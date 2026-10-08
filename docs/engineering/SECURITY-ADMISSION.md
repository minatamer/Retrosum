# Privacy, admission and private transport

Implemented locally in RET-010 on **8 October 2026**. Public live composition is closed. All verification used local/fake or injected adapters, with no provider request or cloud change.

## Connected paths

RET-012's actual nonroot Linux topology exposed Next's internal HTTP/port URL behind TLS termination. Mutating frontend bridges now validate the exact configured `FRONTEND_ORIGIN`, ignore forwarded host/protocol claims, reject missing canonical origin in a hosted context and require Secure admission cookies for the public HTTPS origin. Local tests retain strict loopback fallback. Injected topology/Secure regressions and actual fake/paid-off container probes verify the change; hosted IAM remains a separate gate.

The browser retains originals in its bounded temporary Blob cache, alongside the existing fixed two-hour per-tab projection. Before an available live action it opens a native paper review: selected PDF and business context for extraction; current normalized records, question and recent conversation for Retro. Consent is per action and versioned as `retrosum-processing-v1`. Local controls and declared simulation bypass this flow without loading a challenge script.

After explicit Allow, `POST /api/retrosum/v1/session` establishes or validates the existing content-free run. The managed Cloudflare widget receives an opaque input hash; `/api/retrosum/v1/grants` forwards a bounded token for server verification. Backend verification checks success, hostname, operation class, request hash and challenge age. The grant travels in a request header, never a URL, local storage or transcript. Cancellation, expiry, reset and unmount abort owned work and remove the widget. Reset also increments the grant generation, rejecting a verification already in flight.

The same-origin Next bridge permits only fixed private route paths. Local development accepts loopback HTTP only. Hosted transport requires an HTTPS `run.app` origin, matching `BACKEND_AUDIENCE`, and a Cloud Run `K_SERVICE` context. It requests a short-lived runtime identity from the fixed Google metadata endpoint with the receiving service base URL as audience. It checks audience/expiry and sends that identity to the fixed backend. It never forwards browser Authorization, arbitrary cookies, targets or redirects. Google IAM must validate the identity signature and restrict invocation to the frontend service account; actual IAM acceptance is deferred. [Google service-to-service authentication](https://docs.cloud.google.com/run/docs/authenticating/service-to-service).

## Admission and reservations

The backend ledger holds no financial content: workspace/run identity, hashes, operation/nonces, times and aggregate reservations only. HMAC grants bind the boot epoch, run, workspace, action, operation ID, parsed-input SHA-256 and, for extraction, original SHA-256/retry identity. Cookie claims use the same epoch/run/deadline. Invalid signatures, duplicate cookies, wrong inputs/classes/workspaces, expiry, prior boots and replay reject. Header preflight runs before large JSON or multipart parsing. Full binding is checked after bounded file/graph validation and before dispatch.

Consumption is synchronous: allowance checks, full maximum cost reservation, consumed-operation state and one instance-wide dispatch lease happen without an intervening await. Unknown outcomes retain the full reservation. There is no refund based on a lost response, automatic SDK retry or durable replay cache. Reset discards unused grants and cancels owned controllers; it preserves the independent run cookie, consumed identities and reservations. Refresh does not renew the run deadline. A new workspace cannot reuse the old cookie’s allowance.

| Control                   | Local implementation                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| Run / grant lifetime      | Fixed 30 minutes / at most 2 minutes                                                     |
| Document allowance        | Ten distinct hashes and one deliberate retry of a previously admitted original           |
| Investigation allowance   | Eight `/v1/chat` turns and two `/v1/insights` generations                                |
| Expensive capacity        | One per backend process across extraction/chat/insights                                  |
| Immediate-source attempts | Six/minute and thirty/hour; initial session creation and grant verification              |
| All paid starts           | Twenty/hour per instance                                                                 |
| Memory                    | At most 1,000 runs, 1,000 hashed sources and twenty outstanding grants/run; expiry sweep |
| Token reservation ceiling | USD 2.50 per run, integer micro-USD, current reviewed price policy                       |

Source identity uses only a keyed hash of the immediate socket address. `trust proxy` is false; attacker-supplied forwarding headers cannot invent an identity. Behind a frontend/proxy this may conservatively group visitors into one source. It is **not** a verified end-user IP limit. A trustworthy ingress identity and acceptable aggregate throughput must be measured before public activation.

These process-local controls cannot identify a person or cap the entire owner account. New anonymous identities, process loss, overlapping revisions and extra instances weaken aggregate enforcement. Old-epoch grants fail closed after restart. No durable counter database is introduced. Provider/account controls, monitored balance and paid-off are required complements; a platform budget alert is not a hard cap.

## Bounded resources and output authority

Existing PDF admission remains ten PDFs/twenty pages/twenty MiB, five MiB/original. Multipart fields/files and actual stream bytes are capped. PDF inspection stays in a bounded worker with deadline, operator/image/text limits and drained diagnostics. Frontend extraction streams only a bounded body; provider, bridge, challenge and browser JSON readers cap actual bytes, cancel stalled streams and keep deadlines active through response decoding. Request metadata is always parsed with owned contracts before hashing.

Retro validates the graph, limits context/model requests/tool calls/results and grounds returned facts/sources against the money catalogue. The model cannot select arbitrary URLs, DOM selectors, tools or unconfirmed commands. Financial mutation still uses editable local forms, exact effect preview and explicit confirmation. React renders untrusted strings as text; invoice/ZIP exports retain the established safe filename, masking and inert CSV behavior. Browser original lookup remains session-owned.

Page responses use fresh nonces for framework scripts, strict dynamic script trust, same-origin connections plus the explicit challenge endpoint, local fonts, bounded worker sources, no objects, no framing and same-origin forms. Inline styles remain permitted for owned chart/form geometry. Production has no `unsafe-eval`; development enables it for the framework only. Next’s request nonce forces dynamic page rendering. Client imports cannot reach the server-only transport or the framework proxy entry point.

## Diagnostics and privacy wording

Backend output includes only the allow-listed route, capability mode, HTTP status and bounded rounded duration. It excludes documents, extraction text, chat/contact fields, filenames, source IP, secrets, cookies, grants, arbitrary IDs and raw error objects. A diagnostic sink failure cannot break a request. Usage returned to a requesting client is not printed as a payload. Detailed provider usage and billing measurement remain owner-run evidence, not invented telemetry.

Application request memory is transient; no server originals, Files API library, bucket, database or hosted conversation store is added. `store:false` does not establish universal zero retention. Default API abuse monitoring can retain content for up to thirty days, with file/image and account-policy exceptions. The product links the actual policy rather than promising instantaneous deletion. [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data).

Proposed operator log retention is **seven days** for approved operational application logs; the deployer must configure and verify it, including platform request logs and access controls. It is not currently established in a cloud account. Reset clears browser-owned data, attempts remote cancellation and preserves allowance state. It cannot retract prior downloads or provider-controlled retention.

## Pricing and release gates

The official `gpt-6.1-sol` reference was checked on 8 October 2026: standard short-context input/output rates are USD 2/USD 10 per million tokens. The backend uses supported low reasoning, no paid tools, no automatic retry, and existing request/output limits. Account access is unverified. Long-context and premium tiers require a different price policy and cannot silently use this reservation. [Official model reference](https://developers.openai.com/api/docs/models/gpt-6.1-sol).

Eleven extraction requests at 24k input/6k output and thirty investigation requests at 12k/1.5k produce **41 requests, 624k input and 111k output**, or **USD 2.358 token-only** at those rates. The ledger reserves USD 0.108 per extraction and USD 0.117 for a three-request investigation, retaining the full amount even for known smaller outcomes. USD 2.50 is a process-local admission bound, not a guaranteed bill. PDF imagery/token accounting and billed reasoning units remain unmeasured. The owner’s approximately USD 5 balance is initial test funding; it does not authorize public traffic or imply hosting is free.

`PAID_DEMO_ENABLED=false` overrides live flags. Production composition also keeps `LIVE_ACCEPTANCE_VERIFIED=false` and exposes unavailable capabilities even if credentials exist. There is no browser toggle, environment bypass or automatic provider fallback. Isolated test runtimes explicitly inject a verifier and investigator to exercise guards; they do not activate OpenAI. Before a future controlled release, recheck rates, prove two independently dispatched numeric passes per original, measure an eight-document visit plus Retro/retry usage, establish image input bounds, verify consent/challenge/IAM on the real domain and retain an emergency paid-off rollback. See [release readiness](RELEASE-READINESS.md).

The challenge verifier follows the fixed server validation endpoint, single-use token policy and five-minute bound. The English compact widget fits narrow dialogs; automatic challenge retry/refresh and hidden token fields are disabled. Nonce propagation and `strict-dynamic` follow the provider’s CSP guidance. Real domain/site-key/CSP challenge behavior remains unverified. [Cloudflare validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [widget configuration](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/), [CSP guidance](https://developers.cloudflare.com/turnstile/reference/content-security-policy/).

Production registry audit on 8 October 2026 reported zero advisories across 182 production/optional dependencies. This is an advisory snapshot, not proof of absolute security. Existing asset/font licenses, synthetic PDF provenance and exclusions are recorded in the asset manifests and attribution documents. RET-012 owns image/nonroot/target-runtime verification; no Docker build was performed here.
