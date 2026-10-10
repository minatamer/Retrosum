import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { PROCESSING_DISCLOSURE_VERSION } from "@retrosum/contracts";
import { forwardAdmission } from "./admission.server";

const request = (origin: string) =>
  new Request(`${origin}/api/retrosum/v1/session`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json", Cookie: "retrosum_run=a.b" },
    body: JSON.stringify({
      workspaceId: "workspace_restart",
      consent: true,
      disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
    }),
  });
const expired = "retrosum_run=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict";
describe("admission cookie recovery bridge", () => {
  it.each(["http://localhost:3000", "https://demo.example.com"])(
    "passes only the verified previous-boot deletion for %s while rejecting the action",
    async (origin) => {
      const cookie = expired + (origin.startsWith("https:") ? "; Secure" : "");
      const fetcher = vi.fn<typeof fetch>(async () =>
        Response.json(
          { error: "boot_changed" },
          { status: 409, headers: { "Set-Cookie": cookie } },
        ),
      );
      const result = await forwardAdmission(request(origin), "session", fetcher, {
        FRONTEND_ORIGIN: origin,
      });
      expect(result.status).toBe(409);
      expect(result.headers.get("set-cookie")).toBe(cookie);
      expect(await result.json()).toEqual({ error: "admission_unavailable" });
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(fetch).not.toHaveBeenCalled();
    },
  );
  it.each([
    [409, "workspace_mismatch", expired],
    [403, "invalid_grant", expired],
    [429, "spend_allowance_used", expired],
    [409, "boot_changed", `${expired}; Domain=example.com`],
    [
      409,
      "boot_changed",
      "retrosum_run=new.token; Path=/; Max-Age=1800; HttpOnly; SameSite=Strict",
    ],
  ])("does not forward a cookie for status %s / %s", async (status, error, cookie) => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json({ error }, { status, headers: { "Set-Cookie": cookie } }),
    );
    const result = await forwardAdmission(request("http://localhost:3000"), "session", fetcher, {});
    expect(result.headers.get("set-cookie")).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe("exact batch private bridge", () => {
  it("forwards a bounded ten-document manifest over the fixed private path, with no browser authorization", async () => {
    const operations = Array.from({ length: 10 }, (_, n) => ({
      operationId: `operation_${n}`,
      inputHash: String(n).repeat(64),
      documentHash: String(n).repeat(64),
      retry: false,
    }));
    const body = {
      workspaceId: "workspace_batch",
      action: "extract",
      operationId: "batch_1",
      inputHash: "a".repeat(64),
      retry: false,
      operations,
      consent: true,
      disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
      challengeToken: "t".repeat(2000),
    };
    const origin = "http://localhost:3000";
    const request = new Request(`${origin}/api/retrosum/v1/document-batches`, {
      method: "POST",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        Cookie: "retrosum_run=a.b",
        Authorization: "not-forwarded",
      },
      body: JSON.stringify(body),
    });
    expect(JSON.stringify(body).length).toBeGreaterThan(4096);
    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json({
        grant: "batch.approval",
        expiresAt: 1000000,
        disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
      }),
    );
    const response = await forwardAdmission(request, "batch", fetcher, {});
    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(String(fetcher.mock.calls[0]![0])).toBe("http://127.0.0.1:4000/v1/document-batches");
    const headers = new Headers(fetcher.mock.calls[0]![1]!.headers);
    expect(headers.get("authorization")).toBeNull();
    expect(headers.get("cookie")).toBe("retrosum_run=a.b");
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects oversized manifests and mixed challenge/batch-grant bodies before transport", async () => {
    const fetcher = vi.fn<typeof fetch>();
    for (const body of [
      { padding: "x".repeat(8193) },
      {
        workspaceId: "workspace_batch",
        action: "extract",
        operationId: "operation_1",
        inputHash: "a".repeat(64),
        documentHash: "b".repeat(64),
        retry: false,
        consent: true,
        disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
        batchGrant: "a.b",
        challengeToken: "mixed",
      },
    ]) {
      const request = new Request("http://localhost:3000/api/retrosum/v1/grants", {
        method: "POST",
        headers: { Origin: "http://localhost:3000", "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      expect((await forwardAdmission(request, "grant", fetcher, {})).status).toBe(503);
    }
    expect(fetcher).not.toHaveBeenCalled();
  });
});
