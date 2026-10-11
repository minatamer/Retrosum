import { describe, expect, it } from "vitest";
import { moneyInputMessage } from "./input-guidance.js";
import { parseAmount } from "./amount.js";

describe("money input guidance", () => {
  it("retains exact-amount advice from the actual parser", () => {
    try {
      parseAmount("1.234");
    } catch (cause) {
      expect(moneyInputMessage(cause, "Check these values.")).toBe(
        "Enter an exact USD amount with at most two decimal places.",
      );
      return;
    }
    throw new Error("The invalid amount must be rejected.");
  });
  it("rejects arbitrary messages and does not trust an error name", () => {
    expect(
      moneyInputMessage(new RangeError("Unknown internal record stack"), "Check these values."),
    ).toBe("Check these values.");
    expect(
      moneyInputMessage(new Error("Payment allocations exceed its amount."), "Check these values."),
    ).toBe("Check these values.");
  });
});
