/* eslint-disable @typescript-eslint/naming-convention */
import { transformSync, Visitor } from "@babel/core";
import * as t from "@babel/types";

export const transformHighlightContainingJsx = (s: string): TransformResult => {
  // The highlighted code is likely not valid JSX by itself, so we
  // wrap it in an element babel can parse it
  const validJsxCode = wrapWithVocabTransformElement(s);

  const { key, message, code } = transformJsxToVocabHook(validJsxCode);

  const trimmedCode = trimTrailingSemicolon(code);
  const unwrappedCode = removeWrappingVocabTransformElement(trimmedCode);

  return { key, message, code: unwrappedCode };
};

const elementName = "VocabTransform";
const lengthOfVocabTransformElement = `<${elementName}>`.length;

const trimTrailingSemicolon = (s: string): string =>
  s.substring(0, s.length - 1);

export const wrapWithVocabTransformElement = (s: string): string =>
  `<${elementName}>${s}</${elementName}>`;

export const removeWrappingVocabTransformElement = (s: string): string =>
  s.substring(
    lengthOfVocabTransformElement,
    s.length - (lengthOfVocabTransformElement + 1)
  );

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

const getTranslationMessageFromChildren = (
  children: t.JSXElement["children"]
): string => {
  let message = "";

  children.forEach((child) => {
    if (child.type === "JSXText") {
      message = `${message}${child.value}`;
    } else if (child.type === "JSXElement") {
      const openingElementName = child.openingElement.name;

      if (t.isJSXIdentifier(openingElementName)) {
        const name = openingElementName.name;
        const openingElement = `<${name}>`;
        const closingElement = `</${name}>`;

        const firstChild = child.children[0];
        if (t.isJSXText(firstChild)) {
          const firstChildText = firstChild.value;
          message = `${message}${openingElement}${firstChildText}${closingElement}`;
        }
      }
    }
  });

  return message;
};

const getJsxElementName = (jsxElement: t.JSXElement): string => {
  const openingElementName = jsxElement.openingElement.name;
  if (t.isJSXIdentifier(openingElementName)) {
    return openingElementName.name;
  }

  // Throw instead?
  return "error";
};

const isJsxVocabTransformElement = (jsxElement: t.JSXElement): boolean => {
  const openingElementName = jsxElement.openingElement.name;
  if (t.isJSXIdentifier(openingElementName)) {
    return openingElementName.name === elementName;
  }

  return false;
};

const childrenIdentifier = t.identifier("children");
const translationHookIdentifier = t.identifier("t");

const vocabTransformPlugin = (): { visitor: Visitor<PluginState> } => ({
  visitor: {
    Program: {
      enter: (_path, state) => {
        state.key = "";
        state.message = "";
        state.translationHookProperties = [];
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

        if (isJsxVocabTransformElement(element)) {
          const children = element.children;
          state.message = getTranslationMessageFromChildren(children);
        }
      },
      exit: (path, state) => {
        const element = path.node;
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
          // Assumption: This JSXElement has a single JSXText as its child
          const firstChild = path.get("children.0");

          if (!Array.isArray(firstChild)) {
            firstChild.replaceWith(
              t.jsxExpressionContainer(childrenIdentifier)
            );
          }

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
    },
  },
});
