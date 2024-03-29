import {
  transformHighlightContainingJsx,
  transformJsxToVocabHook,
  transformTemplateLiteralToVocabHook,
} from "./transform";
import type { TransformResult } from "./types";

describe("transformJsxToVocabHook", () => {
  it("should transform jsx correctly and return the correct translation key and message", () => {
    const input =
      '<VocabTransform>Bonjour {foo.text} de <a href="/foo">Vocab {bar}</a>!!!</VocabTransform>';

    const result = transformJsxToVocabHook(input);
    const expectedCode =
      '<VocabTransform>{t("Bonjour fooText de Vocab bar!!!", { fooText: foo.text, bar, a: (children) => <a href="/foo">{children}</a> })}</VocabTransform>;';
    const expected: TransformResult = {
      key: "Bonjour fooText de Vocab bar!!!",
      message: "Bonjour {fooText} de <a>Vocab {bar}</a>!!!",
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

  describe("When a jsx element name is a member expression", () => {
    it("should return a transform result with the correct key, message and transformed code", () => {
      const input = 'Bonjour de <foo.a href="/foo">Vocab</foo.a>!!!';

      const result = transformHighlightContainingJsx(input);
      const expected = {
        key: "Bonjour de Vocab!!!",
        message: "Bonjour de <foo.a>Vocab</foo.a>!!!",
        code: '{t("Bonjour de Vocab!!!", { "foo.a": (children) => <foo.a href="/foo">{children}</foo.a> })}',
      };

      expect(result).toEqual(expected);
    });
  });

  describe("When there are multiple elements surrounded by strings", () => {
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

  describe("When there are multiple of the same element", () => {
    it("should suffix the duplicate keys in the hook call", () => {
      const input =
        'Bonjour de <a href="/foo">Vocab</a>!!! <a href="/bar">Bonjour</a> Bonjour!';

      const result = transformHighlightContainingJsx(input);
      const expected = {
        key: "Bonjour de Vocab!!! Bonjour Bonjour!",
        message: "Bonjour de <a>Vocab</a>!!! <a1>Bonjour</a1> Bonjour!",
        code: '{t("Bonjour de Vocab!!! Bonjour Bonjour!", { a: (children) => <a href="/foo">{children}</a>, a1: (children) => <a href="/bar">{children}</a> })}',
      };

      expect(result).toEqual(expected);
    });
  });

  describe("When there is typescript syntax in an element", () => {
    it("should suffix the duplicate keys in the hook call", () => {
      const input =
        'Bonjour de <a href={"/foo" as const}>Vocab</a>!!! <a href="/bar">Bonjour</a> Bonjour!';

      const result = transformHighlightContainingJsx(input);
      const expected = {
        key: "Bonjour de Vocab!!! Bonjour Bonjour!",
        message: "Bonjour de <a>Vocab</a>!!! <a1>Bonjour</a1> Bonjour!",
        code: '{t("Bonjour de Vocab!!! Bonjour Bonjour!", { a: (children) => <a href={("/foo" as const)}>{children}</a>, a1: (children) => <a href="/bar">{children}</a> })}',
      };

      expect(result).toEqual(expected);
    });
  });
});

describe("transformTemplateLiteralToVocabHook", () => {
  it("should transform a string literal with a member expression into the hook call", () => {
    const input = "`My name is ${props.name}!`";

    const result = transformTemplateLiteralToVocabHook(input);
    const expected = {
      key: "My name is propsName!",
      message: "My name is {propsName}!",
      code: 't("My name is propsName!", { propsName: props.name })',
    };

    expect(result).toEqual(expected);
  });

  it("should transform a string literal with an identifier into the hook call", () => {
    const input = "`My name is ${name}!`";

    const result = transformTemplateLiteralToVocabHook(input);
    const expected = {
      key: "My name is name!",
      message: "My name is {name}!",
      code: 't("My name is name!", { name })',
    };

    expect(result).toEqual(expected);
  });
});
