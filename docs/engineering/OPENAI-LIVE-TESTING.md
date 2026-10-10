# OpenAI local test preparation

Prepared 10 October 2026 under RET-011. No paid request or API key was used in this preparation pass. Public live dispatch remains closed by `LIVE_ACCEPTANCE_VERIFIED=false`; adding a key alone does not enable live processing or chat in `/demo`.

## Current integration

Both backend adapters use the fixed Responses endpoint, `gpt-6.1-sol`, `service_tier: "default"`, low reasoning, foreground requests and `store: false`. Keys stay in the backend/operator environment; never use a `NEXT_PUBLIC_` variable, commit a key or paste it into chat. Committed examples remain fake and paid-off. A private OpenAI project needs API billing/credits and access to the configured model before a live run; those account conditions have not been tested here.

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

The policy's nominal run allowance is USD 2.50, using standard USD 2/input and USD 10/output per million tokens. Input-token ceilings are validated after a response; they are not an API-enforced prebilling ceiling. Actual image/context tokens, account pricing and unknown outcomes still require live measurement. Set an account/project budget as an additional operator control. A failed run never automatically resumes.

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

## Opening public live mode later

Keep the public gate closed until those live results settle. `runtime/compose.ts` currently advertises only fake capabilities while acceptance is pending; changing environment flags is insufficient. A later reviewed change must wire accepted live document/chat capability and admission together, rerun the origin/grant/usage/abort/failure tests, and test the actual browser path with a funded key. This preparation does not claim public live readiness, live accuracy, account access or deployment acceptance.
