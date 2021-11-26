import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

import {
  stripQuotes,
  wrapWithTranslationHook,
  wrapWithDoubleQuotes,
  wrapWithCurlyBrackets,
  isSingleQuoted,
  isDoubleQuoted,
} from "../utils/stringUtils";
import * as codeStrings from "./codeStrings";

const startOfFile = new vscode.Position(0, 0);

const hasUseTranslation = (editor: vscode.TextEditor) => {
  const documentText = editor.document.getText();

  return documentText.includes("useTranslations");
};

const insertImports = (builder: vscode.TextEditorEdit) => {
  builder.insert(
    startOfFile,
    `${codeStrings.vocabImport}\n${codeStrings.translationFileImport}\n`
  );
};

const insertHookCall = (line: number, builder: vscode.TextEditorEdit) => {
  const startOfLine = new vscode.Position(line, 0);
  builder.insert(startOfLine, `${codeStrings.hookCall}\n`);
};

const getSelectionStrings = (
  document: vscode.TextDocument,
  selection: vscode.Selection
) => {
  const previousPosition = new vscode.Position(
    selection.start.line,
    selection.start.character - 1
  );
  const previousCharacter = document.getText(
    new vscode.Range(previousPosition, selection.start)
  );

  const nextPosition = new vscode.Position(
    selection.start.line,
    selection.end.character + 1
  );
  const nextCharacter = document.getText(
    new vscode.Range(nextPosition, selection.end)
  );

  const selectedText = document.getText(selection);
  const firstCharacter = selectedText[0];
  const lastCharacter = selectedText[selectedText.length - 1];

  return {
    previousCharacter,
    firstCharacter,
    lastCharacter,
    nextCharacter,
    selectedText,
    previousPosition,
    nextPosition,
  };
};

const extractTranslationString = (editor: vscode.TextEditor): string => {
  const document = editor.document;
  const selection = editor.selection;
  const currentLine = selection.active.line;

  const {
    previousCharacter,
    firstCharacter,
    lastCharacter,
    nextCharacter,
    selectedText: initiallySelectedText,
    previousPosition,
    nextPosition,
  } = getSelectionStrings(document, selection);

  let selectionToReplace = selection;
  const isSelectionSingleQuoted = isSingleQuoted({
    firstCharacter,
    lastCharacter,
  });
  const isSelectionDoubleQuoted = isDoubleQuoted({
    firstCharacter,
    lastCharacter,
  });
  const isSelectionQuoted = isSelectionSingleQuoted || isSelectionDoubleQuoted;

  // TODO: Handle string literal prop values inside curly braces, e.g. text={"foo"}
  let wrappedTranslationString = "";
  // This implies the selected text is already wrapped in quotes
  const isStringProp = previousCharacter === "=";
  if (isStringProp) {
    wrappedTranslationString = `{${wrapWithTranslationHook(
      initiallySelectedText
    )}}`;
  } else {
    if (isSelectionQuoted) {
      wrappedTranslationString = wrapWithTranslationHook(initiallySelectedText);
    } else {
      const isSelectionInsideSingleQuotes = isSingleQuoted({
        firstCharacter: previousCharacter,
        lastCharacter: nextCharacter,
      });
      const isSelectionInsideDoubleQuotes = isDoubleQuoted({
        firstCharacter: previousCharacter,
        lastCharacter: nextCharacter,
      });

      if (isSelectionInsideSingleQuotes || isSelectionInsideDoubleQuotes) {
        const expandedSelection = new vscode.Selection(
          previousPosition,
          nextPosition
        );
        const expandedSelectionText = document.getText(expandedSelection);
        wrappedTranslationString = wrapWithTranslationHook(
          expandedSelectionText
        );
        selectionToReplace = expandedSelection;
      } else {
        // This means the highlighted text is a JSX string literal
        wrappedTranslationString = wrapWithCurlyBrackets(
          wrapWithTranslationHook(wrapWithDoubleQuotes(initiallySelectedText))
        );
      }
    }
  }

  editor.edit((builder) => {
    if (!hasUseTranslation(editor)) {
      insertImports(builder);
      insertHookCall(currentLine, builder);
    }
    builder.replace(selectionToReplace, wrappedTranslationString);
  });

  return isSelectionQuoted
    ? stripQuotes(initiallySelectedText)
    : initiallySelectedText;
};

export const extractTranslationStringCommand = async () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  // Get the translation string from the user's selection
  const translationString = extractTranslationString(editor);
  const newTranslationString = {
    [translationString]: { message: translationString },
  };

  const currentlyOpenFilePath = editor.document.fileName;
  const currentDirectory = path.dirname(currentlyOpenFilePath);

  const vocabFolderPath = path.join(currentDirectory, ".vocab");
  const translationsFilePath = path.join(vocabFolderPath, "translations.json");

  // Create a vocab folder if it doesn't exist
  if (!fs.existsSync(vocabFolderPath)) {
    fs.mkdirSync(vocabFolderPath);
  }

  // Create a translations file if it doesn't exist
  if (!fs.existsSync(translationsFilePath)) {
    fs.writeFileSync(
      translationsFilePath,
      JSON.stringify(newTranslationString)
    );
  } else {
    const fileContents =
      fs.readFileSync(translationsFilePath).toString() || "{}";
    const translations = JSON.parse(fileContents);
    // Append the new translation string
    const updatedTranslations = {
      ...translations,
      ...newTranslationString,
    };
    fs.writeFileSync(translationsFilePath, JSON.stringify(updatedTranslations));
  }

  // You can't format a specific file with the vscode API, only the currently
  // active file. So we save the current file, then open the translations file,
  // swap to it, format it, save it, then close it.
  const formatSaveTranslationOnExtract = vscode.workspace
    .getConfiguration("vocabHelper")
    .get("formatSaveTranslationOnExtract");

  if (formatSaveTranslationOnExtract === true) {
    await vscode.commands.executeCommand("workbench.action.files.save");

    const translationsFileUri = vscode.Uri.file(translationsFilePath);
    const doc = await vscode.workspace.openTextDocument(translationsFileUri);

    await vscode.window.showTextDocument(doc, {
      preview: false,
      viewColumn: vscode.ViewColumn.One,
    });
    await vscode.commands.executeCommand("editor.action.formatDocument");
    await vscode.commands.executeCommand("workbench.action.files.save");
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  }
};
