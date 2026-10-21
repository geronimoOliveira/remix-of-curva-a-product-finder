// Pareto: items accumulating up to 80% of units sold are Curva A.
// Without sold data, falls back to top 20% by ranking position (estimate).
export function classifyCurvaA<T extends { sold: number | null }>(items: T[]) {
  const hasSold = items.length > 0 && items.every((i) => i.sold !== null);
  if (!hasSold) {
    const n = Math.max(1, Math.ceil(items.length * 0.2));
    return { method: "estimate" as const, rows: items.map((it, i) => ({ ...it, share: null as number | null, curvaA: i < n })) };
  }
  const sorted = [...items].sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0));
  const total = sorted.reduce((s, i) => s + (i.sold ?? 0), 0) || 1;
  let acc = 0;
  const rows = sorted.map((it) => {
    const share = (it.sold ?? 0) / total;
    const curvaA = acc < 0.8;
    acc += share;
    return { ...it, share, curvaA };
  });
  return { method: "pareto" as const, rows };
}
