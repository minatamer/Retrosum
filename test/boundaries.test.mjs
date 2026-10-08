import { describe, expect, it } from "vitest";
import { inspectBoundary } from "../scripts/boundary-rules.mjs";
describe("executable ownership and platform boundaries", () => {
  it.each([
    ["packages/contracts/src/bad.ts", 'import { env } from "node:process";'],
    ["packages/money/src/bad.ts", 'export { readFile } from "fs";'],
    ["packages/contracts/src/bad.ts", 'const sdk=await import("openai");'],
    ["packages/money/src/bad.ts", "const value=process.env.KEY;"],
    ["packages/money/src/bad.ts", 'globalThis.fetch("https://example.com");'],
    ["packages/money/src/bad.ts", 'window["localStorage"].getItem("secret");'],
    ["packages/money/src/bad.ts", 'const root=globalThis; root.fetch("https://example.com");'],
    ["apps/frontend/src/features/bad.ts", 'import { key } from "../../server/private.server";'],
    ["apps/frontend/src/features/bad.ts", 'import { proxy } from "../proxy";'],
    ["apps/frontend/src/features/bad.ts", 'import { app } from "@retrosum/backend";'],
    ["apps/backend/src/bad.ts", 'import { Page } from "@retrosum/frontend";'],
    ["packages/money/src/bad.ts", 'import { value } from "../../../apps/backend/src/value.js";'],
  ])("rejects %s ownership violations", (file, source) =>
    expect(inspectBoundary(file, source).length).toBeGreaterThan(0),
  );
  it("accepts browser-safe shared calculations", () =>
    expect(
      inspectBoundary(
        "packages/money/src/amount.ts",
        'import { moneySchema } from "@retrosum/contracts"; const amount=BigInt(10);',
      ),
    ).toEqual([]));
  it("requires server-only on explicit server modules", () =>
    expect(
      inspectBoundary("apps/frontend/src/server/private.server.ts", "export const value=1;"),
    ).not.toEqual([]));
  it("does not accept a commented server-only import", () =>
    expect(
      inspectBoundary(
        "apps/frontend/src/server/private.server.ts",
        '// import "server-only";\nexport const value=1;',
      ),
    ).not.toEqual([]));
  it("accepts a real side-effect marker using either quotation style", () =>
    expect(
      inspectBoundary(
        "apps/frontend/src/server/private.server.ts",
        "import 'server-only';\nexport const value=1;",
      ),
    ).toEqual([]));
});
