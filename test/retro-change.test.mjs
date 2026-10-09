import { describe, it, expect } from "vitest";
import { harborSession } from "./fixtures/harbor-v1/money-fixture.mjs";
import { retroChangeIntentSchema, retroRequestSchema } from "../packages/contracts/dist/index.js";
import {
  prepareRetroChange,
  fakeChangeIntent,
  patchChangeIntent,
  buildDashboard,
  applyCommand,
  undoLatest,
  verifyRetroChange,
  createRetroResponse,
  changeFormValues,
  changeSelection,
  buildRecordAction,
  recordFormValues,
  nextInvoiceNumber,
} from "../packages/money/dist/index.js";
const scope = { from: "2026-09-01", to: "2026-09-30", asOf: "2026-10-03" };
const intent = (family, operation, fields = {}, query = null) =>
  retroChangeIntentSchema.parse({
    family,
    operation,
    query,
    fields: Object.entries(fields).map(([name, value]) => ({ name, value })),
  });
const ready = (change, session, id = "change_test") => {
  const proposal = prepareRetroChange(change, session.workspace, scope, id);
  expect(proposal.kind, JSON.stringify(proposal)).toBe("ready");
  return proposal;
};
const apply = (proposal, session) => applyCommand(session, proposal.command, proposal.label);
describe("Retro preparation shares real commands without mutating snapshots", () => {
  it("preserves explicit English event dates and holds incomplete or invalid dates", () => {
    const session = harborSession();
    for (const date of ["September 25, 2026", "25 September 2026", "25th Sep 2026", "2026-09-25"]) {
      const parsed = fakeChangeIntent(
        `Add a USD 200 cost for Northstar Supplies on ${date} for site visit`,
        session.workspace,
      );
      const proposal = ready(parsed, session, "english_date");
      expect(proposal.command.actions[0].record.occurredOn).toBe("2026-09-25");
      expect(proposal.effects.find((effect) => effect.factId === "costs").after).toBe(255000);
    }
    for (const date of ["September 25", "February 30, 2026"]) {
      const parsed = fakeChangeIntent(
        `Add a USD 200 cost for Northstar Supplies on ${date} for site visit`,
        session.workspace,
      );
      expect(prepareRetroChange(parsed, session.workspace, scope, "invalid_date").kind).toBe(
        "clarification",
      );
    }
    const invoice = fakeChangeIntent(
      "Create an invoice for Cedar Works, USD 2000, due on November 30, 2026 for design",
      session.workspace,
    );
    expect(invoice.fields.find((field) => field.name === "due").value).toBe("2026-11-30");
    expect(invoice.fields.some((field) => field.name === "date")).toBe(false);
  });
  it("does not truncate malformed grouping or excess decimal precision into a smaller amount", () => {
    const session = harborSession();
    for (const value of ["2,00", "2,000.123", "200.999"]) {
      const parsed = fakeChangeIntent(
        `Create an invoice for Cedar Works, USD ${value}, for consulting`,
        session.workspace,
      );
      const result = prepareRetroChange(parsed, session.workspace, scope, "malformed");
      expect(result.kind).toBe("clarification");
      expect(result.missing.join(" ")).toContain("amount");
    }
  });
  it("parses grouped exact USD and asks for a missing year, then creates a draft without income or cash", () => {
    const session = harborSession(),
      copy = JSON.stringify(session);
    const parsed = fakeChangeIntent(
      "Create an invoice for Cedar Works, USD 2,000, due 30 November for consulting",
      session.workspace,
    );
    const clarification = prepareRetroChange(parsed, session.workspace, scope, "invoice_test");
    expect(clarification.kind).toBe("clarification");
    expect(clarification.missing.join(" ")).toContain("year");
    const year = clarification.choices.find((choice) =>
      choice.fields.some((field) => field.value === "2026-11-30"),
    );
    expect(year).toBeDefined();
    const proposal = ready(patchChangeIntent(clarification.intent, year), session, "invoice_test");
    expect(proposal.command.actions[0].record.lines[0].unitPriceMinor).toBe(200000);
    expect(proposal.command.actions[0].record.status).toBe("draft");
    expect(proposal.effects.find((effect) => effect.factId === "income").after).toBe(480000);
    expect(JSON.stringify(session)).toBe(copy);
    expect(apply(proposal, session).workspace.invoices[0].dueOn).toBe("2026-11-30");
  });
  it("runs draft → edit → explicit issue → allocated payment → invoice remove and full Undo", () => {
    let session = harborSession();
    const customer = session.workspace.contacts.find((c) => c.name === "Cedar Works").id;
    session = apply(
      ready(
        intent("invoices", "create", {
          contact: customer,
          description: "Consulting",
          price: "2000",
          date: "2026-09-28",
        }),
        session,
        "invoice_demo",
      ),
      session,
    );
    const invoice = session.workspace.invoices[0];
    session = apply(
      ready(intent("invoices", "update", { price: "2100" }, invoice.id), session, "edit_demo"),
      session,
    );
    expect(buildDashboard(session.workspace, scope).facts.income.value).toBe(480000);
    session = apply(
      ready(intent("invoices", "issue", {}, invoice.id), session, "issue_demo"),
      session,
    );
    expect(buildDashboard(session.workspace, scope).facts.income.value).toBe(690000);
    const linked = session.workspace.invoices[0].eventId;
    session = apply(
      ready(
        intent("payments", "create", {
          direction: "in",
          price: "500",
          date: "2026-09-29",
          reference: "Retro payment",
          contact: customer,
          allocation: linked,
          allocated: "500",
        }),
        session,
        "payment_demo",
      ),
      session,
    );
    expect(buildDashboard(session.workspace, scope).facts.cash_in.value).toBe(350000);
    const deletion = ready(intent("invoices", "delete", {}, invoice.id), session, "delete_demo");
    expect(deletion.relationships.join(" ")).toContain("match");
    const before = JSON.stringify(session.workspace);
    session = apply(deletion, session);
    expect(session.workspace.payments.at(-1).allocations).toEqual([]);
    expect(session.workspace.events.some((event) => event.id === linked)).toBe(false);
    session = undoLatest(session, session.workspace.revision, deletion.command.id);
    const restored = JSON.parse(before);
    restored.revision = session.workspace.revision;
    expect(session.workspace).toEqual(restored);
  });
  it("cost confirmation updates exact current figures once and Undo restores them", () => {
    let session = harborSession();
    const vendor = session.workspace.contacts.find((c) => c.role === "vendor").id;
    const proposal = ready(
      intent("costs", "create", {
        contact: vendor,
        description: "Site visit",
        net: "200",
        date: "2026-09-28",
        category: "Travel",
      }),
      session,
    );
    expect(proposal.effects.find((effect) => effect.factId === "costs")).toMatchObject({
      before: 235000,
      after: 255000,
    });
    session = apply(proposal, session);
    expect(buildDashboard(session.workspace, scope).facts.profit.value).toBe(225000);
    expect(() => apply(proposal, session)).toThrow(/already/);
    session = undoLatest(session, session.workspace.revision, proposal.command.id);
    expect(buildDashboard(session.workspace, scope).facts.profit.value).toBe(245000);
  });
  it("ambiguous identities, unknown targets, used-contact deletion and stale commands are blocked", () => {
    const session = harborSession();
    session.workspace.contacts.push({ ...session.workspace.contacts[0], id: "contact_duplicate" });
    const creation = intent("invoices", "create", {
      contact: session.workspace.contacts[0].name,
      description: "Service",
      price: "20",
    });
    expect(prepareRetroChange(creation, session.workspace, scope, "test").kind).toBe(
      "clarification",
    );
    expect(
      prepareRetroChange(
        intent("costs", "delete", {}, "not here"),
        session.workspace,
        scope,
        "test",
      ).kind,
    ).toBe("clarification");
    expect(
      prepareRetroChange(
        intent("contacts", "delete", {}, session.workspace.contacts[0].id),
        session.workspace,
        scope,
        "test",
      ).kind,
    ).toBe("rejected");
    const proposal = ready(
      intent("contacts", "create", { name: "Fresh Company", role: "vendor" }),
      session,
    );
    session.workspace.revision++;
    expect(() => apply(proposal, session)).toThrow(/changed/);
  });
  it("contact create/edit/delete and payment edit/remove preserve original provenance and reject overpayment", () => {
    let session = harborSession();
    session = apply(
      ready(
        intent("contacts", "create", {
          name: "New Vendor",
          role: "vendor",
          email: "hello@example.com",
        }),
        session,
        "contact_demo",
      ),
      session,
    );
    const contact = session.workspace.contacts.at(-1);
    session = apply(
      ready(
        intent("contacts", "update", { name: "Better Vendor" }, contact.id),
        session,
        "contact_edit",
      ),
      session,
    );
    expect(session.workspace.contacts.at(-1).name).toBe("Better Vendor");
    session = apply(
      ready(intent("contacts", "delete", {}, contact.id), session, "contact_delete"),
      session,
    );
    const payment = session.workspace.payments.find((p) => p.direction === "in"),
      sources = JSON.stringify(payment.sources);
    const edited = ready(
      intent("payments", "update", { price: "2900", allocated: "2900" }, payment.id),
      session,
      "payment_edit",
    );
    expect(JSON.stringify(edited.command.actions[0].record.sources)).toBe(sources);
    expect(
      prepareRetroChange(
        intent("payments", "update", { price: "9999", allocated: "9999" }, payment.id),
        session.workspace,
        scope,
        "bad",
      ).kind,
    ).toBe("rejected");
    const removed = ready(intent("payments", "delete", {}, payment.id), session, "payment_remove");
    expect(removed.relationships.join(" ")).toContain("invoice / cost records remain");
  });
  it("actual edited form values, not the originally prepared amount, drive preview and confirmed action", () => {
    const session = harborSession(),
      contact = session.workspace.contacts.find((c) => c.role === "vendor").id;
    const proposal = ready(
      intent("costs", "create", {
        contact,
        description: "Original",
        net: "200",
        date: "2026-09-28",
      }),
      session,
    );
    const values = changeFormValues(proposal, session.workspace);
    values.net = "245.37";
    values.description = "Visitor choice";
    const action = buildRecordAction(
      changeSelection(proposal.intent, session.workspace),
      values,
      "actual",
    );
    expect(action.record.netMinor).toBe(24537);
    expect(action.record.description).toBe("Visitor choice");
    expect(
      nextInvoiceNumber({
        ...session.workspace,
        invoices: [{ number: "INV-2" }, { number: "INV-3" }, { number: "INV-4" }],
      }),
    ).toBe("INV-5");
  });
  it("recomputes response command/effects and rejects fabricated preview, forbidden fields and lost allocations", () => {
    const session = harborSession();
    const request = retroRequestSchema.parse({
      operationId: "retro_change",
      workspace: session.workspace,
      scope,
      prompt: "Create contact",
      recent: [],
    });
    const response = createRetroResponse(
      request,
      {
        kind: "change_request",
        intent: intent("contacts", "create", { name: "Acme", role: "customer" }),
      },
      "fake",
    );
    expect(() => verifyRetroChange(response, session.workspace)).not.toThrow();
    response.change.effects[0].after = 123;
    expect(() => verifyRetroChange(response, session.workspace)).toThrow(/verified/);
    expect(
      prepareRetroChange(
        intent("contacts", "create", { name: "Acme", role: "customer", net: "20" }),
        session.workspace,
        scope,
        "test",
      ).kind,
    ).toBe("rejected");
    const payment = session.workspace.payments.find((p) => p.direction === "in");
    const values = recordFormValues({ family: "payments", record: payment }, session.workspace);
    expect(
      buildRecordAction({ family: "payments", record: payment }, values, "test").record.allocations,
    ).toEqual(payment.allocations);
  });
  it("generic fake prompts cover cost/contact/payment and preserve explicit dates/claims", () => {
    const workspace = harborSession().workspace;
    const cost = fakeChangeIntent(
      "Add a cost for Northstar Supplies, USD 200, dated 2026-09-28 for Travel, category Travel",
      workspace,
    );
    expect(prepareRetroChange(cost, workspace, scope, "cost").kind).toBe("ready");
    const contact = fakeChangeIntent(
      "Create contact named Blue Studio as vendor, email hello@example.com",
      workspace,
    );
    expect(prepareRetroChange(contact, workspace, scope, "contact").kind).toBe("ready");
    const payment = fakeChangeIntent(
      "Record incoming payment USD 500 against HS-102 on 2026-09-29, reference DEMO-500",
      workspace,
    );
    expect(prepareRetroChange(payment, workspace, scope, "payment").kind).toBe("ready");
  });
  it("explicit unmatching clears existing allocations in both prepared and real form commands", () => {
    const session = harborSession();
    const payment = session.workspace.payments.find((row) => row.direction === "in");
    const proposal = ready(intent("payments", "update", { allocation: "" }, payment.id), session);
    expect(proposal.command.actions[0].record.allocations).toEqual([]);
    const action = buildRecordAction(
      changeSelection(proposal.intent, session.workspace),
      changeFormValues(proposal, session.workspace),
      "actual",
    );
    expect(action.record.allocations).toEqual([]);
  });
  it("a missing amount/description follow-up retains the counterparty selected by a shortcut", () => {
    const session = harborSession();
    const starting = intent("costs", "create");
    const clarification = prepareRetroChange(starting, session.workspace, scope, "start");
    const selected = patchChangeIntent(starting, clarification.choices[0]);
    const continued = fakeChangeIntent(
      "USD 50 for pending visit, dated 2026-09-28",
      session.workspace,
      selected,
    );
    const proposal = ready(continued, session);
    expect(proposal.command.actions[0].record.counterpartyId).toBe(selected.fields[0].value);
    expect(proposal.command.actions[0].record.description).toBe("pending visit");
  });
});
