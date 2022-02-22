/* eslint-disable @typescript-eslint/naming-convention */
import { transformSync, Visitor } from "@babel/core";
import * as t from "@babel/types";
import {
  getJsxElementName,
  isJsxVocabTransformElement,
  memberExpressionToObjectProperty,
} from "./babel";
import {
  wrapWithTransformWrapper,
  trimTrailingSemicolon,
  removeTransformWrapper,
} from "./string";

export const transformHighlightContainingJsx = (s: string): TransformResult => {
  // The highlighted code is likely not valid JSX by itself, so we
  // wrap it in an element babel can parse it
  const validJsxCode = wrapWithTransformWrapper(s);

  const { key, message, code } = transformJsxToVocabHook(validJsxCode);

  const trimmedCode = trimTrailingSemicolon(code);
  const unwrappedCode = removeTransformWrapper(trimmedCode);

  return { key, message, code: unwrappedCode };
};

interface State {
  key: string;
  message: string;
}

export interface TransformResult extends State {
  code: string;
}

type OnTreeExit = (result: State) => void;

interface PluginOptions {
  onTreeExit: OnTreeExit;
}

interface PluginState extends State {
  translationHookProperties: t.ObjectProperty[];
  currentElementName: string[];
  opts: PluginOptions;
}

export const transformJsxToVocabHook = (
  validJsxCode: string
): TransformResult => {
  let transformResult: TransformResult = { key: "", message: "", code: "" };

  const onTreeExit: OnTreeExit = (result) => {
    transformResult = { ...transformResult, ...result };
  };

  const code = transformSync(validJsxCode, {
    plugins: [
      "@babel/plugin-syntax-jsx",
      [vocabTransformPlugin, { onTreeExit }],
    ],
    retainLines: true,
  })?.code;

  return { ...transformResult, code: code || "" };
};

const childrenIdentifier = t.identifier("children");
const translationHookIdentifier = t.identifier("t");

const jsxExpressionContainerVisitor: Visitor<PluginState> = {
  MemberExpression: (path, state) => {
    if (t.isJSXExpressionContainer(path.parent)) {
      const { objectProperty, keyString } = memberExpressionToObjectProperty(
        path.node
      );
      state.key = `${state.key}${keyString}`;
      state.message = `${state.message}{${keyString}}`;
      state.translationHookProperties.push(objectProperty);
    }
  },
  Identifier: ({ node, parent }, state) => {
    if (t.isJSXExpressionContainer(parent)) {
      const keyAndValue = t.identifier(node.name);
      const computed = false;
      const shorthand = true;
      const objectProperty = t.objectProperty(
        keyAndValue,
        keyAndValue,
        computed,
        shorthand
      );
      state.translationHookProperties.push(objectProperty);

      state.key = `${state.key}${node.name}`;
      state.message = `${state.message}{${node.name}}`;
    }
  },
};

const vocabTransformPlugin = (): { visitor: Visitor<PluginState> } => ({
  visitor: {
    Program: {
      enter: (_path, state) => {
        state.key = "";
        state.message = "";
        state.translationHookProperties = [];
        state.currentElementName = [];
      },
      exit: (_path, state) => {
        state.opts.onTreeExit({
          key: state.key,
          message: state.message,
        });
      },
    },
    JSXElement: {
      enter: (path, state) => {
        const element = path.node;

        if (!isJsxVocabTransformElement(element)) {
          const openingElementName = element.openingElement.name;

          // TODO: Handle the other possible opening element name types
          if (t.isJSXIdentifier(openingElementName)) {
            const name = openingElementName.name;
            state.currentElementName.push(name);
            const openingElement = `<${name}>`;

            state.message = `${state.message}${openingElement}`;
          }
        }
      },
      exit: (path, state) => {
        const element = path.node;

        // Update message
        if (!isJsxVocabTransformElement(element)) {
          const openingElementName = element.openingElement.name;

          // TODO: Handle the other possible opening element name types
          if (t.isJSXIdentifier(openingElementName)) {
            const name = state.currentElementName.pop();
            const closingElement = `</${name}>`;

            state.message = `${state.message}${closingElement}`;
          }
        }

        // Transform into hook arguments
        if (isJsxVocabTransformElement(element)) {
          const keyStringLiteral = t.stringLiteral(state.key);
          const hookParameters = t.objectExpression(
            state.translationHookProperties
          );
          const hookArguments = [keyStringLiteral, hookParameters];
          const hookCallExpression = t.callExpression(
            translationHookIdentifier,
            hookArguments
          );
          path.node.children = [t.jSXExpressionContainer(hookCallExpression)];
        } else {
          // Assumption: This JSXElement has no nested children, so we just replace
          // all its children with a single children identifier
          path.node.children = [t.jsxExpressionContainer(childrenIdentifier)];

          const propertyKey = t.identifier(getJsxElementName(path.node));

          const arrowFunctionBody = path.node;
          const propertyValue = t.arrowFunctionExpression(
            [childrenIdentifier],
            arrowFunctionBody
          );

          const objectProperty = t.objectProperty(propertyKey, propertyValue);
          state.translationHookProperties.push(objectProperty);
        }
      },
    },
    JSXText: (path, state) => {
      const text = path.node.value;
      state.key = `${state.key}${text}`;
      state.message = `${state.message}${text}`;
    },
    JSXExpressionContainer: (path, state) => {
      if (t.isJSXElement(path.parent)) {
        path.traverse(jsxExpressionContainerVisitor, state);
      }
    },
  },
});
