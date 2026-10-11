import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import { inspectPdf } from "./inspection.js";

const original = () => readFile("apps/frontend/public/samples/harbor-v1/harbor-HS-101.pdf");
describe("native PDF ownership and memory headroom", () => {
  it("cancels active and waiting inspections before settling, then inspects a genuine two-page original", async () => {
    const bytes = await original(),
      controllers = Array.from({ length: 4 }, () => new AbortController());
    const work = controllers.map((c) => inspectPdf(bytes, c.signal));
    const results = Promise.allSettled(work);
    await Promise.resolve();
    controllers.forEach((c) => c.abort());
    expect((await results).every((r) => r.status === "rejected")).toBe(true);
    expect((await inspectPdf(bytes, new AbortController().signal)).pages).toHaveLength(2);
  });
  it("rejects before creating a worker at the process headroom limit, without losing later capacity", async () => {
    const bytes = await original(),
      rss = vi.spyOn(process.memoryUsage, "rss").mockReturnValue(640 * 1024 * 1024);
    await expect(inspectPdf(bytes, new AbortController().signal)).rejects.toThrow("instance_busy");
    rss.mockRestore();
    expect((await inspectPdf(bytes, new AbortController().signal)).pages).toHaveLength(2);
  });
  it("stops an active inspection if RSS reaches the limit and releases it before a later original", async () => {
    const bytes = await original(),
      actual = process.memoryUsage.rss;
    let reads = 0;
    const rss = vi
      .spyOn(process.memoryUsage, "rss")
      .mockImplementation(() => (++reads === 1 ? actual() : 640 * 1024 * 1024));
    await expect(inspectPdf(bytes, new AbortController().signal)).rejects.toThrow(
      "unsupported_pdf",
    );
    rss.mockRestore();
    expect((await inspectPdf(bytes, new AbortController().signal)).pages).toHaveLength(2);
  });
});
