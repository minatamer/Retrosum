import {
  retroChangeIntentSchema,
  retroChangePreparationSchema,
  commandSchema,
  dateSchema,
  type ChangeFields,
  type ChangeFieldName,
  type RetroChangeIntent,
  type RetroChangePreparation,
  type Workspace,
  type RetroScope,
  type SessionAction,
  type RetroResponse,
} from "@retrosum/contracts";
import {
  buildRecordAction,
  nextInvoiceNumber,
  type RecordSelection,
  type RecordFormValues,
} from "./record-form.js";
import { parseAmount, formatAmount } from "./amount.js";
import { applyCommand } from "./commands.js";
import { buildDashboard } from "./dashboard.js";
import { validateGraph } from "./graph.js";

const money = (minor: number) => (minor / 100).toFixed(2);
export function recordFormValues(
  selection: RecordSelection,
  workspace: Workspace,
): RecordFormValues {
  switch (selection.family) {
    case "contacts": {
      const r = selection.record;
      return { name: r?.name ?? "", role: r?.role ?? "customer", email: r?.email ?? "" };
    }
    case "costs": {
      const r = selection.record;
      return {
        contact: r?.counterpartyId ?? "",
        description: r?.description ?? "",
        date: r?.occurredOn ?? workspace.asOf,
        due: r?.dueOn ?? "",
        net: r?.netMinor === undefined ? (r ? "" : "0.00") : money(r.netMinor),
        tax: money(r?.taxMinor ?? 0),
        category: r?.category ?? "Other",
        balance: r?.balanceState ?? "unknown",
        reference: r?.reference ?? "",
      };
    }
    case "invoices": {
      const r = selection.record;
      const fields: RecordFormValues = {
        contact: r?.customerId ?? "",
        number: r?.number ?? nextInvoiceNumber(workspace),
        date: r?.issuedOn ?? workspace.asOf,
        due: r?.dueOn ?? "",
        notes: r?.notes ?? "",
        tax: money(r?.taxMinor ?? 0),
        status: r?.status ?? "draft",
        lineKeys: (r?.lines ?? [null]).map((_, i) => `line${i}`).join(","),
      };
      (r?.lines ?? [{ description: "", quantity: "1", unitPriceMinor: 0 }]).forEach((line, i) => {
        fields[`line${i}-description`] = line.description;
        fields[`line${i}-quantity`] = line.quantity;
        fields[`line${i}-price`] = money(line.unitPriceMinor);
      });
      return fields;
    }
    case "payments": {
      const r = selection.record;
      return {
        direction: r?.direction ?? "in",
        date: r?.occurredOn ?? workspace.asOf,
        amount: money(r?.amountMinor ?? 0),
        reference: r?.reference ?? "",
        contact: r?.counterpartyId ?? "",
        allocation: r?.allocations.length === 1 ? r.allocations[0]!.eventId : "",
        allocated: money(r?.allocations.length === 1 ? (r.allocations[0]!.amountMinor ?? 0) : 0),
        preserveAllocations: "yes",
        from: r?.fromAccount ?? workspace.business.ownedAccountReferences[0] ?? "",
        to: r?.toAccount ?? workspace.business.ownedAccountReferences[1] ?? "",
      };
    }
  }
}
const formName = (family: RetroChangeIntent["family"], name: ChangeFieldName) =>
  family === "invoices" && ["description", "quantity", "price"].includes(name)
    ? `line0-${name}`
    : family === "payments" && name === "price"
      ? "amount"
      : name;
export function changeFormValues(
  preparation: Extract<RetroChangePreparation, { kind: "ready" }>,
  workspace: Workspace,
) {
  const selection = changeSelection(preparation.intent, workspace);
  const values = recordFormValues(selection, workspace);
  for (const field of preparation.fields)
    values[formName(selection.family, field.name)] = field.value;
  if (
    selection.family === "payments" &&
    preparation.intent.fields.some((f) => f.name === "allocation")
  )
    values.preserveAllocations = "no";
  if (preparation.intent.operation === "issue") values.status = "issued";
  return values;
}
export function changeSelection(intent: RetroChangeIntent, workspace: Workspace): RecordSelection {
  const id = intent.query;
  switch (intent.family) {
    case "contacts": {
      const record = workspace.contacts.find((r) => r.id === id);
      return record ? { family: "contacts", record } : { family: "contacts" };
    }
    case "invoices": {
      const record = workspace.invoices.find((r) => r.id === id);
      return record ? { family: "invoices", record } : { family: "invoices" };
    }
    case "costs": {
      const record = workspace.events.find((r) => r.id === id && r.kind === "cost");
      return record ? { family: "costs", record } : { family: "costs" };
    }
    case "payments": {
      const record = workspace.payments.find((r) => r.id === id);
      return record ? { family: "payments", record } : { family: "payments" };
    }
  }
}
export function recordActionFields(action: SessionAction, workspace: Workspace): ChangeFields {
  switch (action.type) {
    case "create_invoice":
    case "update_invoice":
      return fieldsFor(
        recordFormValues({ family: "invoices", record: action.record }, workspace),
        "invoices",
      );
    case "create_event":
    case "update_event":
      return fieldsFor(
        recordFormValues({ family: "costs", record: action.record }, workspace),
        "costs",
      );
    case "create_payment":
    case "update_payment":
      return fieldsFor(
        recordFormValues({ family: "payments", record: action.record }, workspace),
        "payments",
      );
    case "create_contact":
    case "update_contact":
      return fieldsFor(
        recordFormValues({ family: "contacts", record: action.record }, workspace),
        "contacts",
      );
    default:
      return [];
  }
}
function candidates(intent: RetroChangeIntent, workspace: Workspace) {
  switch (intent.family) {
    case "contacts":
      return workspace.contacts.map((r) => ({ id: r.id, label: r.name, search: r.name }));
    case "invoices":
      return workspace.invoices.map((r) => ({
        id: r.id,
        label: `${r.number} · ${workspace.contacts.find((c) => c.id === r.customerId)?.name ?? "Customer"}`,
        search: `${r.number} ${workspace.contacts.find((c) => c.id === r.customerId)?.name ?? ""}`,
      }));
    case "costs":
      return workspace.events
        .filter((r) => r.kind === "cost")
        .map((r) => ({
          id: r.id,
          label: `${r.description.slice(0, 80)} · ${formatAmount(r.amountMinor)}`,
          search: `${r.description} ${r.reference} ${r.category} ${workspace.contacts.find((c) => c.id === r.counterpartyId)?.name ?? ""}`,
        }));
    case "payments":
      return workspace.payments.map((r) => ({
        id: r.id,
        label: `${r.reference.slice(0, 80)} · ${formatAmount(r.amountMinor)}`,
        search: `${r.reference} ${workspace.contacts.find((c) => c.id === r.counterpartyId)?.name ?? ""}`,
      }));
  }
}
const fold = (text: string) => text.trim().toLowerCase();
function fieldsFor(values: RecordFormValues, family: RetroChangeIntent["family"]): ChangeFields {
  const names: ChangeFieldName[] =
    family === "contacts"
      ? ["name", "role", "email"]
      : family === "invoices"
        ? ["contact", "number", "date", "due", "description", "quantity", "price", "tax", "notes"]
        : family === "costs"
          ? [
              "contact",
              "description",
              "date",
              "due",
              "net",
              "tax",
              "category",
              "balance",
              "reference",
            ]
          : [
              "direction",
              "date",
              "price",
              "reference",
              "contact",
              "allocation",
              "allocated",
              "from",
              "to",
            ];
  return names.map((name) => ({ name, value: values[formName(family, name)] ?? "" }));
}
function contactChoices(workspace: Workspace, role: "customer" | "vendor") {
  return workspace.contacts
    .filter((r) => r.role === role || r.role === "both")
    .slice(0, 8)
    .map((r) => ({
      label: r.name,
      query: null,
      fields: [{ name: "contact" as const, value: r.id }],
    }));
}
export function prepareRetroChange(
  input: unknown,
  workspaceInput: Workspace,
  scope: RetroScope,
  identity: string,
): RetroChangePreparation {
  const intent = retroChangeIntentSchema.parse(input);
  const workspace = validateGraph(workspaceInput);
  const clarify = (
    missing: string[],
    choices: Extract<RetroChangePreparation, { kind: "clarification" }>["choices"] = [],
  ): RetroChangePreparation => ({ kind: "clarification", intent, missing, choices });
  if (intent.operation === "issue" && intent.family !== "invoices")
    return { kind: "rejected", reason: "Only an existing draft invoice can be explicitly issued." };
  if (intent.operation !== "create") {
    const available = candidates(intent, workspace),
      q = fold(intent.query ?? "");
    const exact = available.filter(
      (r) => r.id === intent.query || fold(r.search) === q || fold(r.label) === q,
    );
    const found = exact.length ? exact : available.filter((r) => q && fold(r.search).includes(q));
    if (found.length !== 1)
      return clarify(
        [
          found.length
            ? "Choose the exact record; several match that name."
            : "Choose an existing record to change.",
        ],
        (found.length ? found : available)
          .slice(0, 8)
          .map((r) => ({ label: r.label, query: r.id, fields: [] })),
      );
    intent.query = found[0]!.id;
  }
  const selection = changeSelection(intent, workspace),
    values = recordFormValues(selection, workspace),
    beforeFields = fieldsFor(values, intent.family);
  if (
    intent.operation === "issue" &&
    selection.family === "invoices" &&
    selection.record?.status !== "draft"
  )
    return {
      kind: "rejected",
      reason: "That invoice is already issued. Payments are recorded separately.",
    };
  const validNames = fieldsFor(values, intent.family).map((r) => r.name);
  if (intent.fields.some((field) => !validNames.includes(field.name)))
    return { kind: "rejected", reason: "This field does not belong to the selected core form." };
  if (
    selection.family === "invoices" &&
    (selection.record?.lines.length ?? 0) > 1 &&
    intent.fields.some((r) => ["price", "quantity", "description"].includes(r.name))
  )
    return {
      kind: "rejected",
      reason:
        "This invoice has multiple items. Use its manual form to select the exact item to change.",
    };
  for (const field of intent.fields) values[formName(intent.family, field.name)] = field.value;
  if (intent.family === "payments" && intent.fields.some((f) => f.name === "allocation"))
    values.preserveAllocations = "no";
  const missing: string[] = [];
  let choices: Extract<RetroChangePreparation, { kind: "clarification" }>["choices"] = [];
  if (intent.operation !== "delete") {
    if (intent.family === "invoices" || intent.family === "costs") {
      const role = intent.family === "invoices" ? "customer" : "vendor";
      const entered = values.contact ?? "";
      const found = workspace.contacts.filter(
        (r) =>
          (r.id === entered || fold(r.name) === fold(entered)) &&
          (r.role === role || r.role === "both"),
      );
      if (found.length !== 1) {
        missing.push(`Choose an existing ${role}. If it is new, create its contact first.`);
        choices = contactChoices(workspace, role);
      } else values.contact = found[0]!.id;
    }
    if (intent.family === "contacts") {
      if (!values.name) missing.push("Contact name");
      if (!intent.fields.some((r) => r.name === "role") && intent.operation === "create") {
        missing.push("Customer, vendor or both?");
        choices = ["customer", "vendor", "both"].map((role) => ({
          label: role,
          query: null,
          fields: [{ name: "role", value: role }],
        }));
      }
    }
    if (intent.family === "invoices" || intent.family === "costs") {
      if (!values[formName(intent.family, "description")])
        missing.push("One service or expense description");
      if (
        intent.operation === "create" &&
        !intent.fields.some((r) => r.name === (intent.family === "invoices" ? "price" : "net"))
      )
        missing.push("Exact USD amount (net; tax is shown separately)");
    }
    if (values.due && !dateSchema.safeParse(values.due).success) {
      missing.push("A complete due date including its year");
      const monthDay = englishDate(values.due, false);
      if (monthDay) {
        const year = Number(workspace.asOf.slice(0, 4));
        choices = [year, year + 1].map((y) => ({
          label: `Due ${monthDay}-${y}`,
          query: null,
          fields: [{ name: "due", value: englishDate(`${values.due} ${y}`, true) ?? "" }],
        }));
      }
    }
    if (intent.family === "payments") {
      if (intent.operation === "create" && !intent.fields.some((r) => r.name === "direction")) {
        missing.push("Money in, money out or owned transfer?");
        choices = ["in", "out", "internal_transfer"].map((direction) => ({
          label:
            direction === "in" ? "Money in" : direction === "out" ? "Money out" : "Owned transfer",
          query: null,
          fields: [{ name: "direction", value: direction }],
        }));
      }
      if (intent.operation === "create" && !intent.fields.some((r) => r.name === "price"))
        missing.push("Exact positive USD payment amount");
      if (!values.reference) missing.push("Payment reference");
      if (values.direction !== "internal_transfer") {
        const entered = values.contact ?? "";
        const target = workspace.events.find(
          (r) => r.id === values.allocation || fold(r.reference) === fold(values.allocation ?? ""),
        );
        if (values.allocation && !target)
          missing.push("An existing invoice or bill event to match");
        if (target) {
          values.allocation = target.id;
          values.contact = target.counterpartyId;
        } else if (entered) {
          const found = workspace.contacts.filter(
            (r) => r.id === entered || fold(r.name) === fold(entered),
          );
          if (found.length === 1) values.contact = found[0]!.id;
          else {
            missing.push("Choose the exact payment counterparty");
            choices = workspace.contacts.slice(0, 8).map((r) => ({
              label: r.name,
              query: null,
              fields: [{ name: "contact", value: r.id }],
            }));
          }
        } else {
          missing.push("Payment counterparty");
          choices = workspace.contacts.slice(0, 8).map((r) => ({
            label: r.name,
            query: null,
            fields: [{ name: "contact", value: r.id }],
          }));
        }
      }
    }
  }
  if (missing.length) return clarify(missing, choices);
  try {
    if (intent.operation === "issue") values.status = "issued";
    const action: SessionAction =
      intent.operation === "delete"
        ? selection.family === "invoices"
          ? { type: "delete_invoice", id: selection.record!.id }
          : selection.family === "costs"
            ? { type: "delete_event", id: selection.record!.id }
            : selection.family === "contacts"
              ? { type: "delete_contact", id: selection.record!.id }
              : { type: "delete_payment", id: selection.record!.id }
        : buildRecordAction(selection, values, identity);
    const label = `${intent.operation === "create" && intent.family === "invoices" ? "Create draft" : intent.operation.charAt(0).toUpperCase() + intent.operation.slice(1)} ${intent.family === "costs" ? "cost / bill" : intent.family.slice(0, -1)}`;
    return previewRetroCommand(
      intent,
      action,
      workspace,
      scope,
      identity,
      label,
      fieldsFor(values, intent.family),
      beforeFields,
    );
  } catch (error) {
    return {
      kind: "rejected",
      reason:
        error instanceof RangeError
          ? error.message.slice(0, 300)
          : "Check the core fields, dates, role, email and exact USD amounts.",
    };
  }
}
export function previewRetroCommand(
  intent: RetroChangeIntent,
  action: SessionAction,
  workspace: Workspace,
  scope: RetroScope,
  identity: string,
  label: string,
  fields: ChangeFields = [],
  beforeFields: ChangeFields = [],
): Extract<RetroChangePreparation, { kind: "ready" }> {
  const command = commandSchema.parse({
    id: `command_${identity}`,
    workspaceId: workspace.id,
    basedOnRevision: workspace.revision,
    actions: [action],
  });
  const after = applyCommand(
    {
      workspace,
      filters: { ...scope, register: intent.family },
      messages: [],
      undo: null,
      appliedCommandIds: [],
    },
    command,
    label,
  ).workspace;
  const a = buildDashboard(workspace, scope),
    b = buildDashboard(after, scope);
  const factIds = [
    "income",
    "costs",
    "profit",
    "margin",
    "cash_in",
    "cash_out",
    "customer_open",
    "supplier_open",
  ];
  const targetId = "record" in action ? action.record.id : "id" in action ? action.id : "";
  const eventIds =
    action.type === "delete_invoice"
      ? workspace.invoices.filter((r) => r.id === targetId && r.eventId).map((r) => r.eventId!)
      : action.type === "delete_event"
        ? [targetId]
        : [];
  const relations = workspace.payments
    .filter((r) => r.allocations.some((allocation) => eventIds.includes(allocation.eventId)))
    .map(
      (r) =>
        `Payment ${r.reference.slice(0, 100)} remains; its match to the removed event is cleared.`,
    );
  if (action.type === "delete_payment")
    relations.push(
      "Only this payment and its allocations are removed. The invoice / cost records remain.",
    );
  if (intent.family === "invoices")
    relations.push(
      intent.operation === "create"
        ? "New invoice starts as Draft; it records no income, open balance or cash."
        : "Issued work and recorded payment movements remain distinct.",
    );
  if (intent.family === "costs")
    relations.push("A cost or paid claim does not create or remove a separate cash movement.");
  return retroChangePreparationSchema.parse({
    kind: "ready",
    intent,
    command,
    expiresAt: workspace.expiresAt,
    targetId,
    label,
    fields,
    beforeFields,
    effects: factIds
      .filter((id) => a.facts[id] && b.facts[id])
      .map((id) => ({
        factId: id,
        label: a.facts[id]!.label,
        before: a.facts[id]!.value,
        after: b.facts[id]!.value,
        unit: a.facts[id]!.unit,
      })),
    relationships: relations.slice(0, 20),
  }) as Extract<RetroChangePreparation, { kind: "ready" }>;
}
export function patchChangeIntent(
  intent: RetroChangeIntent,
  patch: { query: string | null; fields: ChangeFields },
): RetroChangeIntent {
  const fields = new Map(intent.fields.map((field) => [field.name, field]));
  patch.fields.forEach((field) => fields.set(field.name, field));
  return retroChangeIntentSchema.parse({
    ...intent,
    query: patch.query ?? intent.query,
    fields: [...fields.values()],
  });
}
export function verifyRetroChange(response: RetroResponse, workspace: Workspace) {
  if (response.decision.kind !== "change_request") return;
  if (!response.change) throw new RangeError("Missing change preparation.");
  const identity =
    response.change.kind === "ready"
      ? response.change.command.id.slice("command_".length)
      : "verification";
  const expected = prepareRetroChange(
    response.decision.intent,
    workspace,
    response.scope,
    identity,
  );
  if (JSON.stringify(expected) !== JSON.stringify(response.change))
    throw new RangeError("The change preview could not be verified.");
}
const months = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];
function englishDate(value: string, yearRequired: boolean): string | null {
  const match =
    /(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)(?:\s+(\d{4}))?/iu.exec(value) ??
    /([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?/iu.exec(value);
  if (!match) return null;
  const day = /^\d/u.test(match[1]!) ? match[1]! : match[2]!;
  const month = /^\d/u.test(match[1]!) ? match[2]! : match[1]!;
  const m = months.findIndex((name) => name.startsWith(fold(month)) && month.length >= 3) + 1;
  if (!m) return null;
  const md = `${String(m).padStart(2, "0")}-${day.padStart(2, "0")}`;
  if (!yearRequired) return md;
  const date = `${match[3] ?? ""}-${md}`;
  return dateSchema.safeParse(date).success ? date : null;
}
export function fakeChangeIntent(
  prompt: string,
  workspace: Workspace,
  context?: RetroChangeIntent,
): RetroChangeIntent | null {
  const text = prompt.trim(),
    lower = fold(text);
  const isChange = /\b(create|add|record|update|edit|change|move|remove|delete|issue)\b/u.test(
    lower,
  );
  if (!isChange && !context) return null;
  const family: RetroChangeIntent["family"] | undefined = /invoice/u.test(lower)
    ? "invoices"
    : /expense|cost|bill/u.test(lower)
      ? "costs"
      : /payment|money in|money out|transfer/u.test(lower)
        ? "payments"
        : /contact|company|customer|vendor/u.test(lower)
          ? "contacts"
          : context?.family;
  if (!family) return null;
  const operation: RetroChangeIntent["operation"] = isChange
    ? /\b(delete|remove)\b/u.test(lower)
      ? "delete"
      : /\bissue\b/u.test(lower)
        ? "issue"
        : /\b(update|edit|change|move)\b/u.test(lower)
          ? "update"
          : "create"
    : context!.operation;
  let intent: RetroChangeIntent =
    context && context.family === family && !isChange
      ? context
      : { family, operation, query: null, fields: [] };
  const fields: ChangeFields = [];
  const set = (name: ChangeFieldName, value: string | undefined) => {
    if (value !== undefined) fields.push({ name, value: value.trim() });
  };
  const records = candidates(intent, workspace);
  if (operation !== "create") {
    const found = records.filter(
      (row) =>
        lower.includes(fold(row.id)) ||
        row.search.split(" ").some((part) => part.length > 2 && lower.includes(fold(part))),
    );
    const exact = records.filter(
      (row) =>
        lower.includes(fold(row.id)) ||
        workspace.invoices.some(
          (invoice) => invoice.id === row.id && lower.includes(fold(invoice.number)),
        ) ||
        workspace.payments.some(
          (payment) => payment.id === row.id && lower.includes(fold(payment.reference)),
        ) ||
        workspace.contacts.some(
          (contact) => contact.id === row.id && lower.includes(fold(contact.name)),
        ),
    );
    const selected = exact.length === 1 ? exact[0] : found.length === 1 ? found[0] : null;
    if (selected) intent = { ...intent, query: selected.id };
    else if (!intent.query) {
      const q = text
        .replace(
          /^(?:please\s+)?(?:delete|remove|update|edit|change|move|issue)\s+(?:the\s+)?/iu,
          "",
        )
        .replace(/\s*(?:invoice|expense|cost|bill|payment|contact)\s*/giu, " ")
        .split(/\s+(?:to|due|date|amount)\b/iu)[0]
        ?.trim();
      intent = { ...intent, query: q || null };
    }
  }
  const currencyAmount =
    /(?:USD\s*|\$\s*|\bamount\s*(?:of|to|:)\s*)(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)(?![\d.]|,\d)/iu.exec(
      text,
    );
  if (currencyAmount) {
    const value = currencyAmount[1]!.replaceAll(",", "");
    try {
      parseAmount(value);
      set(family === "costs" ? "net" : "price", value);
    } catch {
      set(family === "costs" ? "net" : "price", currencyAmount[1]);
    }
  }
  const due = /\bdue(?:\s+date)?(?:\s+(?:by|on|to))?\s*[:=]?\s*([^,;]+(?:,\s*\d{4})?)/iu.exec(text);
  if (due) {
    const raw = due[1]!.split(/\s+for\s+/iu)[0]!.trim();
    set("due", dateSchema.safeParse(raw).success ? raw : (englishDate(raw, true) ?? raw));
  }
  const date = /\b(?:dated|on|date)(?:\s+to)?\s*[:=]?\s*(\d{4}-\d{2}-\d{2})/iu.exec(text);
  if (date && !due?.[1]?.includes(date[1]!)) set("date", date[1]);
  const contact = workspace.contacts.filter((row) => lower.includes(fold(row.name)));
  if (family !== "contacts") {
    if (contact.length === 1) set("contact", contact[0]!.id);
    else if (!intent.fields.some((field) => field.name === "contact")) {
      const name =
        /\b(?:for|from|to|vendor|customer)\s+([^,$;]+?)(?=\s+(?:USD|due|on|dated|amount|for)\b|[,;$]|$)/iu.exec(
          text,
        )?.[1];
      if (name) set("contact", name);
    }
  } else {
    const name =
      /\b(?:named|name\s*[:=]|contact\s+(?:for\s+|named\s+)?)([^,;]+?)(?=\s+(?:as|role|email)\b|[,;]|$)/iu.exec(
        text,
      )?.[1];
    if (name) set("name", name);
    const role = /\b(both|customer|vendor)\b/iu.exec(text)?.[1];
    if (role) set("role", role.toLowerCase());
    const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu.exec(text)?.[0];
    if (email) set("email", email);
  }
  const description =
    /\bdescription\s*[:=]\s*([^;]+)/iu.exec(text)?.[1] ??
    [...text.matchAll(/\bfor\s+([^,;]+?)(?=\s+(?:USD|due|on|dated)\b|[,;]|$)/giu)]
      .map((m) => m[1]!)
      .filter((value) => !contact.some((c) => fold(value) === fold(c.name)))
      .at(-1);
  if (description && (family === "invoices" || family === "costs")) set("description", description);
  const category = /\bcategory\s*[:=]?\s*(Rent|Software|Materials|Travel|Services|Other)\b/iu.exec(
    text,
  )?.[1];
  if (category) set("category", category[0]!.toUpperCase() + category.slice(1).toLowerCase());
  if (family === "costs") {
    if (/\b(unpaid|open)\b/u.test(lower)) set("balance", "open");
    else if (/\bpaid\b/u.test(lower)) set("balance", "paid");
  }
  if (family === "payments") {
    if (/\b(incoming|received|receive|money in)\b/u.test(lower)) set("direction", "in");
    else if (/\b(outgoing|paid|money out)\b/u.test(lower)) set("direction", "out");
    else if (/\btransfer\b/u.test(lower)) set("direction", "internal_transfer");
    const reference = /\breference\s*[:=]?\s*([^,;]+)/iu.exec(text)?.[1];
    if (reference) set("reference", reference);
    const linked = workspace.events.filter(
      (row) => row.reference && lower.includes(fold(row.reference)),
    );
    if (linked.length === 1 && /\bagainst|match|allocate\b/u.test(lower)) {
      set("allocation", linked[0]!.id);
      if (currencyAmount) set("allocated", currencyAmount[1]!.replaceAll(",", ""));
    }
  }
  return patchChangeIntent(intent, { query: null, fields });
}
