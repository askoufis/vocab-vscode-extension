module.exports = {
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  testEnvironment: "node",
  testPathIgnorePatterns: ["src/test", "out/"],
  watchPlugins: [
    "jest-watch-typeahead/filename",
    "jest-watch-typeahead/testname",
  ],
};
