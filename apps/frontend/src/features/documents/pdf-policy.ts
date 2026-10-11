import { UserFacingError } from "../../components/ui/user-facing-error";
import { MAX_FILE_BYTES } from "@retrosum/contracts";
import type { SourceDocument } from "@retrosum/contracts";

export const PDF_RUNTIME_PATH = "/pdfjs/6.4.299";
export const MAX_CANVAS_PIXELS = 4_000_000;
export const PDF_DEADLINE_MS = 20_000;
export const safePdfOptions = {
  enableXfa: false,
  useSystemFonts: false,
  stopAtErrors: true,
  maxImageSize: 12_000_000,
  canvasMaxAreaInBytes: MAX_CANVAS_PIXELS * 4,
  disableAutoFetch: true,
  disableStream: true,
  disableRange: true,
  cMapUrl: `${PDF_RUNTIME_PATH}/cmaps/`,
  standardFontDataUrl: `${PDF_RUNTIME_PATH}/standard_fonts/`,
  wasmUrl: `${PDF_RUNTIME_PATH}/wasm/`,
  iccUrl: `${PDF_RUNTIME_PATH}/iccs/`,
  verbosity: 0,
};

export function renderDimensions(
  width: number,
  height: number,
  available: number,
  zoom: number,
  dpr: number,
) {
  if (
    ![width, height, available, zoom, dpr].every(Number.isFinite) ||
    width <= 0 ||
    height <= 0 ||
    width > 10000 ||
    height > 10000 ||
    available <= 0
  )
    throw new UserFacingError("This PDF page is outside the supported viewing dimensions.");
  const scale = Math.min(
    (Math.min(available, 760) / width) * Math.max(0.75, Math.min(zoom, 2)),
    8192 / height,
    4096 / width,
  );
  const cssWidth = width * scale;
  const cssHeight = height * scale;
  const outputScale = Math.min(
    Math.max(dpr, 1),
    2,
    Math.sqrt(MAX_CANVAS_PIXELS / (cssWidth * cssHeight)),
  );
  return {
    scale,
    outputScale,
    cssWidth,
    cssHeight,
    pixelWidth: Math.floor(cssWidth * outputScale),
    pixelHeight: Math.floor(cssHeight * outputScale),
  };
}

export async function loadSampleBytes(
  asset: Pick<SourceDocument, "sha256" | "byteLength"> & { pdfPath: string },
  signal: AbortSignal,
) {
  if (
    !/^\/samples\/harbor-v1\/[A-Za-z0-9_-]+\.pdf$/u.test(asset.pdfPath) &&
    !asset.pdfPath.startsWith("blob:")
  )
    throw new UserFacingError("This document source is unavailable.");
  const boundedSignal = AbortSignal.any([signal, AbortSignal.timeout(PDF_DEADLINE_MS)]);
  const response = await fetch(asset.pdfPath, {
    signal: boundedSignal,
    redirect: "error",
    credentials: "omit",
  });
  if (
    !response.ok ||
    !response.body ||
    !response.headers.get("content-type")?.startsWith("application/pdf")
  )
    throw new UserFacingError("The original PDF could not be loaded. Try again or download it.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      total += result.value.byteLength;
      if (total > MAX_FILE_BYTES || total > asset.byteLength)
        throw new UserFacingError("This PDF exceeds its declared size.");
      chunks.push(result.value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  if (total !== asset.byteLength)
    throw new UserFacingError("This PDF is incomplete. Please try again.");
  const data = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.byteLength;
  }
  if (new TextDecoder().decode(data.subarray(0, 5)) !== "%PDF-")
    throw new UserFacingError("This file is not a supported PDF.");
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  if (hash !== asset.sha256)
    throw new UserFacingError("This PDF has changed. Reload the collection before continuing.");
  return data;
}
