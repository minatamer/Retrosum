import { interpretationSchema } from "@retrosum/contracts";
import fixtures from "./fake-fixtures.json" with { type: "json" };
import type { Clock } from "../runtime/clock.js";
import type { AiProviderPort } from "../runtime/provider-port.js";
export function createFakeProvider(clock: Clock): AiProviderPort {
  const declared = new Map(Object.entries(fixtures));
  return {
    kind: "fake",
    investigator: {
      kind: "fake",
      async step(context, history, signal) {
        await clock.sleep(500, signal);
        if (history.length === 0)
          return {
            kind: "tools",
            calls: [{ id: "fake_summary", tool: { name: "get_summary", args: {} } }],
          };
        return { kind: "answer", decision: context.simulationDecision };
      },
    },
    async interpretDocument({ metadata }, signal) {
      const result = declared.get(metadata.document.sha256);
      if (!result) throw new RangeError("fake_unrecognized_pdf");
      await clock.sleep(700, signal);
      signal.throwIfAborted();
      return { interpretation: interpretationSchema.parse(result), usage: null };
    },
  };
}
