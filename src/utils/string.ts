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
  const sanitizedLines = trimmedLines.map((line) =>
    line.replace(/\{" "\}/g, " ")
  );

  return sanitizedLines.reduce((previous, current, currentIndex) => {
    const isFirstElement = currentIndex === 0;
    const isElement = current.startsWith("<");
    const followsSpace = previous.endsWith(" ");
    const followsElement = previous.endsWith(">");
    const joinWithoutSpace =
      isFirstElement || isElement || followsSpace || followsElement;

    if (joinWithoutSpace) {
      return `${previous}${current}`;
    }

    return `${previous} ${current}`;
  }, "");
};

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

export const capitalise = (s: string): string =>
  `${s.charAt(0).toUpperCase()}${s.slice(1)}`;

export const transformWrapper = "VocabTransform";
const lengthOfVocabTransformElement = `<${transformWrapper}>`.length;

export const trimTrailingSemicolon = (s: string): string =>
  s.endsWith(";") ? s.substring(0, s.length - 1) : s;

export const wrapWithTransformWrapper = (s: string): string =>
  `<${transformWrapper}>${s}</${transformWrapper}>`;

export const removeTransformWrapper = (s: string): string =>
  s.substring(
    lengthOfVocabTransformElement,
    s.length - (lengthOfVocabTransformElement + 1)
  );

export const containsJavascriptExpression = (s: string): boolean =>
  s.includes(leftCurlyBracket) && s.includes(rightCurlyBracket);
