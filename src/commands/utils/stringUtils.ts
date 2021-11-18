const singleQuote = "'";
const doubleQuote = '"';

export const isSingleQuoted = ({
  firstCharacter,
  lastCharacter,
}: {
  firstCharacter: string;
  lastCharacter: string;
}) => firstCharacter === singleQuote && lastCharacter === singleQuote;

export const isDoubleQuoted = ({
  firstCharacter,
  lastCharacter,
}: {
  firstCharacter: string;
  lastCharacter: string;
}) => firstCharacter === doubleQuote && lastCharacter === doubleQuote;

export const wrapWithSingleQuotes = <T extends string>(s: T) =>
  `'${s}'` as const;

export const wrapWithDoubleQuotes = <T extends string>(s: T) =>
  `"${s}"` as const;

export const stripQuotes = (s: string): string => s.slice(1, -1);

export const wrapWithTranslationHook = <T extends string>(s: T) =>
  `t(${s})` as const;

export const wrapWithCurlyBrackets = <T extends string>(s: T) =>
  `{${s}}` as const;
