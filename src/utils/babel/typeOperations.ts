import * as t from "@babel/types";
import { capitalise, transformWrapper } from "../string";

export const getJsxElementName = (jsxElement: t.JSXElement): string => {
  const openingElementName = jsxElement.openingElement.name;
  if (t.isJSXIdentifier(openingElementName)) {
    return openingElementName.name;
  }

  // TODO: Handle the other possible opening element name types
  throw new Error(
    "Member expression and namespaced identifiers are not supported yet"
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

  const propertyKey = t.identifier(getJsxElementName(jsxElement));

  const arrowFunctionBody = jsxElement;
  const propertyValue = t.arrowFunctionExpression(
    [childrenIdentifier],
    arrowFunctionBody
  );

  return t.objectProperty(propertyKey, propertyValue);
};
