import { isDoubleQuoted, isSingleQuoted, stripQuotes } from "./stringUtils";

describe("stringUtils", () => {
  describe("isSingleQuoted", () => {
    it("should return true when passed two single quotes", () => {
      const firstCharacter = "'";
      const lastCharacter = "'";

      const result = isSingleQuoted({
        firstCharacter,
        lastCharacter,
      });

      expect(result).toBe(true);
    });

    it("should return false when passed anything but two single quotes", () => {
      const firstCharacter = '"';
      const lastCharacter = "'";

      const result = isSingleQuoted({
        firstCharacter,
        lastCharacter,
      });

      expect(result).toBe(false);
    });
  });

  describe("isDoubleQuoted", () => {
    it("should return true when passed two double quotes", () => {
      const firstCharacter = '"';
      const lastCharacter = '"';

      const result = isDoubleQuoted({
        firstCharacter,
        lastCharacter,
      });

      expect(result).toBe(true);
    });

    it("should return false when passed anything but two double quotes", () => {
      const firstCharacter = "'";
      const lastCharacter = '"';

      const result = isDoubleQuoted({
        firstCharacter,
        lastCharacter,
      });

      expect(result).toBe(false);
    });

    describe("stripQuotes", () => {
      it("should strip surrounding single quotes", () => {
        const testString = "'test'";

        const result = stripQuotes(testString);

        expect(result).toBe("test");
      });

      it("should strip surrounding double quotes", () => {
        const testString = '"test"';

        const result = stripQuotes(testString);

        expect(result).toBe("test");
      });
    });
  });
});
