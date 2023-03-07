import {
  consolidateMultiLineString,
  isDoubleQuoted,
  isSingleQuoted,
  stripFirstLast,
  stripQuotes,
  wrapWithTranslationHook,
  truncateString,
  capitalise,
  removeTransformWrapper,
  wrapWithTransformWrapper,
  trimTrailingSemicolon,
  containsJavascriptExpression,
  isTemplateLiteral,
} from "./string";

// Import this global so it.each works, I think mocha is overriding it
import { it } from "@jest/globals";

describe("stringUtils", () => {
  describe("isSingleQuoted", () => {
    it("should return true when given a single quoted string", () => {
      const testString = "'single quoted'";

      const result = isSingleQuoted(testString);

      expect(result).toBe(true);
    });

    it("should return false when given a non-single quoted string", () => {
      const testString = `'mis-matched quotes"`;

      const result = isSingleQuoted(testString);

      expect(result).toBe(false);
    });
  });

  describe("isDoubleQuoted", () => {
    it("should return true when given a double quoted string", () => {
      const testString = '"double quoted"';

      const result = isDoubleQuoted(testString);

      expect(result).toBe(true);
    });

    it("should return false when given a non-double quoted string", () => {
      const testString = `'mis-matched quotes"`;

      const result = isDoubleQuoted(testString);

      expect(result).toBe(false);
    });
  });

  describe("isTemplateLiteral", () => {
    it("should return true when given a template literal", () => {
      const testString = "`template literal ${foo.bar}`";

      const result = isTemplateLiteral(testString);

      expect(result).toBe(true);
    });

    it("should return false when given a non-template literal", () => {
      const testString = '"something else"';

      const result = isTemplateLiteral(testString);

      expect(result).toBe(false);
    });
  });

  describe("stripFirstLast", () => {
    it.each`
      testString   | expected   | scenario
      ${"Test me"} | ${"est m"} | ${"string length greater than 2"}
      ${"ab"}      | ${""}      | ${"string length equal to 2"}
      ${"a"}       | ${"a"}     | ${"string length equal to 1"}
      ${""}        | ${""}      | ${"string length equal to 0"}
    `(
      "$scenario",
      ({ testString, expected }: { testString: string; expected: string }) => {
        const result = stripFirstLast(testString);

        expect(result).toBe(expected);
      }
    );
  });

  describe("stripQuotes", () => {
    it("should strip surrounding single quotes if the string contains them", () => {
      const testString = "'single quoted'";

      const result = stripQuotes(testString);

      expect(result).toBe("single quoted");
    });

    it("should strip surrounding double quotes if the string contains them", () => {
      const testString = '"double quoted"';

      const result = stripQuotes(testString);

      expect(result).toBe("double quoted");
    });

    it("should leave the string unchanged if it is not surrounded by quotes", () => {
      const testString = "unquoted";

      const result = stripQuotes(testString);

      expect(result).toBe(testString);
    });
  });

  describe("wrapWithTranslationHook", () => {
    it("should wrap the string correctly without arguments", () => {
      const testString = '"Test"';
      const expected = 't("Test")';

      const result = wrapWithTranslationHook(testString);

      expect(result).toBe(expected);
    });
  });

  describe("consolidateMultiLineString", () => {
    it("should leave a single-line string unaffected", () => {
      const singleLineString = "This is a single line";

      const result = consolidateMultiLineString(singleLineString);

      expect(result).toBe(singleLineString);
    });

    it("should replace expression spaces with space characters", () => {
      const stringWithExpressionSpace = 'A string{" "}with{" "}\nsome spaces';

      const result = consolidateMultiLineString(stringWithExpressionSpace);

      expect(result).toBe("A string with some spaces");
    });

    it("should not add spaces when joining opening and closing elements with their children on separate lines", () => {
      const stringWithExpressionSpace = "<a>\nfoo\n</a>";

      const result = consolidateMultiLineString(stringWithExpressionSpace);

      expect(result).toBe("<a>foo</a>");
    });

    it("should not join nested elements with spaces in-between", () => {
      const stringWithExpressionSpace =
        'A string with{" "}\n<div>\n<b>nested</b>\n</div>{" "}\nelements';

      const result = consolidateMultiLineString(stringWithExpressionSpace);

      expect(result).toBe("A string with <div><b>nested</b></div> elements");
    });

    it("should convert a multi-line string into a single line string", () => {
      const multiLineString = "First line.\n    Second line.";
      const expected = "First line. Second line.";

      const result = consolidateMultiLineString(multiLineString);

      expect(result).toBe(expected);
    });
  });

  describe("truncateString", () => {
    it("should not truncate a string that is shorter than or equal to the maximum translation key length", () => {
      const testString = "I'm quite short";
      const maxTranslationKeyLength = 20;

      const result = truncateString(testString, maxTranslationKeyLength);

      expect(result).toBe(testString);
    });

    it("should truncate a string that is longer than the maximum translation key length", () => {
      const testString = "I am longer than the max translation length";
      const maxTranslationKeyLength = 20;

      const result = truncateString(testString, maxTranslationKeyLength);

      const expected = "I am longer than the...";
      expect(result).toBe(expected);
    });

    it("should truncate a string without leaving a space before the ellipsis", () => {
      const testString =
        "I'm a significantly longer string with a space at my 20th character";
      const maxTranslationKeyLength = 20;

      const result = truncateString(testString, maxTranslationKeyLength);

      const expected = "I'm a significantly...";
      expect(result).toBe(expected);
    });
  });

  describe("capitalise", () => {
    it("capitalise the first letter of a string if it is lowercase", () => {
      const s = "test";

      const result = capitalise(s);

      expect(result).toBe("Test");
    });

    it("not change the input string if it already capitalised", () => {
      const s = "Test";

      const result = capitalise(s);

      expect(result).toBe(s);
    });
  });

  describe("trimTrailingSemicolon", () => {
    it("should trim the trailing semicolon if the string that ends with a semicolon", () => {
      const s = "test;";

      const result = trimTrailingSemicolon(s);

      expect(result).toBe("test");
    });

    it("should leave the string unchanged if it does not end in a semicolon", () => {
      const s = "test";

      const result = trimTrailingSemicolon(s);

      expect(result).toBe("test");
    });
  });

  describe("wrapWithTransformWrapper", () => {
    it("should wrap the given string inside a div", () => {
      const input = 'Bonjour de <a href="/foo">Vocab</a>!!!';

      const result = wrapWithTransformWrapper(input);
      const expected =
        '<VocabTransform>Bonjour de <a href="/foo">Vocab</a>!!!</VocabTransform>';

      expect(result).toBe(expected);
    });
  });

  describe("removeTransformWrapper", () => {
    it("should remove the wrapping div from the given string", () => {
      const input =
        '<VocabTransform>Bonjour de <a href="/foo">Vocab</a>!!!</VocabTransform>';

      const result = removeTransformWrapper(input);
      const expected = 'Bonjour de <a href="/foo">Vocab</a>!!!';

      expect(result).toBe(expected);
    });
  });

  describe("containsJavascriptExpression", () => {
    it("should return true if the string contains a javascript expression", () => {
      const s = "I have an expression {foo.bar}";

      const result = containsJavascriptExpression(s);

      expect(result).toBe(true);
    });

    it("should return false if the string does not contain a javascript expression", () => {
      const s = "I don't have an expression";

      const result = containsJavascriptExpression(s);

      expect(result).toBe(false);
    });
  });
});
