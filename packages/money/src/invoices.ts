import { invoiceSchema, type Invoice } from "@retrosum/contracts";
import { sumAmounts } from "./amount.js";

/** Quantity is a decimal string; multiply before rounding half up to one cent. */
export function invoiceAmounts(input: Invoice) {
  const invoice = invoiceSchema.parse(input);
  const lines = invoice.lines.map((line) => {
    const [whole = "0", fraction = ""] = line.quantity.split(".");
    const hundredths = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
    return sumAmounts([Number((hundredths * BigInt(line.unitPriceMinor) + 50n) / 100n)]);
  });
  const netMinor = sumAmounts(lines);
  return {
    lines,
    netMinor,
    taxMinor: invoice.taxMinor,
    grossMinor: sumAmounts([netMinor, invoice.taxMinor]),
  };
}
