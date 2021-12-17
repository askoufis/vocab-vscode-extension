import * as vscode from "vscode";
import { StringLiteralType } from "../../../types/translation";
import * as codeStrings from "../codeStrings";
import { isDoubleQuoted, isSingleQuoted, stripFirstLast } from "./stringUtils";

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

export const insertHookCall = (
  line: number,
  builder: vscode.TextEditorEdit
) => {
  const startOfLine = new vscode.Position(line, 0);
  builder.insert(startOfLine, `${codeStrings.hookCall}\n`);
};

export const analyseSelection = (
  document: vscode.TextDocument,
  originalSelection: vscode.Selection
): { selection: vscode.Selection; type: StringLiteralType } => {
  const expandedSelection = expandSelectionByOneCharacter(
    document,
    originalSelection
  );
  const expandedSelectionText = getSelectionText(document, expandedSelection);

  if (expandedSelectionText.startsWith("=")) {
    return { selection: originalSelection, type: "prop" };
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
      return { selection: originalSelection, type: "regular" };
    }

    return { selection: expandedSelection, type: "prop" };
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
      ? "jsx"
      : "regular";

  return isExpandedSelectionQuoted ? { selection, type } : { selection, type };
};
