// Bounded, no-key Linux audit only. Run in a 1 GiB network-disabled container;
// /fixtures contains public synthetic originals, /pressure is synthetic input.
import { readFile } from "node:fs/promises";
const backend = new URL(process.argv[3] ?? "../apps/backend/dist/", import.meta.url);
const { inspectPdf } = await import(new URL("documents/inspection.js", backend));
const { ExtractionAdmission } = await import(new URL("documents/admission.js", backend));

if (process.env.OPENAI_API_KEY || process.env.TURNSTILE_SECRET_KEY)
  throw new Error("Measurement must not inherit credentials");
globalThis.fetch = async () => {
  throw new Error("Measurement network forbidden");
};
const mode = process.argv[2];
if (!["samples", "pressure", "cancel"].includes(mode)) throw new Error("Unknown audit case");
const ceiling = setTimeout(() => process.exit(124), 45_000);
const admission = new ExtractionAdmission(Date.now);
let peakRss = 0,
  peakExternal = 0;
const poll = setInterval(() => {
  const memory = process.memoryUsage();
  peakRss = Math.max(peakRss, memory.rss);
  peakExternal = Math.max(peakExternal, memory.external);
}, 10);
const run = async (name, bytes, signal = new AbortController().signal) => {
  const release = admission.enter();
  try {
    const start = performance.now();
    const result = await inspectPdf(bytes, signal);
    return {
      name,
      pages: result.pages.length,
      durationMs: Math.round(performance.now() - start),
      status: "supported",
    };
  } catch (cause) {
    return { name, status: cause instanceof Error ? cause.message : "rejected" };
  } finally {
    release();
  }
};
try {
  let results;
  if (mode === "samples") {
    const manifest = JSON.parse(await readFile("/pressure/sample-manifest.json", "utf8"));
    results = [];
    for (let i = 0; i < manifest.documents.length; i += 4) {
      const group = await Promise.all(
        manifest.documents.slice(i, i + 4).map(async (asset) => {
          const bytes = await readFile("/fixtures/" + asset.pdfPath.split("/").at(-1));
          return run(asset.id, bytes);
        }),
      );
      results.push(...group);
    }
  } else {
    const bytes = await readFile("/pressure/pressure.pdf");
    console.log(JSON.stringify({ event: "start", mode, bytes: bytes.length, parallel: 4 }));
    const controllers = Array.from({ length: 4 }, () => new AbortController());
    const work = controllers.map((c, i) => run("pressure_" + i, bytes, c.signal));
    let fifth;
    try {
      admission.enter()();
      fifth = "unexpectedly_admitted";
    } catch {
      fifth = "instance_busy";
    }
    if (mode === "cancel") controllers.forEach((c) => c.abort());
    results = [...(await Promise.all(work)), { fifth }];
    if (mode === "cancel") {
      const manifest = JSON.parse(await readFile("/pressure/sample-manifest.json", "utf8"));
      const asset = manifest.documents[0];
      results.push(
        await run("after_cancel", await readFile("/fixtures/" + asset.pdfPath.split("/").at(-1))),
      );
    }
  }
  console.log(
    JSON.stringify(
      {
        mode,
        results,
        peakRss,
        peakExternal,
        maxRssKiB: process.resourceUsage().maxRSS,
        cgroupPeak: await readFile("/sys/fs/cgroup/memory.peak", "utf8").catch(() => "unavailable"),
      },
      null,
      2,
    ),
  );
} finally {
  clearInterval(poll);
  clearTimeout(ceiling);
}
