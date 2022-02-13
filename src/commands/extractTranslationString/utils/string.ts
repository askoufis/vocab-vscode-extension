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

export const wrapWithTranslationHook = (s: string, args?: string[]) => {
  if (args && args.length > 0) {
    const argumentsObject = `{${args.join(", ")}}`;

    return `t(${removeCurlyBracketsFromString(s)}, ${argumentsObject})`;
  }

  return `t(${s})`;
};

export const wrapWithCurlyBrackets = (s: string) => `{${s}}`;

export const consolidateMultiLineString = (s: string): string => {
  const lines = s.split("\n");
  const trimmedLines = lines.map((line) => line.trim());

  return trimmedLines.join(" ");
};

export const getArgumentsFromJsxStringLiteral = (s: string): string[] => {
  let insideCurlyBrackets = false;
  let currentArgument = "";
  const args: string[] = [];

  for (const character of s) {
    if (character === leftCurlyBracket) {
      insideCurlyBrackets = true;
    } else if (character === rightCurlyBracket) {
      insideCurlyBrackets = false;
      args.push(currentArgument);
      currentArgument = "";
    } else if (insideCurlyBrackets) {
      currentArgument += character;
    }
  }

  return args;
};

export const removeCurlyBracketsFromString = (s: string): string =>
  s.replace(/\{/g, "").replace(/\}/g, "");

export const truncateString = (
  s: string,
  maxTranslationKeyLength: number
): string => {
  if (s.length > maxTranslationKeyLength) {
    const lastCharacterBeforeTruncation = s[maxTranslationKeyLength - 1];
    const willTruncateOnSpace = lastCharacterBeforeTruncation === " ";

    const endIndex = willTruncateOnSpace
      ? maxTranslationKeyLength - 1
      : maxTranslationKeyLength;
    const substringUpToMaxLength = s.slice(0, endIndex);

    return `${substringUpToMaxLength}...`;
  }

  return s;
};
