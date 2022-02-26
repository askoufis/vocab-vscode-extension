import * as t from "@babel/types";
import { capitalise, transformWrapper } from "../string";

type JsxElementNameType = t.JSXElement["openingElement"]["name"]["type"];
interface ElementName {
  name: string;
  type: JsxElementNameType;
}

export const getJsxElementName = (jsxElement: t.JSXElement): ElementName => {
  const openingElementName = jsxElement.openingElement.name;
  if (t.isJSXIdentifier(openingElementName)) {
    return { name: openingElementName.name, type: openingElementName.type };
  }

  if (t.isJSXMemberExpression(openingElementName)) {
    const flattenedName = flattenJsxMemberExpression(openingElementName);
    const joinedName = flattenedName.map(({ name }) => name).join(".");

    return { name: joinedName, type: openingElementName.type };
  }

  // TODO: Handle namespace identifiers
  throw new Error(
    "Namespaced identifiers as JSX element names are not supported yet"
  );
};

export const isJsxVocabTransformElement = (
  jsxElement: t.JSXElement
): boolean => {
  const openingElementName = jsxElement.openingElement.name;
  if (t.isJSXIdentifier(openingElementName)) {
    return openingElementName.name === transformWrapper;
  }

  return false;
};

export const flattenMemberExpression = ({
  object,
  property,
}: t.MemberExpression): t.Identifier[] => {
  if (!t.isIdentifier(object) && !t.isMemberExpression(object)) {
    throw new Error(
      "Member expression object is not an identifier or a member expression"
    );
  }

  const flattenedObject = t.isMemberExpression(object)
    ? flattenMemberExpression(object)
    : [object];

  if (!t.isIdentifier(property)) {
    throw new Error("Member expression property is not an identifier");
  }

  return [...flattenedObject, property];
};

export const flattenJsxMemberExpression = ({
  object,
  property,
}: t.JSXMemberExpression): t.JSXIdentifier[] => {
  if (!t.isJSXIdentifier(object) && !t.isJSXMemberExpression(object)) {
    throw new Error(
      "Member expression object is not an identifier or a member expression"
    );
  }

  const flattenedObject = t.isJSXMemberExpression(object)
    ? flattenJsxMemberExpression(object)
    : [object];

  if (!t.isJSXIdentifier(property)) {
    throw new Error("Member expression property is not an identifier");
  }

  return [...flattenedObject, property];
};

export const memberExpressionToObjectProperty = (
  memberExpression: t.MemberExpression
): { objectProperty: t.ObjectProperty; keyString: string } => {
  const [first, ...rest] = flattenMemberExpression(memberExpression);
  const titleCastRest = rest.map(({ name }) => capitalise(name));
  const keyString = [first.name, ...titleCastRest].join("");

  const key = t.identifier(keyString);
  const value = memberExpression;
  const objectProperty = t.objectProperty(key, value);

  // The caller could get the key string from the object property, but it's a bit tedious
  // so it's easier to just return it alongside for now
  return { objectProperty, keyString };
};

const childrenIdentifier = t.identifier("children");

export const createElementRendererObjectProperty = (
  jsxElement: t.JSXElement
): t.ObjectProperty => {
  // Assumption: This JSXElement has no nested children, so we just replace
  // all its children with a single children identifier
  jsxElement.children = [t.jsxExpressionContainer(childrenIdentifier)];
  const { name, type } = getJsxElementName(jsxElement);

  const propertyKey =
    type === "JSXIdentifier" ? t.identifier(name) : t.stringLiteral(name);

  const arrowFunctionBody = jsxElement;
  const propertyValue = t.arrowFunctionExpression(
    [childrenIdentifier],
    arrowFunctionBody
  );

  return t.objectProperty(propertyKey, propertyValue);
};
