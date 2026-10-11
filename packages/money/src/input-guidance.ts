/** Owned source-review explanations may include a validated source reference. */
export class SourceReviewError extends RangeError {}

/** Reviewed product guidance only. Schema/parser/invariant diagnostics stay private. */
const messages = new Map<string, string>([
  [
    "Enter an exact USD amount with at most two decimal places.",
    "Enter an exact USD amount with at most two decimal places.",
  ],
  [
    "Amount exceeds the demo limit.",
    "This amount exceeds the demo limit. Choose a smaller amount.",
  ],
  ["Total exceeds the demo limit.", "This total exceeds the demo limit. Use smaller amounts."],
  ["Amounts must be zero or greater.", "Amounts must be zero or greater."],
  ["Due date cannot precede the record date.", "Choose a due date on or after the record date."],
  ["Payment allocations exceed its amount.", "The matched amount cannot exceed this payment."],
  [
    "Matched payments exceed the event's gross amount.",
    "These payments exceed the record total. Check the matched amounts.",
  ],
  [
    "Payment matching needs the same counterparty and the correct direction.",
    "Match this payment to a record for the same customer or vendor and payment direction.",
  ],
  [
    "A transfer needs two distinct accounts owned by this business.",
    "Choose two different accounts belonging to this business.",
  ],
  [
    "This business reference already has a canonical event. Review the duplicate first.",
    "This reference already exists. Review the duplicate before adding it.",
  ],
  [
    "This payment reference already has a canonical movement.",
    "This payment reference already exists. Check the earlier payment.",
  ],
  ["Record no longer exists.", "This record is no longer available. Choose a current record."],
  [
    "Your workspace changed. Review a fresh action before confirming.",
    "Your workspace changed. Review a fresh action before confirming.",
  ],
  ["This action has already been applied.", "This action has already been applied."],
  ["This Undo is no longer available.", "This Undo is no longer available."],
  [
    "This demo session reached its 500-action limit. Export and start a fresh session.",
    "This demo session reached its action limit. Keep any originals you need and start a fresh workspace.",
  ],
  ["Edit this sale through its invoice.", "Edit this sale through its invoice."],
  ["Delete this sale through its invoice.", "Delete this sale through its invoice."],
  ["This document is not ready for review.", "This document is not ready for review."],
  ["Choose a current dashboard item.", "Choose a current dashboard item."],
  [
    "Choose a different current item as the position reference.",
    "Choose a different current item as the position reference.",
  ],
  ["Narrow this chart to at most 32 categories.", "Narrow this chart to at most 32 categories."],
  [
    "Narrow this chart to at most 32 counterparties.",
    "Narrow this chart to at most 32 counterparties.",
  ],
  ["Narrow this chart to at most 36 periods.", "Narrow this chart to at most 36 periods."],
  [
    "Converted amount exceeds the display limit.",
    "This amount is too large to display in EUR. Your original USD values are preserved.",
  ],
  ["Choose a category from your records.", "Choose a category from your records."],
  [
    "Choose the exact counterparty from your records.",
    "Choose the exact customer or vendor from your records.",
  ],
  [
    "Choose an end date on or after the start date.",
    "Choose an end date on or after the start date.",
  ],
  [
    "The buyer or seller role needs confirmation.",
    "Confirm whether this business is the buyer or seller before adding its records.",
  ],
]);

export function moneyInputMessage(cause: unknown, fallback: string): string {
  if (cause instanceof SourceReviewError) return cause.message;
  return cause instanceof RangeError ? (messages.get(cause.message) ?? fallback) : fallback;
}
