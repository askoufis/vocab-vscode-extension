import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import { createUnquotedAndQuotedSelections, runExtractionTest } from "./utils";

suite("Vocab Helper Extension Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  suite("extractTranslationString command", () => {
    suite(
      "Component that does not contain the vocab and translation import statements",
      () => {
        test("should insert the required imports, extract the translation string and add it to the translations file", async () => {
          const testFileName = "nonTranslatedFile.tsx";

          const start = new vscode.Position(3, 14);
          const end = new vscode.Position(3, 18);
          const selection = new vscode.Selection(start, end);

          const expectedFileContents = `import { useTranslations } from '@vocab/react';
import translations from './.vocab';
import React from "react";

const MyComponent = () => {
const { t } = useTranslations(translations);
  return <div>{t("Test")}</div>;
};
`;

          const expectedTranslationsFileContents = `{
  "Test": {
    "message": "Test"
  }
}`;
          await runExtractionTest({
            testFileName,
            expectedFileContents,
            expectedTranslationsFileContents,
            selection,
          });
        });
      }
    );

    suite("Component containing a JSX string literal on its own line", () => {
      test("should extract the translation string, surround the hook call with curly brackets and add it to the translations file", async () => {
        const testFileName = "singleLineJsxString.tsx";

        const start = new vscode.Position(8, 6);
        const end = new vscode.Position(8, 78);
        const selection = new vscode.Selection(start, end);

        const expectedFileContents = `import { useTranslations } from "@vocab/react";
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

        const expectedTranslationsFileContents = `{
  "This is a relatively long line of text. This is some padding at the end.": {
    "message": "This is a relatively long line of text. This is some padding at the end."
  }
}`;
        await runExtractionTest({
          testFileName,
          expectedFileContents,
          expectedTranslationsFileContents,
          selection,
        });
      });
    });

    suite("Component containing a JSX string literal with arguments", () => {
      test("should extract the translation string, surround the hook call with curly brackets, add the arguments as parameters and add it to the translations file", async () => {
        const testFileName = "jsxWithArguments.tsx";

        const start = new vscode.Position(10, 6);
        const end = new vscode.Position(10, 73);
        const selection = new vscode.Selection(start, end);

        const expectedFileContents = `import { useTranslations } from "@vocab/react";
import translations from "./.vocab";
import React from "react";

const MyComponent = () => {
  const { t } = useTranslations(translations);
  const unreadEmails = 4;
  const spamEmails = 2;
  return (
    <div>
      {t("You have unreadEmails unread emails and spamEmails spam emails.", {unreadEmails, spamEmails})}
    </div>
  );
};
`;

        const expectedTranslationsFileContents = `{
  "You have unreadEmails unread emails and spamEmails spam emails.": {
    "message": "You have {unreadEmails} unread emails and {spamEmails} spam emails."
  }
}`;
        await runExtractionTest({
          testFileName,
          expectedFileContents,
          expectedTranslationsFileContents,
          selection,
        });
      });
    });

    suite("Component containing a JSX string literal on multiple lines", () => {
      test("should extract the translation string, surround the hook call with curly brackets and add it to the translations file", async () => {
        const testFileName = "multiLineJsxString.tsx";

        // This is a multi-line selection
        const start = new vscode.Position(8, 6);
        const end = new vscode.Position(9, 78);
        const selection = new vscode.Selection(start, end);

        const expectedFileContents = `import { useTranslations } from "@vocab/react";
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

        const expectedTranslationsFileContents = `{
  "This is a relatively long line of text. This is some padding at the end. This is a relatively long line of text. This is some padding at the end.": {
    "message": "This is a relatively long line of text. This is some padding at the end. This is a relatively long line of text. This is some padding at the end."
  }
}`;

        await runExtractionTest({
          testFileName,
          expectedFileContents,
          expectedTranslationsFileContents,
          selection,
        });
      });
    });

    suite("Component containing a prop with a string value", () => {
      const selections = createUnquotedAndQuotedSelections(6, 19, 6, 22);

      selections.map((selection) => {
        test("should extract the translation string, surround the hook call with curly brackets and add it to the translations file", async () => {
          const testFileName = "propValue.tsx";

          const expectedFileContents = `import { useTranslations } from "@vocab/react";
import translations from "./.vocab";
import React from "react";

const MyComponent = () => {
  const { t } = useTranslations(translations);
  return <div foo={t("bar")}>{t("Already extracted")}</div>;
};
`;

          const expectedTranslationsFileContents = `{
  "bar": {
    "message": "bar"
  }
}`;

          await runExtractionTest({
            testFileName,
            expectedFileContents,
            expectedTranslationsFileContents,
            selection,
          });
        });
      });
    });
  });
});
