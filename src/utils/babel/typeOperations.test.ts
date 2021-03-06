import * as t from "@babel/types";
import { transformWrapper } from "../string";
import { createJsxElement } from "./helpers";
import {
  createElementRendererObjectProperty,
  flattenMemberExpression,
  getJsxElementName,
  isJsxVocabTransformElement,
  memberExpressionToObjectProperty,
} from "./typeOperations";

describe("babel utils", () => {
  describe("getJsxElementName", () => {
    it("should get the name of a jsx element with a jsx identifier name", () => {
      const name = "Test";
      const jsxElement = createJsxElement(name);

      const result = getJsxElementName(jsxElement);

      expect(result).toEqual({ name, type: "JSXIdentifier" });
    });

    it("should get the name of a jsx element with a memberExpressionName", () => {
      const elementNameMemberExpression = t.jsxMemberExpression(
        t.jsxIdentifier("Foo"),
        t.jsxIdentifier("Bar")
      );
      const openingElement = t.jsxOpeningElement(
        elementNameMemberExpression,
        []
      );
      const closingElement = t.jsxClosingElement(elementNameMemberExpression);
      const jsxElement = t.jSXElement(openingElement, closingElement, []);

      const result = getJsxElementName(jsxElement);

      expect(result).toEqual({ name: "Foo.Bar", type: "JSXMemberExpression" });
    });
  });

  describe("isJsxVocabTransformElement", () => {
    it("should return true if it is a 'VocabTransform' element", () => {
      const jsxElement = createJsxElement(transformWrapper);

      const result = isJsxVocabTransformElement(jsxElement);

      expect(result).toBe(true);
    });

    it("should return false if it is not a 'VocabTransform' element", () => {
      const jsxElement = createJsxElement("Test");

      const result = isJsxVocabTransformElement(jsxElement);

      expect(result).toBe(false);
    });
  });

  describe("member expression functions", () => {
    const object = t.identifier("foo");
    const property = t.identifier("bar");
    // foo.bar
    const innermostMemberExpression = t.memberExpression(object, property);
    // foo.bar.bar
    const innerMemberExpression = t.memberExpression(
      innermostMemberExpression,
      property
    );
    // foo.bar.bar.bar
    const outerMemberExpression = t.memberExpression(
      innerMemberExpression,
      property
    );

    describe("flattenMemberExpression", () => {
      it("should flatten a non-nested member expression", () => {
        const result = flattenMemberExpression(innermostMemberExpression);

        expect(result).toEqual([object, property]);
      });

      it("should flatten a singly-nested member expression", () => {
        const result = flattenMemberExpression(innerMemberExpression);

        expect(result).toEqual([object, property, property]);
      });

      it("should flatten a doubly-nested member expression", () => {
        const result = flattenMemberExpression(outerMemberExpression);

        expect(result).toEqual([object, property, property, property]);
      });
    });

    describe("memberExpressionToObjectProperty", () => {
      it("should return an object property and the key string for a non-nested member expression correctly", () => {
        const expectedKeyString = "fooBar";
        const expectedObjectProperty = t.objectProperty(
          t.identifier(expectedKeyString),
          innermostMemberExpression
        );

        const result = memberExpressionToObjectProperty(
          innermostMemberExpression
        );

        expect(result.keyString).toEqual(expectedKeyString);
        expect(result.objectProperty).toEqual(expectedObjectProperty);
      });

      it("should return an object property and the key string for a singly-nested member expression correctly", () => {
        const expectedKeyString = "fooBarBar";
        const expectedObjectProperty = t.objectProperty(
          t.identifier(expectedKeyString),
          innerMemberExpression
        );

        const result = memberExpressionToObjectProperty(innerMemberExpression);

        expect(result.keyString).toEqual(expectedKeyString);
        expect(result.objectProperty).toEqual(expectedObjectProperty);
      });

      it("should return an object property and the key string for a doubly-nested member expression correctly", () => {
        const expectedKeyString = "fooBarBarBar";
        const expectedObjectProperty = t.objectProperty(
          t.identifier(expectedKeyString),
          outerMemberExpression
        );

        const result = memberExpressionToObjectProperty(outerMemberExpression);

        expect(result.keyString).toEqual(expectedKeyString);
        expect(result.objectProperty).toEqual(expectedObjectProperty);
      });
    });
  });

  describe("createElementRendererObjectProperty", () => {
    it("should create an object property from a jsx element", () => {
      const jsxElement = createJsxElement("button", [t.jsxText("click me")]);

      const objectProperty = createElementRendererObjectProperty(jsxElement);

      expect(objectProperty).toEqual(
        t.objectProperty(
          t.identifier("button"),
          t.arrowFunctionExpression(
            [t.identifier("children")],
            createJsxElement("button", [
              t.jsxExpressionContainer(t.identifier("children")),
            ])
          )
        )
      );
    });
  });
});
