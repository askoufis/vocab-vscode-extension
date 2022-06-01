/* eslint-disable @typescript-eslint/naming-convention */
import type { Visitor } from "@babel/core";
import { transformSync } from "@babel/core";
import * as t from "@babel/types";
import { memberExpressionToObjectProperty } from "./typeOperations";
import {
  wrapWithTransformWrapper,
  trimTrailingSemicolon,
  removeTransformWrapper,
} from "../string";
import {
  jsxElementEnterVisitor,
  jsxElementExitVisitor,
  jsxTextVisitor,
} from "./visitors";
// @ts-ignore
import babelPluginSyntaxJsx from "@babel/plugin-syntax-jsx";
// @ts-ignore
import babelPluginSyntaxTypescript from "@babel/plugin-syntax-typescript";
import type { OnTreeExit, PluginState, TransformResult } from "./types";

export const transformHighlightContainingJsx = (s: string): TransformResult => {
  // The highlighted code is likely not valid JSX by itself, so we
  // wrap it in an element babel can parse it
  const validJsxCode = wrapWithTransformWrapper(s);

  const { key, message, code } = transformJsxToVocabHook(validJsxCode);

  const trimmedCode = trimTrailingSemicolon(code);
  const unwrappedCode = removeTransformWrapper(trimmedCode);

  return { key, message, code: unwrappedCode };
};

export const transformJsxToVocabHook = (
  validJsxCode: string
): TransformResult => {
  let transformResult: TransformResult = { key: "", message: "", code: "" };

  const onTreeExit: OnTreeExit = (result) => {
    transformResult = { ...transformResult, ...result };
  };

  const code = transformSync(validJsxCode, {
    plugins: [
      babelPluginSyntaxJsx,
      [babelPluginSyntaxTypescript, { isTSX: true }],
      [vocabTransformPlugin, { onTreeExit }],
    ],
    retainLines: true,
  })?.code;

  return { ...transformResult, code: code || "" };
};

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
        state.elementNameOccurrences = {};
        state.translationHookProperties = [];
        state.elementNameStack = [];
      },
      exit: (_path, state) => {
        state.opts.onTreeExit({
          key: state.key,
          message: state.message,
        });
      },
    },
    JSXElement: {
      enter: jsxElementEnterVisitor,
      exit: jsxElementExitVisitor,
    },
    JSXText: jsxTextVisitor,
    JSXExpressionContainer: (path, state) => {
      if (t.isJSXElement(path.parent)) {
        path.traverse(jsxExpressionContainerVisitor, state);
      }
    },
  },
});
