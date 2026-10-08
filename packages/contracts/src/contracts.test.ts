import { describe, expect, it } from "vitest";
import {
  moneySchema,
  revisionSchema,
  sourceReferenceSchema,
  workspaceIdSchema,
  commandSchema,
  documentSchema,
} from "./index.js";
describe("external financial boundaries", () => {
  it.each([
    { minor: 0.1, currency: "USD" },
    { minor: 9007199254740992, currency: "USD" },
    { minor: 100, currency: "EUR" },
    { minor: 100, currency: "USD", secret: "extra" },
  ])("rejects malformed money %j", (input) =>
    expect(moneySchema.safeParse(input).success).toBe(false),
  );
  it.each([-1, 0.5, 1000001, NaN])("rejects invalid revision %s", (input) =>
    expect(revisionSchema.safeParse(input).success).toBe(false),
  );
  it("keeps ID ownership explicit", () => {
    expect(workspaceIdSchema.safeParse("document_sample").success).toBe(false);
    expect(workspaceIdSchema.parse("workspace_sample")).toBe("workspace_sample");
  });
  it("bounds source references", () =>
    expect(
      sourceReferenceSchema.safeParse({ documentId: "document_sample", page: 999 }).success,
    ).toBe(false));
  it("rejects arbitrary commands", () =>
    expect(
      commandSchema.safeParse({
        id: "command_one",
        workspaceId: "workspace_one",
        basedOnRevision: 0,
        actions: [{ type: "execute_javascript", code: "alert(1)" }],
      }).success,
    ).toBe(false));
  it("rejects unsafe filenames and excessive documents", () =>
    expect(
      documentSchema.safeParse({
        id: "document_a",
        name: "bad\u0000.pdf",
        mime: "application/pdf",
        sha256: "a".repeat(64),
        byteLength: 1,
        pageCount: 21,
        kind: "unknown",
        state: "selected",
        provenance: "visitor_upload",
      }).success,
    ).toBe(false));
});
