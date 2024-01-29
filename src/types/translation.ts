import type * as vscode from "vscode";
import type { TransformResult } from "../utils/babel/types";

/**
 * Highlight types
 *
 * stringLiteral
 * E.g. const foo = "foo";
 * Highlight:        ___
 *
 * jsxStringLiteral,
 * E.g. return <div>foo</div>
 * Highlight:       ___
 *
 * propValueStringLiteral,
 * E.g. return <Field label="foo" />
 * Highlight:                ___
 *
 * propValueTemplateLiteral,
 * E.g. return <Field label={`Foo ${props.bar}`} />
 * Highlight:                __________________
 *
 * complexJsx,
 * E.g. return <div>Foo <a href="/bar" >bar</a> {foo}</div>
 * Highlight:       _________________________________
 */

export interface StringLiteral {
  /** What type of thing was the highlighted text */
  type: "stringLiteral";
  /** The selection containing the string literal and quotes if they exist (i.e. if it's not a JSX string literal) */
  selection: vscode.Selection;
  /** The string literal value, excluding surrounding quotes if the selection contains quotes */
  value: string;
}

export interface JsxStringLiteral {
  /** What type of thing was the highlighted text */
  type: "jsxStringLiteral";
  /** The selection containing the string literal and quotes if they exist (i.e. if it's not a JSX string literal) */
  selection: vscode.Selection;
  /** The string literal value, excluding surrounding quotes if the selection contains quotes */
  value: string;
}

export interface PropValueStringLiteral {
  /** What type of thing was the highlighted text */
  type: "propValueStringLiteral";
  /** The selection containing the string literal and quotes if they exist (i.e. if it's not a JSX string literal) */
  selection: vscode.Selection;
  /** The string literal value, excluding surrounding quotes if the selection contains quotes */
  value: string;
}

interface ComplexJsx {
  /** What type of thing was the highlighted text */
  type: "complexJsx";
  /** The selection containing the JSX */
  selection: vscode.Selection;
  /** The result of the babel transformation */
  transformResult: TransformResult;
}

interface PropValueTemplateLiteral {
  /** What type of thing was the highlighted text */
  type: "propValueTemplateLiteral";
  /** The selection containing the JSX */
  selection: vscode.Selection;
  /** The result of the babel transformation */
  transformResult: TransformResult;
}

export type HighlightStringNoTransform =
  | StringLiteral
  | JsxStringLiteral
  | PropValueStringLiteral;

export type HighlightStringWithTransform =
  | ComplexJsx
  | PropValueTemplateLiteral;

type NoTransformType = HighlightStringNoTransform["type"];
type WithTransformType = HighlightStringWithTransform["type"];

export type HighlightType = WithTransformType | NoTransformType;

export type HighlightString =
  | HighlightStringNoTransform
  | HighlightStringWithTransform;

type TranslationKey = string;

interface TranslationString {
  message: string;
  description?: string;
}

export type TranslationsFile = Record<TranslationKey, TranslationString>;

export const isHighlightStringWithTransform = (
  highlightString: HighlightString
): highlightString is HighlightStringWithTransform =>
  highlightString.type === "complexJsx" ||
  highlightString.type === "propValueTemplateLiteral";

export const isHighlightStringNoTransform = (
  highlightString: HighlightString
): highlightString is HighlightStringNoTransform =>
  highlightString.type === "stringLiteral" ||
  highlightString.type === "jsxStringLiteral" ||
  highlightString.type === "propValueStringLiteral";
