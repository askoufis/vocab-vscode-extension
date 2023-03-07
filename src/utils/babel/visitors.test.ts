import * as t from "@babel/types";
import { createJsxElement } from "./helpers";
import type { TransformState } from "./types";
import { createElementRendererObjectProperty } from "./typeOperations";
import {
  jsxElementEnterVisitor,
  jsxElementExitVisitor,
  jsxTextVisitor,
  templateLiteralEnterVisitor,
  templateLiteralExitVisitor,
} from "./visitors";

const createInitialState = () => ({
  key: "Existing text ",
  message: "Existing text ",
  elementNameOccurrences: {},
  translationHookProperties: [],
  elementNameStack: [],
});

describe("JSXText visitor", () => {
  it("should append the text to both the key and the message", () => {
    const jsxTextNode = t.jsxText("test");
    const state = createInitialState();

    jsxTextVisitor({ node: jsxTextNode }, state);

    expect(state).toEqual({
      key: "Existing text test",
      message: "Existing text test",
      elementNameOccurrences: {},
      translationHookProperties: [],
      elementNameStack: [],
    });
  });
});

describe("TemplateLiteral", () => {
  describe("enter visitor", () => {
    it("should append the text and any identifiers to both the key and the message", () => {
      const templateLiteral = t.templateLiteral(
        [
          t.templateElement({ raw: "My name is " }),
          t.templateElement({ raw: "!" }, true),
        ],
        [t.identifier("name")]
      );
      const state = createInitialState();

      templateLiteralEnterVisitor({ node: templateLiteral }, state);

      expect(state).toEqual({
        key: "Existing text My name is name!",
        message: "Existing text My name is {name}!",
        elementNameOccurrences: {},
        translationHookProperties: [
          t.objectProperty(
            t.identifier("name"),
            t.identifier("name"),
            false,
            true
          ),
        ],
        elementNameStack: [],
      });
    });

    it("should append the text and any member expressions to both the key and the message", () => {
      const templateLiteral = t.templateLiteral(
        [
          t.templateElement({ raw: "My name is " }),
          t.templateElement({ raw: "!" }, true),
        ],
        [t.memberExpression(t.identifier("props"), t.identifier("name"))]
      );
      const state = createInitialState();

      templateLiteralEnterVisitor({ node: templateLiteral }, state);

      expect(state).toEqual({
        key: "Existing text My name is propsName!",
        message: "Existing text My name is {propsName}!",
        elementNameOccurrences: {},
        translationHookProperties: [
          t.objectProperty(
            t.identifier("propsName"),
            t.memberExpression(t.identifier("props"), t.identifier("name"))
          ),
        ],
        elementNameStack: [],
      });
    });
  });

  describe("exit visitor", () => {
    // Hard to test this one as it needs a full node path
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip("should append the text and any member expressions to both the key and the message", () => {
      const templateLiteral = t.templateLiteral(
        [
          t.templateElement({ raw: "My name is " }),
          t.templateElement({ raw: "!" }, true),
        ],
        [t.memberExpression(t.identifier("props"), t.identifier("name"))]
      );
      const state = createInitialState();

      // @ts-expect-error
      templateLiteralExitVisitor({ node: templateLiteral }, state);

      expect(state).toEqual({
        key: "Existing text My name is propsName!",
        message: "Existing text My name is {propsName}!",
        elementNameOccurrences: {},
        translationHookProperties: [
          t.objectProperty(
            t.identifier("propsName"),
            t.memberExpression(t.identifier("props"), t.identifier("name"))
          ),
        ],
        elementNameStack: [],
      });
    });
  });
});

describe("JSXElement", () => {
  describe("enter visitor", () => {
    describe("when the element is the VocabTransform element", () => {
      it("should not alter state if we the element is the VocabTransform element", () => {
        const jsxElement = createJsxElement("VocabTransform");
        const state = createInitialState();

        jsxElementEnterVisitor({ node: jsxElement }, state);

        expect(state).toEqual(createInitialState());
      });
    });

    describe("when the element is not the VocabTransform element", () => {
      it("push the element name onto the element name stack and append and an element tag to the message", () => {
        const jsxElement = createJsxElement("button");
        const state = createInitialState();

        jsxElementEnterVisitor({ node: jsxElement }, state);

        expect(state).toEqual({
          key: "Existing text ",
          message: "Existing text <button>",
          elementNameOccurrences: { button: 1 },
          translationHookProperties: [],
          elementNameStack: [{ name: "button", suffix: "" }],
        });
      });
    });

    describe("when an element is visited that has the same name as a previously visited element", () => {
      it("push the element name onto the element name stack and append and an element tag to the message", () => {
        const jsxElement = createJsxElement("button");
        const state = {
          key: "Existing text <button>foo</button>",
          message: "Existing text <button>foo</button> ",
          elementNameOccurrences: { button: 1 },
          translationHookProperties: [],
          elementNameStack: [{ name: "button", suffix: "" }],
        };

        jsxElementEnterVisitor({ node: jsxElement }, state);

        expect(state).toEqual({
          key: "Existing text <button>foo</button>",
          message: "Existing text <button>foo</button> <button1>",
          elementNameOccurrences: { button: 2 },
          translationHookProperties: [],
          elementNameStack: [
            { name: "button", suffix: "" },
            { name: "button", suffix: "1" },
          ],
        });
      });
    });
  });

  describe("exit visitor", () => {
    describe("when the element is the VocabTransform element", () => {
      it("should replace its children with the translation hook call", () => {
        const jsxElement = createJsxElement("VocabTransform");
        const state: TransformState = {
          key: "Click here",
          message: "Click <button>here</button",
          elementNameOccurrences: {},
          translationHookProperties: [
            createElementRendererObjectProperty(createJsxElement("button")),
          ],
          elementNameStack: [],
        };

        jsxElementExitVisitor({ node: jsxElement }, state);

        expect(jsxElement.children).toMatchSnapshot();
      });
    });

    describe("when the element is not the VocabTransform element", () => {
      it("should append its closing tag to the message and add its render function to the translation hook properties", () => {
        const elementName = "button";
        const jsxElement = createJsxElement(elementName, [
          t.jSXText("click me"),
        ]);
        const state: TransformState = {
          key: "Existing text click me",
          message: "Existing text <button>click me",
          elementNameOccurrences: {},
          translationHookProperties: [],
          elementNameStack: [{ name: elementName, suffix: "" }],
        };

        jsxElementExitVisitor({ node: jsxElement }, state);

        expect(state).toMatchSnapshot();
      });
    });
  });
});
