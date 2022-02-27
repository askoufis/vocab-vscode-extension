import * as vscode from "vscode";
import {
  createUnquotedAndQuotedSelections,
  fromHighlightPositions,
  runExtractionTest,
} from "./utils";

suite("Vocab Helper Extension Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  suite("extractTranslationString command", () => {
    suite(
      "Component that does not contain the vocab and translation import statements",
      () => {
        test("should insert the required imports, extract the translation string and add it to the translations file", async () => {
          const testFileName = "nonTranslatedFile.tsx";

          const selection = fromHighlightPositions([3, 14], [3, 18]);

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

        const selection = fromHighlightPositions([8, 6], [8, 78]);

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

    suite("Component that contains a string constant", () => {
      const selections = createUnquotedAndQuotedSelections(6, 20, 6, 37);

      selections.map((selection) => {
        test("should extract the translation string without surrounding it with curly brackets", async () => {
          const testFileName = "stringConstant.tsx";

          const expectedFileContents = `import { useTranslations } from "@vocab/react";
import translations from "./.vocab";
import React from "react";

const MyComponent = () => {
  const { t } = useTranslations(translations);
  const someText = t("This is some text");
  return <div>{someText}</div>;
};
`;

          const expectedTranslationsFileContents = `{
  "This is some text": {
    "message": "This is some text"
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

    suite("Component containing a JSX string literal with arguments", () => {
      test("should extract the translation string, surround the hook call with curly brackets, add the arguments as parameters and add it to the translations file", async () => {
        const testFileName = "jsxWithArguments.tsx";
        const selection = fromHighlightPositions([10, 6], [11, 18]);

        const expectedFileContents = `import { useTranslations } from "@vocab/react";
import translations from "./.vocab";
import React from "react";

const MyComponent = () => {
  const { t } = useTranslations(translations);
  const emails = { unread: 4, spam: 2 };
  const status = "bad";
  return (
    <div>
      {t("You have emailsUnread unread emails and emailsSpam spam emails. This is status.", { emailsUnread: emails.unread, emailsSpam: emails.spam, status })}
    </div>
  );
};
`;

        const expectedTranslationsFileContents = `{
  "You have emailsUnread unread emails and emailsSpam spam emails. This is status.": {
    "message": "You have {emailsUnread} unread emails and {emailsSpam} spam emails. This is {status}."
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
      test("should extract the translation string from the multiline JSX string literal, surround the hook call with curly brackets and add it to the translations file", async () => {
        const testFileName = "multiLineJsxString.tsx";

        const selection = fromHighlightPositions([8, 6], [9, 78]);

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
        test("should extract the translation string from a string literal prop, surround the hook call with curly brackets and add it to the translations file", async () => {
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

    suite(
      "Component containing string literal with max key length set to 20",
      () => {
        test("should extract and truncate the translation string", async () => {
          const selection = fromHighlightPositions([6, 14], [6, 65]);

          const testFileName = "truncateString.tsx";

          const expectedFileContents = `import { useTranslations } from "@vocab/react";
import translations from "./.vocab";
import React from "react";

const MyComponent = () => {
  const { t } = useTranslations(translations);
  return <div>{t("This is a long line...")}</div>;
};
`;

          const expectedTranslationsFileContents = `{
  "This is a long line...": {
    "message": "This is a long line of text that will be truncated."
  }
}`;

          await runExtractionTest(
            {
              testFileName,
              expectedFileContents,
              expectedTranslationsFileContents,
              selection,
            },
            { maxTranslationKeyLength: 20 }
          );
        });
      }
    );

    suite("Component containing complex JSX", () => {
      test("should extract the translation string, insert the translation correctly, add the tag as a parameter and add it to the translations file", async () => {
        const testFileName = "complexJsx.tsx";

        const selection = fromHighlightPositions([9, 6], [16, 40]);

        const expectedFileContents = `import { useTranslations } from "@vocab/react";
import translations from "./.vocab";
import React from "react";
import { Foo } from "./Foo";

const MyComponent = () => {
  const { t } = useTranslations(translations);
  return (
    <div>
      {t("I am a paragraph with some bold and italic text and a link", { b: (children) => <b>{children}</b>, "Foo.Bar": (children) => <Foo.Bar>{children}</Foo.Bar>, i: (children) => <i>{children}</i>, div: (children) => <div className="bar">{children}</div>, a: (children) => <a href="/foo">{children}</a> })}
    </div>
  );
};
`;

        const expectedTranslationsFileContents = `{
  "I am a paragraph with some bold and italic text and a link": {
    "message": "I am a paragraph with some <div><Foo.Bar><b>bold</b></Foo.Bar> and <i>italic</i></div> text and a <a>link</a>"
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

    suite("Component containing the same element twice", () => {
      test("should correctly name the two element parameters", async () => {
        const testFileName = "sameElement.tsx";

        const selection = fromHighlightPositions([8, 6], [8, 67]);

        const expectedFileContents = `import { useTranslations } from "@vocab/react";
import translations from "./.vocab";
import React from "react";

const MyComponent = () => {
  const { t } = useTranslations(translations);
  return (
    <div>
      {t("This text has two links", { a: (children) => <a href="/foo">{children}</a>, a1: (children) => <a href="/bar">{children}</a> })}
    </div>
  );
};
`;

        const expectedTranslationsFileContents = `{
  "This text has two links": {
    "message": "This text <a>has</a> two <a1>links</a1>"
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
