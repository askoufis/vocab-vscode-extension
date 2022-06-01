import * as vscode from "vscode";
import type {
  Configuration,
  FormatAfterReplace,
  MaxTranslationKeyLength,
} from "../types/configuration";

export const getConfiguration = (): Configuration => {
  const maxTranslationKeyLength =
    vscode.workspace
      .getConfiguration("vocabHelper")
      .get<MaxTranslationKeyLength>("maxTranslationKeyLength") || null;

  const formatAfterReplace =
    vscode.workspace
      .getConfiguration("vocabHelper")
      .get<FormatAfterReplace>("formatAfterReplace") || false;

  return { maxTranslationKeyLength, formatAfterReplace };
};
