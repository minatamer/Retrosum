import {
  retroWorkspaceIntentSchema,
  retroScopeSchema,
  type RetroWorkspaceIntent,
  type RetroScope,
  type Workspace,
  type RetroResponse,
  type DashboardPreferences,
} from "@retrosum/contracts";

/** Bounded fake intent recognition only; no financial data or browser side effects. */
export function fakeWorkspaceIntent(prompt: string): RetroWorkspaceIntent | null {
  const text = prompt.trim().toLowerCase();
  const parse = (intent: RetroWorkspaceIntent) => retroWorkspaceIntentSchema.parse(intent);
  if (/\bexport\b/u.test(text)) return null;
  if (/what can (you|retro) do|help me use|capabilities|^help[?.!]*$/u.test(text))
    return parse({ action: "help" });
  if (/clear.*(conversation|chat)/u.test(text)) return parse({ action: "clear_conversation" });
  if (/reset.*(workspace|demo)|start (fresh|over)/u.test(text))
    return parse({ action: "panel", panel: "reset", currency: null });
  if (/restore.*(layout|dashboard)|default.*(layout|dashboard)/u.test(text))
    return parse({ action: "restore_layout" });
  if (/\bundo\b/u.test(text))
    return parse({
      action: "undo",
      which: /layout|dashboard/u.test(text)
        ? "layout"
        : /record|financial|invoice|expense|payment/u.test(text)
          ? "financial"
          : null,
    });
  if (/collapse.*(sidebar|navigation)|expand.*(sidebar|navigation)/u.test(text))
    return parse({ action: "sidebar", collapsed: text.includes("collapse") });
  if (/income.*(target|goal)|(target|goal).*income/u.test(text))
    return parse({
      action: "target",
      amount:
        text
          .match(
            /(?:income\s+(?:target|goal)|(?:target|goal)\s+(?:for\s+)?income)(?:\s+(?:of|to|at))?\s*(?:usd\s*|\$\s*)?(-?\d[\d,]*(?:\.\d+)?)/u,
          )?.[1]
          ?.replaceAll(",", "") ?? null,
    });
  if (/currency|exchange rate|settings|profile/u.test(text))
    return parse({
      action: "panel",
      panel: "settings",
      currency: /\beur\b|euro/u.test(text) ? "EUR" : /\busd\b|dollar/u.test(text) ? "USD" : null,
    });
  if (/(add|upload|select|process).*(document|pdf)|reprocess/u.test(text))
    return parse({ action: "panel", panel: "intake", currency: null });
  if (/\bfilters?\b|change.*(period|date|as.of)|set.*(period|as.of)/u.test(text)) {
    const dates = text.match(/\b\d{4}-\d{2}-\d{2}\b/gu) ?? [];
    return parse({
      action: "filter",
      from: dates.length >= 2 ? dates[0]! : null,
      to: dates.length >= 2 ? dates[1]! : null,
      asOf: /as.of/u.test(text) ? (dates.at(-1) ?? null) : null,
      category: text.match(/(?:category|filter by)\s+([a-z ]+?)(?:[?.!]|$)/u)?.[1]?.trim() ?? null,
      counterparty:
        text.match(/(?:customer|vendor|counterparty)\s+([a-z ]+?)(?:[?.!]|$)/u)?.[1]?.trim() ??
        null,
      clear: /clear|remove|reset/u.test(text),
    });
  }
  if (/review.*(figure|held|document|duplicate|handwrit)|check.*(held|duplicate)/u.test(text))
    return parse({
      action: "review",
      query: /duplicate/u.test(text)
        ? "duplicate"
        : /handwrit/u.test(text)
          ? "handwritten"
          : /held/u.test(text)
            ? "held"
            : null,
    });
  if (/\bpdf\b|download.*document|original.*document/u.test(text)) {
    const ref = text.match(/\b(?:hs-\d+|a-\d+)\b/u)?.[0];
    const query =
      ref ??
      (/handwrit/u.test(text)
        ? "handwritten"
        : /duplicate/u.test(text)
          ? "duplicate"
          : /invoice/u.test(text)
            ? "invoice"
            : /receipt/u.test(text)
              ? "receipt"
              : null);
    return parse({
      action: "source",
      query,
      page: Number(text.match(/page\s+(\d+)/u)?.[1]) || null,
    });
  }
  if (/^(open|show|find|list|go to|view)\b/u.test(text)) {
    if (/document/u.test(text)) return parse({ action: "navigate", view: "documents" });
    const family = /invoice/u.test(text)
      ? "invoices"
      : /expense|bill|cost record/u.test(text)
        ? "costs"
        : /payment/u.test(text)
          ? "payments"
          : /contact/u.test(text)
            ? "contacts"
            : null;
    if (family) return parse({ action: "records", family });
    if (/record/u.test(text)) return parse({ action: "records", family: null });
    if (/dashboard/u.test(text)) return parse({ action: "navigate", view: "overview" });
  }
  return null;
}

export function retroDocuments(workspace: Workspace, query: string | null) {
  const text = query?.trim().toLowerCase();
  if (!text) return workspace.documents;
  return workspace.documents.filter((doc) => {
    if (text === "held") return doc.disposition === "held" || doc.state === "needs_review";
    if (text === "duplicate")
      return (
        doc.disposition === "duplicate" ||
        doc.reviewNotes.some((note) => /repeats|duplicate/iu.test(note))
      );
    if (text === "handwritten")
      return doc.provenance === "synthetic_handwriting" || /handwrit/iu.test(doc.name);
    if (`${doc.id} ${doc.name} ${doc.kind}`.toLowerCase().includes(text)) return true;
    return (
      workspace.events.some(
        (event) =>
          `${event.reference ?? ""} ${event.description}`.toLowerCase().includes(text) &&
          event.sources.some((source) => source.documentId === doc.id),
      ) ||
      workspace.invoices.some(
        (invoice) =>
          invoice.number.toLowerCase().includes(text) &&
          invoice.sources.some((source) => source.documentId === doc.id),
      )
    );
  });
}

export function prepareRetroFilter(
  intent: Extract<RetroWorkspaceIntent, { action: "filter" }>,
  workspace: Workspace,
  scope: RetroScope,
): RetroScope {
  const categories = [...new Set(workspace.events.map((event) => event.category))];
  const category = intent.category
    ? categories.find((name) => name.toLowerCase() === intent.category!.toLowerCase())
    : undefined;
  const matches = intent.counterparty
    ? workspace.contacts.filter(
        (contact) =>
          contact.id === intent.counterparty ||
          contact.name.toLowerCase() === intent.counterparty!.toLowerCase(),
      )
    : [];
  if (intent.category && !category) throw new RangeError("Choose a category from your records.");
  if (intent.counterparty && matches.length !== 1)
    throw new RangeError("Choose the exact counterparty from your records.");
  const next = retroScopeSchema.parse({
    from: intent.from ?? scope.from,
    to: intent.to ?? scope.to,
    ...(intent.asOf || scope.asOf ? { asOf: intent.asOf ?? scope.asOf } : {}),
    ...(!intent.clear && (category ?? scope.category)
      ? { category: category ?? scope.category }
      : {}),
    ...(!intent.clear && (matches[0]?.id ?? scope.counterpartyId)
      ? { counterpartyId: matches[0]?.id ?? scope.counterpartyId }
      : {}),
  });
  if (next.from > next.to) throw new RangeError("Choose an end date on or after the start date.");
  return next;
}

export function isRetroUiCurrent(response: RetroResponse, dashboard: DashboardPreferences) {
  return response.uiRevision === dashboard.revision;
}
