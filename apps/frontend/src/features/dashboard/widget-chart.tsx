"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { ChartStyle, DashboardPreferences } from "@retrosum/contracts";
import {
  formatDisplayAmount,
  convertDisplayAmount,
  ratioTenths,
  type ChartPoint,
  type DashboardFact,
} from "@retrosum/money";
import styles from "./configurable-dashboard.module.css";

export function StyleFigure({ style }: { style: ChartStyle }) {
  return (
    <svg viewBox="0 0 100 54" fill="none" aria-hidden="true">
      {style === "pie" ? (
        <>
          <circle cx="50" cy="27" r="19" stroke="currentColor" strokeWidth="10" opacity=".25" />
          <circle
            cx="50"
            cy="27"
            r="19"
            stroke="currentColor"
            strokeWidth="10"
            strokeDasharray="65 120"
            transform="rotate(-90 50 27)"
          />
        </>
      ) : style === "bar" ? (
        <>
          <path d="M18 48V28 M39 48V14 M60 48V22 M81 48V6" stroke="currentColor" strokeWidth="11" />
        </>
      ) : (
        <>
          <path
            d={
              style === "curve"
                ? "M5 42C20 42 15 22 30 22S45 35 55 30 75 8 95 10"
                : "M5 42L30 22L55 30L95 10"
            }
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M5 50h90" stroke="currentColor" opacity=".2" />
        </>
      )}
    </svg>
  );
}
export function WidgetChart({
  points,
  style,
  preferences,
  onSelect,
  pieUnavailable,
  total,
}: {
  points: ChartPoint[];
  style: ChartStyle;
  preferences: DashboardPreferences;
  onSelect(fact: DashboardFact): void;
  pieUnavailable: boolean;
  total: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const [plotHeight, setPlotHeight] = useState(256);
  const gradient = useId().replaceAll(":", "");
  const slices = points
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => point.fact.value !== null && point.fact.value > 0);
  const selected = active === null ? undefined : points[active];
  const selectedSlice = slices.find(({ index }) => index === active)?.point;
  const share = (value: number) => `${((ratioTenths(value, total) ?? 0) / 10).toFixed(1)}%`;
  const records = (fact: DashboardFact) =>
    `${fact.contributors.length} ${fact.contributors.length === 1 ? "record" : "records"}`;
  const values = points
    .flatMap((p) => [p.fact.value, p.comparison?.value])
    .filter((v): v is number => typeof v === "number");
  const outsideDisplayLimit =
    preferences.currency === "EUR" &&
    [total, ...values].some((v) => formatDisplayAmount(v, preferences) === "Outside display limit");
  const visiblePlot =
    style !== "pie" && !pieUnavailable && values.length > 0 && !outsideDisplayLimit;
  useEffect(() => {
    const node = canvas.current;
    if (!node || !visiblePlot) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry || entry.contentRect.width <= 0 || entry.contentRect.height <= 0) return;
      const height = (entry.contentRect.height / entry.contentRect.width) * 640;
      setPlotHeight((current) => (Math.abs(current - height) < 0.5 ? current : height));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [visiblePlot]);
  if (!values.length)
    return (
      <div className={styles.emptyChart}>
        No eligible figures in this scope. Select another period or review your documents.
      </div>
    );
  if (pieUnavailable)
    return (
      <div className={styles.emptyChart}>
        This view contains negative values. Choose Line, Curve or Bar to show them accurately.
      </div>
    );
  if (style === "pie" && !slices.length)
    return (
      <div className={styles.emptyChart}>
        No positive eligible figures in this scope. Select another period or review your documents.
      </div>
    );
  const max = Math.max(1, ...values, 0),
    min = Math.min(0, ...values);
  const axisHeight = plotHeight - 80;
  const plotBottom = plotHeight - 52;
  const y = (v: number) => plotBottom - ((v - min) / (max - min)) * axisHeight;
  const x = (i: number) => (points.length === 1 ? 320 : 48 + (i / (points.length - 1)) * 546);
  const inspectPlot = (
    event: React.PointerEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>,
  ) => {
    if ("pointerType" in event && event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const localX = ((event.clientX - bounds.left) / bounds.width) * 640;
    const localY = ((event.clientY - bounds.top) / bounds.height) * plotHeight;
    if (localX < 28 || localX > 614 || localY < 12 || localY > plotBottom + 14) {
      return;
    }
    setActive(
      Math.max(
        0,
        Math.min(points.length - 1, Math.round(((localX - 48) / 546) * (points.length - 1))),
      ),
    );
  };
  const path = (comparison = false) => {
    let previous: { x: number; y: number } | null = null;
    return points
      .map((point, index) => {
        const value = comparison ? point.comparison?.value : point.fact.value;
        if (value === null || value === undefined) {
          previous = null;
          return "";
        }
        const next = { x: x(index), y: y(value) };
        const command = previous
          ? style === "curve"
            ? `C${(previous.x + next.x) / 2},${previous.y} ${(previous.x + next.x) / 2},${next.y} ${next.x},${next.y}`
            : `L${next.x},${next.y}`
          : `M${next.x},${next.y}`;
        previous = next;
        return command;
      })
      .join(" ");
  };
  const key = (event: React.KeyboardEvent, fact: DashboardFact) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(fact);
    }
  };
  if (outsideDisplayLimit)
    return (
      <div className={styles.emptyChart}>
        Converted figures exceed the display limit. Switch to USD in Settings.
      </div>
    );
  return (
    <>
      <div
        className={style === "pie" ? styles.donutLayout : styles.plot}
        onPointerLeave={(event) => {
          if (!event.currentTarget.contains(document.activeElement)) setActive(null);
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setActive(null);
        }}
      >
        {style === "pie" ? (
          <svg viewBox="0 0 240 240" className={styles.donut} aria-label="Composition chart">
            <circle cx="120" cy="120" r="78" fill="none" stroke="#173d3010" strokeWidth="28" />
            {slices.map(({ point, index }) => {
              const length = (point.fact.value! / total) * 490.088;
              const offset =
                total > 0
                  ? points
                      .slice(0, index)
                      .reduce(
                        (sum, p) => sum + (Math.max(0, p.fact.value ?? 0) / total) * 490.088,
                        0,
                      )
                  : 0;
              return (
                <circle
                  key={point.label}
                  cx="120"
                  cy="120"
                  r="78"
                  fill="none"
                  stroke={palette[index % palette.length]}
                  strokeWidth={active === index ? 36 : 28}
                  strokeDasharray={`${length} ${490.088 - length}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 120 120)"
                  className={styles.donutSegment}
                  data-active={active === index}
                  data-muted={active !== null && active !== index}
                  role="button"
                  tabIndex={0}
                  aria-label={`${point.label}: ${formatDisplayAmount(point.fact.value!, preferences)}, ${share(point.fact.value!)}, ${records(point.fact)}, view source records`}
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(index)}
                  onClick={() => onSelect(point.fact)}
                  onKeyDown={(e) => key(e, point.fact)}
                />
              );
            })}
            <g className={styles.donutReadout} role="status" aria-live="polite" aria-atomic="true">
              <text x="120" y="103" textAnchor="middle" className={styles.donutCaption}>
                {selectedSlice
                  ? selectedSlice.label.length > 18
                    ? `${selectedSlice.label.slice(0, 16)}…`
                    : selectedSlice.label
                  : "DOCUMENTED TOTAL"}
              </text>
              <text x="120" y="132" textAnchor="middle" className={styles.donutTotal}>
                {formatDisplayAmount(selectedSlice?.fact.value ?? total, preferences)}
              </text>
              <text x="120" y="153" textAnchor="middle" className={styles.donutShare}>
                {selectedSlice
                  ? `${share(selectedSlice.fact.value!)} · ${records(selectedSlice.fact)}`
                  : "Hover a category"}
              </text>
            </g>
          </svg>
        ) : (
          <div className={styles.plotCanvas} ref={canvas}>
            <svg
              viewBox={`0 0 640 ${plotHeight}`}
              className={styles.trend}
              aria-label="Financial trend chart"
              onPointerMove={inspectPlot}
              onClick={(event) => {
                if (!(event.target as Element).closest('[role="button"]')) inspectPlot(event);
              }}
            >
              <defs>
                <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-fill, #8bbe98)" stopOpacity=".32" />
                  <stop offset="100%" stopColor="var(--chart-fill, #8bbe98)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <rect x="28" y="12" width="586" height={plotHeight - 50} fill="transparent" />
              {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
                <g key={fraction}>
                  <path
                    d={`M48 ${28 + fraction * axisHeight}H610`}
                    stroke="var(--chart-grid, #173d3010)"
                  />
                  <text x="2" y={32 + fraction * axisHeight} className={styles.axis}>
                    {new Intl.NumberFormat("en-US", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(
                      (preferences.currency === "EUR"
                        ? convertDisplayAmount(
                            Math.round(max - fraction * (max - min)),
                            preferences.eurRateMicros!,
                          )
                        : max - fraction * (max - min)) / 100,
                    )}
                  </text>
                </g>
              ))}
              {min < 0 && <path d={`M48 ${y(0)}H610`} stroke="var(--chart-zero, #173d3060)" />}
              {selected && active !== null && (
                <g className={styles.hoverGuide} aria-hidden="true">
                  <rect x={x(active) - 16} y="18" width="32" height={plotHeight - 66} rx="8" />
                  <line x1={x(active)} x2={x(active)} y1="18" y2={plotHeight - 44} />
                </g>
              )}
              {style !== "bar" && (
                <>
                  {points.length > 1 && !points.some((p) => p.fact.value === null) && (
                    <path
                      d={`${path()} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`}
                      fill={`url(#${gradient})`}
                    />
                  )}
                  <path
                    d={path()}
                    fill="none"
                    stroke="var(--chart-income, #235a45)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    pathLength="1"
                    className={styles.drawLine}
                  />
                  <path
                    d={path(true)}
                    fill="none"
                    stroke="var(--chart-cost, #bc7356)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="6 5"
                  />
                </>
              )}
              {points.map((point, index) => (
                <g key={point.label}>
                  {point.fact.value !== null && (
                    <g
                      role="button"
                      tabIndex={0}
                      aria-label={`${point.label}: ${formatDisplayAmount(point.fact.value, preferences)}, view source records`}
                      onPointerEnter={() => setActive(index)}
                      onFocus={() => setActive(index)}
                      onClick={() => onSelect(point.fact)}
                      onKeyDown={(e) => key(e, point.fact)}
                      className={styles.chartMark}
                      data-active={active === index}
                    >
                      {style === "bar" ? (
                        <rect
                          x={x(index) - Math.min(32, 220 / points.length)}
                          y={Math.min(y(point.fact.value), y(0))}
                          width={Math.min(58, 390 / points.length)}
                          height={Math.max(2, Math.abs(y(point.fact.value) - y(0)))}
                          rx="6"
                          fill="#83ae90"
                          className={styles.growBar}
                        />
                      ) : (
                        <>
                          <circle
                            cx={x(index)}
                            cy={y(point.fact.value)}
                            r="18"
                            fill="transparent"
                          />
                          {active === index && (
                            <circle
                              cx={x(index)}
                              cy={y(point.fact.value)}
                              r="14"
                              fill="var(--chart-income, #235a45)"
                              opacity=".2"
                            />
                          )}
                          <circle
                            cx={x(index)}
                            cy={y(point.fact.value)}
                            r={active === index ? 7 : 5}
                            fill="var(--chart-income, #235a45)"
                            stroke="var(--chart-edge, #fffdf7)"
                            strokeWidth="3"
                          />
                        </>
                      )}
                    </g>
                  )}
                  {style === "bar" &&
                    point.comparison?.value !== null &&
                    point.comparison?.value !== undefined && (
                      <rect
                        x={x(index) + 3}
                        y={Math.min(y(point.comparison.value), y(0))}
                        width={Math.min(26, 160 / points.length)}
                        height={Math.max(2, Math.abs(y(point.comparison.value) - y(0)))}
                        rx="4"
                        fill="#dcab86"
                        role="button"
                        tabIndex={0}
                        aria-label={`${point.label} comparison: ${formatDisplayAmount(point.comparison.value, preferences)}`}
                        className={styles.chartMark}
                        data-active={active === index}
                        data-series="comparison"
                        onPointerEnter={() => setActive(index)}
                        onFocus={() => setActive(index)}
                        onClick={() => onSelect(point.comparison!)}
                        onKeyDown={(e) => key(e, point.comparison!)}
                      />
                    )}
                  {style !== "bar" &&
                    point.comparison?.value !== null &&
                    point.comparison?.value !== undefined && (
                      <g
                        role="button"
                        tabIndex={0}
                        aria-label={`${point.label} ${point.comparison.label}: ${formatDisplayAmount(point.comparison.value, preferences)}, view source records`}
                        className={styles.chartMark}
                        data-active={active === index}
                        data-series="comparison"
                        onPointerEnter={() => setActive(index)}
                        onFocus={() => setActive(index)}
                        onClick={() => onSelect(point.comparison!)}
                        onKeyDown={(e) => key(e, point.comparison!)}
                      >
                        <circle
                          cx={x(index)}
                          cy={y(point.comparison.value)}
                          r="18"
                          fill="transparent"
                        />
                        {active === index && (
                          <circle
                            cx={x(index)}
                            cy={y(point.comparison.value)}
                            r="12"
                            fill="var(--chart-cost, #bc7356)"
                            opacity=".2"
                          />
                        )}
                        <circle
                          cx={x(index)}
                          cy={y(point.comparison.value)}
                          r={active === index ? 6 : 4}
                          fill="var(--chart-cost, #bc7356)"
                          stroke="var(--chart-edge, #fffdf7)"
                          strokeWidth="2"
                        />
                      </g>
                    )}
                  {(points.length <= 8 ||
                    index % Math.ceil(points.length / 6) === 0 ||
                    index === points.length - 1) && (
                    <text
                      x={x(index)}
                      y={plotHeight - 17}
                      textAnchor="middle"
                      className={styles.axis}
                    >
                      {point.label}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>
        )}
        {style === "pie" && (
          <div className={styles.legend}>
            {slices.map(({ point: p, index: i }) => (
              <button
                key={p.label}
                type="button"
                onClick={() => onSelect(p.fact)}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                data-active={active === i}
              >
                <i style={{ background: palette[i % palette.length] }} />
                <span>{p.label}</span>
                <strong>{formatDisplayAmount(p.fact.value!, preferences)}</strong>
                <small>
                  {share(p.fact.value!)} · {records(p.fact)}
                </small>
              </button>
            ))}
          </div>
        )}
        {active !== null && selected && style !== "pie" && (
          <div
            className={styles.chartTooltip}
            data-side={x(active) > 320 ? "left" : "right"}
            role="status"
          >
            <b>{selected.label}</b>
            {[selected.fact, ...(selected.comparison ? [selected.comparison] : [])].map((fact) => (
              <div className={styles.tooltipRow} key={fact.id}>
                <span>{fact.label}</span>
                <button
                  type="button"
                  disabled={fact.value === null}
                  aria-label={`View ${selected.label} ${fact.label} source records`}
                  onClick={() => onSelect(fact)}
                >
                  <strong>
                    {fact.value === null
                      ? "Unavailable"
                      : formatDisplayAmount(fact.value, preferences)}
                  </strong>
                  <span aria-hidden="true">↗</span>
                </button>
                <small>{records(fact)}</small>
              </div>
            ))}
            <small>Open an amount for original documents.</small>
          </div>
        )}
      </div>
      <details className={styles.dataTable}>
        <summary>View data & sources</summary>
        <div>
          <table>
            <thead>
              <tr>
                <th>Group</th>
                <th>{preferences.currency} amount</th>
                <th>Records</th>
              </tr>
            </thead>
            <tbody>
              {(style === "pie" ? slices.map(({ point }) => point) : points)
                .flatMap((point) =>
                  [point.fact, ...(point.comparison ? [point.comparison] : [])].map((fact) => ({
                    label: point.label,
                    fact,
                  })),
                )
                .map((p) => (
                  <tr key={`${p.label}-${p.fact.id}`}>
                    <th>
                      <button type="button" onClick={() => onSelect(p.fact)}>
                        {p.label} · {p.fact.label} ↗
                      </button>
                    </th>
                    <td>
                      {p.fact.value === null
                        ? "Unavailable"
                        : formatDisplayAmount(p.fact.value, preferences)}
                    </td>
                    <td>{p.fact.contributors.length}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
const palette = ["#173d30", "#dcab86", "#89aa8d", "#b06b50", "#a9b9a6", "#7b927e"];
