import * as t from "@babel/types";
import { createJsxElement } from "./helpers";
import { TransformState } from "./transform";
import { createElementRendererObjectProperty } from "./typeOperations";
import {
  jsxElementEnterVisitor,
  jsxElementExitVisitor,
  jsxTextVisitor,
} from "./visitors";

const initialTransformState: TransformState = {
  key: "Existing text ",
  message: "Existing text ",
  elementNameOccurrences: {},
  translationHookProperties: [],
  elementNameStack: [],
};

describe("JSXText visitor", () => {
  it("should append the text to both the key and the message", () => {
    const jsxTextNode = t.jSXText("test");
    const state = {
      ...initialTransformState,
    };

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

describe("JSXElement", () => {
  describe("enter visitor", () => {
    describe("when the element is the VocabTransform element", () => {
      it("should not alter state if we the element is the VocabTransform element", () => {
        const jsxElement = createJsxElement("VocabTransform");
        const state = {
          ...initialTransformState,
        };

        jsxElementEnterVisitor({ node: jsxElement }, state);

        expect(state).toEqual(initialTransformState);
      });
    });

    describe("when the element is not the VocabTransform element", () => {
      it("push the element name onto the element name stack and append and an element tag to the message", () => {
        const jsxElement = createJsxElement("button");
        const state = {
          ...initialTransformState,
        };

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
