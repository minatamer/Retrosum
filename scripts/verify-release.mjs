import { readdir, readFile, realpath, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, resolve, relative, isAbsolute } from "node:path";

const [kind, argument] = process.argv.slice(2);
if (!["frontend", "backend"].includes(kind) || !argument)
  throw new Error("Usage: verify-release.mjs frontend|backend <package-root>");
const root = await realpath(resolve(argument));
const visited = new Set();
const inventory = [];
async function walk(directory) {
  const canonical = await realpath(directory);
  const outside = relative(root, canonical);
  if (
    outside === ".." ||
    outside.startsWith("../") ||
    outside.startsWith("..\\") ||
    isAbsolute(outside)
  )
    throw new Error("Release dependency link escapes its package.");
  if (visited.has(canonical)) return;
  visited.add(canonical);
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (
      /^\.env(?:\.|$)|\.pem$|\.key$|service-account.*\.json$|credentials.*\.json$/iu.test(
        entry.name,
      )
    )
      throw new Error("Private configuration is present in the release package.");
    if (entry.isSymbolicLink()) {
      const target = relative(root, await realpath(path));
      if (
        target === ".." ||
        target.startsWith("../") ||
        target.startsWith("..\\") ||
        isAbsolute(target)
      )
        throw new Error("Release file link escapes its package.");
    }
    const info = entry.isSymbolicLink() ? await stat(path) : entry;
    if (info.isDirectory()) await walk(path);
    else {
      const bytes = await readFile(path);
      inventory.push({
        path: relative(root, path).replaceAll("\\", "/"),
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      });
    }
  }
}
await walk(root);
const required =
  kind === "frontend"
    ? [
        "apps/frontend/server.js",
        "apps/frontend/.next/BUILD_ID",
        "apps/frontend/public/pdfjs/6.4.299/pdf.worker.min.mjs",
        "apps/frontend/public/pdfjs/6.4.299/version.json",
        "apps/frontend/public/pdfjs/6.4.299/LICENSE",
      ]
    : [
        "dist/server.js",
        "dist/documents/inspect-worker.mjs",
        "dist/providers/fake-fixtures.json",
        "node_modules/@retrosum/contracts/dist/index.js",
        "node_modules/@retrosum/money/dist/index.js",
        "node_modules/pdfjs-dist/legacy/build/pdf.mjs",
      ];
for (const path of required) await stat(join(root, path));
if (kind === "frontend") {
  const publicFiles = inventory.filter((file) => file.path.startsWith("apps/frontend/public/"));
  if (publicFiles.filter((file) => file.path.endsWith(".pdf")).length !== 8)
    throw new Error("The release must contain all eight published PDF originals.");
  if (
    !inventory.some((file) => file.path.includes("/.next/static/") && file.path.endsWith(".woff2"))
  )
    throw new Error("Locally bundled fonts are missing.");
  const runtime = JSON.parse(await readFile(join(root, required[3]), "utf8"));
  if (runtime.version !== "6.4.299") throw new Error("PDF runtime version mismatch.");
} else {
  for (const name of ["src", "scripts", "docs", "test", ".git"])
    if (inventory.some((file) => file.path.startsWith(name + "/")))
      throw new Error("Authoring files are present in the backend runtime.");
}
inventory.sort((a, b) => a.path.localeCompare(b.path, "en"));
const digest = createHash("sha256");
for (const file of inventory) digest.update(file.path + "\0" + file.sha256 + "\n");
process.stdout.write(
  JSON.stringify({
    kind,
    files: inventory.length,
    bytes: inventory.reduce((total, file) => total + file.bytes, 0),
    sha256: digest.digest("hex"),
    result: "verified",
  }) + "\n",
);
