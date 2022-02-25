import * as t from "@babel/types";

export const createJsxElement = (
  elementName: string,
  children: t.JSXElement["children"] = []
): t.JSXElement => {
  const elementNameIdentifier = t.jsxIdentifier(elementName);
  const openingElement = t.jsxOpeningElement(elementNameIdentifier, []);
  const closingElement = t.jsxClosingElement(elementNameIdentifier);

  return t.jSXElement(openingElement, closingElement, children);
};
