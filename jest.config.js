module.exports = {
  transform: {
    "^.+\\.tsx?$": "esbuild-jest",
  },
  testEnvironment: "node",
  testPathIgnorePatterns: ["src/test", "out/"],
  watchPlugins: [
    "jest-watch-typeahead/filename",
    "jest-watch-typeahead/testname",
  ],
};
