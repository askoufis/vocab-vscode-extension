import * as t from "@babel/types";
import { TransformState } from "./transform";
import {
  createElementRendererObjectProperty,
  getJsxElementName,
  isJsxVocabTransformElement,
} from "./typeOperations";

export const jsxTextVisitor = (
  { node: jsxText }: { node: t.JSXText },
  state: TransformState
) => {
  const text = jsxText.value;
  state.key = `${state.key}${text}`;
  state.message = `${state.message}${text}`;
};

export const jsxElementEnterVisitor = (
  { node: jsxElement }: { node: t.JSXElement },
  state: TransformState
) => {
  if (!isJsxVocabTransformElement(jsxElement)) {
    const { name } = getJsxElementName(jsxElement);
    const elementNameCount = state.elementNameOccurrences[name];
    state.elementNameOccurrences[name] = elementNameCount
      ? elementNameCount + 1
      : 1;
    const elementNameSuffix = elementNameCount ? `${elementNameCount}` : "";
    const suffixedElementName = `${name}${elementNameSuffix}`;
    state.elementNameStack.push({ name, suffix: elementNameSuffix });
    const openingElement = `<${suffixedElementName}>`;

    state.message = `${state.message}${openingElement}`;
  }
};

const translationHookIdentifier = t.identifier("t");

export const jsxElementExitVisitor = (
  { node: jsxElement }: { node: t.JSXElement },
  state: TransformState
) => {
  if (isJsxVocabTransformElement(jsxElement)) {
    const keyStringLiteral = t.stringLiteral(state.key);
    const hookParameters = t.objectExpression(state.translationHookProperties);
    const hookArguments = [keyStringLiteral, hookParameters];
    const hookCallExpression = t.callExpression(
      translationHookIdentifier,
      hookArguments
    );

    jsxElement.children = [t.jSXExpressionContainer(hookCallExpression)];
  } else {
    // Update message
    // Since we're exiting the node the element name is on the top of the stack
    const elementName = state.elementNameStack.pop();
    if (!elementName) {
      throw new Error("Element name stack was empty");
    }

    const { name, suffix: elementNameSuffix } = elementName;
    const suffixedElementName = `${name}${elementNameSuffix}`;
    const closingElement = `</${suffixedElementName}>`;
    state.message = `${state.message}${closingElement}`;

    // Push a property with the element name as the key and an
    // arrow function that renders children inside the element
    const objectProperty = createElementRendererObjectProperty(
      jsxElement,
      elementNameSuffix
    );
    state.translationHookProperties.push(objectProperty);
  }
};
