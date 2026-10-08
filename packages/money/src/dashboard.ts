import {
  dateSchema,
  type SessionFilter,
  type SourceReference,
  type Workspace,
} from "@retrosum/contracts";
import { calculateMetrics, changeTenths, ratioTenths, type Contribution } from "./metrics.js";
import { sourceEligible } from "./graph.js";
import { sumAmounts } from "./amount.js";

export type DashboardScope = Omit<SessionFilter, "register"> & {
  asOf: string;
  revision: number;
  currency: "USD";
};
export type FactRow = {
  id: string;
  label: string;
  date: string;
  category: string;
  party: string;
  amountMinor: number;
  basis: string;
  sources: SourceReference[];
  grossMinor?: number;
  netMinor?: number;
  taxMinor?: number;
  note?: string;
};
export type DashboardFact = {
  id: string;
  label: string;
  value: number | null;
  unit: "money" | "percent" | "count";
  scope: DashboardScope;
  dateBasis: "event" | "payment" | "as_of" | "collection";
  formula: string;
  basis: string;
  unavailable: string | null;
  contributors: FactRow[];
  excluded: { id: string; label: string; reason: string; sources: SourceReference[] }[];
  issues: Workspace["issues"];
  sources: SourceReference[];
};
export type FactMark = {
  label: string;
  factId: string;
  value: number;
  shareTenths: number | null;
  count: number;
};
export type DashboardCatalogue = ReturnType<typeof buildDashboard>;

export function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  if (value.getUTCFullYear() < 0) return "0000-01-01";
  if (value.getUTCFullYear() > 9999) return "9999-12-31";
  return value.toISOString().slice(0, 10);
}
function monthRange(date: string) {
  const first = `${date.slice(0, 7)}-01`;
  const next = new Date(`${first}T00:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  next.setUTCDate(0);
  return { from: first, to: next.toISOString().slice(0, 10) };
}
export function comparisonRange(filter: Pick<SessionFilter, "from" | "to">) {
  if (filter.from === "0000-01-01") return null;
  const month = monthRange(filter.from);
  if (filter.from === month.from && filter.to === month.to)
    return monthRange(shiftDate(filter.from, -1));
  const days =
    Math.round(
      (Date.parse(`${filter.to}T00:00:00Z`) - Date.parse(`${filter.from}T00:00:00Z`)) / 86400000,
    ) + 1;
  const from = shiftDate(filter.from, -days);
  return from === "0000-01-01" &&
    Date.parse(`${filter.from}T00:00:00Z`) - days * 86400000 < Date.parse("0000-01-01T00:00:00Z")
    ? null
    : { from, to: shiftDate(filter.from, -1) };
}
function uniqueSources(rows: { sources: SourceReference[] }[]) {
  return [
    ...new Map(
      rows.flatMap((row) => row.sources).map((source) => [JSON.stringify(source), source]),
    ).values(),
  ];
}

/** Current validated graph is the sole input. No provider text or fixture lookup supplies values. */
export function buildDashboard(workspace: Workspace, filter: Omit<SessionFilter, "register">) {
  dateSchema.parse(filter.from);
  dateSchema.parse(filter.to);
  if (filter.from > filter.to) throw new RangeError("The reporting dates are reversed.");
  const scope: DashboardScope = {
    from: filter.from,
    to: filter.to,
    ...(filter.category ? { category: filter.category } : {}),
    ...(filter.counterpartyId ? { counterpartyId: filter.counterpartyId } : {}),
    asOf: dateSchema.parse(filter.asOf ?? workspace.asOf),
    revision: workspace.revision,
    currency: "USD",
  };
  const metrics = calculateMetrics(workspace, scope);
  const facts: Record<string, DashboardFact> = {};
  const events = new Map(workspace.events.map((row) => [row.id as string, row]));
  const payments = new Map(workspace.payments.map((row) => [row.id as string, row]));
  const names = new Map(workspace.contacts.map((row) => [row.id as string, row.name]));
  const matches = (row: Workspace["events"][number]) =>
    (!scope.category || row.category === scope.category) &&
    (!scope.counterpartyId || row.counterpartyId === scope.counterpartyId);
  const inPeriod = (date: string) => date >= scope.from && date <= scope.to;
  const scopedEvents = workspace.events.filter((row) => inPeriod(row.occurredOn) && matches(row));
  const eligible = scopedEvents.filter(
    (row) => row.status === "posted" && sourceEligible(workspace, row.sources, row.origin),
  );
  const eligibleIds = new Set(eligible.map((row) => row.id));
  const exclusionsCache = new Map<string, DashboardFact["excluded"]>();
  const movementRows = workspace.payments.filter(
    (row) =>
      inPeriod(row.occurredOn) &&
      (!scope.counterpartyId || row.counterpartyId === scope.counterpartyId) &&
      sourceEligible(workspace, row.sources, row.origin),
  );
  const rowFrom = (contribution: Contribution): FactRow => {
    const event = events.get(contribution.id);
    const payment = payments.get(contribution.id);
    if (event)
      return {
        ...contribution,
        label: event.reference || event.description,
        date: event.occurredOn,
        category: event.category,
        party: names.get(event.counterpartyId) ?? "Unknown",
        grossMinor: event.amountMinor,
        ...(event.netMinor === undefined ? {} : { netMinor: event.netMinor }),
        ...(event.taxMinor === undefined ? {} : { taxMinor: event.taxMinor }),
        note: event.dueOn ? `Due ${event.dueOn}` : "Due date not supplied",
      };
    if (payment)
      return {
        ...contribution,
        label: payment.reference || "Unreferenced movement",
        date: payment.occurredOn,
        category: payment.direction,
        party:
          names.get(payment.counterpartyId ?? "") ??
          (payment.direction === "internal_transfer" ? "Owned accounts" : "Unknown"),
        note:
          payment.direction === "internal_transfer"
            ? `${payment.fromAccount} → ${payment.toAccount}`
            : payment.allocations.length
              ? `${payment.allocations.length} validated match(es)`
              : "Unmatched movement",
      };
    throw new RangeError("A contribution has no current record.");
  };
  const eventExclusions = (kind?: "sale" | "cost", balances = false) => {
    const key = `${kind ?? "all"}:${balances}`;
    const cached = exclusionsCache.get(key);
    if (cached) return cached;
    const rows = scopedEvents
      .filter(
        (row) =>
          (!kind || row.kind === kind) &&
          (!eligibleIds.has(row.id) ||
            (balances && row.occurredOn > scope.asOf) ||
            (balances
              ? metrics.exclusions.unknownBalances
              : metrics.exclusions.unknownNet
            ).includes(row.id)),
      )
      .map((row) => ({
        id: row.id,
        label: row.reference || row.description,
        sources: row.sources,
        reason: !eligibleIds.has(row.id)
          ? "Held, duplicate or source not ready"
          : balances
            ? row.occurredOn > scope.asOf
              ? "Event follows the selected as-of date"
              : "Settlement unknown; no invented open balance"
            : "Explicit tax without a known net amount",
      }));
    exclusionsCache.set(key, rows);
    return rows;
  };
  const add = (
    id: string,
    label: string,
    value: number | null,
    contributors: FactRow[],
    formula: string,
    basis: string,
    dateBasis: DashboardFact["dateBasis"] = "event",
    excluded: DashboardFact["excluded"] = eventExclusions(),
    unit: DashboardFact["unit"] = "money",
    unavailable = "Unavailable from supplied records",
  ) => {
    const sources = uniqueSources([...contributors, ...excluded]);
    const documentIds = new Set(sources.map((source) => source.documentId));
    const fact: DashboardFact = {
      id,
      label,
      value,
      unit,
      scope,
      formula,
      basis,
      dateBasis,
      contributors,
      excluded,
      unavailable: value === null ? unavailable : null,
      sources,
      issues: workspace.issues.filter(
        (issue) => !issue.resolved && issue.documentIds.some((id) => documentIds.has(id)),
      ),
    };
    facts[id] = fact;
    return fact;
  };
  const incomeAvailable = eligible.some(
    (row) => row.kind === "sale" && !metrics.exclusions.unknownNet.includes(row.id),
  );
  const costAvailable = eligible.some(
    (row) => row.kind === "cost" && !metrics.exclusions.unknownNet.includes(row.id),
  );
  const documentAvailable = incomeAvailable || costAvailable;
  const income = add(
    "income",
    "Invoiced income",
    incomeAvailable ? metrics.income.minor : null,
    metrics.income.contributors.map(rowFrom),
    "Sum of eligible issued sale amounts",
    "Net when stated; otherwise document total without separate tax",
    "event",
    eventExclusions("sale"),
  );
  const costs = add(
    "costs",
    "Documented costs",
    costAvailable ? metrics.costs.minor : null,
    metrics.costs.contributors.map(rowFrom),
    "Sum of eligible documented cost amounts",
    income.basis,
    "event",
    eventExclusions("cost"),
  );
  // A supplied event establishes a document slice; absent opposite-side events contribute zero to its preview, disclosed below.
  const previewBasis = `${income.basis}. Missing records are outside this supplied slice; ${!incomeAvailable ? "no eligible income was supplied" : !costAvailable ? "no eligible costs were supplied" : "both income and costs are supplied"}.`;
  const bridge = [
    ...income.contributors,
    ...costs.contributors.map((row) => ({ ...row, amountMinor: -row.amountMinor })),
  ];
  add(
    "profit",
    metrics.profitMinor < 0 ? "Loss preview" : "Profit preview",
    documentAvailable ? metrics.profitMinor : null,
    bridge,
    "Invoiced income − documented costs",
    previewBasis,
  );
  add(
    "margin",
    "Margin preview",
    documentAvailable ? metrics.marginTenths : null,
    bridge,
    "(Income − costs) ÷ positive income × 100; half-up to one decimal",
    previewBasis,
    "event",
    eventExclusions(),
    "percent",
    "Margin unavailable on zero or missing income",
  );
  const cashAvailable =
    !scope.category && movementRows.some((row) => row.direction !== "internal_transfer");
  const cashExclusions = movementRows
    .filter((row) => row.direction === "internal_transfer" || Boolean(scope.category))
    .map((row) => ({
      id: row.id,
      label: row.reference,
      sources: row.sources,
      reason:
        row.direction === "internal_transfer"
          ? "Owned transfer; excluded from operating cash"
          : "A whole movement cannot be attributed to a category",
    }));
  const cashBasis =
    "Recorded operating movements; not account balance. Invoice paid claims do not create cash.";
  const cashIn = add(
    "cash_in",
    "Recorded cash in",
    cashAvailable ? metrics.cashIn.minor : null,
    metrics.cashIn.contributors.map(rowFrom),
    "Sum of supplied inbound operating movements",
    cashBasis,
    "payment",
    cashExclusions,
  );
  const cashOut = add(
    "cash_out",
    "Recorded cash out",
    cashAvailable ? metrics.cashOut.minor : null,
    metrics.cashOut.contributors.map(rowFrom),
    "Sum of supplied outbound operating movements",
    cashBasis,
    "payment",
    cashExclusions,
  );
  add(
    "cash_net",
    "Net cash movement",
    cashAvailable ? metrics.netCashMinor : null,
    [
      ...cashIn.contributors,
      ...cashOut.contributors.map((row) => ({ ...row, amountMinor: -row.amountMinor })),
    ],
    "Recorded cash in − recorded cash out",
    cashBasis,
    "payment",
    cashExclusions,
  );
  const knownRows = eligible.filter(
    (row) => row.occurredOn <= scope.asOf && !metrics.exclusions.unknownBalances.includes(row.id),
  );
  const customer = add(
    "customer_open",
    "Known customer open",
    knownRows.some((row) => row.kind === "sale") ? metrics.customerOpen.minor : null,
    metrics.customerOpen.contributors.map(rowFrom),
    "Gross customer amount − validated settlements through as-of",
    "Known open only, on selected event dates; unknown settlement excluded",
    "as_of",
    eventExclusions("sale", true),
  );
  const supplier = add(
    "supplier_open",
    "Known supplier open",
    knownRows.some((row) => row.kind === "cost") ? metrics.supplierOpen.minor : null,
    metrics.supplierOpen.contributors.map(rowFrom),
    "Gross supplier amount − validated settlements through as-of",
    customer.basis,
    "as_of",
    eventExclusions("cost", true),
  );
  const open = [...customer.contributors, ...supplier.contributors];
  add(
    "overdue",
    "Overdue known open",
    knownRows.length ? metrics.overdue.minor : null,
    metrics.overdue.contributors.map(rowFrom),
    "Known positive open with due date strictly before as-of",
    customer.basis,
    "as_of",
    eventExclusions(undefined, true),
  );
  const soonEnd = shiftDate(scope.asOf, 7);
  for (const [key, label, fact] of [
    ["customer", "Customer", customer],
    ["supplier", "Supplier", supplier],
  ] as const) {
    const due = fact.contributors.filter((row) => {
      const date = events.get(row.id)?.dueOn;
      return date && date >= scope.asOf && date <= soonEnd;
    });
    add(
      `${key}_soon`,
      `${label} due soon`,
      fact.value === null ? null : sumAmounts(due.map((row) => row.amountMinor)),
      due,
      `Known open due from ${scope.asOf} through ${soonEnd}, inclusive`,
      fact.basis,
      "as_of",
      fact.excluded,
    );
  }
  const taxRows = metrics.tax.contributors.map((row) => ({
    ...rowFrom(row),
    basis: "explicit tax disclosure",
  }));
  add(
    "tax",
    "Explicit document tax",
    taxRows.length ? metrics.tax.minor : null,
    taxRows,
    "Sum of explicitly stated tax; no inferred recovery or liability",
    "Document tax disclosure; separate from income/cost basis",
  );
  const collapse = (marks: FactMark[], limit: number, id: string, total: number): FactMark[] => {
    if (marks.length <= limit) return marks;
    const remainder = marks.slice(limit - 1);
    const contributors = remainder.flatMap((mark) => facts[mark.factId]!.contributors);
    const value = sumAmounts(remainder.map((mark) => mark.value));
    add(
      id,
      `Other · ${remainder.length} groups`,
      value,
      contributors,
      "Sum of all remaining groups; every member is listed below",
      income.basis,
      "event",
      eventExclusions(),
    );
    return [
      ...marks.slice(0, limit - 1),
      {
        label: `Other (${remainder.length})`,
        factId: id,
        value,
        count: contributors.length,
        shareTenths: ratioTenths(value, total),
      },
    ];
  };
  const categories = collapse(
    metrics.categories
      .sort((a, b) => b.minor - a.minor || a.category.localeCompare(b.category))
      .map((category): FactMark => {
        const id = `category:${category.category}`;
        add(
          id,
          category.category,
          category.minor,
          category.contributors.map(rowFrom),
          "Sum of this category’s eligible documented costs",
          costs.basis,
          "event",
          eventExclusions("cost").filter(
            (row) => events.get(row.id)?.category === category.category,
          ),
        );
        return {
          label: category.category,
          factId: id,
          value: category.minor,
          shareTenths: ratioTenths(category.minor, metrics.costs.minor),
          count: category.contributors.length,
        };
      }),
    6,
    "category_group:other",
    metrics.costs.minor,
  );
  const partyMarks = (kind: "sale" | "cost") => {
    const rows = kind === "sale" ? income.contributors : costs.contributors;
    const grouped = new Map<string, FactRow[]>();
    for (const row of rows) {
      const partyId = events.get(row.id)!.counterpartyId;
      grouped.set(partyId, [...(grouped.get(partyId) ?? []), row]);
    }
    return [...grouped]
      .map(([partyId, contributors]): FactMark => {
        const value = sumAmounts(contributors.map((row) => row.amountMinor));
        const id = `${kind}_party:${partyId}`;
        const label = names.get(partyId) ?? "Unknown";
        add(
          id,
          label,
          value,
          contributors,
          `Sum of ${kind === "sale" ? "issued income" : "documented costs"} for this counterparty`,
          income.basis,
          "event",
          eventExclusions(kind).filter((row) => events.get(row.id)?.counterpartyId === partyId),
        );
        return {
          label,
          factId: id,
          value,
          shareTenths: ratioTenths(
            value,
            kind === "sale" ? metrics.income.minor : metrics.costs.minor,
          ),
          count: contributors.length,
        };
      })
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
  };
  const customers = collapse(partyMarks("sale"), 7, "sale_party_group:other", metrics.income.minor),
    vendors = collapse(partyMarks("cost"), 7, "cost_party_group:other", metrics.costs.minor);
  const profitBridge: FactMark[] = [
    {
      label: "Income",
      factId: "income",
      value: metrics.income.minor,
      count: income.contributors.length,
      shareTenths: null,
    },
    ...categories.map((mark) => {
      const original = facts[mark.factId]!;
      const id = `bridge:${mark.factId}`;
      add(
        id,
        `Less ${mark.label}`,
        -mark.value,
        original.contributors.map((row) => ({ ...row, amountMinor: -row.amountMinor })),
        "Deduct this category’s documented cost from income",
        previewBasis,
        "event",
        original.excluded,
      );
      return {
        ...mark,
        label: `Less ${mark.label}`,
        factId: id,
        value: -mark.value,
        shareTenths: null,
      };
    }),
    {
      label: facts.profit!.label,
      factId: "profit",
      value: metrics.profitMinor,
      count: bridge.length,
      shareTenths: null,
    },
  ];
  const cashDates = [
    ...new Set([...cashIn.contributors, ...cashOut.contributors].map((row) => row.date)),
  ].sort();
  const bucketSize = Math.max(1, Math.ceil(cashDates.length / 6));
  const dateGroups = cashDates
    .filter((_, index) => index % bucketSize === 0)
    .map((date, index) => ({
      from: date,
      to: cashDates[Math.min((index + 1) * bucketSize - 1, cashDates.length - 1)]!,
    }));
  const cashSeries = dateGroups.map(({ from, to }) => {
    const date = from === to ? from : `${from} – ${to}`;
    return {
      label: date,
      from,
      to,
      marks: [cashIn, cashOut].map((fact) => {
        const rows = fact.contributors.filter((row) => row.date >= from && row.date <= to);
        const value = sumAmounts(rows.map((row) => row.amountMinor));
        const id = `${fact.id}:${date}`;
        add(
          id,
          `${date} · ${fact.label}`,
          value,
          rows,
          fact.formula,
          fact.basis,
          "payment",
          fact.excluded,
        );
        return { label: fact.label, factId: id, value, count: rows.length, shareTenths: null };
      }),
    };
  });
  const ageingLabels = [
    "Current",
    "1–30 days overdue",
    "31–60 days overdue",
    "61+ days overdue",
    "Unknown due date",
  ];
  const ageing = [customer, supplier].map((fact) => ({
    label: fact.label,
    marks: ageingLabels.map((label, index): FactMark => {
      const rows = fact.contributors.filter((row) => {
        const due = events.get(row.id)?.dueOn;
        if (!due) return index === 4;
        const age = Math.round(
          (Date.parse(`${scope.asOf}T00:00:00Z`) - Date.parse(`${due}T00:00:00Z`)) / 86400000,
        );
        return index === (age <= 0 ? 0 : age <= 30 ? 1 : age <= 60 ? 2 : 3);
      });
      const value = sumAmounts(rows.map((row) => row.amountMinor));
      const id = `${fact.id}:age:${index}`;
      add(
        id,
        `${fact.label} · ${label}`,
        fact.value === null ? null : value,
        rows,
        `Gross known open in bucket: ${label}; due date compared with ${scope.asOf}`,
        fact.basis,
        "as_of",
        fact.excluded,
      );
      return {
        label,
        factId: id,
        value,
        count: rows.length,
        shareTenths: ratioTenths(value, fact.value ?? 0),
      };
    }),
  }));
  const coverage = (
    ["Usable", "Review / held", "Failed / cancelled", "Duplicate", "Processing"] as const
  ).map((label, index) => {
    const documents = workspace.documents.filter((doc) => {
      const bucket =
        doc.disposition === "duplicate"
          ? 3
          : doc.state === "error" || doc.state === "cancelled"
            ? 2
            : doc.state === "needs_review" || doc.disposition === "held"
              ? 1
              : doc.state === "ready"
                ? 0
                : 4;
      return bucket === index;
    });
    const id = `coverage:${index}`;
    const rows: FactRow[] = documents.map((doc) => ({
      id: doc.id,
      label: doc.name,
      date: "",
      party: "",
      category: label,
      amountMinor: 0,
      basis: `${doc.state} · ${doc.disposition} · ${doc.recognitionMode ?? "not interpreted"}`,
      sources: [{ documentId: doc.id, page: 1 }],
      note: doc.reviewNotes.join(" · "),
    }));
    add(
      id,
      `${label} sources`,
      documents.length,
      rows,
      "Count of documents in this state, across the whole collection",
      "Source document count, separate from economic events",
      "collection",
      [],
      "count",
    );
    return {
      label,
      factId: id,
      value: documents.length,
      count: documents.length,
      shareTenths: ratioTenths(documents.length, workspace.documents.length),
    };
  });
  add(
    "coverage",
    "Review coverage",
    workspace.documents.length ? coverage[0]!.value : null,
    coverage.flatMap((mark) => facts[mark.factId]!.contributors),
    "Count of usable originals / all collection originals",
    "Collection scope; not AI confidence",
    "collection",
    [],
    "count",
  );
  const compatibleRange = comparisonRange(scope);
  const priorRange = compatibleRange ?? { from: scope.from, to: scope.to };
  const priorMetrics = calculateMetrics(workspace, { ...scope, ...priorRange });
  const previousEvents = compatibleRange
    ? workspace.events.filter(
        (row) =>
          row.occurredOn >= priorRange.from &&
          row.occurredOn <= priorRange.to &&
          matches(row) &&
          row.status === "posted" &&
          sourceEligible(workspace, row.sources, row.origin),
      )
    : [];
  const comparison = ["income", "costs", "profit"] as const;
  const priorSets = {
    income: priorMetrics.income.contributors.map(rowFrom),
    costs: priorMetrics.costs.contributors.map(rowFrom),
    profit: [
      ...priorMetrics.income.contributors.map(rowFrom),
      ...priorMetrics.costs.contributors
        .map(rowFrom)
        .map((row) => ({ ...row, amountMinor: -row.amountMinor })),
    ],
  };
  const changes = comparison.map((key) => {
    const current = facts[key]!;
    const rows = compatibleRange ? priorSets[key] : [];
    const hasPrior = key === "profit" ? previousEvents.length > 0 : rows.length > 0;
    const compatible =
      hasPrior &&
      priorMetrics.exclusions.unknownNet.length === 0 &&
      metrics.exclusions.unknownNet.length === 0;
    const previous = key === "profit" ? priorMetrics.profitMinor : priorMetrics[key].minor;
    const prior = add(
      `prior:${key}`,
      key === "profit"
        ? previous < 0
          ? "Prior loss preview"
          : "Prior profit preview"
        : `Prior ${current.label.toLowerCase()}`,
      hasPrior ? previous : null,
      rows,
      current.formula,
      key === "profit"
        ? `${income.basis}. Prior supplied slice: ${priorSets.income.length} income and ${priorSets.costs.length} cost records. Missing records are outside this preview.`
        : current.basis,
    );
    prior.scope = { ...scope, ...priorRange };
    prior.excluded = workspace.events
      .filter(
        (row) =>
          row.occurredOn >= priorRange.from &&
          row.occurredOn <= priorRange.to &&
          matches(row) &&
          (!previousEvents.includes(row) || priorMetrics.exclusions.unknownNet.includes(row.id)),
      )
      .map((row) => ({
        id: row.id,
        label: row.reference || row.description,
        sources: row.sources,
        reason: "Held, duplicate, unavailable source or unknown net basis",
      }));
    prior.sources = uniqueSources([...rows, ...prior.excluded]);
    prior.issues = workspace.issues.filter(
      (issue) =>
        !issue.resolved &&
        issue.documentIds.some((id) => prior.sources.some((source) => source.documentId === id)),
    );
    return {
      key,
      label: key === "profit" ? "Profit / loss" : current.label,
      currentFactId: key,
      priorFactId: prior.id,
      priorRange,
      changeTenths:
        compatible && current.value !== null ? changeTenths(current.value, previous) : null,
      differenceMinor:
        hasPrior && current.value !== null ? sumAmounts([current.value, -previous]) : null,
      reason: !hasPrior
        ? "No compatible prior records supplied"
        : !compatible
          ? "Unknown net basis prevents comparison"
          : previous <= 0
            ? "Percentage unavailable on non-positive prior; inspect absolute difference"
            : null,
    };
  });
  const trend = [
    ...(previousEvents.length
      ? [
          {
            label: `${priorRange.from} – ${priorRange.to}`,
            marks: changes.map((change) => ({
              label: change.label,
              factId: change.priorFactId,
              value: facts[change.priorFactId]!.value ?? 0,
              count: facts[change.priorFactId]!.contributors.length,
              shareTenths: null,
            })),
          },
        ]
      : []),
    ...(documentAvailable
      ? [
          {
            label: `${scope.from} – ${scope.to}`,
            marks: changes.map((change) => ({
              label: change.label,
              factId: change.currentFactId,
              value: facts[change.currentFactId]!.value ?? 0,
              count: facts[change.currentFactId]!.contributors.length,
              shareTenths: null,
            })),
          },
        ]
      : []),
  ];
  return {
    scope,
    facts,
    metrics,
    categories,
    customers,
    vendors,
    profitBridge,
    cashSeries,
    ageing,
    coverage,
    changes,
    trend,
    includedEventCount: new Set(
      [...income.contributors, ...costs.contributors].map((row) => row.id),
    ).size,
    unknownSettlementCount: metrics.exclusions.unknownBalances.length,
    openCount: open.length,
    pendingIssueCount: workspace.issues.filter((issue) => !issue.resolved).length,
    latestEditRevision: Math.max(
      0,
      ...workspace.events.map((row) => row.editedAtRevision ?? 0),
      ...workspace.payments.map((row) => row.editedAtRevision ?? 0),
      ...workspace.invoices.map((row) => row.editedAtRevision ?? 0),
    ),
  };
}
