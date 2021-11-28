const singleQuote = "'";
const doubleQuote = '"';
const leftCurlyBracket = "{";
const rightCurlyBracket = "}";

export const isSingleQuoted = (s: string): boolean =>
  s.startsWith(singleQuote) && s.endsWith(singleQuote);

export const isDoubleQuoted = (s: string): boolean =>
  s.startsWith(doubleQuote) && s.endsWith(doubleQuote);

export const isWithinCurlyBrackets = (s: string): boolean =>
  s.startsWith(leftCurlyBracket) && s.endsWith(rightCurlyBracket);

export const wrapWithSingleQuotes = (s: string) => `'${s}'`;

export const wrapWithDoubleQuotes = (s: string) => `"${s}"`;

export const stripFirstLast = (s: string): string =>
  s.length >= 2 ? s.slice(1, -1) : s;

export const stripQuotes = (s: string): string =>
  isSingleQuoted(s) || isDoubleQuoted(s) ? stripFirstLast(s) : s;

export const wrapWithTranslationHook = (s: string) => `t(${s})`;

export const wrapWithCurlyBrackets = (s: string) => `{${s}}`;

export const consolidateMultiLineString = (s: string): string => {
  const lines = s.split("\n");
  const trimmedLines = lines.map((line) => line.trim());

  return trimmedLines.join(" ");
};
