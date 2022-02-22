import * as path from "path";
import * as vscode from "vscode";
import { showError } from "../../utils/error";

export const openTranslationsFileCommand = async () => {
  try {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const currentlyOpenFilePath = editor.document.fileName;
    const currentDirectory = path.dirname(currentlyOpenFilePath);

    const vocabFolderPath = path.join(currentDirectory, ".vocab");
    const translationsFilePath = path.join(
      vocabFolderPath,
      "translations.json"
    );

    const translationsFileUri = vscode.Uri.file(translationsFilePath);

    try {
      // Throws if the file does not exist
      await vscode.workspace.fs.stat(translationsFileUri);
      const doc = await vscode.workspace.openTextDocument(translationsFileUri);

      await vscode.window.showTextDocument(doc, {
        preview: false,
        viewColumn: vscode.ViewColumn.Two,
      });
    } catch {
      throw new Error(
        `Could not find a translations file for this component at path: ${translationsFilePath}`
      );
    }
  } catch (error) {
    showError(error);
  }
};
