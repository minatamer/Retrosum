import Link from "next/link";
import { RuntimeStatus } from "../features/runtime/runtime-status";
export default function HomePage() {
  return (
    <main id="main" className="foundation" tabIndex={-1}>
      <div className="wordmark" aria-label="Retrosum">
        Retro<span>sum.</span>
      </div>
      <p className="eyebrow">Your financial story, clearer.</p>
      <h1>
        Make sense of
        <br />
        your business money.
      </h1>
      <p className="lead">
        A temporary workspace for your documents, a clearer picture of your finances, and Retro to
        help you along the way.
      </p>
      <Link className="primary-link" href="/workspace">
        Open workspace <span aria-hidden="true">↗</span>
      </Link>
      <RuntimeStatus />
      <p className="foundation-note">
        Workspace foundation · The product experience is being built.
      </p>
    </main>
  );
}
