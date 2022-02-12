import * as vscode from "vscode";
import { MaxTranslationKeyLength } from "../../../types/configuration";
import { HighlightString, HighlightType } from "../../../types/translation";
import * as codeStrings from "../codeStrings";
import {
  consolidateMultiLineString,
  getArgumentsFromJsxStringLiteral,
  isDoubleQuoted,
  isSingleQuoted,
  stripFirstLast,
  stripQuotes,
  truncateString,
  wrapWithCurlyBrackets,
  wrapWithDoubleQuotes,
  wrapWithTranslationHook,
} from "./string";

const startOfFile = new vscode.Position(0, 0);

export const hasUseTranslation = (editor: vscode.TextEditor) => {
  const documentText = editor.document.getText();

  return documentText.includes("useTranslations");
};

export const insertImports = (builder: vscode.TextEditorEdit) => {
  builder.insert(
    startOfFile,
    `${codeStrings.vocabImport}\n${codeStrings.translationFileImport}\n`
  );
};

export const getSelectionText = (
  document: vscode.TextDocument,
  selection: vscode.Selection
): string => {
  const selectionRange = document.validateRange(
    new vscode.Range(selection.start, selection.end)
  );

  return document.getText(selectionRange);
};

export const expandSelectionByOneCharacter = (
  document: vscode.TextDocument,
  selection: vscode.Selection
): vscode.Selection => {
  const newStartPosition = document.validatePosition(
    new vscode.Position(selection.start.line, selection.start.character - 1)
  );
  const newEndPosition = document.validatePosition(
    new vscode.Position(selection.end.line, selection.end.character + 1)
  );

  return new vscode.Selection(newStartPosition, newEndPosition);
};

const isJsxOrPropValueStringLiteral = (type: HighlightType): boolean =>
  type === "jsxStringLiteral" || type === "propValueStringLiteral";

export const replaceHighlightWithTranslation = async (
  editor: vscode.TextEditor,
  highlightString: HighlightString,
  maxTranslationKeyLength: MaxTranslationKeyLength
) => {
  const translationStringArguments =
    highlightString.type === "jsxStringLiteral"
      ? getArgumentsFromJsxStringLiteral(highlightString.value)
      : [];
  const hasArguments = translationStringArguments.length > 0;

  let replacementString = highlightString.value;

  // For now we'll only truncate keys that don't have arguments
  if (!hasArguments && maxTranslationKeyLength) {
    replacementString = truncateString(
      replacementString,
      maxTranslationKeyLength
    );
  }

  replacementString = wrapWithTranslationHook(
    wrapWithDoubleQuotes(replacementString),
    translationStringArguments
  );

  if (isJsxOrPropValueStringLiteral(highlightString.type)) {
    replacementString = wrapWithCurlyBrackets(replacementString);
  }

  await editor.edit((builder) => {
    if (!hasUseTranslation(editor)) {
      insertImports(builder);

      const currentSelection = editor.selection;
      const currentLine = currentSelection.active.line;
      insertHookCall(currentLine, builder);
    }
    builder.replace(highlightString.selection, replacementString);
  });
};

export const insertHookCall = (
  line: number,
  builder: vscode.TextEditorEdit
) => {
  const startOfLine = new vscode.Position(line, 0);
  builder.insert(startOfLine, `${codeStrings.hookCall}\n`);
};

const analyseSelection = (
  document: vscode.TextDocument,
  originalSelection: vscode.Selection
): { selection: vscode.Selection; type: HighlightType } => {
  const expandedSelection = expandSelectionByOneCharacter(
    document,
    originalSelection
  );
  const expandedSelectionText = getSelectionText(document, expandedSelection);

  if (expandedSelectionText.startsWith("=")) {
    return { selection: originalSelection, type: "propValueStringLiteral" };
  }

  const doubleExpandedSelection = expandSelectionByOneCharacter(
    document,
    expandedSelection
  );
  const doubleExpandedText = getSelectionText(
    document,
    doubleExpandedSelection
  );

  if (doubleExpandedText.startsWith("=")) {
    if (expandedSelectionText.startsWith(" ")) {
      return { selection: originalSelection, type: "stringLiteral" };
    }

    return { selection: expandedSelection, type: "propValueStringLiteral" };
  }

  const originalSelectionText = stripFirstLast(expandedSelectionText);

  const isOriginalSelectionSingleQuoted = isSingleQuoted(originalSelectionText);
  const isOriginalSelectionDoubleQuoted = isDoubleQuoted(originalSelectionText);

  const isOriginalSelectionQuoted =
    isOriginalSelectionSingleQuoted || isOriginalSelectionDoubleQuoted;

  const isExpandedSelectionSingleQuoted = isSingleQuoted(expandedSelectionText);
  const isExpandedSelectionDoubleQuoted = isDoubleQuoted(expandedSelectionText);

  const isExpandedSelectionQuoted =
    isExpandedSelectionSingleQuoted || isExpandedSelectionDoubleQuoted;

  const selection = isExpandedSelectionQuoted
    ? expandedSelection
    : originalSelection;

  const type =
    !isOriginalSelectionQuoted && !isExpandedSelectionQuoted
      ? "jsxStringLiteral"
      : "stringLiteral";

  return isExpandedSelectionQuoted ? { selection, type } : { selection, type };
};

export const getHighlightString = (
  editor: vscode.TextEditor
): HighlightString => {
  const document = editor.document;
  const selection = editor.selection;

  const selectionAnalysis = analyseSelection(document, selection);
  let value = consolidateMultiLineString(getSelectionText(document, selection));
  if (selectionAnalysis.type !== "jsxStringLiteral") {
    value = stripQuotes(value);
  }

  return {
    value,
    ...selectionAnalysis,
  };
};
