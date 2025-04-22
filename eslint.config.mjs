import eslintConfigSeek from "eslint-config-seek";

export default [
  ...eslintConfigSeek,
  {
    rules: {
      "jest/expect-expect": [
        "warn",
        {
          assertFunctionNames: ["expect", "runExtractionTest"],
          additionalTestBlockFunctions: [],
        },
      ],
      "@typescript-eslint/consistent-type-imports": ["error"],
    },
  },
  {
    ignores: ["out/**", "dist/**", "**/*.d.ts", "**/testFiles/**"],
  },
];
