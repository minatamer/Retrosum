import Link from "next/link";
import { formatAmount } from "@retrosum/money";
import { RuntimeStatus } from "../../features/runtime/runtime-status";
export default function WorkspacePage() {
  return (
    <main id="main" className="foundation" tabIndex={-1}>
      <Link className="wordmark" href="/">
        Retro<span>sum.</span>
      </Link>
      <p className="eyebrow">Workspace foundation</p>
      <h1>
        Your money,
        <br />
        with a clear source.
      </h1>
      <p className="lead">
        Documents and records will appear here as the next tickets are delivered.
      </p>
      <p>Currency: USD · Exact cent formatting: {formatAmount(10)}</p>
      <RuntimeStatus />
      <Link className="primary-link" href="/">
        Back to home
      </Link>
    </main>
  );
}
