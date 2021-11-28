import {
  consolidateMultiLineString,
  isDoubleQuoted,
  isSingleQuoted,
  stripFirstLast,
  stripQuotes,
} from "./stringUtils";

// Mocha globals override this
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
});
