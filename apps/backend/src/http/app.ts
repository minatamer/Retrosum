import express from "express";
import type { ErrorRequestHandler, Express } from "express";
import { requestIdSchema } from "@retrosum/contracts";
import type { AppRuntime } from "../runtime/compose.js";
import { extractRoute } from "../documents/extract-route.js";
import { chatRoute } from "../retro/chat-route.js";
export function createApp(runtime: AppRuntime): Express {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", false);
  app.use((request, response, next) => {
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
  app.post(
    "/v1/chat",
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
      next();
    },
    express.json({ limit: "2mb", strict: true }),
    (request, response) => chatRoute(runtime, request, response),
  );
  app.use(express.json({ limit: "4kb", strict: true }));
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
  app.post("/v1/extract", (request, response) => extractRoute(runtime, request, response));
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
