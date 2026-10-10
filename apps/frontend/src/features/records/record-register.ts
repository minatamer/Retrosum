import type { SessionFilter, Workspace } from "@retrosum/contracts";

/** Filter dated rows without changing financial eligibility or the underlying workspace. */
export function recordsInPeriod(
  workspace: Pick<Workspace, "invoices" | "events" | "payments" | "contacts">,
  range: Pick<SessionFilter, "from" | "to">,
) {
  const inPeriod = (date: string) => date >= range.from && date <= range.to;
  return {
    invoices: workspace.invoices.filter((record) => inPeriod(record.issuedOn)),
    costs: workspace.events.filter(
      (record) => record.kind === "cost" && inPeriod(record.occurredOn),
    ),
    payments: workspace.payments.filter((record) => inPeriod(record.occurredOn)),
    contacts: workspace.contacts,
  };
}
