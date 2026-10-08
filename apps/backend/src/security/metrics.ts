export type OperationalMetric = {
  route: "extract" | "chat" | "insights" | "admission" | "session";
  mode: "fake" | "live" | "unavailable";
  status: number;
  durationMs: number;
};
export function emitMetric(
  sink: ((metric: OperationalMetric) => void) | undefined,
  value: OperationalMetric,
) {
  // Explicit projection prevents request bodies, arbitrary keys and error objects entering logs.
  const metric: OperationalMetric = {
    route: value.route,
    mode: value.mode,
    status: value.status,
    durationMs: Math.min(120000, Math.max(0, Math.round(value.durationMs))),
  };
  if (
    !["extract", "chat", "insights", "admission", "session"].includes(metric.route) ||
    !["fake", "live", "unavailable"].includes(metric.mode) ||
    !Number.isInteger(metric.status) ||
    metric.status < 100 ||
    metric.status > 599 ||
    !Number.isFinite(metric.durationMs)
  )
    return;
  try {
    sink?.(metric);
  } catch {
    /* Diagnostics cannot break a request or emit raw sink errors. */
  }
}
