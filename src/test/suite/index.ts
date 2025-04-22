/* eslint-disable no-console */
import path from "path";
import Mocha from "mocha";
import { glob } from "node:fs/promises";

export async function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
  });

  const testsRoot = path.resolve(__dirname, "..");
  const testFiles = glob("**/**.test.js", { cwd: testsRoot });

  // Add files to the test suite
  for await (const file of testFiles) {
    mocha.addFile(path.resolve(testsRoot, file));
  }

  try {
    // Run the mocha test
    mocha.run((failures) => {
      if (failures > 0) {
        throw new Error(`${failures} tests failed.`);
      }
    });
  } catch (error) {
    console.error(error);
    throw new Error(error as string);
  }
}
