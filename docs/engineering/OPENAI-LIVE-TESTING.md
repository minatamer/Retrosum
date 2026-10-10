# OpenAI local testing

Updated 10 October 2026. The owner-authorized ten-PDF numeric/record checks and seventeen live Retro cases passed with the installed key. Local paid startup is connected; real localhost Turnstile/browser verification passed. See [actual evidence and limitations](../validation/RET-011.md). Earlier preparation statements below are dated historical context.

`PAID_DEMO_ENABLED` is the only paid feature switch. With `FAKE_MODE=false`, `PAID_DEMO_ENABLED=true` requests live document processing and live Retro together; there are no separate document/copilot enablement settings. Credentials, admission and verified acceptance still apply. Keep committed examples fake and paid-off; accepted private local testing does not establish hosted acceptance.

`FAKE_MODE` is the only mode selector. Its default `true` selects local fixtures; `false` requests the accepted OpenAI path, subject to the paid switch and remaining prerequisites. The unused separate provider setting was removed by the owner's 10 October 2026 decision. Hosted acceptance remains independent of those flags.

## Key expiry and restricted permissions

Owner checkpoint, **10 October 2026**: the owner selected **90 days** in the Retrosum project-key creation dialog. Retain that lifetime for local testing. The installed key has now completed live generation and exact input-count requests. The dashboard's final expiry timestamp remains authoritative; it has not been inspected. Keep the secret only in backend `OPENAI_API_KEY` in the ignored `apps/backend/.env.local`.

Ninety days is a project recommendation, not an OpenAI-mandated duration. Start replacement about two weeks before expiry: create a replacement with the same narrow permissions, update the private backend environment, restart, verify the replacement during an authorized bounded test, then revoke the old key. OpenAI recommends expiring project keys and replacement-first rotation; organization/project lifetime policies may impose a shorter maximum. [Official key-expiration guidance](https://developers.openai.com/api/docs/guides/production-best-practices).

Read-only comparison with ScreenPilot's `docs/operations/live-provider-setup.md`, Phase B: its 14 September 2026 owner checkpoint records a restricted OpenAI key with a finite expiry and only Responses write access. It does **not** record the number of days, so a longer lifetime cannot be confirmed. That guide's explicit 30-day key belongs to ElevenLabs and does not establish the OpenAI lifetime. No ScreenPilot secret was read or copied.

Select **Restricted** in the Retrosum key dialog. The following recommendation comes from the current backend's endpoint inventory and OpenAI's resource-permission documentation; saved account permissions have not been verified:

| Permission/resource                                                                                       | Setting                         | Current Retrosum use                                             |
| --------------------------------------------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------- |
| Responses API (`POST /v1/responses`, `POST /v1/responses/input_tokens`)                                   | Write/create-request permission | PDF extraction, Retro investigation and exact input preflight    |
| List models                                                                                               | None                            | The reviewed model ID is fixed in backend policy                 |
| Other model endpoints: chat completions, audio, images, embeddings, Realtime                              | None                            | No requests to these endpoints                                   |
| Files and vector stores                                                                                   | None                            | Original PDF bytes are sent inline as `input_file.file_data`     |
| Agents, Traces, Vaults, Voices, Assistants, Threads, Evals, fine-tuning, Batch and other unused resources | None                            | Local tools and evaluation scripts do not call these hosted APIs |
| Administration and key/project management                                                                 | None                            | The app does not manage the account                              |

Scroll inside the dialog to find **Responses API**; if it appears under the expandable **Model capabilities** group, enable only its Responses child permission. Keep the other children disabled rather than granting the entire group. Do not enable List models just to request a known model. The Responses permission permits creating the result and receiving its body; this implementation does not retrieve stored responses. A read-only key cannot perform the required POST. OpenAI also checks the key owner's project role, so a later permission failure needs its specific missing scope checked rather than automatically broadening the key to All. [Official permission reference](https://developers.openai.com/api/docs/guides/rbac), [Responses creation reference](https://developers.openai.com/api/reference/resources/responses/methods/create).

Model access and spending are separate project settings. In the Retrosum project's Limits, allow the configured `gpt-6.1-sol` model and disable unrelated models where supported; retain conservative spend/rate limits. Key expiry and endpoint permissions do not impose a dollar cap. The installed key's generation/count access is proven by the authorized tests; saved dashboard permissions were not inspected. The owner confirms the configured spending limit is USD 5, already set; its scope/period and enforcement were not independently inspected or changed.

## Current integration

Both backend adapters use the fixed Responses and input-count endpoints, `gpt-6.1-sol`, `service_tier: "default"`, low reasoning, foreground generation and `store: false`. Keys stay in the backend/operator environment; never use a `NEXT_PUBLIC_` variable, commit a key or paste it into chat. Committed examples remain fake and paid-off. The installed key's model/generation/count access is proven; current account balance and saved permissions were not inspected. The configured USD 5 spending limit is owner-confirmed; dashboard scope/period/enforcement remains manual verification, not a pending setup request.

PDF extraction forwards the actual inspected original bytes inline, with strict structured transcription output. Retro receives bounded current-workspace facts, registered topics/tools and recent messages. It returns a typed intent; the application validates it, calculates exact figures, renders source links and owns navigation, editable previews and confirmation. Reasoning/tool output is preserved for stateless continuations. Errors, refusal, incomplete output, excessive usage and deadline cancellation stop the turn without automatic retries.

Contextual shortcuts come from the validated reply. Four starters appear only in empty chat; current explanations offer the relevant highlight and related topics, ambiguous records offer actual choices, and chart proposals offer supported styles. Typed yes/no/style replies resolve only against those current choices. This works with fake and OpenAI responses. Free-form model-authored buttons are unnecessary and would still require the same application validation.

The API tier behavior, strict schema requirements, PDF input and model were checked against official [Responses reference](https://developers.openai.com/api/reference/resources/responses/methods/create), [function calling guide](https://developers.openai.com/api/docs/guides/function-calling), [Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs), [PDF input guide](https://developers.openai.com/api/docs/guides/file-inputs) and [model reference](https://developers.openai.com/api/docs/models/gpt-6.1-sol).

## Private Retro test runner

From the repository root, first build the backend and shared packages:

```powershell
pnpm build:shared
pnpm --filter @retrosum/backend build
pnpm evaluate:retro
```

The last command runs seventeen deterministic fake cases without network, even when the shell contains paid settings. It checks the same investigation/grounding path on a declared Harbor test workspace. It writes an ignored `artifacts/local/retro-evaluation.json` report. This fixture is supplied test input, not evidence that OpenAI has transcribed the PDFs correctly.

When a private key and a paid testing budget have been explicitly approved, set `OPENAI_API_KEY` privately in the operator shell, set `PAID_DEMO_ENABLED=true`, and run:

```powershell
pnpm evaluate:retro --live --confirm-paid
```

No `.env` is loaded automatically by this runner. It checks all opt-ins before dispatch, uses only the fixed endpoint, forbids redirects, reserves the configured three-request allowance before each case, meters reported input/output tokens, verifies the actual standard tier and stops at the first failed/unknown outcome. No retries or financial writes occur. The report records declared prompts, structured decisions, source/tool counts and usage; it excludes keys, provider bodies and raw error messages. Review the live decisions against the question and current workspace before treating intent accuracy as accepted.

The USD 2.50 process-local allowance reserves at USD 2.50/M input (the cache-write ceiling) and USD 10/M output. The fixed token-count endpoint checks the complete PDF/context/schema/tool input before generation, and actual usage/tier is checked afterward. Counting failure/excess rejects generation. Unknown outcomes retain the full reservation; no automatic retries. The owner-confirmed USD 5 OpenAI limit remains separate; account billing enforcement was not tested. Generation ceilings are USD 0.120/extraction and USD 0.135/three-request Retro turn.

## Separate PDF recognition evaluation

After building the backend, the existing runner defaults to local original-byte/hash/page inspection:

```powershell
node scripts/evaluate-recognition.mjs
```

Its paid run requires the same private key and paid environment flag plus:

```powershell
node scripts/evaluate-recognition.mjs --live --confirm-paid
```

It runs two independent passes over the ten visible original PDFs/eighteen pages and compares numeric transcription only after dispatch. The ignored recognition report contains sample interpretations, hashes and usage. Exact numeric accuracy, business-role/event/payment grounding, handwriting, image-token envelope and observed spend need review before release acceptance.

## Local paid mode

The backend's ignored `apps/backend/.env.local` uses `FAKE_MODE=false` and `PAID_DEMO_ENABLED=true`, plus the existing `OPENAI_API_KEY`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` and at least 32-character `GRANT_SIGNING_SECRET`. Keep committed examples fake/paid-off. Use the normal `pnpm dev:backend` and `pnpm dev:frontend` commands, then localhost:3000/demo. Every live action requires its disclosure and a real challenge-bound grant. Keys never enter frontend public environment variables. After editing backend environment values restart the normal stack.

The widget must permit `localhost`; use the matching production site/secret pair. The backend validates hostname/action/request hash/timestamp. If the widget rejects the local hostname, update its hostname setting through the owner's Cloudflare account before testing; do not substitute test keys to claim real acceptance.

Actual localhost testing passed for an invoice, a two-page receipts PDF and a grounded Retro profit explanation, using the installed production challenge pair. If a server restart leaves a signed previous-boot admission cookie, the first Allow rejects and clears only that obsolete cookie: close the review and deliberately send/process again. Current-run refresh and Reset never replenish allowances. Request preparation failure does not spend the document retry; errors after dispatch remain conservatively attempted.

Extraction now separates a 60-second input-count deadline from the 75-second generation deadline, inside a 170-second backend and 175-second browser/bridge bound. The earlier combined 75-second budget timed out during real raster checks. All clocks cover decoding and owned cancellation. Retro retains its 60-second whole-turn bound.

The PDF runner writes progressive checkpoints and reserves unknown attempts. To deliberately resume the identical authorized live candidate, add `--resume`; changed model/prompt/schema/originals reject reuse. Neither runner authorizes release. Hosted IAM/domain/privacy/billing/overlap, general handwriting and owner/physical acceptance remain pending.
