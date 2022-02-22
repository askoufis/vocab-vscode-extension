import * as vscode from "vscode";

const isError = (error: unknown): error is Error => error instanceof Error;

export const showError = (error: unknown) => {
  if (isError(error)) {
    vscode.window.showErrorMessage(`Error: ${error.message}`);
  } else {
    vscode.window.showErrorMessage("Error was thrown with no message");
  }
};
