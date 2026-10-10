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
