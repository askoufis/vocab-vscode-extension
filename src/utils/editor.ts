import * as vscode from "vscode";
import type { MaxTranslationKeyLength } from "../types/configuration";
import type {
  HighlightString,
  HighlightStringWithTransform,
  HighlightType,
} from "../types/translation";
import { isHighlightStringWithTransform } from "../types/translation";
import * as codeStrings from "../commands/extractTranslationString/codeStrings";
import {
  transformHighlightContainingJsx,
  transformTemplateLiteralToVocabHook as transformTemplateLiteralHighlight,
} from "./babel/transform";
import {
  consolidateMultiLineString,
  containsJavascriptExpression,
  isDoubleQuoted,
  isSingleQuoted,
  isTemplateLiteral,
  stripQuotes,
  truncateString,
  wrapWithCurlyBrackets,
  wrapWithDoubleQuotes,
  wrapWithTranslationHook,
} from "./string";

const startOfFile = new vscode.Position(0, 0);

const hasUseTranslations = (editor: vscode.TextEditor) => {
  const documentText = editor.document.getText();

  return documentText.includes("useTranslations");
};

const insertImports = (builder: vscode.TextEditorEdit) => {
  builder.insert(
    startOfFile,
    `${codeStrings.vocabImport}\n${codeStrings.translationFileImport}\n`
  );
};

const getSelectionText = (
  document: vscode.TextDocument,
  selection: vscode.Selection
): string => {
  const selectionRange = document.validateRange(
    new vscode.Range(selection.start, selection.end)
  );

  return document.getText(selectionRange);
};

const expandSelectionByOneCharacter = (
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

const replaceAndInsertHook = async (
  editor: vscode.TextEditor,
  selection: vscode.Selection,
  replacementString: string
) => {
  await editor.edit((builder) => {
    if (!hasUseTranslations(editor)) {
      insertImports(builder);

      const currentSelection = editor.selection;
      const currentLine = currentSelection.active.line;
      insertHookCall(currentLine, builder);
    }
    builder.replace(selection, replacementString);
  });
};

const replaceHighlightStringWithTransform = async (
  editor: vscode.TextEditor,
  highlightString: HighlightStringWithTransform
) => {
  const {
    selection,
    transformResult: { code },
  } = highlightString;

  await replaceAndInsertHook(editor, selection, code);
};

export const replaceHighlightWithTranslation = async (
  editor: vscode.TextEditor,
  highlightString: HighlightString,
  maxTranslationKeyLength: MaxTranslationKeyLength
): Promise<void> => {
  if (isHighlightStringWithTransform(highlightString)) {
    await replaceHighlightStringWithTransform(editor, highlightString);
    return;
  }

  let replacementString = highlightString.value;

  if (maxTranslationKeyLength) {
    replacementString = truncateString(
      replacementString,
      maxTranslationKeyLength
    );
  }

  replacementString = wrapWithTranslationHook(
    wrapWithDoubleQuotes(replacementString)
  );

  if (isJsxOrPropValueStringLiteral(highlightString.type)) {
    replacementString = wrapWithCurlyBrackets(replacementString);
  }

  await replaceAndInsertHook(
    editor,
    highlightString.selection,
    replacementString
  );
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
  const originalSelectionText = getSelectionText(document, originalSelection);

  if (isTemplateLiteral(originalSelectionText)) {
    return { selection: originalSelection, type: "propValueTemplateLiteral" };
  }

  const expandedSelection = expandSelectionByOneCharacter(
    document,
    originalSelection
  );
  const expandedSelectionText = getSelectionText(document, expandedSelection);

  if (isTemplateLiteral(originalSelectionText)) {
    return { selection: expandedSelection, type: "propValueTemplateLiteral" };
  }

  if (
    (originalSelectionText.includes("<") &&
      originalSelectionText.includes(">")) ||
    containsJavascriptExpression(originalSelectionText)
  ) {
    return { selection: originalSelection, type: "complexJsx" };
  }

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

  return { selection, type };
};

const typesToStripQuotesFrom: Array<HighlightType> = [
  "stringLiteral",
  "propValueStringLiteral",
];

export const getHighlightString = (
  editor: vscode.TextEditor
): HighlightString => {
  const document = editor.document;
  const selection = editor.selection;

  const { selection: analysisSelection, type } = analyseSelection(
    document,
    selection
  );

  let value = consolidateMultiLineString(getSelectionText(document, selection));

  if (type === "complexJsx") {
    const transformResult = transformHighlightContainingJsx(value);

    return { type, selection: analysisSelection, transformResult };
  }

  if (type === "propValueTemplateLiteral") {
    const transformResult = transformTemplateLiteralHighlight(value);

    return { type, selection: analysisSelection, transformResult };
  }

  if (typesToStripQuotesFrom.includes(type)) {
    value = stripQuotes(value);
  }

  return {
    value,
    type,
    selection: analysisSelection,
  };
};
