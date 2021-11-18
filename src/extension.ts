import * as vscode from "vscode";
import {
  extractTranslationStringCommand,
  openTranslationsFileCommand,
} from "./commands";

export const activate = async (context: vscode.ExtensionContext) => {
  console.log("Vocab Helper is now active");

  const extractTranslationStringDisposable = vscode.commands.registerCommand(
    "vocabHelper.extractTranslationString",
    extractTranslationStringCommand
  );

  const openTranslationsFileDisposable = vscode.commands.registerCommand(
    "vocabHelper.openTranslationsFile",
    openTranslationsFileCommand
  );

  context.subscriptions.push(extractTranslationStringDisposable);
  context.subscriptions.push(openTranslationsFileDisposable);
};

export const deactivate = () => {};
