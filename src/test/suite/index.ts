/* eslint-disable no-console */
import path from "path";
import Mocha from "mocha";
import { glob } from "fast-glob";

export async function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
  });

  const testsRoot = path.resolve(__dirname, "..");
  const testFiles = await glob("**/**.test.js", { cwd: testsRoot });

  // Add files to the test suite
  testFiles.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

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
