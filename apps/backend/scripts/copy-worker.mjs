import { copyFile, mkdir } from "node:fs/promises";
await mkdir(new URL("../dist/documents/", import.meta.url), { recursive: true });
await copyFile(
  new URL("../src/documents/inspect-worker.mjs", import.meta.url),
  new URL("../dist/documents/inspect-worker.mjs", import.meta.url),
);
