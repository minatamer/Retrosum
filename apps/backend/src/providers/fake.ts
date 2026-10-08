import { interpretationSchema } from "@retrosum/contracts";
import fixtures from "./fake-fixtures.json" with { type: "json" };
import type { Clock } from "../runtime/clock.js";
import type { AiProviderPort } from "../runtime/provider-port.js";
export function createFakeProvider(clock: Clock): AiProviderPort {
  const declared = new Map(Object.entries(fixtures));
  return {
    kind: "fake",
    async interpretDocument({ metadata }, signal) {
      const result = declared.get(metadata.document.sha256);
      if (!result) throw new RangeError("fake_unrecognized_pdf");
      await clock.sleep(700, signal);
      signal.throwIfAborted();
      return { interpretation: interpretationSchema.parse(result), usage: null };
    },
  };
}
