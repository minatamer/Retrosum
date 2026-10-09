import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(join(root, "apps/frontend/package.json"));
const pdfRoot = dirname(require.resolve("pdfjs-dist/package.json"));
const { getDocument } = await import(pathToFileURL(join(pdfRoot, "legacy/build/pdf.mjs")).href);
export const numericTokens = (text) =>
  text.match(/[A-Z]+(?:-[A-Z]+)*-\d+|\d{4}-\d{2}-\d{2}|[+-]?\d[\d,]*(?:\.\d{2})?%?/gu) ?? [];
const counts = (tokens) =>
  Object.fromEntries(
    [...new Set(tokens)]
      .sort()
      .map((token) => [token, tokens.filter((value) => value === token).length]),
  );

export function createVerificationTask(data) {
  return getDocument({
    data: new Uint8Array(data),
    useSystemFonts: false,
    enableXfa: false,
    useWorkerFetch: false,
    verbosity: 0,
    stopAtErrors: true,
    standardFontDataUrl: join(pdfRoot, "standard_fonts").replaceAll("\\", "/") + "/",
  });
}

export async function verifyHarbor() {
  const manifest = JSON.parse(
    await readFile(join(root, "apps/frontend/src/features/documents/sample-manifest.json"), "utf8"),
  );
  const truth = JSON.parse(
    await readFile(join(root, "test/fixtures/harbor-v1/ground-truth.json"), "utf8"),
  );
  assert.equal(manifest.fixtureVersion, truth.fixtureVersion);
  assert.equal(manifest.documents.length, 10);
  let pageCount = 0;
  let bytes = 0;
  let numericFields = 0;
  let numericOccurrences = 0;
  for (const asset of manifest.documents) {
    const data = await readFile(join(root, "apps/frontend/public", asset.pdfPath));
    assert.equal(data.byteLength, asset.byteLength, asset.label + " byte count");
    assert.equal(
      createHash("sha256").update(data).digest("hex"),
      asset.sha256,
      asset.label + " hash",
    );
    assert.ok(data.byteLength <= 5 * 1024 * 1024);
    assert.match(data.subarray(0, 8).toString(), /^%PDF-/u);
    const thumbnail = await readFile(join(root, "apps/frontend/public", asset.thumbnailPath));
    assert.equal(thumbnail.subarray(0, 4).toString(), "RIFF");
    assert.equal(thumbnail.subarray(8, 12).toString(), "WEBP");
    const expected = truth.documents.find((item) => item.label === asset.label);
    assert.ok(expected);
    const loading = createVerificationTask(data);
    try {
      const pdf = await loading.promise;
      assert.equal(pdf.numPages, asset.pageCount);
      assert.equal(pdf.numPages, expected.pages.length);
      assert.equal(asset.duplicateOf?.replace("document_", ""), expected.duplicateOf);
      for (const inventory of expected.pages) {
        const page = await pdf.getPage(inventory.page);
        const content = await page.getTextContent();
        const text = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
        numericFields += inventory.fields.length;
        for (const [raw, count, value, scale, treatment] of inventory.fields) {
          assert.ok(count >= 1 && inventory.blockId && treatment);
          if (scale === "USD_cents") {
            const [whole, fraction] = raw.replaceAll(",", "").split(".");
            const sign = whole.startsWith("-") ? -1n : 1n;
            assert.equal(
              Number((BigInt(whole.replace(/^[+-]/u, "")) * 100n + BigInt(fraction)) * sign),
              value,
              raw,
            );
          } else if (scale === "ISO_date" || scale === "identifier") assert.equal(raw, value);
          else if (scale === "basis_points")
            assert.equal(Number(raw.replace("%", "")) * 100, value);
          else assert.equal(Number(raw), value);
        }
        numericOccurrences += inventory.fields.reduce((sum, field) => sum + field[1], 0);
        if (expected.raster) {
          assert.equal(
            text.trim(),
            "",
            "Raster fixture must not supply an invisible transcription.",
          );
          const operations = await page.getOperatorList();
          assert.ok(
            operations.fnArray.length > 0,
            "Raster page must contain actual drawing operations.",
          );
        } else {
          const expectedCounts = Object.fromEntries(
            inventory.fields
              .map((field) => [field[0], field[1]])
              .sort(([a], [b]) => a.localeCompare(b)),
          );
          assert.deepEqual(
            counts(numericTokens(text)),
            expectedCounts,
            `${asset.label} page ${inventory.page} numeric inventory`,
          );
        }
        page.cleanup();
      }
      pageCount += pdf.numPages;
      bytes += data.byteLength;
    } finally {
      await loading.destroy();
    }
  }
  assert.equal(pageCount, 18);
  assert.ok(pageCount <= 20 && bytes <= 20 * 1024 * 1024);
  assert.equal(truth.events.filter((event) => event.reference === "A-77").length, 1);
  for (const event of truth.events) {
    assert.equal(event.netCents + event.taxCents, event.grossCents, event.reference);
    assert.equal(
      event.lineAmounts.reduce((sum, amount) => sum + amount, 0),
      event.netCents,
      event.reference,
    );
    assert.ok(
      manifest.documents.some(
        (asset) => asset.label === event.document && asset.pageCount >= event.page,
      ),
    );
  }
  for (const [month, expected] of [
    ["2026-09", truth.expectations.September],
    ["2026-08", truth.expectations.August],
  ]) {
    const rows = truth.events.filter((event) => event.date.startsWith(month));
    const income = rows
      .filter((event) => event.direction === "income")
      .reduce((sum, event) => sum + event.netCents, 0);
    const costs = rows
      .filter((event) => event.direction === "cost")
      .reduce((sum, event) => sum + event.netCents, 0);
    assert.deepEqual(
      [income, costs, income - costs],
      [expected.income, expected.costs, expected.profit],
    );
  }
  const incoming = truth.payments
    .filter((row) => row.kind === "operating" && row.signedCents > 0)
    .reduce((sum, row) => sum + row.signedCents, 0);
  const outgoing = -truth.payments
    .filter((row) => row.kind === "operating" && row.signedCents < 0)
    .reduce((sum, row) => sum + row.signedCents, 0);
  assert.deepEqual([incoming, outgoing, incoming - outgoing], [300000, 92000, 208000]);
  return {
    files: manifest.documents.length,
    pages: pageCount,
    bytes,
    numericFields,
    numericOccurrences,
    rasterPages: 3,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(JSON.stringify(await verifyHarbor()));
