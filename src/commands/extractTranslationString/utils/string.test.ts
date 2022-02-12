import {
  consolidateMultiLineString,
  isDoubleQuoted,
  isSingleQuoted,
  stripFirstLast,
  stripQuotes,
  removeCurlyBracketsFromString,
  wrapWithTranslationHook,
  getArgumentsFromJsxStringLiteral,
  truncateString,
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

    describe("stripFirstLast", () => {
      it.each`
        testString   | expected   | scenario
        ${"Test me"} | ${"est m"} | ${"string length greater than 2"}
        ${"ab"}      | ${""}      | ${"string length equal to 2"}
        ${"a"}       | ${"a"}     | ${"string length equal to 1"}
        ${""}        | ${""}      | ${"string length equal to 0"}
      `(
        "$scenario",
        ({
          testString,
          expected,
        }: {
          testString: string;
          expected: string;
        }) => {
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
  });

  describe("wrapWithTranslationHook", () => {
    it("should wrap the string correctly without arguments", () => {
      const testString = '"Test"';
      const expected = 't("Test")';

      const result = wrapWithTranslationHook(testString);

      expect(result).toBe(expected);
    });

    it("should wrap the string correctly with arguments", () => {
      const testString = '"Test"';
      const args = ["foo", "bar"];
      const expected = 't("Test", {foo, bar})';

      const result = wrapWithTranslationHook(testString, args);

      expect(result).toBe(expected);
    });
  });

  describe("consolidateMultiLineString", () => {
    it("should leave a single-line string unaffected", () => {
      const singleLineString = "This is a single line";

      const result = consolidateMultiLineString(singleLineString);

      expect(result).toBe(singleLineString);
    });

    it("should convert a multi-line string into a single line string", () => {
      const multiLineString = "First line.\n    Second line.";
      const expected = "First line. Second line.";

      const result = consolidateMultiLineString(multiLineString);

      expect(result).toBe(expected);
    });
  });

  describe("getArgumentsFromJsxStringLiteral", () => {
    it("should return a list with a single argument when the string contains 1 argument", () => {
      const testString = "This string contains {num} arguments";
      const expected = ["num"];

      const result = getArgumentsFromJsxStringLiteral(testString);

      expect(result).toEqual(expected);
    });

    it("should return a list with multiple arguments when the string contains multiple arguments", () => {
      const testString =
        "This string contains {num} arguments and {value} letters";
      const expected = ["num", "value"];

      const result = getArgumentsFromJsxStringLiteral(testString);

      expect(result).toEqual(expected);
    });

    it("should return an empty list when the string does not contain arguments", () => {
      const testString = "This string contains no arguments";
      const expected: string[] = [];

      const result = getArgumentsFromJsxStringLiteral(testString);

      expect(result).toEqual(expected);
    });
  });

  describe("removeCurlyBracketsFromString", () => {
    it("should not alter a string that does not contain curly brackets", () => {
      const testString = "I have no curly brackets";

      const result = removeCurlyBracketsFromString(testString);

      expect(result).toEqual(testString);
    });

    it("should remove all curly brackets from a string", () => {
      const testString = "{I have{}} {some} {curly} brackets}{";
      const expected = "I have some curly brackets";

      const result = removeCurlyBracketsFromString(testString);

      expect(result).toEqual(expected);
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
});
