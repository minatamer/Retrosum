import { readFile, writeFile } from "node:fs/promises";
const truth = JSON.parse(await readFile("test/fixtures/harbor-v1/ground-truth.json", "utf8"));
const manifest = JSON.parse(
  await readFile("apps/frontend/src/features/documents/sample-manifest.json", "utf8"),
);
const output = {};
for (const asset of manifest.documents) {
  const original = truth.documents.find((doc) => doc.label === asset.label);
  const fields = original.pages.flatMap((page) =>
    page.fields.map((field, n) => ({
      key: `p${page.page}_${n}`,
      page: page.page,
      block: page.blockId,
      raw: field[0],
      occurrences: field[1],
      normalized: String(field[2]),
      scale: field[3],
      treatment: field[4],
      ambiguous: false,
    })),
  );
  const field = (value, page, scale) => {
    const found = fields.find(
      (item) =>
        item.page === page && item.normalized === String(value) && (!scale || item.scale === scale),
    );
    if (!found) throw new Error(`${asset.label} p${page} missing ${value}/${scale}`);
    return found.key;
  };
  const events = truth.events
    .filter((event) => event.document === (asset.label === "D06" ? "D03" : asset.label))
    .map((event) => {
      const lines = [];
      const patterns = {
        "HS-101": [
          [12, 15000, 180000],
          [8, 15000, 120000],
        ],
        "HS-102": [
          [1, 120000, 120000],
          [2, 30000, 60000],
        ],
        "A-77": [[12, 3000, 36000]],
        "AU-101": [[10, 25000, 250000]],
        "AU-102": [[6, 25000, 150000]],
        "NS-A-10": [[4, 5000, 20000]],
        "PC-091": [[1, 12000, 12000]],
      };
      for (const [quantity, price, total] of patterns[event.reference] ?? [])
        lines.push({
          description: event.reference + " service / item",
          quantity: field(quantity, event.page),
          unitPrice: field(price, event.page, "USD_cents"),
          total: field(total, event.page, "USD_cents"),
        });
      return {
        party: event.counterparty,
        businessRole: event.direction === "income" ? "issuer" : "recipient",
        description: event.reference,
        category: event.category,
        dateField: field(event.date, event.page, "ISO_date"),
        dueField: event.dueDate ? field(event.dueDate, event.page, "ISO_date") : null,
        referenceField: field(event.reference, event.page, "identifier"),
        grossField: field(event.grossCents, event.page, "USD_cents"),
        netField: field(event.netCents, event.page, "USD_cents"),
        taxField: field(event.taxCents, event.page, "USD_cents"),
        balanceState: event.status,
        lines,
      };
    });
  const payments = truth.payments
    .filter((payment) => payment.document === asset.label)
    .map((payment) => ({
      party: payment.kind === "internal_transfer" ? "" : payment.counterparty,
      direction:
        payment.kind === "internal_transfer"
          ? "internal_transfer"
          : payment.signedCents > 0
            ? "in"
            : "out",
      dateField: field(payment.date, payment.page, "ISO_date"),
      referenceField: field(payment.rowId, payment.page, "identifier"),
      amountField: field(payment.signedCents, payment.page, "USD_cents"),
      eventReference: payment.kind === "internal_transfer" ? null : payment.reference,
      fromAccount: payment.kind === "internal_transfer" ? "checking" : null,
      toAccount: payment.kind === "internal_transfer" ? "reserve" : null,
    }));
  output[asset.sha256] = {
    version: "recognition-v1",
    kind: asset.kind,
    currency: "USD",
    business: "Harbor Studio",
    asOfField: asset.label === "D07" ? field(manifest.asOf, 1, "ISO_date") : null,
    fields,
    events,
    payments,
    warnings: [],
  };
}
await writeFile(
  "apps/backend/src/providers/fake-fixtures.json",
  JSON.stringify(output, null, 2) + "\n",
);
console.log("Authored eight declared fake interpretations; not live OCR results.");
