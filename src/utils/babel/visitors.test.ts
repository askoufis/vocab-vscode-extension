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
          translationHookProperties: [],
          elementNameStack: ["button"],
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
          translationHookProperties: [],
          elementNameStack: [elementName],
        };

        jsxElementExitVisitor({ node: jsxElement }, state);

        expect(state).toMatchSnapshot();
      });
    });
  });
});
