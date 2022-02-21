import * as vscode from "vscode";

import { truncateString } from "./utils/string";

import {
  getHighlightString,
  replaceHighlightWithTranslation,
} from "./utils/editor";
import { TextDecoder } from "util";
import { HighlightString, TranslationsFile } from "../../types/translation";
import { MaxTranslationKeyLength } from "../../types/configuration";
import { getTranslationsFilePath } from "./utils/file";
import { getConfiguration } from "../configuration";

const getTranslationStringKeyFromHighlightString = (
  highlightString: HighlightString
): string => {
  if (highlightString.type === "complexJsx") {
    return highlightString.transformResult.key;
  }

  return highlightString.value;
};

const getTranslationMessageFromHighlightString = (
  highlightString: HighlightString
): string => {
  if (highlightString.type === "complexJsx") {
    return highlightString.transformResult.message;
  }

  return highlightString.value;
};

const addTranslationStringToTranslationsFile = async (
  editor: vscode.TextEditor,
  highlightString: HighlightString,
  maxTranslationKeyLength: MaxTranslationKeyLength
): Promise<void> => {
  const translationsFilePath = getTranslationsFilePath(editor);
  const translationsFileUri = vscode.Uri.file(translationsFilePath);

  let translationStringKey =
    getTranslationStringKeyFromHighlightString(highlightString);

  if (maxTranslationKeyLength) {
    translationStringKey = truncateString(
      translationStringKey,
      maxTranslationKeyLength
    );
  }

  const translationMessage =
    getTranslationMessageFromHighlightString(highlightString);

  const translationStringObject = {
    [translationStringKey]: { message: translationMessage },
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
  const { maxTranslationKeyLength, formatAfterReplace } = getConfiguration();

  await replaceHighlightWithTranslation(
    editor,
    highlightString,
    maxTranslationKeyLength
  );

  if (formatAfterReplace) {
    await vscode.commands.executeCommand("editor.action.formatDocument");
  }

  await addTranslationStringToTranslationsFile(
    editor,
    highlightString,
    maxTranslationKeyLength
  );
};
