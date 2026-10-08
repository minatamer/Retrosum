"use client";
import { useState } from "react";
import Link from "next/link";
import { formatAmount } from "@retrosum/money";
import { PaperDialog } from "../../components/ui/paper-dialog";
import { ComposerShell } from "../../components/ui/composer-shell";
import styles from "./landing.module.css";

const previewMetrics = [
  {
    id: "income",
    label: "Income",
    amount: 480000,
    detail:
      "Two September sales: Cedar Works, $3,000, and Maple Retail, $1,800. Income records work billed; it is different from cash received.",
    delta: "+20% vs August",
    color: "var(--rs-income)",
  },
  {
    id: "costs",
    label: "Costs",
    amount: 128000,
    detail:
      "September costs: Northstar Supplies, $360; Cove Spaces rent, $800; PaperCloud software, $120. The sample separates the supplier bill's $36 tax from its $360 operating cost.",
    delta: "+16.4% vs August",
    color: "var(--rs-cost)",
  },
  {
    id: "profit",
    label: "Operating profit",
    amount: 352000,
    detail:
      "The intended September view shows $4,800 income less $1,280 operating costs. Profit tells a different story from cash movement. Actual records and their PDF sources connect in the workspace.",
    delta: "+21.4% vs August",
    color: "var(--rs-cash)",
  },
] as const;
export function DashboardPreview() {
  const [active, setActive] = useState<(typeof previewMetrics)[number] | null>(null);
  return (
    <div className={styles.dashboardPreview}>
      <div className={styles.previewHeader}>
        <div>
          <span className="rs-eyebrow">Harbor Studio</span>
          <h3>A good month, in perspective.</h3>
        </div>
        <span className={styles.previewPeriod}>Sep 2026</span>
      </div>
      <div className={styles.previewMetrics}>
        {previewMetrics.map((metric) => (
          <button
            key={metric.id}
            type="button"
            onClick={() => setActive(metric)}
            className={styles.previewMetric}
            style={{ borderTopColor: metric.color }}
            aria-label={`Explain ${metric.label}: ${formatAmount(metric.amount)}`}
          >
            <span>{metric.label}</span>
            <strong className="rs-numeral">{formatAmount(metric.amount)}</strong>
            <small>{metric.delta}</small>
            <span className={styles.metricHint}>
              See what’s behind it <span aria-hidden="true">↗</span>
            </span>
          </button>
        ))}
      </div>
      <div className={styles.chartArea}>
        <div>
          <span className="rs-eyebrow">Income & operating costs</span>
          <p>Room to grow.</p>
          <div className={styles.chartLegend}>
            <span>
              <i style={{ background: "var(--rs-income)" }} />
              Income
            </span>
            <span>
              <i style={{ background: "var(--rs-cost)" }} />
              Costs
            </span>
          </div>
        </div>
        <svg
          className={styles.previewChart}
          viewBox="0 0 500 190"
          role="img"
          aria-label="Illustrative August income 4,000 dollars and costs 1,100 dollars; September income 4,800 dollars and costs 1,280 dollars."
        >
          <g stroke="rgba(237,244,231,.12)">
            <path d="M20 20H480M20 65H480M20 110H480M20 155H480" />
          </g>
          <g className={styles.chartBars}>
            <rect x="100" y="35" width="48" height="120" rx="6" fill="var(--rs-income)" />
            <rect x="156" y="122" width="48" height="33" rx="6" fill="var(--rs-cost)" />
            <rect x="310" y="11" width="48" height="144" rx="6" fill="var(--rs-income)" />
            <rect x="366" y="116.6" width="48" height="38.4" rx="6" fill="var(--rs-cost)" />
          </g>
          <g fill="var(--rs-muted)" fontSize="12" textAnchor="middle">
            <text x="150" y="181">
              August
            </text>
            <text x="360" y="181">
              September
            </text>
          </g>
        </svg>
      </div>
      <p className={styles.previewCaption}>
        Illustrative preview · Fictional Harbor Studio figures · Click a number to explore its
        meaning.
      </p>
      <PaperDialog
        open={active !== null}
        onClose={() => setActive(null)}
        title={active?.label ?? "Financial detail"}
        caption="Illustrative sample detail"
      >
        <p className={styles.detailAmount}>{active && formatAmount(active.amount)}</p>
        <p>{active?.detail}</p>
        <p>
          Every accepted workspace record will link back to its original PDF. This landing preview
          is not a live document extraction.
        </p>
        <Link className="rs-button" href="/workspace?entry=sample#documents">
          Explore the sample business <span aria-hidden="true">↗</span>
        </Link>
      </PaperDialog>
    </div>
  );
}
const retroExamples = [
  {
    id: "summary",
    prompt: "Summarize this month",
    text: "A clear summary, with the numbers that matter and the documents behind them. Retro helps you connect income, costs, profit and cash.",
    label: "Summarize",
  },
  {
    id: "tour",
    prompt: "Show me around",
    text: "Follow a guided tour of your dashboard. Retro will scroll to the right section, highlight a figure, and explain what it means.",
    label: "Give me a tour",
  },
  {
    id: "invoice",
    prompt: "Create a $2,000 invoice, due November 30",
    text: "See an editable draft fill in front of you. Review the customer, amount and due date, then confirm. Your most recent change has an Undo button.",
    label: "Prepare an invoice",
  },
  {
    id: "expense",
    prompt: "Help me add an expense",
    text: "Create, update or remove a session record through a clear form. Retro prepares the details; you stay in control of the final change.",
    label: "Add an expense",
  },
] as const;
export function RetroPreview() {
  const [selected, setSelected] = useState<(typeof retroExamples)[number]>(retroExamples[0]);
  return (
    <div className={styles.retroPreview}>
      <span className={styles.previewTag}>Interaction preview</span>
      <ComposerShell
        value=""
        disabled
        footnote="A preview of Retro’s intended capabilities. Full conversation connects in the workspace."
        shortcuts={retroExamples.map((example) => (
          <button
            type="button"
            key={example.id}
            aria-pressed={selected.id === example.id}
            onClick={() => setSelected(example)}
          >
            {example.label}
          </button>
        ))}
      >
        <div className="rs-chat-user" key={selected.id + "-user"}>
          {selected.prompt}
        </div>
        <div className="rs-chat-retro" key={selected.id}>
          <span className="rs-eyebrow">Retro</span>
          {selected.text}
        </div>
      </ComposerShell>
    </div>
  );
}
