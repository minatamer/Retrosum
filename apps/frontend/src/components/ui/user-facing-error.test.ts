import { describe, expect, it } from "vitest";
import { UserFacingError, userFacingError } from "./user-facing-error";

describe("product error presentation", () => {
  const fallback = "This step could not finish. Your records are preserved.";
  it("hides parser, storage, network, schema and internal diagnostics regardless of name or prefix", () => {
    for (const cause of [
      new SyntaxError("Unexpected token at internal.example/private"),
      new TypeError("Failed to fetch: private endpoint"),
      new RangeError("This PDF secret parser stack"),
      Object.assign(new Error('[{"path":["amountMinor"],"code":"invalid_type"}]'), {
        name: "ZodError",
      }),
      new DOMException("Browser storage failed: internal detail", "QuotaExceededError"),
      new RangeError("ungrounded_answer"),
      "private diagnostic",
    ])
      expect(userFacingError(cause, fallback)).toBe(fallback);
  });
  it("retains intentional product guidance and translates known money validation", () => {
    expect(userFacingError(new UserFacingError("Select at least one document."), fallback)).toBe(
      "Select at least one document.",
    );
    expect(
      userFacingError(
        new RangeError("Enter an exact USD amount with at most two decimal places."),
        fallback,
      ),
    ).toContain("exact USD amount");
    expect(
      userFacingError(new RangeError("Payment allocations exceed its amount."), fallback),
    ).toBe("The matched amount cannot exceed this payment.");
    expect(
      userFacingError(new RangeError("Due date cannot precede the record date."), fallback),
    ).toContain("due date");
    // A name or message prefix cannot promote an arbitrary exception to application guidance.
    expect(
      userFacingError(
        Object.assign(new Error("Private stack"), { name: "UserFacingError" }),
        fallback,
      ),
    ).toBe(fallback);
  });
});
