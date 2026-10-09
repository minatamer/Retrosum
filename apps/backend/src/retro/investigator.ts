import {
  RETRO_LIMITS,
  retroTopicSchema,
  type RetroDecision,
  type RetroRequest,
  type RetroResponse,
  type RetroTool,
} from "@retrosum/contracts";
import {
  briefFact,
  buildDashboard,
  createRetroResponse,
  executeRetroTool,
  fakeRetroDecision,
  topicFacts,
  validateRetroInput,
} from "@retrosum/money";

export type ToolCall = { id: string; tool: RetroTool };
export type InvestigationContext = {
  prompt: string;
  recent: RetroRequest["recent"];
  scope: RetroRequest["scope"];
  topics: { topic: string; factIds: string[] }[];
  facts: ReturnType<typeof briefFact>[];
  simulationDecision: RetroDecision;
  changeContext?: RetroRequest["changeContext"];
  uiContext?: RetroRequest["uiContext"];
};
export type ToolResult = { call: ToolCall; result: unknown };
export interface RecordInvestigator {
  readonly kind: "fake" | "openai";
  step(
    context: InvestigationContext,
    history: ToolResult[],
    signal: AbortSignal,
  ): Promise<{ kind: "tools"; calls: ToolCall[] } | { kind: "answer"; decision: RetroDecision }>;
}
export async function investigate(
  input: unknown,
  provider: RecordInvestigator,
  signal: AbortSignal,
): Promise<RetroResponse> {
  const request = validateRetroInput(input);
  const catalogue = buildDashboard(request.workspace, request.scope);
  const topics = retroTopicSchema.options.map((topic) => ({
    topic,
    factIds: topicFacts(topic, catalogue),
  }));
  const ids = [...new Set(topics.flatMap((topic) => topic.factIds))];
  const context: InvestigationContext = {
    prompt: request.prompt,
    recent: request.recent,
    scope: request.scope,
    topics,
    facts: ids.map((id) => briefFact(catalogue.facts[id]!)),
    simulationDecision: fakeRetroDecision(
      request.prompt,
      catalogue,
      request.workspace,
      request.changeContext,
    ),
    ...(request.changeContext ? { changeContext: request.changeContext } : {}),
    ...(request.uiContext ? { uiContext: request.uiContext } : {}),
  };
  const history: ToolResult[] = [];
  const bounded = AbortSignal.any([signal, AbortSignal.timeout(RETRO_LIMITS.deadlineMs)]);
  const steps: RetroResponse["steps"] = [];
  const seen = new Set<string>();
  for (let iteration = 0; iteration < RETRO_LIMITS.requests; iteration++) {
    bounded.throwIfAborted();
    if (JSON.stringify({ context, history }).length > RETRO_LIMITS.inputCharacters)
      throw new RangeError("context_too_large");
    // Race the deadline even for an injected adapter that ignores cancellation.
    const result = await withAbort(provider.step(context, history, bounded), bounded);
    bounded.throwIfAborted();
    if (result.kind === "answer")
      return createRetroResponse(
        request,
        result.decision,
        provider.kind === "fake" ? "fake" : "live",
        steps,
      );
    if (result.calls.length === 0 || result.calls.length + history.length > RETRO_LIMITS.tools)
      return createRetroResponse(
        request,
        { kind: "limited_result", reason: "tool_limit" },
        provider.kind === "fake" ? "fake" : "live",
        steps,
      );
    for (const call of result.calls) {
      if (!/^[A-Za-z0-9_-]{1,120}$/u.test(call.id) || seen.has(call.id))
        throw new RangeError("invalid_tool_call");
      seen.add(call.id);
      const value = executeRetroTool(call.tool, request, catalogue);
      bounded.throwIfAborted();
      history.push({ call, result: value });
      steps.push({ tool: call.tool.name, count: Array.isArray(value) ? value.length : 1 });
    }
  }
  return createRetroResponse(
    request,
    { kind: "limited_result", reason: "tool_limit" },
    provider.kind === "fake" ? "fake" : "live",
    steps,
  );
}
async function withAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => reject(new RangeError("turn_timeout"));
    signal.addEventListener("abort", abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}
