import * as vscode from "vscode";
import { TransformResult } from "../commands/extractTranslationString/utils/jsxBabelTransform";

const HIGHLIGHT_TYPES = [
  // E.g. const foo = "foo";
  // Highlight:        ___
  "stringLiteral",
  // E.g. return <div>foo</div>
  // Highlight:       ___
  "jsxStringLiteral",
  // E.g. return <Field label="foo" />
  // Highlight:                ___
  "propValueStringLiteral",
  // E.g. return <div>Foo <b>bar</b> foo</div>
  // Highlight:       __________________
  "stringLiteralAndJsx",
] as const;
export type HighlightType = typeof HIGHLIGHT_TYPES[number];

export type HighlightStringNoTransform = {
  /** The string literal value, excluding surrounding quotes if the selection contains quotes */
  value: string;
  /** The selection containing the string literal and quotes if they exist (i.e. if it's not a JSX string literal) */
  selection: vscode.Selection;
  /** What type of thing was the highlighted text */
  type: Exclude<HighlightType, "stringLiteralAndJsx">;
};

export type HighlightStringWithTransform = {
  /** The selection containing the string literal and quotes if they exist (i.e. if it's not a JSX string literal) */
  selection: vscode.Selection;
  /** What type of thing was the highlighted text */
  type: "stringLiteralAndJsx";
  /** What type of thing was the highlighted text */
  transformResult: TransformResult;
};

export type HighlightString =
  | HighlightStringNoTransform
  | HighlightStringWithTransform;

type TranslationKey = string;

interface TranslationString {
  message: string;
  description?: string;
}

export type TranslationsFile = Record<TranslationKey, TranslationString>;
