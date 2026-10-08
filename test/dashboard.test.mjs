import { describe, expect, it } from "vitest";
import {
  buildDashboard,
  applyCommand,
  undoLatest,
  calculateMetrics,
  comparisonRange,
} from "../packages/money/dist/index.js";
import { sessionSchema } from "../packages/contracts/dist/index.js";
import { harborSession } from "./fixtures/harbor-v1/money-fixture.mjs";

function catalogue(session = harborSession(), filter = session.filters) {
  return buildDashboard(session.workspace, filter);
}
describe("dashboard fact authority", () => {
  it("reconciles every Harbor headline, comparison, bridge and rent source", () => {
    const result = catalogue();
    const values = Object.fromEntries(
      Object.entries(result.facts).map(([id, fact]) => [id, fact.value]),
    );
    expect(values).toMatchObject({
      income: 480000,
      costs: 128000,
      profit: 352000,
      margin: 733,
      cash_in: 300000,
      cash_out: 92000,
      cash_net: 208000,
      customer_open: 180000,
      supplier_open: 39600,
      overdue: 0,
      customer_soon: 180000,
      supplier_soon: 39600,
      tax: 3600,
    });
    expect(result.changes.map((row) => row.changeTenths)).toEqual([200, 164, 214]);
    expect(result.categories.find((row) => row.label === "Rent")).toMatchObject({
      value: 80000,
      shareTenths: 625,
    });
    const rent = result.facts["category:Rent"];
    expect(rent.contributors).toHaveLength(1);
    expect(rent.sources[0].page).toBe(1);
    expect(
      harborSession().workspace.documents.find((doc) => doc.id === rent.sources[0].documentId).name,
    ).toMatch(/rent/iu);
    expect(result.profitBridge.slice(0, -1).reduce((sum, mark) => sum + mark.value, 0)).toBe(
      values.profit,
    );
    expect(result.facts.cash_net.excluded).toHaveLength(1);
    expect(
      result.cashSeries.flatMap((row) => row.marks).reduce((sum, mark) => sum + mark.value, 0),
    ).toBe(392000);
    expect(
      result.facts["prior:income"].sources.every(
        (source) =>
          harborSession().workspace.documents.find((doc) => doc.id === source.documentId).kind ===
          "history",
      ),
    ).toBe(true);
    expect(result.coverage.reduce((sum, row) => sum + row.value, 0)).toBe(8);
  });
  it("refreshes all selected contribution facts on CRUD and Undo", () => {
    const session = harborSession();
    const record = {
      ...session.workspace.events.find((row) => row.kind === "cost" && row.category === "Rent"),
      id: "event_extraCost",
      description: "Extra rent",
      reference: "EXTRA",
      amountMinor: 20000,
      netMinor: 20000,
      taxMinor: 0,
      origin: "session",
      sources: [],
    };
    const next = applyCommand(
      session,
      {
        id: "command_dashboardCost",
        workspaceId: session.workspace.id,
        basedOnRevision: session.workspace.revision,
        actions: [{ type: "create_event", record }],
      },
      "Add cost",
    );
    const changed = catalogue(next);
    expect(changed.facts.costs.value).toBe(148000);
    expect(changed.facts.profit.value).toBe(332000);
    expect(changed.facts["category:Rent"].contributors).toHaveLength(2);
    expect(
      Object.values(changed.facts).every((fact) => fact.scope.revision === next.workspace.revision),
    ).toBe(true);
    const undone = undoLatest(next, next.workspace.revision, next.undo.commandId);
    expect(catalogue(undone).facts.costs.value).toBe(128000);
    expect(catalogue(undone).facts["category:Rent"].contributors).toHaveLength(1);
  });
  it("uses the same category/party/date authority and never attributes whole cash to a category", () => {
    const session = harborSession();
    const filtered = catalogue(session, { ...session.filters, category: "Rent" });
    expect(filtered.facts.costs.value).toBe(80000);
    expect(filtered.facts.cash_net.value).toBeNull();
    expect(filtered.facts.cash_net.excluded.some((row) => row.reason.includes("category"))).toBe(
      true,
    );
    const party = session.workspace.contacts.find((row) => row.name === "Cedar Works");
    const byParty = catalogue(session, { ...session.filters, counterpartyId: party.id });
    expect(byParty.facts.income.value).toBe(300000);
    expect(byParty.facts.income.value).toBe(
      calculateMetrics(session.workspace, byParty.scope).income.minor,
    );
    const roundTrip = sessionSchema.parse({
      ...session,
      filters: {
        ...session.filters,
        category: "Rent",
        counterpartyId: party.id,
        asOf: "2026-10-09",
      },
    });
    expect(roundTrip.filters.category).toBe("Rent");
  });
  it("uses inclusive seven-day due scope, exact ageing and selected as-of without future settlements", () => {
    const session = harborSession();
    const late = catalogue(session, { ...session.filters, asOf: "2026-10-09" });
    expect(late.facts.overdue.value).toBe(180000);
    expect(late.ageing[0].marks[1].value).toBe(180000);
    expect(late.facts.customer_soon.value).toBe(0);
    expect(late.facts.supplier_soon.value).toBe(39600);
    const before = catalogue(session, { ...session.filters, asOf: "2026-09-01" });
    expect(before.facts.customer_open.value).toBeNull();
    expect(before.facts.supplier_open.value).toBe(0);
  });
  it("does not invent absent history, zero margin or unknown balances", () => {
    const session = harborSession();
    session.workspace.events = session.workspace.events.filter(
      (row) => row.occurredOn >= "2026-09-01",
    );
    const noPrior = catalogue(session);
    expect(noPrior.trend).toHaveLength(1);
    expect(noPrior.changes.every((row) => row.changeTenths === null)).toBe(true);
    const august = catalogue(harborSession(), { from: "2026-08-01", to: "2026-08-31" });
    expect(august.facts.customer_open.value).toBeNull();
    expect(august.facts.supplier_open.value).toBeNull();
    expect(august.unknownSettlementCount).toBe(5);
    expect(august.facts.cash_net.value).toBeNull();
    const onlyCosts = structuredClone(session);
    onlyCosts.workspace.events = onlyCosts.workspace.events.filter((row) => row.kind === "cost");
    const loss = catalogue(onlyCosts);
    expect(loss.facts.margin.value).toBeNull();
    expect(loss.facts.income.value).toBeNull();
    expect(loss.facts.profit.value).toBe(-128000);
    const empty = structuredClone(session);
    empty.workspace.events = [];
    empty.workspace.payments = [];
    empty.workspace.documents = [];
    expect(catalogue(empty).trend).toEqual([]);
    expect(catalogue(empty).facts.profit.value).toBeNull();
  });
  it("excludes held duplicates, unknown tax basis and incompatible comparison, keeps reasons", () => {
    const session = harborSession();
    session.workspace.events.find((row) => row.reference === "A-77").netMinor = undefined;
    const result = catalogue(session);
    expect(result.facts.costs.value).toBe(92000);
    expect(result.facts.costs.excluded.some((row) => row.reason.includes("net"))).toBe(true);
    expect(result.changes.every((row) => row.changeTenths === null)).toBe(true);
    session.workspace.documents.find((doc) => doc.name.includes("rent")).disposition = "held";
    expect(catalogue(session).facts.costs.value).toBe(12000);
  });
  it("uses whole calendar months or an equal-length preceding custom range", () => {
    expect(comparisonRange({ from: "2026-09-01", to: "2026-09-30" })).toEqual({
      from: "2026-08-01",
      to: "2026-08-31",
    });
    expect(comparisonRange({ from: "2026-09-10", to: "2026-09-12" })).toEqual({
      from: "2026-09-07",
      to: "2026-09-09",
    });
    expect(() => catalogue(harborSession(), { from: "2026-09-30", to: "2026-09-01" })).toThrow(
      /reversed/u,
    );
  });
  it("bounds busy charts without losing any Other member or actual cash observation", () => {
    const session = harborSession();
    const base = session.workspace.events.find((row) => row.kind === "cost");
    for (let index = 0; index < 20; index++)
      session.workspace.events.push({
        ...base,
        id: `event_small${index}`,
        category: `Small category ${index}`,
        origin: "session",
        sources: [],
        amountMinor: 100,
        netMinor: 100,
        taxMinor: 0,
      });
    for (let index = 1; index <= 30; index++)
      session.workspace.payments.push({
        id: `payment_day${index}`,
        occurredOn: `2026-09-${String(index).padStart(2, "0")}`,
        direction: "in",
        amountMinor: 100,
        currency: "USD",
        reference: `Daily ${index}`,
        allocations: [],
        sources: [],
        origin: "session",
      });
    const result = catalogue(session);
    expect(result.categories).toHaveLength(6);
    const other = result.categories.at(-1);
    expect(result.facts[other.factId].contributors.length).toBeGreaterThan(15);
    expect(result.categories.reduce((sum, row) => sum + row.value, 0)).toBe(
      result.facts.costs.value,
    );
    expect(result.cashSeries.length).toBeLessThanOrEqual(6);
    expect(
      result.cashSeries.flatMap((group) => group.marks).reduce((sum, row) => sum + row.value, 0),
    ).toBe(395000);
  });
  it("does not fail at the schema's supported calendar boundaries", () => {
    expect(comparisonRange({ from: "0000-01-01", to: "0000-01-31" })).toBeNull();
    const empty = harborSession();
    empty.workspace.events = [];
    empty.workspace.payments = [];
    expect(
      catalogue(empty, { from: "9999-12-01", to: "9999-12-31", asOf: "9999-12-31" }).facts
        .customer_soon.value,
    ).toBeNull();
    expect(
      catalogue(empty, { from: "0000-01-01", to: "0000-01-31" }).changes.every(
        (row) => row.changeTenths === null,
      ),
    ).toBe(true);
  });
  it("describes prior coverage independently of a current period with held income", () => {
    const session = harborSession();
    for (const doc of session.workspace.documents)
      if (doc.name === "harbor-HS-101.pdf" || doc.name === "harbor-HS-102.pdf")
        doc.disposition = "held";
    const result = catalogue(session);
    expect(result.facts.profit.value).toBe(-128000);
    expect(result.facts["prior:profit"].value).toBe(290000);
    expect(result.facts["prior:profit"].basis).toContain("2 income and 3 cost records");
    expect(result.facts["prior:profit"].basis).not.toContain("no eligible income was supplied");
    expect(result.facts["prior:profit"].label).toBe("Prior profit preview");
  });
});
