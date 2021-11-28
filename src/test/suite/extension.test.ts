import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import { TextDecoder } from "util";

const testFolderLocation = "/../../../src/test/suite/testFiles/";
const vocabFolderPath = __dirname + testFolderLocation + ".vocab/";
const vocabFolderUri = vscode.Uri.file(vocabFolderPath);

const runTestCleanup = async () => {
  try {
    await vscode.workspace.fs.delete(vocabFolderUri, { recursive: true });
  } catch {}
};

const createUnquotedAndQuotedSelections = (
  startLine: number,
  startCharacter: number,
  endLine: number,
  endCharacter: number
) => {
  const start = new vscode.Position(startLine, startCharacter);
  const end = new vscode.Position(endLine, endCharacter);
  const selection = new vscode.Selection(start, end);

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

// FIXME: When running all tests, only the first one passes. All tests pass when run individually.
suite("Vocab Helper Extension Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  suite("extractTranslationString command", () => {
    suite(
      "Component that does not contain the vocab and translation import statements",
      () => {
        test("should insert the required imports, extract the translation string and add it to the translations file", async () => {
          await runTestCleanup();

          const testFile = "nonTranslatedFile.tsx";
          const tsxFileUri = vscode.Uri.file(
            path.join(__dirname + testFolderLocation + testFile)
          );
          const translationsFileUri = vscode.Uri.file(
            path.join(vocabFolderPath + "translations.json")
          );
          const tsxFileDocument = await vscode.workspace.openTextDocument(
            tsxFileUri
          );
          const editor = await vscode.window.showTextDocument(tsxFileDocument);

          const start = new vscode.Position(3, 14);
          const end = new vscode.Position(3, 18);
          const stringLiteralSelection = new vscode.Selection(start, end);
          editor.selection = stringLiteralSelection;

          await vscode.commands.executeCommand(
            "vocabHelper.extractTranslationString"
          );
          const tsxFileText = tsxFileDocument.getText();
          const expectedTsx = `import { useTranslations } from '@vocab/react';
import translations from './.vocab';
import React from "react";

const MyComponent = () => {
const { t } = useTranslations(translations);
  return <div>{t("Test")}</div>;
};
`;

          assert.strictEqual(tsxFileText, expectedTsx);
          await vscode.commands.executeCommand(
            "workbench.action.closeActiveEditor"
          );

          const translationsFileText = await readFile(translationsFileUri);
          const expectedTranslations = `{
  "Test": {
    "message": "Test"
  }
}`;

          assert.strictEqual(translationsFileText, expectedTranslations);
        });
      }
    );

    suite("Component containing a JSX string literal on its own line", () => {
      test("should extract the translation string, surround the hook call with curly brackets and add it to the translations file", async () => {
        await runTestCleanup();

        const testFile = "singleLineJsxString.tsx";
        const tsxFileUri = vscode.Uri.file(
          path.join(__dirname + testFolderLocation + testFile)
        );
        const translationsFileUri = vscode.Uri.file(
          path.join(vocabFolderPath + "translations.json")
        );
        const tsxFileDocument = await vscode.workspace.openTextDocument(
          tsxFileUri
        );
        const editor = await vscode.window.showTextDocument(tsxFileDocument);

        const start = new vscode.Position(8, 6);
        const end = new vscode.Position(8, 78);
        const selection = new vscode.Selection(start, end);
        editor.selection = selection;

        await vscode.commands.executeCommand(
          "vocabHelper.extractTranslationString"
        );
        const tsxFileText = tsxFileDocument.getText();
        const expectedTsx = `import { useTranslations } from "@vocab/react";
import translations from "./.vocab";
import React from "react";

const MyComponent = () => {
  const { t } = useTranslations(translations);
  return (
    <div>
      {t("This is a relatively long line of text. This is some padding at the end.")}
    </div>
  );
};
`;

        assert.strictEqual(tsxFileText, expectedTsx);
        await vscode.commands.executeCommand(
          "workbench.action.closeActiveEditor"
        );

        const translationsFileText = await readFile(translationsFileUri);
        const expectedTranslations = `{
  "This is a relatively long line of text. This is some padding at the end.": {
    "message": "This is a relatively long line of text. This is some padding at the end."
  }
}`;

        assert.strictEqual(translationsFileText, expectedTranslations);
      });
    });

    suite("Component containing a JSX string literal on multiple lines", () => {
      test("should extract the translation string, surround the hook call with curly brackets and add it to the translations file", async () => {
        await runTestCleanup();

        const testFile = "multiLineJsxString.tsx";
        const tsxFileUri = vscode.Uri.file(
          path.join(__dirname + testFolderLocation + testFile)
        );
        const translationsFileUri = vscode.Uri.file(
          path.join(vocabFolderPath + "translations.json")
        );
        const tsxFileDocument = await vscode.workspace.openTextDocument(
          tsxFileUri
        );
        const editor = await vscode.window.showTextDocument(tsxFileDocument);

        // This is a multi-line selection
        const start = new vscode.Position(8, 6);
        const end = new vscode.Position(9, 78);
        const stringLiteralSelection = new vscode.Selection(start, end);
        editor.selection = stringLiteralSelection;

        await vscode.commands.executeCommand(
          "vocabHelper.extractTranslationString"
        );
        const tsxFileText = tsxFileDocument.getText();
        const expectedTsx = `import { useTranslations } from "@vocab/react";
import translations from "./.vocab";
import React from "react";

const MyComponent = () => {
  const { t } = useTranslations(translations);
  return (
    <div>
      {t("This is a relatively long line of text. This is some padding at the end. This is a relatively long line of text. This is some padding at the end.")}
    </div>
  );
};
`;

        assert.strictEqual(tsxFileText, expectedTsx);
        await vscode.commands.executeCommand(
          "workbench.action.closeActiveEditor"
        );

        const translationsFileText = await readFile(translationsFileUri);
        const expectedTranslations = `{
  "This is a relatively long line of text. This is some padding at the end. This is a relatively long line of text. This is some padding at the end.": {
    "message": "This is a relatively long line of text. This is some padding at the end. This is a relatively long line of text. This is some padding at the end."
  }
}`;

        assert.strictEqual(translationsFileText, expectedTranslations);
      });
    });

    suite("Component containing a prop with a string value", () => {
      const selections = createUnquotedAndQuotedSelections(6, 19, 6, 22);

      selections.map((selection) => {
        test("should extract the translation string, surround the hook call with curly brackets and add it to the translations file", async () => {
          await runTestCleanup();

          const testFile = "propValue.tsx";
          const tsxFileUri = vscode.Uri.file(
            path.join(__dirname + testFolderLocation + testFile)
          );
          const translationsFileUri = vscode.Uri.file(
            path.join(vocabFolderPath + "translations.json")
          );
          const tsxFileDocument = await vscode.workspace.openTextDocument(
            tsxFileUri
          );
          const editor = await vscode.window.showTextDocument(tsxFileDocument);

          editor.selection = selection;

          await vscode.commands.executeCommand(
            "vocabHelper.extractTranslationString"
          );
          const tsxFileText = tsxFileDocument.getText();
          const expectedTsx = `import { useTranslations } from "@vocab/react";
import translations from "./.vocab";
import React from "react";

const MyComponent = () => {
  const { t } = useTranslations(translations);
  return <div foo={t("bar")}>{t("Already extracted")}</div>;
};
`;

          assert.strictEqual(tsxFileText, expectedTsx);
          await vscode.commands.executeCommand(
            "workbench.action.closeActiveEditor"
          );

          const translationsFileText = await readFile(translationsFileUri);
          const expectedTranslations = `{
  "bar": {
    "message": "bar"
  }
}`;

          assert.strictEqual(translationsFileText, expectedTranslations);
        });
      });
    });
  });
});
