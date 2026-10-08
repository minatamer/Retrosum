import { describe, expect, it } from "vitest";
import { parseAmount, formatAmount, sumAmounts } from "./amount.js";
describe("exact USD minor units", () => {
  it.each([
    ["0.10", 10],
    ["2000", 200000],
    ["-12.34", -1234],
    [" 0.01 ", 1],
    ["10000000000.00", 1000000000000],
  ])("parses %s without floating rounding", (input, expected) =>
    expect(parseAmount(input)).toBe(expected),
  );
  it.each([
    "0.001",
    "1e3",
    "$20",
    "1,000.00",
    "01.00",
    "NaN",
    "Infinity",
    "10000000000.01",
    "--2",
    ".1",
    "",
  ])("rejects ambiguous or out-of-bounds %s", (input) =>
    expect(() => parseAmount(input)).toThrow(),
  );
  it("sums cents rather than currency floats", () => expect(sumAmounts([10, 20, -1])).toBe(29));
  it("rejects invalid values and aggregate overflow", () => {
    expect(() => sumAmounts([0.1])).toThrow();
    expect(() => sumAmounts([1000000000000, 1])).toThrow();
  });
  it("formats USD consistently", () => {
    expect(formatAmount(10)).toBe("$0.10");
    expect(formatAmount(-1234)).toBe("-$12.34");
  });
});
