"use client";
import { useEffect, useState } from "react";
import { capabilitiesSchema } from "@retrosum/contracts";
import type { RuntimeCapabilities } from "@retrosum/contracts";
export function RuntimeStatus() {
  const [capabilities, setCapabilities] = useState<RuntimeCapabilities | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/retrosum/v1/config", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Unavailable");
        const result = capabilitiesSchema.parse(await response.json());
        if (!controller.signal.aborted) setCapabilities(result);
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    }
    void load();
    return () => controller.abort();
  }, []);
  const message =
    failed || capabilities?.mode === "unavailable"
      ? "AI processing unavailable. Your local workspace remains accessible."
      : capabilities?.mode === "fake"
        ? "Development simulation · No AI API requests."
        : capabilities?.mode === "live"
          ? "Live AI runtime enabled."
          : "Checking workspace runtime…";
  return (
    <p className="runtime-status" role="status">
      {message}
    </p>
  );
}
