import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";

export const openTranslationsFileCommand = async () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const currentlyOpenFilePath = editor.document.fileName;
  const currentDirectory = path.dirname(currentlyOpenFilePath);

  const vocabFolderPath = path.join(currentDirectory, ".vocab");
  const translationsFilePath = path.join(vocabFolderPath, "translations.json");

  const translationsFileUri = vscode.Uri.file(translationsFilePath);

  // eslint-disable-next-line no-sync
  if (fs.existsSync(translationsFilePath)) {
    const doc = await vscode.workspace.openTextDocument(translationsFileUri);

    await vscode.window.showTextDocument(doc, {
      preview: false,
      viewColumn: vscode.ViewColumn.Two,
    });
  } else {
    vscode.window.showInformationMessage(
      `Could not find a translations file for this component.\nPath: ${translationsFilePath}`
    );
  }
};
