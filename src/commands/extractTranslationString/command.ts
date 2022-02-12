import * as vscode from "vscode";

import {
  getArgumentsFromJsxStringLiteral,
  removeCurlyBracketsFromString,
  truncateString,
} from "./utils/stringUtils";

import {
  getHighlightString,
  replaceHighlightWithTranslation,
} from "./utils/editorUtils";
import { TextDecoder } from "util";
import { HighlightString, TranslationsFile } from "../../types/translation";
import { MaxTranslationKeyLength } from "../../types/configuration";
import { getTranslationsFilePath } from "./utils/file";

const addTranslationStringToTranslationsFile = async (
  editor: vscode.TextEditor,
  highlightString: HighlightString,
  maxTranslationKeyLength: MaxTranslationKeyLength
): Promise<void> => {
  const translationsFilePath = getTranslationsFilePath(editor);
  const translationsFileUri = vscode.Uri.file(translationsFilePath);

  const translationStringArguments =
    highlightString.type === "jsxStringLiteral"
      ? getArgumentsFromJsxStringLiteral(highlightString.value)
      : [];
  const hasArguments = translationStringArguments.length > 0;

  let translationStringKey =
    highlightString.type === "jsxStringLiteral"
      ? removeCurlyBracketsFromString(highlightString.value)
      : highlightString.value;

  // For now we'll only truncate keys that don't have arguments
  if (!hasArguments && maxTranslationKeyLength) {
    translationStringKey = truncateString(
      translationStringKey,
      maxTranslationKeyLength
    );
  }

  const translationStringObject = {
    [translationStringKey]: { message: highlightString.value },
  };

  try {
    // Check if the file exists
    await vscode.workspace.fs.stat(translationsFileUri);
    const fileContentsBuffer = await vscode.workspace.fs.readFile(
      translationsFileUri
    );

    // Default to an empty object if the file is empty
    const fileContents = new TextDecoder().decode(fileContentsBuffer) || "{}";

    const existingTranslations: TranslationsFile = JSON.parse(fileContents);
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

export const extractTranslationStringCommand = async () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  // Get the translation string from the user's selection
  const highlightString = getHighlightString(editor);

  const maxTranslationKeyLength =
    vscode.workspace
      .getConfiguration("vocabHelper")
      .get<MaxTranslationKeyLength>("maxTranslationKeyLength") || null;

  await replaceHighlightWithTranslation(
    editor,
    highlightString,
    maxTranslationKeyLength
  );
  await addTranslationStringToTranslationsFile(
    editor,
    highlightString,
    maxTranslationKeyLength
  );
};
