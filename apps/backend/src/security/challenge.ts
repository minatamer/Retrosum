import { z } from "zod";
import type { ChallengeVerifier } from "./admission.js";
import { readBoundedJson } from "./read-json.js";
const resultSchema = z.object({
  success: z.boolean(),
  hostname: z.string().max(253).optional(),
  action: z.string().max(100).optional(),
  cdata: z.string().max(255).optional(),
  challenge_ts: z.iso.datetime().optional(),
});
export function turnstileVerifier(
  secret: string,
  hostname: string,
  now: () => number,
  fetcher: typeof fetch = fetch,
): ChallengeVerifier {
  return async (request, signal) => {
    if (!secret) return false;
    const bounded = AbortSignal.any([signal, AbortSignal.timeout(6000)]);
    try {
      const response = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        redirect: "error",
        signal: bounded,
        body: new URLSearchParams({ secret, response: request.challengeToken }),
      });
      if (!response.ok) {
        await response.body?.cancel();
        return false;
      }
      const r = resultSchema.parse(await readBoundedJson(response, 8192, bounded));
      const age = now() - Date.parse(r.challenge_ts ?? "");
      return (
        r.success &&
        r.hostname === hostname &&
        r.action === `retrosum_${request.action}` &&
        r.cdata === request.inputHash &&
        age >= 0 &&
        age < 300_000
      );
    } catch {
      return false;
    }
  };
}
