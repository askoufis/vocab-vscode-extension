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
    const name = getJsxElementName(jsxElement);
    state.elementNameStack.push(name);
    const openingElement = `<${name}>`;

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
    const name = state.elementNameStack.pop();
    const closingElement = `</${name}>`;

    state.message = `${state.message}${closingElement}`;

    const objectProperty = createElementRendererObjectProperty(jsxElement);
    // Push a property with the element name as the key and an
    // arrow function that renders children inside the element
    state.translationHookProperties.push(objectProperty);
  }
};
