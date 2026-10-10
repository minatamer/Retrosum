"use client";
import { useState } from "react";
import {
  chartMetricSchema,
  chartSpecSchema,
  chartGroupingSchema,
  type ChartSpec,
  type ChartStyle,
  type DashboardRequest,
  type DashboardWidget,
  type RetroResponse,
} from "@retrosum/contracts";
import { buildCustomChart, isRetroCurrent, isRetroUiCurrent } from "@retrosum/money";
import { useSession } from "../session/session-provider";
import { StyleFigure } from "../dashboard/widget-chart";
import styles from "./dashboard-request.module.css";
import { ReplyText } from "./reply-text";

export function DashboardRequestPreview({
  decision,
  response,
  proposalId,
}: {
  decision: DashboardRequest;
  response: RetroResponse;
  proposalId: string;
}) {
  const { controller, session } = useSession();
  const [style, setStyle] = useState<ChartStyle>(decision.style ?? "curve");
  const [title, setTitle] = useState(decision.title);
  const [target, setTarget] = useState("");
  const [position, setPosition] = useState<"first" | "last">(decision.position ?? "first");
  const [chartMetric, setChartMetric] = useState(
    chartMetricSchema.safeParse(decision.metric).data ?? "income",
  );
  const [groupBy, setGroupBy] = useState<ChartSpec["groupBy"]>(decision.groupBy);
  const [range, setRange] = useState<ChartSpec["range"]>(
    decision.groupBy === "quarter" ? "history" : "scope",
  );
  const [notice, setNotice] = useState<string | null>(null);
  if (!session) return null;
  const applied = session.dashboard.appliedProposalIds.includes(proposalId);
  const metric = chartMetricSchema.safeParse(decision.metric);
  const kpi = decision.action === "kpi" || !metric.success;
  const changing =
    decision.action === "remove" || decision.action === "restyle" || decision.action === "move";
  const candidates = session.dashboard.widgets.filter(
    (w) =>
      (decision.action !== "restyle" || w.kind === "chart") &&
      (!decision.target ||
        (w.kind === "chart"
          ? w.spec.title
          : w.kind === "kpi"
            ? w.metric.replaceAll("_", " ")
            : "income target"
        )
          .toLowerCase()
          .includes(decision.target.toLowerCase())),
  );
  const apply = () => {
    try {
      const current = controller.getSnapshot().session;
      if (!current || !isRetroCurrent(response, current.workspace, current.filters))
        throw new RangeError("Your figures or filters changed. Ask again for a current view.");
      if (!isRetroUiCurrent(response, current.dashboard))
        throw new RangeError("Your dashboard changed. Ask again for a current proposal.");
      let widgets = current.dashboard.widgets;
      if (current.dashboard.appliedProposalIds.includes(proposalId))
        throw new RangeError("This proposal was already applied.");
      if (changing) {
        const chosen =
          candidates.find((w) => w.id === target) ??
          (candidates.length === 1 ? candidates[0] : undefined);
        if (!chosen) throw new RangeError("Choose the dashboard item you want to change.");
        if (
          decision.action === "restyle" &&
          chosen.kind === "chart" &&
          buildCustomChart(current.workspace, current.filters, { ...chosen.spec, style })
            .pieUnavailable
        )
          throw new RangeError("Negative values need Line, Curve or Bar.");
        if (
          decision.action === "restyle" &&
          chosen.kind === "chart" &&
          style === "pie" &&
          chosen.spec.comparison
        )
          throw new RangeError("This chart compares two metrics. Choose Line, Curve or Bar.");
        widgets =
          decision.action === "move"
            ? position === "first"
              ? [chosen, ...widgets.filter((w) => w.id !== chosen.id)]
              : [...widgets.filter((w) => w.id !== chosen.id), chosen]
            : decision.action === "remove"
              ? widgets.filter((w) => w.id !== chosen.id)
              : widgets.map((w) =>
                  w.id === chosen.id && w.kind === "chart"
                    ? { ...w, spec: { ...w.spec, style } }
                    : w,
                );
      } else {
        const id = `widget_${crypto.randomUUID()}`;
        const widget: DashboardWidget = kpi
          ? { id, kind: "kpi", metric: decision.metric }
          : {
              id,
              kind: "chart",
              spec: chartSpecSchema.parse({
                title,
                metric: chartMetric,
                style,
                groupBy,
                range,
                comparison: null,
              }),
            };
        if (
          widget.kind === "chart" &&
          buildCustomChart(current.workspace, current.filters, widget.spec).pieUnavailable
        )
          throw new RangeError("Negative values need a Line, Curve or Bar view.");
        widgets = [...widgets, widget];
      }
      controller.setDashboard({
        ...current.dashboard,
        widgets,
        appliedProposalIds: [...current.dashboard.appliedProposalIds, proposalId].slice(-40),
      });
      setNotice(
        decision.action === "remove"
          ? "Dashboard item removed. Undo layout restores it."
          : changing
            ? "Dashboard updated. Undo layout restores the previous layout."
            : "Added to your dashboard. Undo layout removes this addition.",
      );
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Check your dashboard choice.");
    }
  };
  return (
    <div className={styles.proposal}>
      {!applied && (
        <>
          {!changing && !kpi && (
            <details className={styles.details}>
              <summary>Chart details & scope</summary>
              <label>
                Chart title
                <input maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label>
                Metric
                <select
                  value={chartMetric}
                  onChange={(e) => setChartMetric(chartMetricSchema.parse(e.target.value))}
                >
                  {chartMetricSchema.options.map((m) => (
                    <option value={m} key={m}>
                      {m.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Group by
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(chartGroupingSchema.parse(e.target.value))}
                >
                  {chartGroupingSchema.options.map((g) => (
                    <option value={g} key={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Period
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value as ChartSpec["range"])}
                >
                  <option value="scope">Current filters</option>
                  <option value="history">All supplied history</option>
                </select>
              </label>
            </details>
          )}
          {changing && (
            <label>
              Which dashboard item?
              <select
                value={target || (candidates.length === 1 ? candidates[0]!.id : "")}
                onChange={(e) => setTarget(e.target.value)}
              >
                <option value="">Choose an item</option>
                {candidates.map((w) => (
                  <option value={w.id} key={w.id}>
                    {w.kind === "chart"
                      ? w.spec.title
                      : w.kind === "kpi"
                        ? w.metric.replaceAll("_", " ")
                        : "Income target"}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!kpi && decision.action !== "remove" && decision.action !== "move" && (
            <div className={styles.choices} role="group" aria-label="Choose a chart style">
              {(["line", "curve", "bar", "pie"] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  aria-pressed={style === s}
                  onClick={() => setStyle(s)}
                >
                  <StyleFigure style={s} />
                  <span>
                    {s === "curve"
                      ? "Curve"
                      : s === "pie"
                        ? "Pie / donut"
                        : s === "bar"
                          ? "Bar"
                          : "Line"}
                  </span>
                </button>
              ))}
            </div>
          )}
          {decision.action === "move" && (
            <label>
              Position
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as "first" | "last")}
              >
                <option value="first">First on dashboard</option>
                <option value="last">Last on dashboard</option>
              </select>
            </label>
          )}
          <p>
            <ReplyText
              text={
                changing
                  ? "Choose an item, then confirm the change."
                  : kpi
                    ? `Add a ${decision.metric.replaceAll("_", " ")} KPI with its source trail.`
                    : `${range === "history" ? "All supplied history" : "Current filters"} · ${groupBy} groups · source-linked figures.`
              }
            />
          </p>
          <button className={styles.apply} type="button" onClick={apply}>
            {decision.action === "remove"
              ? "Remove item"
              : changing
                ? "Update dashboard"
                : "Add to dashboard"}{" "}
            →
          </button>
        </>
      )}
      {notice && (
        <p role="status">
          <ReplyText text={notice} />
        </p>
      )}
      {applied && !notice && (
        <p>
          <ReplyText text="This proposal is on your dashboard." />
        </p>
      )}
      {applied &&
        session.dashboardUndo &&
        !session.dashboardUndo.appliedProposalIds.includes(proposalId) && (
          <button
            type="button"
            onClick={() => {
              controller.undoDashboard();
              setNotice("Dashboard change undone.");
            }}
          >
            Undo layout ↶
          </button>
        )}
    </div>
  );
}
