import * as vscode from "vscode";

import {
  getArgumentsFromJsxStringLiteral,
  removeCurlyBracketsFromString,
  truncateString,
} from "./utils/string";

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
  if (highlightString.type === "stringLiteralAndJsx") {
    return highlightString.transformResult.key;
  }

  if (highlightString.type === "jsxStringLiteral") {
    return removeCurlyBracketsFromString(highlightString.value);
  }

  return highlightString.value;
};

const getTranslationMessageFromHighlightString = (
  highlightString: HighlightString
): string => {
  if (highlightString.type === "stringLiteralAndJsx") {
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

  const translationStringArguments =
    highlightString.type === "jsxStringLiteral"
      ? getArgumentsFromJsxStringLiteral(highlightString.value)
      : [];
  const hasArguments = translationStringArguments.length > 0;

  let translationStringKey =
    getTranslationStringKeyFromHighlightString(highlightString);

  // For now we'll only truncate keys that don't have arguments
  if (!hasArguments && maxTranslationKeyLength) {
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
