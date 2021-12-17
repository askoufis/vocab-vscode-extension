import * as vscode from "vscode";

const STRING_LITERAL_TYPES = ["regular", "jsx", "prop"] as const;
export type StringLiteralType = typeof STRING_LITERAL_TYPES[number];

export interface TranslationString {
  /** The string literal value, excluding surrounding quotes if the selection contains quotes */
  value: string;
  /** The selection containing the string literal and quotes if they exist (i.e. if it's not a JSX string literal) */
  selection: vscode.Selection;
  /** What type of string literal this is*/
  type: StringLiteralType;
}

type TranslationKey = string;

interface TranslationStringData {
  message: string;
  description?: string;
}

export type TranslationsFileData = Record<
  TranslationKey,
  TranslationStringData
>;
