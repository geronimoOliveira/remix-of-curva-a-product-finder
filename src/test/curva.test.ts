import { describe, it, expect } from "vitest";
import { classifyCurvaA } from "@/lib/curva";

describe("classifyCurvaA", () => {
  it("marks items up to 80% of units as Curva A", () => {
    const r = classifyCurvaA([{ sold: 10 }, { sold: 70 }, { sold: 15 }, { sold: 5 }]);
    expect(r.rows.filter((x) => x.curvaA).map((x) => x.sold)).toEqual([70, 15]);
  });
  it("falls back to top 20% when sold is missing", () => {
    const r = classifyCurvaA(Array.from({ length: 10 }, () => ({ sold: null })));
    expect(r.rows.filter((x) => x.curvaA).length).toBe(2);
  });
});
