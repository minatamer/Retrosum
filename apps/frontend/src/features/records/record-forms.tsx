"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  contactIdSchema,
  contactSchema,
  eventIdSchema,
  eventSchema,
  invoiceIdSchema,
  invoiceSchema,
  paymentIdSchema,
  paymentSchema,
  type Contact,
  type FinancialEvent,
  type Invoice,
  type Payment,
  type SessionAction,
  type Workspace,
} from "@retrosum/contracts";
import { parseAmount, sumAmounts } from "@retrosum/money";
import { Button } from "../../components/ui/button";
import styles from "./records.module.css";

export type RecordSelection =
  | { family: "contacts"; record?: Contact }
  | { family: "costs"; record?: FinancialEvent }
  | { family: "invoices"; record?: Invoice }
  | { family: "payments"; record?: Payment };
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="rs-form-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
const text = (data: FormData, name: string) => String(data.get(name) ?? "").trim();
const amount = (data: FormData, name: string) => {
  const value = parseAmount(text(data, name));
  if (value < 0) throw new RangeError("Amounts must be zero or greater.");
  return value;
};
const dollars = (minor: number) => (minor / 100).toFixed(2);
function Contacts({
  workspace,
  role,
  current,
}: {
  workspace: Workspace;
  role: "customer" | "vendor";
  current?: string;
}) {
  return (
    <select name="contact" required defaultValue={current ?? ""}>
      <option value="" disabled>
        Choose a {role}
      </option>
      {workspace.contacts
        .filter((contact) => contact.role === "both" || contact.role === role)
        .map((contact) => (
          <option key={contact.id} value={contact.id}>
            {contact.name}
          </option>
        ))}
    </select>
  );
}
export function RecordForm({
  selection,
  workspace,
  onSave,
}: {
  selection: RecordSelection;
  workspace: Workspace;
  onSave: (action: SessionAction, label: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [lineKeys, setLineKeys] = useState(() =>
    Array.from(
      { length: selection.family === "invoices" ? (selection.record?.lines.length ?? 1) : 1 },
      (_, index) => `line${index}`,
    ),
  );
  const [nextLine, setNextLine] = useState(lineKeys.length);
  const [direction, setDirection] = useState(
    selection.family === "payments" ? (selection.record?.direction ?? "in") : "in",
  );
  const [invoiceStatus, setInvoiceStatus] = useState(
    selection.family === "invoices" ? (selection.record?.status ?? "draft") : "draft",
  );
  const editing = Boolean(selection.record);
  const date = workspace.asOf;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      const data = new FormData(event.currentTarget);
      const uuid = crypto.randomUUID();
      switch (selection.family) {
        case "contacts": {
          const record = contactSchema.parse({
            id: selection.record?.id ?? contactIdSchema.parse(`contact_${uuid}`),
            name: text(data, "name"),
            role: text(data, "role"),
            ...(text(data, "email") ? { email: text(data, "email") } : {}),
          });
          onSave(
            { type: editing ? "update_contact" : "create_contact", record },
            `${editing ? "Update" : "Create"} ${record.name}`,
          );
          break;
        }
        case "costs": {
          const netMinor = amount(data, "net");
          const taxMinor = amount(data, "tax");
          const record = eventSchema.parse({
            ...selection.record,
            id: selection.record?.id ?? eventIdSchema.parse(`event_${uuid}`),
            kind: "cost",
            counterpartyId: text(data, "contact"),
            description: text(data, "description"),
            occurredOn: text(data, "date"),
            ...(text(data, "due") ? { dueOn: text(data, "due") } : { dueOn: undefined }),
            amountMinor: sumAmounts([netMinor, taxMinor]),
            netMinor,
            taxMinor,
            currency: "USD",
            basis: "gross",
            status: selection.record?.status ?? "posted",
            paidClaim: text(data, "balance") === "paid",
            balanceState: text(data, "balance"),
            category: text(data, "category"),
            reference: text(data, "reference"),
            sources: selection.record?.sources ?? [],
            origin: selection.record?.origin ?? "session",
          });
          onSave(
            { type: editing ? "update_event" : "create_event", record },
            `${editing ? "Update" : "Create"} cost`,
          );
          break;
        }
        case "invoices": {
          const record = invoiceSchema.parse({
            ...selection.record,
            id: selection.record?.id ?? invoiceIdSchema.parse(`invoice_${uuid}`),
            number: text(data, "number"),
            customerId: text(data, "contact"),
            issuedOn: text(data, "date"),
            ...(text(data, "due") ? { dueOn: text(data, "due") } : { dueOn: undefined }),
            currency: "USD",
            notes: text(data, "notes"),
            status: selection.record ? invoiceStatus : "draft",
            taxMinor: amount(data, "tax"),
            lines: lineKeys.map((key) => ({
              description: text(data, `${key}-description`),
              quantity: text(data, `${key}-quantity`),
              unitPriceMinor: amount(data, `${key}-price`),
            })),
          });
          onSave(
            { type: editing ? "update_invoice" : "create_invoice", record },
            invoiceStatus === "issued" && selection.record?.status === "draft"
              ? `Issue invoice ${record.number}`
              : `${editing ? "Update" : "Create draft"} invoice ${record.number}`,
          );
          break;
        }
        case "payments": {
          const eventId = text(data, "allocation");
          const target = workspace.events.find((record) => record.id === eventId);
          const counterparty = target?.counterpartyId ?? text(data, "contact");
          const record = paymentSchema.parse({
            ...selection.record,
            id: selection.record?.id ?? paymentIdSchema.parse(`payment_${uuid}`),
            occurredOn: text(data, "date"),
            direction,
            amountMinor: amount(data, "amount"),
            currency: "USD",
            reference: text(data, "reference"),
            ...(counterparty && direction !== "internal_transfer"
              ? { counterpartyId: counterparty }
              : { counterpartyId: undefined }),
            allocations:
              eventId && direction !== "internal_transfer"
                ? [{ eventId, amountMinor: amount(data, "allocated") }]
                : [],
            ...(direction === "internal_transfer"
              ? { fromAccount: text(data, "from"), toAccount: text(data, "to") }
              : { fromAccount: undefined, toAccount: undefined }),
            sources: selection.record?.sources ?? [],
            origin: selection.record?.origin ?? "session",
          });
          onSave(
            { type: editing ? "update_payment" : "create_payment", record },
            `${editing ? "Update" : "Record"} payment`,
          );
          break;
        }
      }
    } catch (cause) {
      setError(
        cause instanceof RangeError
          ? cause.message
          : "Check the required fields, dates, email and exact USD amounts.",
      );
    }
  };
  return (
    <form onSubmit={submit} className={styles.form}>
      {selection.family === "contacts" && (
        <>
          <Field label="Contact name">
            <input name="name" required maxLength={100} defaultValue={selection.record?.name} />
          </Field>
          <Field label="Role">
            <select name="role" defaultValue={selection.record?.role ?? "customer"}>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="both">Customer & vendor</option>
            </select>
          </Field>
          <Field label="Email (optional)">
            <input
              name="email"
              type="email"
              maxLength={160}
              defaultValue={selection.record?.email}
            />
          </Field>
          <p className={styles.hint}>
            A simple contact for this browser session. No message is sent.
          </p>
        </>
      )}
      {selection.family === "costs" && (
        <>
          <Field label="Vendor">
            <Contacts
              workspace={workspace}
              role="vendor"
              {...(selection.record ? { current: selection.record.counterpartyId } : {})}
            />
          </Field>
          <Field label="Description">
            <input
              name="description"
              required
              maxLength={240}
              defaultValue={selection.record?.description}
            />
          </Field>
          <div className={styles.twoColumns}>
            <Field label="Cost date">
              <input
                name="date"
                type="date"
                required
                defaultValue={selection.record?.occurredOn ?? date}
              />
            </Field>
            <Field label="Due date (optional)">
              <input name="due" type="date" defaultValue={selection.record?.dueOn} />
            </Field>
          </div>
          <div className={styles.twoColumns}>
            <Field label="Net amount (USD)">
              <input
                name="net"
                inputMode="decimal"
                required
                defaultValue={
                  selection.record
                    ? selection.record.netMinor === undefined
                      ? ""
                      : dollars(selection.record.netMinor)
                    : "0.00"
                }
              />
            </Field>
            <Field label="Explicit tax (USD)">
              <input
                name="tax"
                inputMode="decimal"
                required
                defaultValue={dollars(selection.record?.taxMinor ?? 0)}
              />
            </Field>
          </div>
          <Field label="Category">
            <select name="category" defaultValue={selection.record?.category ?? "Other"}>
              {[
                ...new Set([
                  "Rent",
                  "Software",
                  "Materials",
                  "Travel",
                  "Services",
                  "Other",
                  ...(selection.record ? [selection.record.category] : []),
                ]),
              ].map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </Field>
          <Field label="Payment claim">
            <select name="balance" defaultValue={selection.record?.balanceState ?? "unknown"}>
              <option value="unknown">Unknown</option>
              <option value="open">Explicitly open</option>
              <option value="paid">Stated paid · cash recorded separately</option>
            </select>
          </Field>
          <Field label="Bill / receipt reference (optional)">
            <input name="reference" maxLength={80} defaultValue={selection.record?.reference} />
          </Field>
          <p className={styles.hint}>
            Gross is net plus explicit tax. A paid claim does not create a cash movement.
          </p>
        </>
      )}
      {selection.family === "invoices" && (
        <>
          <Field label="Customer">
            <Contacts
              workspace={workspace}
              role="customer"
              {...(selection.record ? { current: selection.record.customerId } : {})}
            />
          </Field>
          <Field label="Invoice number">
            <input
              name="number"
              required
              maxLength={40}
              defaultValue={selection.record?.number ?? `INV-${workspace.invoices.length + 1}`}
            />
          </Field>
          <div className={styles.twoColumns}>
            <Field label="Issue date">
              <input
                name="date"
                type="date"
                required
                defaultValue={selection.record?.issuedOn ?? date}
              />
            </Field>
            <Field label="Due date (optional)">
              <input name="due" type="date" defaultValue={selection.record?.dueOn} />
            </Field>
          </div>
          <fieldset className={styles.lines}>
            <legend>Services & items</legend>
            {lineKeys.map((key) => {
              const initial = selection.record?.lines[Number(key.slice(4))];
              return (
                <div className={styles.line} key={key}>
                  <Field label={`Item ${lineKeys.indexOf(key) + 1} description`}>
                    <input
                      name={`${key}-description`}
                      required
                      maxLength={200}
                      defaultValue={initial?.description}
                    />
                  </Field>
                  <div className={styles.twoColumns}>
                    <Field label={`Item ${lineKeys.indexOf(key) + 1} quantity`}>
                      <input
                        name={`${key}-quantity`}
                        inputMode="decimal"
                        required
                        defaultValue={initial?.quantity ?? "1"}
                      />
                    </Field>
                    <Field label={`Item ${lineKeys.indexOf(key) + 1} unit price (USD)`}>
                      <input
                        name={`${key}-price`}
                        inputMode="decimal"
                        required
                        defaultValue={dollars(initial?.unitPriceMinor ?? 0)}
                      />
                    </Field>
                  </div>
                  {lineKeys.length > 1 && (
                    <button
                      className={styles.textButton}
                      type="button"
                      onClick={() => setLineKeys((keys) => keys.filter((item) => item !== key))}
                    >
                      Remove item {lineKeys.indexOf(key) + 1}
                    </button>
                  )}
                </div>
              );
            })}
            <Button
              variant="ghost"
              disabled={lineKeys.length >= 20}
              onClick={() => {
                setLineKeys((keys) => [...keys, `line${nextLine}`]);
                setNextLine((next) => next + 1);
              }}
            >
              Add an item
            </Button>
          </fieldset>
          <Field label="Explicit invoice tax (USD)">
            <input
              name="tax"
              inputMode="decimal"
              required
              defaultValue={dollars(selection.record?.taxMinor ?? 0)}
            />
          </Field>
          <Field label="Notes (optional)">
            <textarea
              name="notes"
              rows={2}
              maxLength={1000}
              defaultValue={selection.record?.notes}
            />
          </Field>
          {selection.record && (
            <Field label="Invoice status">
              <select
                value={invoiceStatus}
                onChange={(event) => setInvoiceStatus(event.target.value as "draft" | "issued")}
              >
                {selection.record.status === "draft" && (
                  <option value="draft">Keep as draft</option>
                )}
                <option value="issued">Issued · include in financial records</option>
              </select>
            </Field>
          )}
          <p className={styles.hint}>
            {selection.record?.status === "issued"
              ? "Payments stay separate. The linked sale updates together with this invoice."
              : "New invoices start as drafts. Review and explicitly issue a saved draft to include it in income and open balances."}
          </p>
        </>
      )}
      {selection.family === "payments" && (
        <>
          <Field label="Direction">
            <select
              value={direction}
              onChange={(event) => setDirection(event.target.value as Payment["direction"])}
            >
              <option value="in">Money in</option>
              <option value="out">Money out</option>
              <option value="internal_transfer">Transfer between owned accounts</option>
            </select>
          </Field>
          <div className={styles.twoColumns}>
            <Field label="Payment date">
              <input
                name="date"
                type="date"
                required
                defaultValue={selection.record?.occurredOn ?? date}
              />
            </Field>
            <Field label="Payment amount (USD)">
              <input
                name="amount"
                inputMode="decimal"
                required
                defaultValue={dollars(selection.record?.amountMinor ?? 0)}
              />
            </Field>
          </div>
          <Field label="Payment reference">
            <input
              name="reference"
              required
              maxLength={120}
              defaultValue={selection.record?.reference}
            />
          </Field>
          {direction === "internal_transfer" ? (
            <div className={styles.twoColumns}>
              <Field label="From owned account">
                <select
                  name="from"
                  defaultValue={
                    selection.record?.fromAccount ?? workspace.business.ownedAccountReferences[0]
                  }
                >
                  {workspace.business.ownedAccountReferences.map((account) => (
                    <option key={account}>{account}</option>
                  ))}
                </select>
              </Field>
              <Field label="To owned account">
                <select
                  name="to"
                  defaultValue={
                    selection.record?.toAccount ?? workspace.business.ownedAccountReferences[1]
                  }
                >
                  {workspace.business.ownedAccountReferences.map((account) => (
                    <option key={account}>{account}</option>
                  ))}
                </select>
              </Field>
            </div>
          ) : (
            <>
              <Field label="Counterparty (optional if unmatched)">
                <select name="contact" defaultValue={selection.record?.counterpartyId ?? ""}>
                  <option value="">No counterparty yet</option>
                  {workspace.contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Match to a financial record (optional)">
                <select
                  name="allocation"
                  defaultValue={selection.record?.allocations[0]?.eventId ?? ""}
                >
                  <option value="">Unmatched movement</option>
                  {workspace.events
                    .filter(
                      (record) =>
                        record.status !== "duplicate" &&
                        record.kind === (direction === "in" ? "sale" : "cost"),
                    )
                    .map((record) => (
                      <option key={record.id} value={record.id}>
                        {record.reference || record.description} ·{" "}
                        {
                          workspace.contacts.find((contact) => contact.id === record.counterpartyId)
                            ?.name
                        }
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Amount to match (USD)">
                <input
                  name="allocated"
                  inputMode="decimal"
                  defaultValue={dollars(selection.record?.allocations[0]?.amountMinor ?? 0)}
                />
              </Field>
            </>
          )}
          <p className={styles.hint}>
            A recorded movement changes cash, not income or costs. Matching changes the remaining
            balance; owned transfers are excluded from operating cash.
          </p>
          {(selection.record?.allocations.length ?? 0) > 1 && (
            <p className={styles.warning}>
              This payment currently has multiple matches. Saving this simple form replaces them
              with the one match shown.
            </p>
          )}
        </>
      )}
      {selection.record && "origin" in selection.record && (
        <p className={styles.hint}>
          {selection.record.origin === "document"
            ? "Original PDF references stay attached. Your edit changes the current session record, never the original document."
            : "Created in this session."}
        </p>
      )}
      {error && (
        <p role="alert" className={styles.warning}>
          {error}
        </p>
      )}
      <Button type="submit">
        {selection.family === "invoices" &&
        invoiceStatus === "issued" &&
        selection.record?.status === "draft"
          ? "Issue invoice"
          : editing
            ? "Save changes"
            : selection.family === "invoices"
              ? "Save draft invoice"
              : "Create record"}
      </Button>
    </form>
  );
}
