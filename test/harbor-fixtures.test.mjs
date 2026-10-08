import { expect, test } from "vitest";
import { createVerificationTask, numericTokens, verifyHarbor } from "../scripts/verify-harbor.mjs";

test("fixture bytes, pages, complete numeric inventory and ledger relations agree", async () => {
  expect(await verifyHarbor()).toMatchObject({ files: 8, pages: 14, rasterPages: 3 });
}, 15000);
test("numeric inventory preserves identifiers, dates, signs, rates and amounts", () => {
  expect(numericTokens("NS-A-10 / 2026-08-15 / -200.00 USD / 10% / 4 packs")).toEqual([
    "NS-A-10",
    "2026-08-15",
    "-200.00",
    "10%",
    "4",
  ]);
});
test("damaged PDF parsing rejects and its owned worker is destroyed", async () => {
  const loading = createVerificationTask(new TextEncoder().encode("%PDF-1.7\nbroken"));
  try {
    await expect(loading.promise).rejects.toThrow();
  } finally {
    await loading.destroy();
  }
  expect(loading.destroyed).toBe(true);
});
