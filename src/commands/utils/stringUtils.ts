export const wrapWithQuotes = (s: string): string => `"${s}"`;

export const stripQuotes = (s: string): string => s.slice(1, -1);

export const wrapTranslationString = (translationString: string): string =>
  `t(${translationString})`;
