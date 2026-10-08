import { describe, it, expect } from "vitest";
import { commandSchema, invoiceSchema } from "../packages/contracts/dist/index.js";
import {
  applyCommand,
  undoLatest,
  validateGraph,
  validateSession,
  calculateMetrics,
  invoiceAmounts,
  ratioTenths,
  changeTenths,
} from "../packages/money/dist/index.js";
import { harborSession } from "./fixtures/harbor-v1/money-fixture.mjs";
const command = (session, actions, id = "command_one") =>
  commandSchema.parse({
    id,
    workspaceId: session.workspace.id,
    basedOnRevision: session.workspace.revision,
    actions,
  });
const metrics = (session) => calculateMetrics(session.workspace, session.filters);
const manualCost = (session, amountMinor = 20000) => ({
  ...session.workspace.events.find((record) => record.kind === "cost"),
  id: "event_manual",
  reference: "",
  amountMinor,
  netMinor: amountMinor,
  taxMinor: 0,
  sources: [],
  origin: "session",
  balanceState: "unknown",
  paidClaim: false,
});
describe("canonical financial workspace", () => {
  it("matches every visible Harbor baseline, period, exclusion and percentage", () => {
    const session = validateSession(harborSession());
    const result = metrics(session);
    expect([
      result.income.minor,
      result.costs.minor,
      result.profitMinor,
      result.marginTenths,
      result.cashIn.minor,
      result.cashOut.minor,
      result.netCashMinor,
      result.customerOpen.minor,
      result.supplierOpen.minor,
    ]).toEqual([480000, 128000, 352000, 733, 300000, 92000, 208000, 180000, 39600]);
    expect(result.exclusions.transfers).toHaveLength(1);
    const august = calculateMetrics(session.workspace, { from: "2026-08-01", to: "2026-08-31" });
    expect([august.income.minor, august.costs.minor, august.profitMinor]).toEqual([
      400000, 110000, 290000,
    ]);
    expect(august.exclusions.unknownBalances).toHaveLength(5);
    expect(changeTenths(480000, 400000)).toBe(200);
    expect(changeTenths(128000, 110000)).toBe(164);
    expect(changeTenths(352000, 290000)).toBe(214);
    expect(changeTenths(-1_000_000_000_000, 1_000_000_000_000)).toBe(-2000);
    expect(ratioTenths(80000, 128000)).toBe(625);
  });
  it("adds 200, recomputes once at one revision, then Undo restores the complete graph", () => {
    const before = harborSession();
    const after = applyCommand(
      before,
      command(before, [{ type: "create_event", record: manualCost(before) }]),
      "Add cost",
    );
    expect([
      metrics(after).costs.minor,
      metrics(after).profitMinor,
      after.workspace.revision,
    ]).toEqual([148000, 332000, 1]);
    const restored = undoLatest(after, 1, "command_one");
    expect(restored.workspace).toEqual({ ...before.workspace, revision: 2 });
    expect([metrics(restored).costs.minor, metrics(restored).profitMinor, restored.undo]).toEqual([
      128000,
      352000,
      null,
    ]);
    expect(() =>
      applyCommand(
        restored,
        command(restored, [{ type: "create_event", record: manualCost(restored) }]),
        "Replay",
      ),
    ).toThrow(/already/);
  });
  it("posts no draft, issues exact fractional lines/tax, and settles separately", () => {
    const before = harborSession();
    const invoice = invoiceSchema.parse({
      id: "invoice_trial",
      number: "NEW-1",
      customerId: before.workspace.contacts[0].id,
      issuedOn: "2026-09-29",
      dueOn: "2026-11-30",
      currency: "USD",
      lines: [{ description: "Work", quantity: "1.25", unitPriceMinor: 160000 }],
      taxMinor: 10000,
      status: "draft",
      notes: "",
    });
    expect(invoiceAmounts(invoice)).toMatchObject({ netMinor: 200000, grossMinor: 210000 });
    const draft = applyCommand(
      before,
      command(before, [{ type: "create_invoice", record: invoice }]),
      "Draft",
    );
    expect(metrics(draft).income.minor).toBe(480000);
    const issued = applyCommand(
      draft,
      command(
        draft,
        [{ type: "update_invoice", record: { ...invoice, status: "issued" } }],
        "command_issue",
      ),
      "Issue",
    );
    expect([
      metrics(issued).income.minor,
      metrics(issued).customerOpen.minor,
      metrics(issued).cashIn.minor,
    ]).toEqual([680000, 390000, 300000]);
    const movement = {
      ...issued.workspace.payments[0],
      id: "payment_partial",
      amountMinor: 50000,
      occurredOn: "2026-09-30",
      reference: "partial",
      allocations: [{ eventId: issued.workspace.invoices[0].eventId, amountMinor: 50000 }],
      sources: [],
      origin: "session",
    };
    const paid = applyCommand(
      issued,
      command(issued, [{ type: "create_payment", record: movement }], "command_pay"),
      "Payment",
    );
    expect([
      metrics(paid).income.minor,
      metrics(paid).customerOpen.minor,
      metrics(paid).cashIn.minor,
    ]).toEqual([680000, 340000, 350000]);
    const removed = applyCommand(
      paid,
      command(paid, [{ type: "delete_invoice", id: invoice.id }], "command_delete"),
      "Delete",
    );
    expect(
      removed.workspace.payments.find((record) => record.id === movement.id).allocations,
    ).toEqual([]);
    expect(metrics(removed).cashIn.minor).toBe(350000);
    expect(
      undoLatest(removed, removed.workspace.revision, "command_delete").workspace.invoices,
    ).toEqual(paid.workspace.invoices);
  });
  it("fails atomically for role/dependency/overpayment errors and stale revisions", () => {
    const before = harborSession();
    const snapshot = JSON.stringify(before);
    expect(() =>
      applyCommand(
        before,
        command(before, [
          { type: "create_event", record: manualCost(before) },
          { type: "delete_contact", id: before.workspace.contacts[0].id },
        ]),
        "Invalid batch",
      ),
    ).toThrow(/counterparty/);
    expect(JSON.stringify(before)).toBe(snapshot);
    expect(() =>
      applyCommand(
        before,
        {
          ...command(before, [{ type: "create_event", record: manualCost(before) }]),
          basedOnRevision: 9,
        },
        "Stale",
      ),
    ).toThrow(/changed/);
    expect(() =>
      applyCommand(
        before,
        command(before, [
          {
            type: "update_event",
            record: { ...before.workspace.events[0], amountMinor: 1, netMinor: 1, taxMinor: 0 },
          },
        ]),
        "Too small",
      ),
    ).toThrow(/exceed/);
    expect(() =>
      validateGraph({
        ...before.workspace,
        payments: [
          ...before.workspace.payments,
          { ...before.workspace.payments[0], id: "payment_repeat" },
        ],
      }),
    ).toThrow(/reference|exceed/);
    expect(() =>
      validateGraph({
        ...before.workspace,
        events: [
          ...before.workspace.events,
          { ...manualCost(before), amountMinor: 1_000_000_000_000, netMinor: 1_000_000_000_000 },
        ],
      }),
    ).toThrow(/Total/);
  });
  it("holds/reviews duplicate renditions without duplicating a canonical event", () => {
    const before = harborSession();
    const duplicate = before.workspace.documents.find((doc) => doc.disposition === "duplicate");
    const after = applyCommand(
      before,
      command(before, [{ type: "review_document", documentId: duplicate.id, decision: "accept" }]),
      "Review",
    );
    expect(metrics(after).costs.minor).toBe(128000);
    expect(() =>
      validateGraph({
        ...before.workspace,
        events: [...before.workspace.events, { ...before.workspace.events[2], id: "event_repeat" }],
      }),
    ).toThrow(/canonical/);
    const invalidTransfer = { ...before.workspace.payments[3], toAccount: "third-party" };
    expect(() =>
      validateGraph({
        ...before.workspace,
        payments: [...before.workspace.payments.slice(0, 3), invalidTransfer],
      }),
    ).toThrow(/owned/);
  });
  it("excludes unknown taxed net, preserves source claims without inventing cash, and invalidates old Undo", () => {
    const before = harborSession();
    const cost = manualCost(before);
    delete cost.netMinor;
    cost.taxMinor = 100;
    const after = applyCommand(
      before,
      command(before, [{ type: "create_event", record: cost }]),
      "Unknown net",
    );
    expect(metrics(after).exclusions.unknownNet).toContain(cost.id);
    expect(metrics(after).costs.minor).toBe(128000);
    const newest = applyCommand(
      after,
      command(after, [{ type: "delete_event", id: cost.id }], "command_latest"),
      "Delete",
    );
    expect(() => undoLatest(newest, newest.workspace.revision, "command_one")).toThrow(/no longer/);
    expect(ratioTenths(1, 0)).toBeNull();
    expect(changeTenths(100, -100)).toBeNull();
    expect(() =>
      validateSession({ ...after, undo: { ...after.undo, appliedAtRevision: 99 } }),
    ).toThrow(/Undo/);
  });
});
