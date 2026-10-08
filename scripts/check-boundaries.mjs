import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { inspectBoundary } from "./boundary-rules.mjs";
async function files(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const name = path.join(root, entry.name);
      if (entry.isDirectory()) return files(name);
      return /\.(?:ts|tsx)$/u.test(name) && !name.endsWith(".test.ts") ? [name] : [];
    }),
  );
  return nested.flat();
}
const roots = [
  "packages/contracts/src",
  "packages/money/src",
  "apps/frontend/src",
  "apps/backend/src",
];
const sourceFiles = (await Promise.all(roots.map(files))).flat();
const results = await Promise.all(
  sourceFiles.map(async (file) => inspectBoundary(file, await readFile(file, "utf8"))),
);
const findings = results.flat();
for (const finding of findings)
  console.error(finding.file + ":" + finding.line + " " + finding.message);
if (findings.length) process.exitCode = 1;
else console.log("Workspace boundaries passed (" + sourceFiles.length + " source files).");
