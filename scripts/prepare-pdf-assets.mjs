import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(join(root, "apps/frontend/package.json"));
const packageRoot = dirname(require.resolve("pdfjs-dist/package.json"));
const metadata = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
if (metadata.version !== "6.4.299")
  throw new Error("Update PDF runtime policy with the pinned version.");
const target = join(root, "apps/frontend/public/pdfjs", metadata.version);
await mkdir(target, { recursive: true });
await cp(join(packageRoot, "build/pdf.worker.min.mjs"), join(target, "pdf.worker.min.mjs"));
for (const directory of ["cmaps", "standard_fonts", "wasm", "iccs"])
  await cp(join(packageRoot, directory), join(target, directory), { recursive: true });
await cp(join(packageRoot, "LICENSE"), join(target, "LICENSE"));
await writeFile(join(target, "version.json"), JSON.stringify({ version: metadata.version }) + "\n");
