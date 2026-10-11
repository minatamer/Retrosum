"use client";
import { userFacingError } from "../../components/ui/user-facing-error";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { Payment, SessionAction, Workspace } from "@retrosum/contracts";
import {
  buildRecordAction,
  nextInvoiceNumber,
  type RecordFormValues,
  type RecordSelection,
} from "@retrosum/money";
export type { RecordSelection } from "@retrosum/money";
import { Button } from "../../components/ui/button";
import styles from "./records.module.css";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="rs-form-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
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
  animation,
  onPreview,
  submitLabel,
  submitDisabled,
}: {
  selection: RecordSelection;
  workspace: Workspace;
  onSave: (action: SessionAction, label: string) => void;
  animation?: {
    values: RecordFormValues;
    identity: string;
    trackEffect(effect: AbortController): () => void;
    onComplete(): void;
  };
  onPreview?: (action: SessionAction | null, label: string) => void;
  submitLabel?: string;
  submitDisabled?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [lineKeys, setLineKeys] = useState(() =>
    Array.from(
      { length: selection.family === "invoices" ? (selection.record?.lines.length ?? 1) : 1 },
      (_, index) => `line${index}`,
    ),
  );
  const [nextLine, setNextLine] = useState(lineKeys.length);
  const [direction, setDirection] = useState<Payment["direction"]>(
    selection.family === "payments" ? (selection.record?.direction ?? "in") : "in",
  );
  const [invoiceStatus, setInvoiceStatus] = useState<"draft" | "issued">(
    selection.family === "invoices" ? (selection.record?.status ?? "draft") : "draft",
  );
  const form = useRef<HTMLFormElement>(null),
    dirty = useRef(new Set<string>());
  const notifyLatest = useRef<(element: HTMLFormElement) => void>(() => undefined);
  const editing = Boolean(selection.record),
    date = workspace.asOf;
  const convert = (element: HTMLFormElement) => {
    const data: RecordFormValues = Object.fromEntries(
      [...new FormData(element)].map(([key, value]) => [key, String(value)]),
    );
    data.lineKeys = lineKeys.join(",");
    data.direction = data.direction ?? direction;
    data.status = data.status ?? invoiceStatus;
    if (selection.family === "payments")
      data.contact =
        workspace.events.find((record) => record.id === data.allocation)?.counterpartyId ??
        data.contact ??
        "";
    if (animation && selection.family === "payments")
      data.preserveAllocations = !dirty.current.has("allocation")
        ? (animation.values.preserveAllocations ?? "no")
        : "no";
    const action = buildRecordAction(selection, data, animation?.identity ?? crypto.randomUUID());
    const label =
      selection.family === "invoices" &&
      invoiceStatus === "issued" &&
      selection.record?.status === "draft"
        ? `Issue invoice ${"record" in action && "number" in action.record ? action.record.number : ""}`
        : `${editing ? "Update" : selection.family === "invoices" ? "Create draft" : "Create"} ${selection.family === "costs" ? "cost" : selection.family.slice(0, -1)}`;
    return { action, label };
  };
  const notify = (element: HTMLFormElement) => {
    try {
      const result = convert(element);
      onPreview?.(result.action, result.label);
    } catch {
      onPreview?.(null, "");
    }
  };
  useLayoutEffect(() => {
    notifyLatest.current = notify;
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      const result = convert(event.currentTarget);
      onSave(result.action, result.label);
    } catch (cause) {
      setError(
        userFacingError(cause, "Check the required fields, dates, email and exact USD amounts."),
      );
    }
  };
  useEffect(() => {
    if (!animation) return;
    const root = form.current;
    if (!root) return;
    const effect = new AbortController(),
      untrack = animation.trackEffect(effect);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    // Resolve each control when its turn arrives: direction can mount transfer fields.
    const fields = Object.entries(animation.values);
    let index = 0;
    const next = () => {
      if (stopped || effect.signal.aborted) return;
      const field = fields[index++];
      if (!field) {
        notifyLatest.current(root);
        animation.onComplete();
        return;
      }
      const [name, value] = field;
      const node = root.elements.namedItem(name);
      if (!(
        node instanceof HTMLInputElement ||
        node instanceof HTMLSelectElement ||
        node instanceof HTMLTextAreaElement
      )) {
        next();
        return;
      }
      if (dirty.current.has(name)) {
        next();
        return;
      }
      root
        .querySelectorAll("[data-retro-filling]")
        .forEach((element) => element.removeAttribute("data-retro-filling"));
      node.setAttribute("data-retro-filling", "true");
      const write = (written: string) => {
        if (dirty.current.has(name) || stopped || effect.signal.aborted) return false;
        if (name === "direction") setDirection(written as Payment["direction"]);
        else if (name === "status") setInvoiceStatus(written as "draft" | "issued");
        node.value = written;
        return true;
      };
      const typed =
        (node instanceof HTMLTextAreaElement ||
          (node instanceof HTMLInputElement && node.type === "text")) &&
        value.length > 0;
      let length = 0;
      const step = () => {
        length = Math.min(value.length, length + Math.max(1, Math.ceil(value.length / 12)));
        if (!write(typed ? value.slice(0, length) : value)) {
          node.removeAttribute("data-retro-filling");
          next();
          return;
        }
        if (typed && length < value.length) timer = setTimeout(step, 25);
        else {
          node.removeAttribute("data-retro-filling");
          timer = setTimeout(next, 110);
        }
      };
      timer = setTimeout(step, 120);
    };
    const cancel = () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      root
        .querySelectorAll("[data-retro-filling]")
        .forEach((element) => element.removeAttribute("data-retro-filling"));
    };
    effect.signal.addEventListener("abort", cancel, { once: true });
    timer = setTimeout(next, 160);
    return () => {
      effect.abort();
      cancel();
      untrack();
      effect.signal.removeEventListener("abort", cancel);
    };
  }, [animation]);
  return (
    <form
      ref={form}
      onSubmit={submit}
      className={styles.form}
      onChange={(event) => {
        const node = event.target;
        if (
          node instanceof HTMLInputElement ||
          node instanceof HTMLSelectElement ||
          node instanceof HTMLTextAreaElement
        ) {
          dirty.current.add(node.name);
          node.removeAttribute("data-retro-filling");
        }
        notify(event.currentTarget);
      }}
    >
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
              defaultValue={selection.record?.number ?? nextInvoiceNumber(workspace)}
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
              disabled={lineKeys.length >= 25}
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
                name="status"
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
              name="direction"
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
      <Button type="submit" disabled={submitDisabled}>
        {submitLabel ??
          (selection.family === "invoices" &&
          invoiceStatus === "issued" &&
          selection.record?.status === "draft"
            ? "Issue invoice"
            : editing
              ? "Save changes"
              : selection.family === "invoices"
                ? "Save draft invoice"
                : "Create record")}
      </Button>
    </form>
  );
}
