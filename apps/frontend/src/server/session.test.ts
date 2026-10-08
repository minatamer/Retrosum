import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { revokeSession } from "./session.server";
const make = (body: unknown, origin = "http://localhost:3000") =>
  new Request("http://localhost:3000/api/retrosum/v1/session", {
    method: "DELETE",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
describe("fixed content-free session revoke bridge", () => {
  it("forwards only bounded workspace identity, preserves private origin and clears action-only cookie", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
    const result = await revokeSession(make({ workspaceId: "workspace_test" }), fetcher);
    expect(result.status).toBe(200);
    expect(fetcher.mock.calls[0]![0].toString()).toBe("http://127.0.0.1:4000/v1/session");
    expect(fetcher.mock.calls[0]![1]!.body).toBe('{"workspaceId":"workspace_test"}');
    expect(result.headers.get("set-cookie")).toContain("retrosum_action=");
    expect(await result.json()).toMatchObject({ providerCopiesRecalled: false });
  });
  it("rejects foreign origins and extra content without dispatch; unreachable revoke is truthful", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("secret");
    });
    expect(
      (
        await revokeSession(
          make({ workspaceId: "workspace_test" }, "https://other.example"),
          fetcher,
        )
      ).status,
    ).toBe(403);
    expect(
      (await revokeSession(make({ workspaceId: "workspace_test", records: "secret" }), fetcher))
        .status,
    ).toBe(503);
    expect(fetcher).not.toHaveBeenCalled();
    const result = await revokeSession(make({ workspaceId: "workspace_test" }), fetcher);
    expect(await result.json()).toMatchObject({ remoteCancellation: false });
  });
});
