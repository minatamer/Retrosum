import { cp, mkdir, access, readdir, realpath, symlink, copyFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, basename, dirname, relative, isAbsolute } from "node:path";

// Fixed owned destination. Fail instead of deleting or merging an earlier candidate.
const root = fileURLToPath(new URL("../", import.meta.url));
const app = join(root, "apps/frontend");
const output = join(root, "artifacts/local/release/frontend");
await access(join(app, ".next/standalone/apps/frontend/server.js"));
await mkdir(dirname(output), { recursive: true });
await mkdir(output, { recursive: false });
const source = await realpath(join(app, ".next/standalone"));
async function copy(directory, destination) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (/^\.env(?:\.|$)/u.test(basename(entry.name))) continue;
    const from = join(directory, entry.name),
      to = join(destination, entry.name);
    if (entry.isSymbolicLink()) {
      const target = await realpath(from),
        path = relative(source, target);
      if (path === ".." || path.startsWith("../") || path.startsWith("..\\") || isAbsolute(path))
        throw new Error("Standalone trace has an external link; rebuild it in Linux.");
      const mapped = join(output, path);
      const directoryLink = (await stat(target)).isDirectory();
      await symlink(
        process.platform === "win32" && directoryLink ? mapped : relative(dirname(to), mapped),
        to,
        directoryLink ? (process.platform === "win32" ? "junction" : "dir") : "file",
      );
    } else if (entry.isDirectory()) {
      await mkdir(to, { recursive: true });
      await copy(from, to);
    } else await copyFile(from, to);
  }
}
await copy(source, output);
const packagedApp = join(output, "apps/frontend");
await cp(join(app, ".next/static"), join(packagedApp, ".next/static"), { recursive: true });
await cp(join(app, "public"), join(packagedApp, "public"), { recursive: true });
process.stdout.write("Frontend standalone, static and public assets prepared.\n");
