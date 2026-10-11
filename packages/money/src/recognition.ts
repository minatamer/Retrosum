import { moneyInputMessage, SourceReviewError } from "./input-guidance.js";
import {
  interpretationSchema,
  extractionResultSchema,
  workspaceSchema,
  documentSchema,
  eventSchema,
  paymentSchema,
  contactSchema,
  invoiceSchema,
  MAX_MINOR_UNITS,
  type Workspace,
  type SourceDocument,
  type ExtractionResult,
  type NumericField,
} from "@retrosum/contracts";
import { validateGraph } from "./graph.js";
import { invoiceAmounts } from "./invoices.js";

// Whole identifiers and dates are tokens; their component digits are not extra fields.
export function numericTokens(text: string): string[] {
  return (
    text.match(/[A-Za-z]+(?:-[A-Za-z]+)*-\d+|\d{4}-\d{2}-\d{2}|[+-]?\d[\d,]*(?:\.\d+)?%?/gu) ?? []
  );
}
function counts(tokens: string[]) {
  const result = new Map<string, number>();
  for (const token of tokens) result.set(token, (result.get(token) ?? 0) + 1);
  return result;
}
function rawNormalized(field: NumericField): string | null {
  const raw = field.raw.replaceAll(",", "");
  if (["identifier", "ISO_date"].includes(field.scale)) return field.raw;
  if (field.scale === "USD_cents" || field.scale === "basis_points") {
    const decimal = raw.replace(/%$/u, "");
    if (!/^[+-]?\d+(?:\.\d{1,2})?$/u.test(decimal)) return null;
    const negative = decimal.startsWith("-");
    const [whole = "0", fraction = ""] = decimal.replace(/^[+-]/u, "").split(".");
    const minor = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
    if (minor > BigInt(MAX_MINOR_UNITS)) return null;
    return String(negative ? -minor : minor);
  }
  if (/^\d+(?:\.\d+)?$/u.test(raw)) return raw.replace(/\.0+$/u, "");
  return null;
}

/** Provider output proposes facts only. Validation never looks up expected fixture values. */
export function mergeInterpretation(
  input: Workspace,
  source: SourceDocument,
  output: ExtractionResult,
): Workspace {
  const result = extractionResultSchema.parse(output);
  const data = interpretationSchema.parse(result.interpretation);
  const workspace = workspaceSchema.parse(input);
  const doc = documentSchema.parse(source);
  if (result.sha256 !== doc.sha256 || result.inspection.pages.length !== doc.pageCount)
    throw new RangeError("The interpretation belongs to a different original PDF.");
  const existing = workspace.documents.find((item) => item.id === doc.id);
  if (!existing) throw new RangeError("Select the original before applying its interpretation.");
  const fields = new Map(data.fields.map((field) => [field.key, field]));
  const notes: string[] = [...data.warnings];
  let blocked = fields.size !== data.fields.length;
  const checks = new Map<string, "native_checked" | "visual_review" | "ambiguous">();
  if (blocked) notes.push("The numeric inventory contains repeated field identities.");
  if (
    data.currency !== "USD" ||
    data.business.trim().toLowerCase() !== workspace.business.name.trim().toLowerCase()
  ) {
    notes.push("Confirm the business identity and USD currency before using these figures.");
    blocked = true;
  }
  if (data.events.length + data.payments.length > 100) {
    blocked = true;
    notes.push("This PDF exceeds the supported 100 financial rows. No rows were truncated.");
  }
  if (data.payments.length && data.kind !== "payment_register") {
    blocked = true;
    notes.push(
      "A paid claim on an invoice, bill or receipt is not a recorded cash movement. Keep this source held; cash requires dedicated payment-register evidence.",
    );
  }
  for (const page of result.inspection.pages) {
    const pageFields = data.fields.filter((field) => field.page === page.page);
    const expected = counts(
      pageFields.flatMap((field) => Array<string>(field.occurrences).fill(field.raw)),
    );
    const actual = counts(numericTokens(page.text));
    const nativeMatches =
      !page.raster &&
      expected.size === actual.size &&
      [...actual].every(([raw, count]) => expected.get(raw) === count);
    if (!page.raster && !nativeMatches) {
      blocked = true;
      notes.push(
        `Page ${page.page}: the complete numeric inventory does not match the embedded text. Keep this source held.`,
      );
    }
    for (const field of pageFields) {
      const uncertain =
        field.ambiguous || field.normalized === null || rawNormalized(field) !== field.normalized;
      checks.set(
        field.key,
        uncertain ? "ambiguous" : nativeMatches ? "native_checked" : "visual_review",
      );
      if (uncertain) blocked = true;
    }
    if (page.raster)
      notes.push(
        `Page ${page.page} is image-only. Compare every raw figure with the original before accepting.`,
      );
  }
  if (data.fields.some((field) => !checks.has(field.key))) {
    blocked = true;
    notes.push("A field points to an unavailable PDF page.");
  }
  if (!data.fields.length && result.inspection.pages.some((page) => page.raster)) {
    blocked = true;
    notes.push(
      "This image-only document has no numeric transcription. View its original and enter records manually.",
    );
  }
  if (blocked && !notes.length)
    notes.push(
      "One or more digits are ambiguous or inconsistent. No candidate records were added.",
    );
  const value = (key: string, scale?: string) => {
    const field = fields.get(key);
    if (
      !field ||
      field.normalized === null ||
      checks.get(key) === "ambiguous" ||
      (scale && field.scale !== scale)
    )
      throw new RangeError("A required figure has no reliable source field.");
    return field.normalized;
  };
  const amount = (key: string, absolute = false) => {
    const text = value(key, "USD_cents");
    if (!/^[+-]?\d+$/u.test(text)) throw new RangeError("A money field must be integer cents.");
    const signed = BigInt(text);
    const cents = absolute && signed < 0n ? -signed : signed;
    if (cents < 0n || cents > BigInt(MAX_MINOR_UNITS))
      throw new RangeError("This amount is outside the supported range.");
    return Number(cents);
  };
  const sourceAt = (key: string) => {
    const field = fields.get(key);
    if (!field) throw new RangeError("A field source is missing.");
    return { documentId: doc.id, page: field.page, blockId: field.block, excerpt: field.raw };
  };
  const base = doc.id.replace(/^document_/u, "");
  const contact = (name: string, role: "customer" | "vendor") => {
    const found = workspace.contacts.find(
      (item) => item.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
    if (found) {
      if (found.role !== role) found.role = "both";
      return found.id;
    }
    const record = contactSchema.parse({
      id: `contact_${base}_${workspace.contacts.length}`,
      name,
      role,
    });
    workspace.contacts.push(record);
    return record.id;
  };
  // Work on a detached candidate; a bad later row cannot partially commit an earlier row.
  const before = workspaceSchema.parse(workspace);
  let duplicate = false;
  if (!blocked)
    try {
      for (const [index, row] of data.events.entries()) {
        if (row.businessRole === "unknown")
          throw new RangeError("The buyer or seller role needs confirmation.");
        const kind = row.businessRole === "issuer" ? "sale" : "cost";
        const party = contact(row.party, kind === "sale" ? "customer" : "vendor");
        const reference = value(row.referenceField, "identifier");
        const record = eventSchema.parse({
          id: `event_${base}_${index}`,
          kind,
          counterpartyId: party,
          reference,
          description: row.description,
          category: row.category || "Uncategorized",
          occurredOn: value(row.dateField, "ISO_date"),
          ...(row.dueField ? { dueOn: value(row.dueField, "ISO_date") } : {}),
          amountMinor: amount(row.grossField),
          ...(row.netField ? { netMinor: amount(row.netField) } : {}),
          ...(row.taxField ? { taxMinor: amount(row.taxField) } : {}),
          currency: "USD",
          basis: "gross",
          status: "posted",
          balanceState: row.balanceState,
          paidClaim: row.balanceState === "paid",
          sources: [sourceAt(row.referenceField)],
          origin: "document",
        });
        if (
          record.netMinor !== undefined &&
          record.taxMinor !== undefined &&
          record.netMinor + record.taxMinor !== record.amountMinor
        )
          throw new SourceReviewError(
            `Source total for ${reference} differs from net plus explicit tax. It was not corrected.`,
          );
        const same = workspace.events.find(
          (event) =>
            event.kind === kind && event.counterpartyId === party && event.reference === reference,
        );
        if (same) {
          if (
            same.amountMinor !== record.amountMinor ||
            same.occurredOn !== record.occurredOn ||
            same.dueOn !== record.dueOn ||
            same.balanceState !== record.balanceState ||
            same.netMinor !== record.netMinor ||
            same.taxMinor !== record.taxMinor
          )
            throw new SourceReviewError(
              `Another source for ${reference} has conflicting figures. No duplicate relationship was assumed.`,
            );
          if (!same.sources.some((item) => item.documentId === doc.id))
            same.sources.push(...record.sources);
          duplicate = true;
          continue;
        }
        if (row.lines.length) {
          const invoice = invoiceSchema.parse({
            id: `invoice_${base}_${index}`,
            number: reference,
            customerId: party,
            issuedOn: record.occurredOn,
            ...(record.dueOn ? { dueOn: record.dueOn } : {}),
            currency: "USD",
            status: "issued",
            eventId: record.id,
            lines: row.lines.map((line) => ({
              description: line.description,
              quantity: value(line.quantity),
              unitPriceMinor: amount(line.unitPrice),
            })),
            taxMinor: record.taxMinor ?? 0,
            notes: "Imported from the original PDF.",
            sources: record.sources,
            origin: "document",
          });
          const calculated = invoiceAmounts(invoice);
          if (
            calculated.lines.some((minor, n) => minor !== amount(row.lines[n]!.total)) ||
            (record.netMinor !== undefined && calculated.netMinor !== record.netMinor) ||
            calculated.grossMinor !== record.amountMinor ||
            record.taxMinor === undefined
          )
            throw new SourceReviewError(
              `The line arithmetic for ${reference} does not agree with its source figures. It was not corrected.`,
            );
          if (kind === "sale") workspace.invoices.push(invoice);
        }
        workspace.events.push(record);
      }
      for (const [index, row] of data.payments.entries()) {
        const transfer = row.direction === "internal_transfer";
        const party =
          transfer || !row.party
            ? undefined
            : contact(row.party, row.direction === "in" ? "customer" : "vendor");
        const amountMinor = amount(row.amountField, true);
        const candidates = workspace.events.filter(
          (event) =>
            event.reference === row.eventReference &&
            event.counterpartyId === party &&
            event.kind === (row.direction === "in" ? "sale" : "cost"),
        );
        const event = candidates.length === 1 ? candidates[0] : undefined;
        const allocated = event
          ? workspace.payments
              .flatMap((payment) => payment.allocations)
              .filter((item) => item.eventId === event.id)
              .reduce((sum, item) => sum + item.amountMinor, 0)
          : 0;
        const canMatch = !transfer && event && amountMinor <= event.amountMinor - allocated;
        const record = paymentSchema.parse({
          id: `payment_${base}_${index}`,
          occurredOn: value(row.dateField, "ISO_date"),
          direction: row.direction,
          reference: value(row.referenceField, "identifier"),
          amountMinor,
          currency: "USD",
          origin: "document",
          ...(party ? { counterpartyId: party } : {}),
          sources: [sourceAt(row.referenceField)],
          allocations: canMatch ? [{ eventId: event.id, amountMinor }] : [],
          ...(transfer ? { fromAccount: row.fromAccount, toAccount: row.toAccount } : {}),
        });
        workspace.payments.push(record);
        if (!transfer && row.eventReference && !canMatch)
          notes.push(
            `Payment ${record.reference}: no safe unique invoice/bill match; cash is kept separately.`,
          );
      }
      if (data.asOfField) workspace.asOf = value(data.asOfField, "ISO_date");
      validateGraph(workspace);
    } catch (error) {
      workspace.contacts = before.contacts;
      workspace.events = before.events;
      workspace.payments = before.payments;
      workspace.invoices = before.invoices;
      workspace.asOf = before.asOf;
      blocked = true;
      notes.push(
        moneyInputMessage(
          error,
          "A required source field is unsupported. No candidate records were added.",
        ),
      );
    }
  if (duplicate)
    notes.push(
      "This source repeats an existing economic event. Confirm the second-copy relationship; it contributes no extra income or cost.",
    );
  const review = blocked || duplicate || notes.length > 0;
  Object.assign(existing, {
    kind: data.kind,
    state: review ? "needs_review" : "ready",
    disposition: review ? "held" : "active",
    recognitionMode: result.mode,
    reviewBlocked: blocked,
    reviewNotes: notes.slice(0, 30),
    numericFields: data.fields
      .map((field) => ({
        ...field,
        ambiguous: undefined,
        check: checks.get(field.key) ?? "ambiguous",
      }))
      .map(({ ambiguous: _unused, ...field }) => field),
  });
  workspace.issues = workspace.issues.filter((issue) => !issue.documentIds.includes(doc.id));
  if (review)
    workspace.issues.push({
      id: `issue_${base}`,
      code: duplicate ? "duplicate" : "ambiguous_amount",
      documentIds: [doc.id],
      message: notes[0] ?? "Review the original figures.",
      resolved: false,
    });
  workspace.revision += 1;
  return validateGraph(workspace);
}
