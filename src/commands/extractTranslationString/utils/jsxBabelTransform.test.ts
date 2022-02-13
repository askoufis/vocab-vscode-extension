import {
  removeWrappingVocabTransformElement,
  transformHighlightContainingJsx,
  transformJsxToVocabHook,
  TransformResult,
  wrapWithVocabTransformElement,
} from "./jsxBabelTransform";

describe("wrapWithVocabTransformElement", () => {
  it("should wrap the given string inside a div", () => {
    const input = 'Bonjour de <a href="/foo">Vocab</a>!!!';

    const result = wrapWithVocabTransformElement(input);
    const expected =
      '<VocabTransform>Bonjour de <a href="/foo">Vocab</a>!!!</VocabTransform>';

    expect(result).toBe(expected);
  });
});

describe("removeWrappingVocabTransformElement", () => {
  it("should remove the wrapping div from the given string", () => {
    const input =
      '<VocabTransform>Bonjour de <a href="/foo">Vocab</a>!!!</VocabTransform>';

    const result = removeWrappingVocabTransformElement(input);
    const expected = 'Bonjour de <a href="/foo">Vocab</a>!!!';

    expect(result).toBe(expected);
  });
});

describe("transformJsxToVocabHook", () => {
  it("should transform jsx correctly and return the correct translation key and message", () => {
    const input =
      '<VocabTransform>Bonjour de <a href="/foo">Vocab</a>!!!</VocabTransform>';

    const result = transformJsxToVocabHook(input);
    const expectedCode =
      '<VocabTransform>{t("Bonjour de Vocab!!!", { a: (children) => <a href="/foo">{children}</a> })}</VocabTransform>;';
    const expected: TransformResult = {
      key: "Bonjour de Vocab!!!",
      message: "Bonjour de <a>Vocab</a>!!!",
      code: expectedCode,
    };

    expect(result).toEqual(expected);
  });
});

describe("transformHighlightContainingJsx", () => {
  describe("When there is a single element after a string", () => {
    it("should return a transform result with the correct key, message and transformed code", () => {
      const input = 'Bonjour de <a href="/foo">Vocab</a>';

      const result = transformHighlightContainingJsx(input);
      const expected = {
        key: "Bonjour de Vocab",
        message: "Bonjour de <a>Vocab</a>",
        code: '{t("Bonjour de Vocab", { a: (children) => <a href="/foo">{children}</a> })}',
      };

      expect(result).toEqual(expected);
    });
  });

  describe("When there is a single element before a string", () => {
    it("should return a transform result with the correct key, message and transformed code", () => {
      const input = '<a href="/foo">Bonjour</a> de Vocab';

      const result = transformHighlightContainingJsx(input);
      const expected = {
        key: "Bonjour de Vocab",
        message: "<a>Bonjour</a> de Vocab",
        code: '{t("Bonjour de Vocab", { a: (children) => <a href="/foo">{children}</a> })}',
      };

      expect(result).toEqual(expected);
    });
  });

  describe("When there is a single jsx element surrounded by jsx strings", () => {
    it("should return a transform result with the correct key, message and transformed code", () => {
      const input = 'Bonjour de <a href="/foo">Vocab</a>!!!';

      const result = transformHighlightContainingJsx(input);
      const expected = {
        key: "Bonjour de Vocab!!!",
        message: "Bonjour de <a>Vocab</a>!!!",
        code: '{t("Bonjour de Vocab!!!", { a: (children) => <a href="/foo">{children}</a> })}',
      };

      expect(result).toEqual(expected);
    });
  });

  describe("When there is are multiple elements surrounded by strings", () => {
    it("should return a transform result with the correct key, message and transformed code", () => {
      const input =
        'Bonjour de <a href="/foo">Vocab</a>!!! <Strong>Bonjour</Strong> Bonjour!';

      const result = transformHighlightContainingJsx(input);
      const expected = {
        key: "Bonjour de Vocab!!! Bonjour Bonjour!",
        message: "Bonjour de <a>Vocab</a>!!! <Strong>Bonjour</Strong> Bonjour!",
        code: '{t("Bonjour de Vocab!!! Bonjour Bonjour!", { a: (children) => <a href="/foo">{children}</a>, Strong: (children) => <Strong>{children}</Strong> })}',
      };

      expect(result).toEqual(expected);
    });
  });
});
