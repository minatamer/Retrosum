"use client";
import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { formatAmount, type DashboardFact, type FactMark } from "@retrosum/money";
import { factValue, percentage } from "./format";
import styles from "./dashboard.module.css";

export type ChartGroup = { label: string; marks: FactMark[] };
export function ChartPanel({
  title,
  subtitle,
  children,
  table,
  id,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  table: ReactNode;
  id?: string;
}) {
  return (
    <section className={styles.panel} id={id}>
      <div className={styles.panelHeading}>
        <h2>{title}</h2>
        <span aria-hidden="true">↗</span>
      </div>
      <p className={styles.caption}>{subtitle}</p>
      {children}
      <details className={styles.data}>
        <summary>View data table</summary>
        {table}
      </details>
    </section>
  );
}
export function DataTable({
  marks,
  facts,
  onSelect,
}: {
  marks: FactMark[];
  facts: Record<string, DashboardFact>;
  onSelect(id: string): void;
}) {
  return (
    <div className={styles.tableScroll} tabIndex={0} aria-label="Chart data">
      <table>
        <thead>
          <tr>
            <th scope="col">Record group</th>
            <th scope="col">Value</th>
            <th scope="col">Included</th>
          </tr>
        </thead>
        <tbody>
          {marks.map((mark) => (
            <tr key={mark.factId}>
              <th scope="row">
                <button type="button" onClick={() => onSelect(mark.factId)}>
                  {mark.label}
                </button>
              </th>
              <td>{factValue(facts[mark.factId]!)}</td>
              <td>{mark.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {marks.length === 0 && <p>No supplied values in this scope.</p>}
    </div>
  );
}
export function FactTooltip({
  fact,
  shareTenths,
}: {
  fact: DashboardFact | null;
  shareTenths?: number | null | undefined;
}) {
  return (
    <div className={styles.tooltip} role="status" aria-live="polite">
      {fact ? (
        <>
          <b>
            {fact.label} · {factValue(fact)}
            {shareTenths === undefined || shareTenths === null
              ? ""
              : ` · ${percentage(shareTenths)} of this whole`}
          </b>
          <span>
            {fact.scope.from} – {fact.scope.to} · USD · {fact.contributors.length} records
          </span>
          <span>
            {fact.dateBasis === "payment"
              ? "Movement dates"
              : fact.dateBasis === "as_of"
                ? `Known gross open as of ${fact.scope.asOf}`
                : "Net / stated document basis"}{" "}
            · Click or press Enter to view records
          </span>
        </>
      ) : (
        <>
          <b>Every figure has a paper trail.</b>
          <span>Hover or focus a mark for its exact value. Tap to inspect records.</span>
        </>
      )}
    </div>
  );
}
/** Small bounded series: semantic HTML hit targets over exact SVG bars; no chart library or money arithmetic. */
export function GroupedBars({
  groups,
  facts,
  colors,
  onSelect,
  signed = false,
}: {
  groups: ChartGroup[];
  facts: Record<string, DashboardFact>;
  colors: string[];
  onSelect(id: string): void;
  signed?: boolean;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [isolated, setIsolated] = useState<number | null>(null);
  const id = useId();
  const seriesNames = [
    ...new Set(groups.flatMap((group) => group.marks.map((mark) => mark.label))),
  ];
  const available = groups
    .flatMap((group) => group.marks)
    .filter((mark) => facts[mark.factId]!.value !== null);
  const max = Math.max(1, ...available.map((mark) => Math.abs(mark.value)));
  const negative = signed && available.some((mark) => mark.value < 0);
  const baseline = negative ? 135 : 240,
    height = negative ? 105 : 210;
  return (
    <>
      <div className={styles.legend} aria-label="Chart series">
        {seriesNames.map((name, index) => (
          <button
            type="button"
            key={name}
            aria-pressed={isolated === index}
            onClick={() => setIsolated(isolated === index ? null : index)}
          >
            <i style={{ background: colors[index % colors.length] }} aria-hidden="true" />
            {name}
          </button>
        ))}
      </div>
      {groups.length ? (
        <div className={styles.plot}>
          <div className={styles.axisLabels} aria-hidden="true">
            <span>{formatAmount(max)}</span>
            <span>{negative ? "$0.00" : formatAmount(Math.round(max / 2))}</span>
            <span>{negative ? formatAmount(-max) : "$0.00"}</span>
          </div>
          <div
            className={styles.barCanvas}
            style={groups.length > 3 ? { minWidth: `${groups.length * 90}px` } : undefined}
          >
            <svg viewBox="0 0 600 280" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse">
                  <path d="M0 0 12 12" stroke="currentColor" strokeOpacity=".15" strokeWidth="2" />
                </pattern>
              </defs>
              {[30, 135, 240].map((y) => (
                <line key={y} x1="0" x2="600" y1={y} y2={y} className={styles.gridLine} />
              ))}
              <line x1="0" x2="600" y1={baseline} y2={baseline} className={styles.zeroLine} />
              {groups.flatMap((group, groupIndex) =>
                group.marks.map((mark, index) => {
                  const width = 600 / groups.length;
                  const slot = Math.min(56, width / (group.marks.length + 2));
                  const x =
                    width * groupIndex +
                    width / 2 +
                    (index - (group.marks.length - 1) / 2) * (slot + 8) -
                    slot / 2;
                  const h = (Math.abs(mark.value) / max) * height;
                  const y = mark.value < 0 ? baseline : baseline - h;
                  return facts[mark.factId]!.value === null ? null : (
                    <g
                      key={mark.factId}
                      className={styles.barGroup}
                      style={{ opacity: isolated === null || isolated === index ? 1 : 0.2 }}
                    >
                      <rect
                        x={x}
                        y={y}
                        width={slot}
                        height={Math.max(h, mark.value === 0 ? 2 : 0)}
                        rx="5"
                        fill={colors[index % colors.length]}
                        className={styles.bar}
                        style={{ transformOrigin: `${x}px ${baseline}px` }}
                      />
                      <rect
                        x={x}
                        y={y}
                        width={slot}
                        height={Math.max(h, 2)}
                        rx="5"
                        fill={`url(#${id})`}
                      />
                    </g>
                  );
                }),
              )}
            </svg>
            <div className={styles.hitGroups}>
              {groups.map((group) => (
                <div className={styles.hitGroup} key={group.label}>
                  {group.marks.map((mark, index) => (
                    <button
                      className={styles.chartHit}
                      key={mark.factId}
                      type="button"
                      style={{ "--mark-color": colors[index % colors.length] } as CSSProperties}
                      aria-label={`${group.label}, ${mark.label}, ${factValue(facts[mark.factId]!)}, view records`}
                      onMouseEnter={() => setHovered(mark.factId)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(mark.factId)}
                      onBlur={() => setHovered(null)}
                      onClick={() => onSelect(mark.factId)}
                    >
                      <span>{mark.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className={styles.xLabels}>
              {groups.map((group) => (
                <span key={group.label}>{group.label}</span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.chartEmpty}>
          No dated observations supplied. Your first records will bring this chart to life.
        </div>
      )}
      <FactTooltip fact={hovered ? (facts[hovered] ?? null) : null} />
      <p className={styles.legendNote}>
        Legend selection highlights the chart only. Headline figures keep their full filter scope.
      </p>
    </>
  );
}
export function RankedBars({
  marks,
  facts,
  onSelect,
  colors,
}: {
  marks: FactMark[];
  facts: Record<string, DashboardFact>;
  onSelect(id: string): void;
  colors: string[];
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const max = Math.max(1, ...marks.map((mark) => Math.abs(mark.value)));
  return (
    <>
      <div className={styles.ranking}>
        {marks.map((mark, index) => (
          <button
            className={styles.rank}
            key={mark.factId}
            type="button"
            onClick={() => onSelect(mark.factId)}
            onMouseEnter={() => setHovered(mark.factId)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(mark.factId)}
            onBlur={() => setHovered(null)}
          >
            <span className={styles.rankText}>
              <b>{mark.label}</b>
              <strong>{factValue(facts[mark.factId]!)}</strong>
            </span>
            <span className={styles.track}>
              <i
                style={{
                  width: `${(Math.abs(mark.value) / max) * 100}%`,
                  background: colors[index % colors.length],
                }}
              />
            </span>
            <span className={styles.rankMeta}>
              {mark.count} {mark.count === 1 ? "record" : "records"}
              {mark.shareTenths === null ? "" : ` · ${percentage(mark.shareTenths)} of this whole`}
            </span>
          </button>
        ))}
        {marks.length === 0 && (
          <p className={styles.chartEmpty}>No included records in this scope.</p>
        )}
      </div>
      <FactTooltip
        fact={hovered ? (facts[hovered] ?? null) : null}
        shareTenths={marks.find((mark) => mark.factId === hovered)?.shareTenths}
      />
    </>
  );
}
