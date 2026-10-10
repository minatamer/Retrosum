import { describe, it, expect } from "vitest";
import {
  retroShortcuts,
  resolveRetroReply,
  RETRO_HELP_EXAMPLES,
} from "../apps/frontend/src/features/retro/shortcuts.ts";
import {
  createRetroResponse,
  fakeRetroDecision,
  buildDashboard,
  explainTopic,
} from "../packages/money/dist/index.js";
import { harborSession } from "./fixtures/harbor-v1/money-fixture.mjs";

const session = harborSession();
const request = {
  operationId: "retro_shortcuts",
  workspace: session.workspace,
  scope: { from: session.filters.from, to: session.filters.to, asOf: session.filters.asOf },
  prompt: "Summarize this period",
  recent: [],
  uiContext: { dashboard: session.dashboard },
};
const catalogue = buildDashboard(session.workspace, session.filters);
const explanation = createRetroResponse(request, explainTopic("profit", catalogue), "local");
const choices = (response = explanation, extra = {}) =>
  retroShortcuts({ empty: false, current: true, response, ...extra });

describe("bounded contextual Retro shortcuts", () => {
  it("offers four distinct starters with matching explanation topics", () => {
    const starters = retroShortcuts({ empty: true, current: true });
    expect(starters).toHaveLength(4);
    expect(new Set(starters.map((choice) => choice.label)).size).toBe(4);
    for (const choice of starters.filter((choice) => choice.kind === "topic"))
      expect(fakeRetroDecision(choice.label, catalogue, session.workspace).topic).toBe(
        choice.topic,
      );
    expect(fakeRetroDecision("What can Retro do?", catalogue, session.workspace)).toMatchObject({
      kind: "workspace_request",
      intent: { action: "help" },
    });
    expect(fakeRetroDecision("Show me around", catalogue, session.workspace).kind).toBe("tour");
  });
  it("routes every help example to its labelled capability, including the entire dashboard", () => {
    const expected = [
      "explanation",
      "explanation",
      "workspace_request",
      "change_request",
      "explanation",
      "workspace_request",
      "workspace_request",
      "change_request",
      "dashboard_request",
      "dashboard_request",
      "workspace_request",
      "workspace_request",
      "workspace_request",
    ];
    RETRO_HELP_EXAMPLES.forEach((prompt, index) =>
      expect(fakeRetroDecision(prompt, catalogue, session.workspace).kind, prompt).toBe(
        expected[index],
      ),
    );
    expect(fakeRetroDecision("Explain this dashboard", catalogue, session.workspace).topic).toBe(
      "summary",
    );
  });
  it("replaces starters with the exact current highlight and related questions in every mode", () => {
    const selected = choices();
    expect(selected.map((choice) => choice.label)).toEqual([
      "Show me",
      "No, thanks",
      "Explain cash",
      "Compare periods",
    ]);
    expect(selected[0].target).toBe("profit");
    for (const mode of ["fake", "live", "local"])
      expect(choices({ ...explanation, mode })).toEqual(selected);
    expect(choices(explanation, { dismissed: true }).map((choice) => choice.kind)).toEqual([
      "topic",
      "topic",
    ]);
  });
  it("resolves yes/no only when that response actually offers them", () => {
    for (const text of ["yes", "yes please", "show me"])
      expect(resolveRetroReply(text, choices()).kind).toBe("highlight");
    expect(resolveRetroReply("no, thanks", choices()).kind).toBe("decline");
    expect(resolveRetroReply("yes", choices(explanation, { dismissed: true }))).toBeUndefined();
    expect(resolveRetroReply("yes", choices(explanation, { current: false }))).toBeUndefined();
  });
  it("suppresses old or busy action authority and does not repeat starters after a result", () => {
    expect(choices(explanation, { busy: true })).toEqual([]);
    expect(choices(explanation, { current: false }).map((choice) => choice.kind)).toEqual([
      "topic",
    ]);
    expect(retroShortcuts({ empty: false, current: true })).toEqual([]);
  });
  it("keeps every clarification choice reachable while limiting the main row to four", () => {
    const response = {
      ...explanation,
      decision: { kind: "change_request", intent: {} },
      change: {
        kind: "clarification",
        choices: Array.from({ length: 8 }, (_, i) => ({
          label: `Record ${i}`,
          query: `record_${i}`,
          fields: [],
        })),
      },
    };
    expect(choices(response)).toHaveLength(4);
    expect(resolveRetroReply("Record 2", choices(response)).choice.query).toBe("record_2");
    expect(choices({ ...response, change: { ...response.change, choices: [] } })).toEqual([]);
  });
  it("offers styles only for an unapplied current chart and preserves style aliases", () => {
    const response = createRetroResponse(
      request,
      fakeRetroDecision("Chart quarterly income", catalogue, session.workspace),
      "local",
    );
    expect(choices(response).map((choice) => choice.kind)).toEqual([
      "style",
      "style",
      "style",
      "style",
    ]);
    expect(resolveRetroReply("bar chart", choices(response)).style).toBe("bar");
    expect(resolveRetroReply("donut", choices(response)).style).toBe("pie");
    expect(choices(response, { applied: true })).toEqual([]);
    expect(choices(response, { applied: true, current: false })).toEqual([]);
    expect(choices(response, { current: false }).some((choice) => choice.kind === "style")).toBe(
      false,
    );
  });
  it("leaves editable/confirmed actions with their owning controls and gives useful recovery", () => {
    const filter = createRetroResponse(
      request,
      fakeRetroDecision("Change period", catalogue, session.workspace),
      "local",
    );
    expect(choices(filter)).toEqual([]);
    expect(
      choices({
        ...explanation,
        decision: { kind: "limited_result", reason: "unknown_history" },
      }).map((choice) => choice.prompt),
    ).toEqual(["Change period", "Open documents"]);
    expect(choices(explanation, { failed: true })).toHaveLength(2);
  });
});
