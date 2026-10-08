import Busboy from "busboy";
import type { Request } from "express";
import {
  extractionRequestSchema,
  MAX_FILE_BYTES,
  type ExtractionRequest,
} from "@retrosum/contracts";

export const MAX_MULTIPART_BYTES = MAX_FILE_BYTES + 64 * 1024;
export function readExtraction(
  req: Request,
  signal: AbortSignal,
): Promise<{ metadata: ExtractionRequest; bytes: Uint8Array }> {
  return new Promise((resolve, reject) => {
    const length = req.headers["content-length"];
    if (length && (!/^\d+$/u.test(length) || Number(length) > MAX_MULTIPART_BYTES)) {
      reject(new RangeError("body_too_large"));
      return;
    }
    let parser: ReturnType<typeof Busboy>;
    try {
      parser = Busboy({
        headers: req.headers,
        limits: {
          files: 1,
          fields: 1,
          parts: 3,
          fileSize: MAX_FILE_BYTES,
          fieldSize: 32 * 1024,
          headerPairs: 20,
        },
      });
    } catch {
      reject(new RangeError("invalid_multipart"));
      return;
    }
    let metadata: unknown;
    const chunks: Buffer[] = [];
    let fileCount = 0;
    let received = 0;
    let settled = false;
    const cleanup = () => {
      signal.removeEventListener("abort", abort);
      req.removeListener("data", count);
      req.removeListener("error", fail);
      req.unpipe(parser);
    };
    function fail() {
      if (settled) return;
      settled = true;
      cleanup();
      parser.destroy();
      req.resume();
      reject(new RangeError("invalid_multipart"));
    }
    function abort() {
      fail();
    }
    function count(chunk: Buffer) {
      received += chunk.length;
      if (received > MAX_MULTIPART_BYTES) fail();
    }
    req.on("data", count);
    req.once("error", fail);
    signal.addEventListener("abort", abort, { once: true });
    parser.on("file", (name, stream, info) => {
      fileCount++;
      if (name !== "file" || info.mimeType !== "application/pdf") {
        stream.resume();
        fail();
        return;
      }
      stream.on("limit", fail);
      stream.on("error", fail);
      stream.on("data", (chunk: Buffer) => {
        if (!settled) chunks.push(chunk);
      });
    });
    parser.on("field", (name, value, info) => {
      if (name !== "metadata" || metadata !== undefined || info.valueTruncated) {
        fail();
        return;
      }
      try {
        metadata = JSON.parse(value);
      } catch {
        fail();
      }
    });
    for (const event of ["filesLimit", "fieldsLimit", "partsLimit", "error"] as const)
      parser.on(event, fail);
    parser.once("close", () => {
      if (settled) return;
      const parsed = extractionRequestSchema.safeParse(metadata);
      if (!parsed.success || fileCount !== 1 || !chunks.length) {
        fail();
        return;
      }
      settled = true;
      cleanup();
      resolve({ metadata: parsed.data, bytes: Buffer.concat(chunks) });
    });
    req.pipe(parser);
    if (signal.aborted) fail();
  });
}
