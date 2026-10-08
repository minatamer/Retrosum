# Retrosum repository instructions

Read the complete selected ticket and relevant blueprint sections before edits. Latest owner instructions govern scope. Execute and validate one ticket at a time; advance only after the settled snapshot has no actionable findings except agreed deferred external checks. Do not delegate unless explicitly authorized. Per-ticket staging and commits are authorized; no push or deployment is authorized.

## Architecture and safety

- pnpm 11.25.0 / Node 24 LTS, strict TypeScript; Next frontend, Express backend, browser-safe contracts and pure money package.
- Shared packages never read environment, access platform APIs, use providers/storage/HTTP, or import apps. Apps import packages through public exports. Frontend client code cannot import server modules; server modules use .server.ts and server-only.
- Environment loading/listeners occur only in explicit startup. App factories and imports have no external side effects. Provider adapters stay backend-only. Fake mode and paid-off examples are committed defaults; tests prohibit external network and inherited paid settings.
- Monetary values are exact bounded integer cents. All UI, commands, Retro facts and export calculations reuse the money engine. No hidden financial dataset; sample facts have visible PDF sources. Generated output is untrusted data, never action authority.
- No hosted database, document bucket, persistent chat store, background queue or uploaded-file library. Browser persistence is bounded, per-tab and expires after two hours. Abort/revoke/cleanup owned resources on reset/expiry.

## Product and verification

English/USD; forest green/burnt orange/ivory, professional vintage type, smooth chart/motion interaction. Retro is a floating glass pill composer, user bubbles and unboxed assistant responses, with suggestions/tour/highlights/editable animated forms/confirmation/latest Undo. No product setting disables animation. Hero fills the first device viewport; verify phone/tablet/small and large laptop layouts, height constraints, keyboard and touch paths.

Use focused meaningful tests during iteration. Before closing each ticket run its required checks; root settled gates are pnpm format:check, pnpm lint, pnpm typecheck, pnpm check:boundaries, pnpm test:unit, pnpm build. Browser verification uses the available CUA browser tools. Record actual fake/local/live/cloud evidence separately. Live OpenAI accuracy/spend and owner aesthetic review are pending until available. RET-012 local packaging/preparation is authorized; cloud changes and actual deployment remain deferred.

Write a file-level commit plan under docs/commit-plans/RET-###.md. Keep all commits for a ticket under its prefix; multiple cohesive commits are preferred. Stage explicit allocated paths, inspect staged diff, exclude secrets/dependencies/generated output, and record verification/validation in the ticket and docs/validation/. Do not falsely mark external acceptance complete.
