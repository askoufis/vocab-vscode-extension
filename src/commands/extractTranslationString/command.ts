import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

import {
  stripQuotes,
  wrapTranslationString,
  wrapWithQuotes,
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

const extractTranslationString = (editor: vscode.TextEditor) => {
  const document = editor.document;
  const selection = editor.selection;
  const currentLine = selection.active.line;
  const selectedTranslationString = document.getText(selection);

  const positionBeforeTranslationString = new vscode.Position(
    selection.start.line,
    selection.start.character - 1
  );
  const characterBeforeTranslationString = document.getText(
    new vscode.Range(positionBeforeTranslationString, selection.start)
  );
  const isStringProp = characterBeforeTranslationString === "=";
  const wrappedTranslationString = isStringProp
    ? `{${wrapTranslationString(selectedTranslationString)}}`
    : wrapTranslationString(wrapWithQuotes(selectedTranslationString));

  editor.edit((builder) => {
    if (!hasUseTranslation(editor)) {
      insertImports(builder);
      insertHookCall(currentLine, builder);
    }
    builder.replace(selection, wrappedTranslationString);
  });

  return isStringProp
    ? stripQuotes(selectedTranslationString)
    : selectedTranslationString;
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
    const translations = JSON.parse(
      fs.readFileSync(translationsFilePath).toString()
    );
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
