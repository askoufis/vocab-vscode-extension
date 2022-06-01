import type * as vscode from "vscode";
import * as path from "path";

export const getTranslationsFilePath = (editor: vscode.TextEditor) => {
  const currentlyOpenFilePath = editor.document.fileName;
  const currentDirectory = path.dirname(currentlyOpenFilePath);

  const vocabFolderPath = path.join(currentDirectory, ".vocab");
  const translationsFilePath = path.join(vocabFolderPath, "translations.json");

  return translationsFilePath;
};
