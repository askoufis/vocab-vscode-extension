import * as vscode from "vscode";
import * as path from "path";

import {
  wrapWithTranslationHook,
  wrapWithDoubleQuotes,
  wrapWithCurlyBrackets,
  consolidateMultiLineString,
  stripQuotes,
  getArgumentsFromJsxStringLiteral,
  removeCurlyBracketsFromString,
  truncateString,
} from "./utils/stringUtils";

import {
  analyseSelection,
  getSelectionText,
  hasUseTranslation,
  insertHookCall,
  insertImports,
} from "./utils/editorUtils";
import { TextDecoder } from "util";
import { StringLiteralType, TranslationString } from "../../types/translation";
import { MaxTranslationKeyLength } from "../../types/configuration";

const getTranslationString = (editor: vscode.TextEditor): TranslationString => {
  const document = editor.document;
  let selection = editor.selection;

  const selectionAnalysis = analyseSelection(document, selection);
  let value = consolidateMultiLineString(getSelectionText(document, selection));
  if (selectionAnalysis.type !== "jsx") {
    value = stripQuotes(value);
  }

  return {
    value,
    ...selectionAnalysis,
  };
};

const getTranslationsFilePath = (editor: vscode.TextEditor) => {
  const currentlyOpenFilePath = editor.document.fileName;
  const currentDirectory = path.dirname(currentlyOpenFilePath);

  const vocabFolderPath = path.join(currentDirectory, ".vocab");
  const translationsFilePath = path.join(vocabFolderPath, "translations.json");

  return translationsFilePath;
};

const addTranslationStringToTranslationsFile = async (
  editor: vscode.TextEditor,
  translationString: TranslationString,
  maxTranslationKeyLength: MaxTranslationKeyLength
): Promise<void> => {
  const translationsFilePath = getTranslationsFilePath(editor);
  const translationsFileUri = vscode.Uri.file(translationsFilePath);

  const translationStringArguments =
    translationString.type === "jsx"
      ? getArgumentsFromJsxStringLiteral(translationString.value)
      : [];
  const hasArguments = translationStringArguments.length > 0;

  let translationStringKey =
    translationString.type === "jsx"
      ? removeCurlyBracketsFromString(translationString.value)
      : translationString.value;

  // For now we'll only truncate keys that don't have arguments
  if (!hasArguments && maxTranslationKeyLength) {
    translationStringKey = truncateString(
      translationStringKey,
      maxTranslationKeyLength
    );
  }

  const translationStringObject = {
    [translationStringKey]: { message: translationString.value },
  };

  try {
    await vscode.workspace.fs.stat(translationsFileUri);
    const fileContentsBuffer = await vscode.workspace.fs.readFile(
      translationsFileUri
    );
    // Default to an empty object if the file is empty
    const fileContents = new TextDecoder().decode(fileContentsBuffer) || "{}";

    const existingTranslations = JSON.parse(fileContents);
    // Append the new translation string
    const updatedTranslations = {
      ...existingTranslations,
      ...translationStringObject,
    };

    await vscode.workspace.fs.writeFile(
      translationsFileUri,
      Buffer.from(JSON.stringify(updatedTranslations, undefined, 2))
    );
  } catch {
    // Create a translations file if it doesn't exist, i.e. if fs.stat fails
    await vscode.workspace.fs.writeFile(
      translationsFileUri,
      Buffer.from(JSON.stringify(translationStringObject, undefined, 2))
    );
  }
};

const isJsxOrPropStringLiteral = (type: StringLiteralType): boolean =>
  type === "jsx" || type === "prop";

const replaceTranslationStringInCurrentDocument = async (
  editor: vscode.TextEditor,
  translationString: TranslationString,
  maxTranslationKeyLength: MaxTranslationKeyLength
) => {
  const translationStringArguments =
    translationString.type === "jsx"
      ? getArgumentsFromJsxStringLiteral(translationString.value)
      : [];
  const hasArguments = translationStringArguments.length > 0;

  let replacementString = translationString.value;

  // For now we'll only truncate keys that don't have arguments
  if (!hasArguments && maxTranslationKeyLength) {
    replacementString = truncateString(
      replacementString,
      maxTranslationKeyLength
    );
  }

  replacementString = wrapWithTranslationHook(
    wrapWithDoubleQuotes(replacementString),
    translationStringArguments
  );

  if (isJsxOrPropStringLiteral(translationString.type)) {
    replacementString = wrapWithCurlyBrackets(replacementString);
  }

  await editor.edit((builder) => {
    if (!hasUseTranslation(editor)) {
      insertImports(builder);

      const currentSelection = editor.selection;
      const currentLine = currentSelection.active.line;
      insertHookCall(currentLine, builder);
    }
    builder.replace(translationString.selection, replacementString);
  });
};

export const extractTranslationStringCommand = async () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  // Get the translation string from the user's selection
  const translationString = getTranslationString(editor);

  const maxTranslationKeyLength =
    vscode.workspace
      .getConfiguration("vocabHelper")
      .get<MaxTranslationKeyLength>("maxTranslationKeyLength") || null;

  await replaceTranslationStringInCurrentDocument(
    editor,
    translationString,
    maxTranslationKeyLength
  );
  await addTranslationStringToTranslationsFile(
    editor,
    translationString,
    maxTranslationKeyLength
  );
};
