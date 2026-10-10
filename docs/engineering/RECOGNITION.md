# PDF recognition and review

## Local product behavior

The browser inspects the actual original PDFs, compares size/signature/hash/page counts and admits the combined 10-file / 20-page / 20-MiB envelope before requests. Sample start supplies metadata and original bytes; there is no prepared financial graph in the browser. Explicit fake composition returns one declared per-hash interpretation. Every sample source stays visible in the gallery. A unfamiliar visitor upload has no fake OCR result: its original is preserved and manual records remain usable.

Originals flow through bounded multipart browser → same-origin Next route → Express. The bridge streams at most 5 MiB + 64 KiB, applies cancellation and a shared 175-second transport deadline, and bounds response decoding to 512 KiB. Express accepts one PDF plus one bounded metadata field, checks actual bytes and digest, then independently inspects it in a worker with a 20-second deadline and bounded V8 memory. Workers terminate on completion, cancellation and failure. PDF diagnostics are drained, never logged. Servers write no uploaded original or provider result to disk.

The parser rejects encryption, script/launch/open actions, attachments, active/external annotations, excessive dimensions, image work, operators and text. PDF.js resource/image limits and 4-Mpixel previews remain enforced. The worker’s metadata pass also checks decoded image operations. Limits are deliberately conservative; unsupported PDFs remain viewable only if the safe viewer can render them, otherwise the original download is available.

The numeric inventory preserves raw token, occurrence count, normalized string, units, page/block and treatment. The money package compares the entire inventory against text-native pages. Image-only fields require explicit source review. There are no confidence percentages or fabricated boxes. A missing digit, incorrect inventory, unknown role/currency, conflicting duplicate or arithmetic mismatch holds the entire source and adds no candidate records. The app never repairs a value from expected fixture JSON.

Accepted money fields are bounded integer cents. Line quantity multiplication and tax checks reuse the money authority. Repeated service pages do not become extra events. Payments are separate cash evidence; exact party/reference/direction matches can allocate to an existing event, while unmatched evidence remains separate. Distinct Northstar scans require duplicate review and share one economic event. Source review shows the calculation effect before acceptance, opens the original cited page, requires an explicit figure check, and provides latest Undo.

Browser persistence keeps the normalized inventory and final document states within the existing 2-MiB projection. Visitor originals use the bounded temporary IndexedDB cache, with an in-memory fallback if storage is denied. Reset/expiry/dispose release owned effects and in-memory originals. Refresh preserves completed figures and review state; interrupted work becomes cancelled and never restarts automatically. Input revision/workspace/generation guards discard stale results.

## OpenAI adapter and release gate

Checked **8 October 2026** against official documentation:

- The selected `gpt-6.1-sol` supports Responses, vision and strict structured output; supported reasoning includes `low`, used here. `none` and `minimal` are unsupported. [Model reference](https://developers.openai.com/api/docs/models/gpt-6.1-sol).
- Responses accepts inline `input_file` with Base64 PDF data; PDFs provide text plus page imagery. The adapter sends the inspected original with high detail. [File input guide](https://developers.openai.com/api/docs/guides/file-inputs).
- Strict JSON schema belongs in `text.format`. All interpretation fields are required, absent values use null, and objects reject additional properties. [Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses).
- `store:false` and foreground requests avoid the application’s stored response/background polling path. They do **not** establish universal zero provider retention; file/image inputs and abuse monitoring follow the account’s data controls. [Data controls](https://developers.openai.com/api/docs/guides/your-data).

The backend-only adapter first verifies the exact full PDF input using the fixed token-count endpoint, then performs one foreground generation with a separate 75-second deadline, 6,000 output-token ceiling, versioned untrusted-document prompt and strict schema. Input counting is bounded to 60 seconds; the backend operation to 170 seconds, transports to 175. No Files API, tools, automatic retry or expected-result imports. Unverified/excess input, refusal, incomplete/invalid output, unexpected service tier, oversized response and usage over 24,000 input/6,000 output reject. Numeric/role accuracy was checked on two independent actual-byte corpus passes; general handwriting/upload accuracy is not implied.

Two independent live corpus passes and record audits passed on 10 October 2026. Accepted normal composition connects documents and Retro when fake mode is off, paid is on and all credential/admission prerequisites are present. Paid-off and missing prerequisites reject without fake fallback. Process-local admission enforces one active operation, ten distinct originals, one deliberate retry, replay rejection and bounded fixed-lifetime counter storage. These counters contain operation IDs/hashes only, not documents/financial results. Reservations are never refunded on uncertain outcomes; they are not durable global quotas across instances/restarts. Actual localhost Turnstile/browser checks passed for both features; hosted acceptance remains separate.

## Evaluation

Build first, then run `node scripts/evaluate-recognition.mjs` for actual-file inspection with zero provider dispatch. Its ignored report records ten hashes/eighteen pages and leaves numeric/live acceptance pending.

Only an owner-authorized paid run uses `--live --confirm-paid` plus private `OPENAI_API_KEY` and `PAID_DEMO_ENABLED=true`. The runner dispatches two independent passes over actual originals, loads independent truth only afterward, compares the complete numeric multiset including units/normalized values/counts, and records model/prompt/schema/hashes/usage/spend. It reserves the full per-request token ceiling against a $2.50 evaluation bound at the conservative $2.50/M cache-write input ceiling and $10/M output; it stops on failure rather than silently rebilling. Verify pricing before each new paid acceptance run. Numeric corpus success alone cannot open public support.

D04 is honestly synthetic handwriting-style. It meets the owner’s allowed recreated demonstration option; it is not human handwritten OCR evidence. The selected synthetic corpus passed live numeric/record checks; it does not establish a real human-handwriting benchmark. See [10 October acceptance evidence](../validation/RET-011.md).
