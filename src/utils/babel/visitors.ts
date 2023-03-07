import * as t from "@babel/types";
import type { TransformState } from "./types";
import {
  createElementRendererObjectProperty,
  getJsxElementName,
  isJsxVocabTransformElement,
  memberExpressionToObjectProperty,
} from "./typeOperations";
import type { NodePath } from "@babel/core";

export const jsxTextVisitor = (
  { node: jsxText }: { node: t.JSXText },
  state: TransformState
) => {
  const text = jsxText.value;
  state.key = `${state.key}${text}`;
  state.message = `${state.message}${text}`;
};

const constructHookCallExpression = (state: TransformState) => {
  const keyStringLiteral = t.stringLiteral(state.key);
  const hookParameters = t.objectExpression(state.translationHookProperties);
  const hookArguments = [keyStringLiteral, hookParameters];

  return t.callExpression(translationHookIdentifier, hookArguments);
};

export const templateLiteralEnterVisitor = (
  { node: templateLiteral }: { node: t.TemplateLiteral },
  state: TransformState
) => {
  // Template literals alternate between quasis and expressions
  let index = 0;
  for (const quasi of templateLiteral.quasis) {
    const text = quasi.value.raw;
    state.key = `${state.key}${text}`;
    state.message = `${state.message}${text}`;

    // tail === true for the last quasi
    if (quasi.tail) {
      break;
    }

    const expression = templateLiteral.expressions[index];

    if (t.isIdentifier(expression)) {
      const keyString = expression.name;

      state.key = `${state.key}${keyString}`;
      state.message = `${state.message}{${keyString}}`;

      const objectProperty = t.objectProperty(
        expression,
        expression,
        // computed
        false,
        // shorthand
        true
      );

      state.translationHookProperties.push(objectProperty);
    } else if (t.isMemberExpression(expression)) {
      const { keyString, objectProperty } =
        memberExpressionToObjectProperty(expression);
      state.key = `${state.key}${keyString}`;
      state.message = `${state.message}{${keyString}}`;

      state.translationHookProperties.push(objectProperty);
    } else {
      throw new Error(
        `Expected identifier or member expression, got ${expression?.type}`
      );
    }

    index += 1;
  }
};

export const templateLiteralExitVisitor = (
  path: NodePath<t.TemplateLiteral>,
  state: TransformState
) => {
  const hookCallExpression = constructHookCallExpression(state);

  path.replaceWith(hookCallExpression);
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
    const hookCallExpression = constructHookCallExpression(state);

    jsxElement.children = [t.jsxExpressionContainer(hookCallExpression)];
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
