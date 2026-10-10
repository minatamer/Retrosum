import express from "express";
import type { ErrorRequestHandler, Express } from "express";
import { requestIdSchema, workspaceIdSchema } from "@retrosum/contracts";
import { z } from "zod";
import type { AppRuntime } from "../runtime/compose.js";
import { extractRoute } from "../documents/extract-route.js";
import { chatRoute } from "../retro/chat-route.js";
import {
  admissionRoute,
  admissionStatus,
  safeAdmissionError,
  paidPreflight,
} from "../security/routes.js";
import { runCookie } from "../security/admission.js";
import { emitMetric, type OperationalMetric } from "../security/metrics.js";
export function createApp(runtime: AppRuntime): Express {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", false);
  app.use((request, response, next) => {
    const routes: Record<string, OperationalMetric["route"]> = {
      "/v1/extract": "extract",
      "/v1/chat": "chat",
      "/v1/insights": "insights",
      "/v1/grants": "admission",
      "/v1/document-batches": "admission",
      "/v1/session": "session",
    };
    const route = routes[request.path];
    if (route) {
      const started = performance.now();
      response.once("finish", () =>
        emitMetric(runtime.ports.metric, {
          route,
          mode: runtime.capabilities.mode,
          status: response.statusCode,
          durationMs: performance.now() - started,
        }),
      );
    }
    response.set("Cache-Control", "no-store");
    response.set("X-Content-Type-Options", "nosniff");
    response.set("Referrer-Policy", "no-referrer");
    const origin = request.headers.origin;
    if (origin && origin !== runtime.config.FRONTEND_ORIGIN) {
      response.status(403).json({ error: "origin_rejected" });
      return;
    }
    next();
  });
  for (const action of ["chat", "insights"] as const)
    app.post(
      `/v1/${action}`,
      (request, response, next) => {
        if (request.headers.origin !== runtime.config.FRONTEND_ORIGIN) {
          response.status(403).json({ error: "origin_not_allowed" });
          return;
        }
        if (
          !runtime.capabilities.copilot.available ||
          (!runtime.config.FAKE_MODE && !runtime.config.PAID_DEMO_ENABLED)
        ) {
          response
            .status(503)
            .json({ error: runtime.capabilities.copilot.reason ?? "adapter_not_ready" });
          return;
        }
        if (!paidPreflight(runtime, request, response, action)) return;
        try {
          const releaseIntake = runtime.admission.enter();
          response.once("finish", releaseIntake);
          response.once("close", releaseIntake);
          next();
        } catch {
          response.status(409).json({ error: "instance_busy" });
        }
      },
      express.json({ limit: "2mb", strict: true }),
      (request, response) => chatRoute(runtime, request, response, action, true),
    );
  app.post("/v1/extract", (request, response) => extractRoute(runtime, request, response));
  app.post(
    "/v1/document-batches",
    express.json({ limit: "8kb", strict: true }),
    (request, response) => admissionRoute(runtime, request, response, "batch"),
  );
  app.use(express.json({ limit: "4kb", strict: true }));
  app.post("/v1/session", (request, response) =>
    admissionRoute(runtime, request, response, "session"),
  );
  app.post("/v1/grants", (request, response) =>
    admissionRoute(runtime, request, response, "grant"),
  );
  app.get("/v1/health", (_request, response) => {
    response.json({
      status: "ok",
      requestId: requestIdSchema.parse(runtime.ports.createRequestId()),
      time: new Date(runtime.ports.clock.now()).toISOString(),
    });
  });
  app.get("/v1/ready", (_request, response) => {
    response
      .status(runtime.ready ? 200 : 503)
      .json({ status: runtime.ready ? "ready" : "unavailable", mode: runtime.capabilities.mode });
  });
  app.get("/v1/config", (_request, response) => {
    response.json(runtime.capabilities);
  });
  app.get("/v1/exchange-rate", async (_request, response) => {
    const controller = new AbortController();
    const close = () => controller.abort();
    response.once("close", close);
    try {
      const quote = await runtime.exchangeRates.read(controller.signal);
      if (!controller.signal.aborted) response.json(quote);
    } catch {
      if (!controller.signal.aborted)
        response.status(503).json({ error: "exchange_rate_unavailable" });
    } finally {
      response.removeListener("close", close);
    }
  });
  app.delete("/v1/session", (request, response) => {
    if (request.headers.origin !== runtime.config.FRONTEND_ORIGIN) {
      response.status(403).json({ error: "origin_not_allowed" });
      return;
    }
    const parsed = z.strictObject({ workspaceId: workspaceIdSchema }).safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: "invalid_session" });
      return;
    }
    if (!runtime.config.FAKE_MODE) {
      try {
        const cookie = runCookie(request.headers.cookie);
        if (!cookie) throw new RangeError("invalid_grant");
        runtime.paidAdmission.revoke(cookie, parsed.data.workspaceId);
      } catch (cause) {
        const code = safeAdmissionError(cause);
        response.status(admissionStatus(code)).json({ error: code });
        return;
      }
    }
    runtime.operations.revoke(parsed.data.workspaceId);
    response.set("Set-Cookie", "retrosum_action=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict");
    response.json({
      cancellationRequested: true,
      actionCookieCleared: true,
      allowanceRetained: true,
      providerCopiesRecalled: false,
    });
  });
  app.use((_request, response) => {
    response.status(404).json({ error: "not_found" });
  });
  const handleError: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
    const bodyError = error instanceof Error && "status" in error ? error.status : undefined;
    response.status(bodyError === 413 ? 413 : bodyError === 400 ? 400 : 500).json({
      error:
        bodyError === 413
          ? "body_too_large"
          : bodyError === 400
            ? "invalid_json"
            : "internal_error",
    });
  };
  app.use(handleError);
  return app;
}
