import { MAX_MINOR_UNITS, minorUnitsSchema } from "@retrosum/contracts";
export function parseAmount(input: string): number {
  const normalized = input.trim();
  if (!/^-?(?:0|[1-9]\d{0,10})(?:\.\d{1,2})?$/u.test(normalized)) {
    throw new RangeError("Enter an exact USD amount with at most two decimal places.");
  }
  const negative = normalized.startsWith("-");
  const [whole = "0", fraction = ""] = normalized.replace(/^-/, "").split(".");
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (cents > BigInt(MAX_MINOR_UNITS)) throw new RangeError("Amount exceeds the demo limit.");
  return minorUnitsSchema.parse(Number(negative ? -cents : cents));
}
export function formatAmount(minor: number): string {
  minorUnitsSchema.parse(minor);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}
export function sumAmounts(values: readonly number[]): number {
  const total = values.reduce((sum, value) => sum + BigInt(minorUnitsSchema.parse(value)), 0n);
  if (total > BigInt(MAX_MINOR_UNITS) || total < -BigInt(MAX_MINOR_UNITS))
    throw new RangeError("Total exceeds the demo limit.");
  return Number(total);
}
