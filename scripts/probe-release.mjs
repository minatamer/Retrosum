// Explicit targets; no redirects, uploads, grants or provider requests.
const [kind, target, expected, frontendOrigin] = process.argv.slice(2);
if (!["frontend", "backend"].includes(kind) || !["fake", "unavailable"].includes(expected))
  throw new Error(
    "Usage: probe-release.mjs frontend|backend <origin> fake|unavailable [frontend-origin]",
  );
const origin = new URL(target);
if (
  origin.origin !== target ||
  origin.username ||
  origin.password ||
  (origin.protocol !== "https:" &&
    !(origin.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)))
)
  throw new Error("Provide an exact HTTPS or loopback origin without credentials.");
const actionOrigin = kind === "frontend" ? target : frontendOrigin;
if (expected === "unavailable" && (!actionOrigin || new URL(actionOrigin).origin !== actionOrigin))
  throw new Error("Unavailable backend probes require the exact configured frontend origin.");
const token = process.env.RETROSUM_PROBE_TOKEN;
if (
  token &&
  (kind !== "backend" ||
    origin.protocol !== "https:" ||
    !origin.hostname.endsWith(".run.app") ||
    !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u.test(token) ||
    token.length > 8192)
)
  throw new Error("Probe identity is allowed only for an explicit HTTPS Cloud Run backend.");
async function request(path, options = {}, limit = 2 * 1024 * 1024) {
  const signal = AbortSignal.timeout(15_000);
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", "Bearer " + token);
  const response = await fetch(new URL(path, origin), {
    ...options,
    headers,
    signal,
    redirect: "error",
  });
  const reader = response.body?.getReader();
  const parts = [];
  let length = 0;
  const cancel = () => {
    void reader?.cancel().catch(() => undefined);
  };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    while (reader) {
      signal.throwIfAborted();
      const part = await reader.read();
      signal.throwIfAborted();
      if (part.done) break;
      length += part.value.byteLength;
      if (length > limit) throw new Error("Probe response exceeded its byte bound.");
      parts.push(Buffer.from(part.value));
    }
    return { response, body: Buffer.concat(parts).toString("utf8") };
  } finally {
    signal.removeEventListener("abort", cancel);
    await reader?.cancel().catch(() => undefined);
    reader?.releaseLock();
  }
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
const prefix = kind === "frontend" ? "/api/retrosum" : "";
const config = await request(prefix + "/v1/config", {}, 16_384);
assert(config.response.status === 200, "Configuration probe failed.");
const capabilities = JSON.parse(config.body);
assert(
  capabilities.mode === expected && capabilities.processing?.admissionAvailable === false,
  "Unexpected mode or paid admission. Stop without sending action probes.",
);
if (expected === "unavailable")
  assert(
    capabilities.documents?.available === false && capabilities.copilot?.available === false,
    "Unavailable mode must close both provider capabilities.",
  );
if (kind === "backend") {
  const health = await request("/v1/health", {}, 4096);
  assert(health.response.status === 200, "Backend health failed.");
  const ready = await request("/v1/ready", {}, 4096);
  assert(
    ready.response.status === (expected === "fake" ? 200 : 503),
    "Unexpected capability readiness.",
  );
} else {
  const landing = await request("/");
  assert(
    landing.response.status === 200 && landing.body.includes("Retrosum"),
    "Landing probe failed.",
  );
  assert(
    landing.response.headers.get("content-security-policy")?.includes("'nonce-"),
    "Nonce CSP is missing.",
  );
  const samples = [
    "harbor-HS-101",
    "harbor-HS-102",
    "northstar-A-77-scan",
    "rent-R-091-handwritten",
    "papercloud-September",
    "northstar-A-77-second-copy",
    "harbor-payments-September",
    "harbor-August-records",
    "harbor-September-operations",
    "harbor-September-services",
  ];
  for (const sample of samples) {
    const pdf = await request(`/samples/harbor-v1/${sample}.pdf`);
    assert(
      pdf.response.status === 200 && pdf.body.startsWith("%PDF-"),
      "Sample asset probe failed.",
    );
  }
  const worker = await request("/pdfjs/6.4.299/pdf.worker.min.mjs");
  assert(
    worker.response.status === 200 && worker.body.length > 1_000_000,
    "Pinned PDF worker missing.",
  );
}
// Only after free config proves unavailable: empty bodies cannot start a paid operation.
if (expected === "unavailable") {
  for (const action of ["extract", "chat", "insights"]) {
    const rejected = await request(
      prefix + "/v1/" + action,
      {
        method: "POST",
        headers: {
          Origin: actionOrigin,
          "Content-Type":
            action === "extract"
              ? "multipart/form-data; boundary=retrosum_probe"
              : "application/json",
        },
        body: action === "extract" ? "--retrosum_probe--\r\n" : "{}",
      },
      4096,
    );
    assert(rejected.response.status === 503, "Paid-off action was not rejected before dispatch.");
  }
}
process.stdout.write(JSON.stringify({ kind, expected, result: "passed", paidRequests: 0 }) + "\n");
