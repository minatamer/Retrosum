import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { randomUUID } from "node:crypto";
import { EXTRACTION_TRANSPORT_DEADLINE_MS } from "@retrosum/contracts";
import { parseConfig } from "./config/config.js";
import { composeRuntime } from "./runtime/compose.js";
import { systemClock } from "./runtime/clock.js";
import { createApp } from "./http/app.js";
import { LIVE_ACCEPTANCE_VERIFIED } from "./providers/policy.js";
export async function startServer() {
  if (process.env.NODE_ENV !== "test") {
    try {
      const localValues = parseEnv(readFileSync(new URL("../.env.local", import.meta.url), "utf8"));
      for (const [key, value] of Object.entries(localValues))
        if (process.env[key] === undefined) process.env[key] = value;
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT"))
        throw new Error("Could not load backend local configuration.", { cause: error });
    }
  }
  const config = parseConfig(process.env);
  const provider = config.FAKE_MODE
    ? (await import("./providers/fake.js")).createFakeProvider(systemClock)
    : config.PAID_DEMO_ENABLED && LIVE_ACCEPTANCE_VERIFIED && config.OPENAI_API_KEY
      ? (await import("./providers/openai.js")).createOpenAiProvider(config.OPENAI_API_KEY)
      : undefined;
  const runtime = composeRuntime(config, {
    clock: systemClock,
    createRequestId: () => "request_" + randomUUID(),
    metric: (metric) => {
      process.stdout.write(JSON.stringify({ event: "operation", ...metric }) + "\n");
    },
    ...(provider ? { provider } : {}),
  });
  const server = createApp(runtime).listen(config.PORT, config.HOST);
  server.requestTimeout = EXTRACTION_TRANSPORT_DEADLINE_MS;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  const shutdown = () => {
    server.close();
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  server.once("close", () => {
    process.removeListener("SIGINT", shutdown);
    process.removeListener("SIGTERM", shutdown);
  });
  server.once("error", () => {
    process.stderr.write("Retrosum backend could not listen on its configured address.\n");
    process.exitCode = 1;
  });
  return server;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  void startServer().catch(() => {
    process.stderr.write("Retrosum backend could not initialize its safe runtime.\n");
    process.exitCode = 1;
  });
