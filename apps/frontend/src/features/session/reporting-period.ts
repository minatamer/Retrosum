import type { MoneySession, SessionFilter } from "@retrosum/contracts";
import sampleManifest from "../documents/sample-manifest.json";

export type DateRange = Pick<SessionFilter, "from" | "to">;

export function monthDateRange(month: string): DateRange {
  return {
    from: `${month}-01`,
    to: new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0))
      .toISOString()
      .slice(0, 10),
  };
}

export function defaultDateRange(
  session: Pick<MoneySession, "workspace" | "experience">,
): DateRange {
  const isSample =
    (session.experience.entry === "sample" && session.experience.stage !== "choose") ||
    session.workspace.documents.some((doc) => doc.provenance === "synthetic");
  const month = isSample
    ? sampleManifest.period
    : new Date(session.workspace.createdAt).toISOString().slice(0, 7);
  return monthDateRange(month);
}
