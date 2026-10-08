import { formatAmount, type DashboardFact } from "@retrosum/money";

export function percentage(tenths: number) {
  return `${(tenths / 10).toFixed(1)}%`;
}
export function factValue(fact: DashboardFact) {
  return fact.value === null
    ? "Unavailable"
    : fact.unit === "money"
      ? formatAmount(fact.value)
      : fact.unit === "percent"
        ? percentage(fact.value)
        : String(fact.value);
}
export function shortDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
export function periodLabel(from: string, to: string) {
  return from.slice(0, 7) === to.slice(0, 7)
    ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
        new Date(`${from}T00:00:00Z`),
      )
    : `${shortDate(from)} – ${shortDate(to)}`;
}
export function colorFor(label: string) {
  if (label === "Rent") return "var(--rs-cost)";
  if (label === "Materials") return "var(--rs-comparison)";
  if (label === "Software") return "var(--rs-cash)";
  const palette = [
    "var(--rs-cost)",
    "var(--rs-cash)",
    "var(--rs-comparison)",
    "var(--rs-income)",
    "var(--rs-review)",
  ];
  let hash = 0;
  for (const character of label) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length]!;
}
