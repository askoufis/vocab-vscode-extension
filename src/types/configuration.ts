export type MaxTranslationKeyLength = number | null;
export type FormatAfterReplace = boolean;

export interface Configuration {
  maxTranslationKeyLength: MaxTranslationKeyLength;
  formatAfterReplace: FormatAfterReplace;
}
