import {
  minorUnitsSchema,
  type SessionFilter,
  type SourceReference,
  type Workspace,
} from "@retrosum/contracts";
import { sumAmounts } from "./amount.js";
import { sourceEligible } from "./graph.js";

export type Contribution = {
  id: string;
  amountMinor: number;
  sources: SourceReference[];
  basis: "net" | "document_total" | "movement" | "balance";
};
export type MoneyMetric = { minor: number; contributors: Contribution[] };
function metric(contributors: Contribution[]): MoneyMetric {
  return { minor: sumAmounts(contributors.map((record) => record.amountMinor)), contributors };
}
/** Signed half-up rounding, no floating point money or percentage intermediates. */
export function ratioTenths(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  const value = BigInt(numerator) * 1000n;
  const magnitude = value < 0n ? -value : value;
  const rounded = (magnitude * 2n + BigInt(denominator)) / (2n * BigInt(denominator));
  return Number(value < 0n ? -rounded : rounded);
}
export function changeTenths(current: number, previous: number) {
  minorUnitsSchema.parse(current);
  minorUnitsSchema.parse(previous);
  if (previous <= 0) return null;
  return ratioTenths(Number(BigInt(current) - BigInt(previous)), previous);
}
export function calculateMetrics(workspace: Workspace, filter: Omit<SessionFilter, "register">) {
  const inPeriod = (date: string) => date >= filter.from && date <= filter.to;
  const asOf = filter.asOf ?? workspace.asOf;
  const matches = (record: Workspace["events"][number]) =>
    (!filter.category || record.category === filter.category) &&
    (!filter.counterpartyId || record.counterpartyId === filter.counterpartyId);
  const eligibleEvents = workspace.events.filter(
    (record) =>
      record.status === "posted" && sourceEligible(workspace, record.sources, record.origin),
  );
  const eligiblePayments = workspace.payments.filter((record) =>
    sourceEligible(workspace, record.sources, record.origin),
  );
  const periodEvents = eligibleEvents.filter(
    (record) => inPeriod(record.occurredOn) && matches(record),
  );
  const unknownNet = periodEvents.filter(
    (record) => record.netMinor === undefined && (record.taxMinor ?? 0) > 0,
  );
  const eligibleBasis = periodEvents.filter((record) => !unknownNet.includes(record));
  const contribution = (record: (typeof eligibleBasis)[number]): Contribution => ({
    id: record.id,
    amountMinor: record.netMinor ?? record.amountMinor,
    sources: record.sources,
    basis: record.netMinor === undefined ? "document_total" : "net",
  });
  const income = metric(eligibleBasis.filter((record) => record.kind === "sale").map(contribution));
  const costs = metric(eligibleBasis.filter((record) => record.kind === "cost").map(contribution));
  const tax = metric(
    periodEvents
      .filter((record) => record.taxMinor !== undefined)
      .map((record) => ({
        id: record.id,
        amountMinor: record.taxMinor ?? 0,
        sources: record.sources,
        basis: "net",
      })),
  );
  // A whole payment cannot be attributed to one category from partial allocations.
  const cashRows = eligiblePayments.filter(
    (record) =>
      inPeriod(record.occurredOn) &&
      !filter.category &&
      (!filter.counterpartyId || record.counterpartyId === filter.counterpartyId),
  );
  const movement = (record: (typeof cashRows)[number]): Contribution => ({
    id: record.id,
    amountMinor: record.amountMinor,
    sources: record.sources,
    basis: "movement",
  });
  const cashIn = metric(cashRows.filter((record) => record.direction === "in").map(movement));
  const cashOut = metric(cashRows.filter((record) => record.direction === "out").map(movement));
  const allocated = new Map<string, number[]>();
  const settlementSources = new Map<string, SourceReference[]>();
  for (const payment of eligiblePayments) {
    if (payment.occurredOn > asOf) continue;
    for (const allocation of payment.allocations) {
      allocated.set(allocation.eventId, [
        ...(allocated.get(allocation.eventId) ?? []),
        allocation.amountMinor,
      ]);
      settlementSources.set(allocation.eventId, [
        ...(settlementSources.get(allocation.eventId) ?? []),
        ...payment.sources,
      ]);
    }
  }
  const openRows: Contribution[] = [];
  const unknownBalances: string[] = [];
  for (const record of periodEvents) {
    if (record.occurredOn > asOf) continue;
    const matched = sumAmounts(allocated.get(record.id) ?? []);
    if (record.paidClaim || record.balanceState === "paid") continue;
    if (record.balanceState === "unknown" && matched === 0) {
      unknownBalances.push(record.id);
      continue;
    }
    const remaining = sumAmounts([record.amountMinor, -matched]);
    if (remaining > 0)
      openRows.push({
        id: record.id,
        amountMinor: remaining,
        sources: [...record.sources, ...(settlementSources.get(record.id) ?? [])],
        basis: "balance",
      });
  }
  const periodById = new Map<string, (typeof periodEvents)[number]>(
    periodEvents.map((record) => [record.id, record]),
  );
  const customerOpen = metric(openRows.filter((row) => periodById.get(row.id)?.kind === "sale"));
  const supplierOpen = metric(openRows.filter((row) => periodById.get(row.id)?.kind === "cost"));
  const overdue = metric(
    openRows.filter((row) => {
      const event = periodById.get(row.id);
      return Boolean(event?.dueOn && event.dueOn < asOf);
    }),
  );
  const profitMinor = sumAmounts([income.minor, -costs.minor]);
  const categories = [
    ...new Set(
      eligibleBasis.filter((record) => record.kind === "cost").map((record) => record.category),
    ),
  ].map((category) => ({
    category,
    ...metric(
      eligibleBasis
        .filter((record) => record.kind === "cost" && record.category === category)
        .map(contribution),
    ),
  }));
  return {
    income,
    costs,
    tax,
    profitMinor,
    marginTenths: ratioTenths(profitMinor, income.minor),
    cashIn,
    cashOut,
    netCashMinor: sumAmounts([cashIn.minor, -cashOut.minor]),
    customerOpen,
    supplierOpen,
    overdue,
    categories,
    exclusions: {
      unknownNet: unknownNet.map((record) => record.id),
      unknownBalances,
      heldOrDuplicate: workspace.events
        .filter(
          (record) =>
            inPeriod(record.occurredOn) && matches(record) && !eligibleEvents.includes(record),
        )
        .map((record) => record.id),
      transfers: cashRows
        .filter((record) => record.direction === "internal_transfer")
        .map((record) => record.id),
    },
    scope: { from: filter.from, to: filter.to, asOf, revision: workspace.revision },
  };
}
