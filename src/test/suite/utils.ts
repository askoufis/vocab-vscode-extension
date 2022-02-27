import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import { TextDecoder } from "util";
import {
  FormatAfterReplace,
  MaxTranslationKeyLength,
} from "../../types/configuration";

const testFolderLocation = "/../../../src/test/suite/testFiles/";
const vocabFolderPath = `${path.join(
  __dirname,
  testFolderLocation,
  ".vocab/"
)}`;
const vocabFolderUri = vscode.Uri.file(vocabFolderPath);

type PositionTuple = [number, number];

export const fromHighlightPositions = (
  start: PositionTuple,
  end: PositionTuple
): vscode.Selection => {
  const startPosition = new vscode.Position(...start);
  const endPosition = new vscode.Position(...end);

  return new vscode.Selection(startPosition, endPosition);
};

export const setMaxTranslationKeyLength = async (
  maxTranslationKeyLength: MaxTranslationKeyLength = null
) => {
  const configuration = vscode.workspace.getConfiguration();

  await configuration.update(
    "vocabHelper.maxTranslationKeyLength",
    maxTranslationKeyLength,
    vscode.ConfigurationTarget.Global
  );
};

export const setFormatAfterReplace = async (
  formatAfterReplace: FormatAfterReplace
) => {
  const configuration = vscode.workspace.getConfiguration();

  await configuration.update(
    "vocabHelper.formatAfterReplace",
    formatAfterReplace,
    vscode.ConfigurationTarget.Global
  );
};

const runTestSetup = async () => {
  try {
    await vscode.workspace.fs.delete(vocabFolderUri, { recursive: true });
  } catch {}
};

export const createUnquotedAndQuotedSelections = (
  startLine: number,
  startCharacter: number,
  endLine: number,
  endCharacter: number
) => {
  const selection = fromHighlightPositions(
    [startLine, startCharacter],
    [endLine, endCharacter]
  );

  const startWithQuotes = new vscode.Position(startLine, startCharacter - 1);
  const endWithQuotes = new vscode.Position(endLine, endCharacter + 1);
  const selectionWithQuotes = new vscode.Selection(
    startWithQuotes,
    endWithQuotes
  );

  return [selection, selectionWithQuotes];
};

const readFile = async (uri: vscode.Uri) =>
  new TextDecoder().decode(await vscode.workspace.fs.readFile(uri));

export const runExtractionTest = async (
  {
    testFileName,
    expectedFileContents,
    expectedTranslationsFileContents,
    selection,
  }: {
    testFileName: string;
    expectedFileContents: string;
    expectedTranslationsFileContents: string;
    selection: vscode.Selection;
  },
  {
    maxTranslationKeyLength,
  }: { maxTranslationKeyLength?: MaxTranslationKeyLength } = {}
) => {
  await runTestSetup();

  await setMaxTranslationKeyLength(maxTranslationKeyLength);
  await setFormatAfterReplace(false);

  const testFileUri = vscode.Uri.file(
    path.join(__dirname, testFolderLocation, testFileName)
  );
  const translationsFileUri = vscode.Uri.file(
    path.join(vocabFolderPath, "translations.json")
  );
  const testFileDocument = await vscode.workspace.openTextDocument(testFileUri);
  const editor = await vscode.window.showTextDocument(testFileDocument);

  editor.selection = selection;

  await vscode.commands.executeCommand("vocabHelper.extractTranslationString");
  const testFileContents = testFileDocument.getText();

  assert.strictEqual(testFileContents, expectedFileContents);
  await vscode.commands.executeCommand("workbench.action.closeActiveEditor");

  const translationsFileContents = await readFile(translationsFileUri);

  assert.strictEqual(
    translationsFileContents,
    expectedTranslationsFileContents
  );
};
