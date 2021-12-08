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
  translationString: TranslationString
): Promise<void> => {
  const translationsFilePath = getTranslationsFilePath(editor);
  const translationsFileUri = vscode.Uri.file(translationsFilePath);

  const translationStringKey =
    translationString.type === "jsx"
      ? removeCurlyBracketsFromString(translationString.value)
      : translationString.value;

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
  translationString: TranslationString
) => {
  const translationStringArguments =
    translationString.type === "jsx"
      ? getArgumentsFromJsxStringLiteral(translationString.value)
      : [];
  let replacementString = wrapWithTranslationHook(
    wrapWithDoubleQuotes(translationString.value),
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

  await replaceTranslationStringInCurrentDocument(editor, translationString);
  await addTranslationStringToTranslationsFile(editor, translationString);
};
