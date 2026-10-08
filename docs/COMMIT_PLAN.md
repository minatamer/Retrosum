# Retrosum unstaged-work commit decision

Prepared **8 October 2026** against `83c2642` (`RET-000: Add initial product and architecture documentation`).

**Decision: one commit containing all 21 existing changed/new files and this plan — 22 files total.** The staged index was empty when inspected. This document proposes the grouping; no staging or commit has been performed.

## Commit subject

```text
RET-000: refine demo documentation and plan implementation
```

Use `RET-000` because this is a documentation and planning checkpoint. The twelve future implementation tickets remain Planned; their presence does not mean RET-001 through RET-012 have been implemented.

Suggested commit body:

```text
Record the confirmed PDF sample, live OpenAI processing, dashboard and Retro flow.
Define refresh-safe browser storage, session CRUD, inline confirmation and Undo.
Update the visual brief and documentation authority/navigation.
Add twelve cohesive implementation packets with dependencies and acceptance checks.
```

## Why this grouping

The active blueprint defines the decisions implemented by the ticket queue, and the HTML summarizes those same decisions. The root/documentation READMEs, historical notices and imported-methodology adoption notes link to both the active blueprint and new queue. Commit them together so every new reference resolves and the documentation tells one consistent story at this checkpoint.

The HTML's illustrative interactions belong with the documented product direction. The twelve ticket files and their index belong together as one planned backlog. There is no separate application implementation in the current changes that warrants another commit.

## File-level assignment

Every row is assigned to the single commit above. Stage whole files when execution is requested; no hunk split is needed.

| Repository path | Current state | Include | Reason |
| --- | --- | --- | --- |
| `README.md` | Modified | Yes | Current product summary, planning status and links to active docs/queue. |
| `docs/RETROSUM_DEMO_SOURCE_OF_TRUTH.md` | Modified | Yes | Confirmed product decisions, finance/AI/UI/storage contracts, research and twelve-ticket ownership. |
| `docs/RETROSUM_OVERVIEW.html` | Modified | Yes | Matching PM summary, photographic brand direction and illustrative chart/paper/Retro interactions. |
| `docs/retrosum.md` | Modified | Yes | Historical-input notice prevents old requirements overriding the current blueprint. |
| `docs/retrosum.html` | Modified | Yes | Historical-prototype notice points readers to the current brief, blueprint and queue. |
| `docs/LESSONS_LEARNED_FROM_CLIPBUILDER.md` | Modified | Yes | Retrosum adoption note separates imported methodology from current product decisions. |
| `docs/PORTFOLIO_DEMO_BUILD_PLAYBOOK.md` | Modified | Yes | Matching adoption/authority note for the imported sibling playbook. |
| `docs/README.md` | New | Yes | Documentation map, authority and concise confirmed-decision summary. |
| `docs/tickets/README.md` | New | Yes | Canonical twelve-ticket queue, dependencies, status and completion policy. |
| `docs/tickets/RET-001-initialize-workspace-and-contracts.md` | New | Yes | Planned workspace/contracts/safe-runtime foundation. |
| `docs/tickets/RET-002-build-brand-and-landing.md` | New | Yes | Planned visual foundations, sourced landing and reusable interaction shells. |
| `docs/tickets/RET-003-author-sample-pdfs-and-viewer.md` | New | Yes | Planned visible PDF corpus, independent ground truth and floating paper viewer. |
| `docs/tickets/RET-004-build-money-state-crud-and-refresh.md` | New | Yes | Planned canonical money graph, manual CRUD, Undo and browser recovery. |
| `docs/tickets/RET-005-deliver-live-pdf-recognition-and-review.md` | New | Yes | Planned live OpenAI recognition, source review and exact-number acceptance. |
| `docs/tickets/RET-006-build-interactive-money-dashboard.md` | New | Yes | Planned dashboard KPIs, smooth charts, filters and source drill-down. |
| `docs/tickets/RET-007-build-retro-conversation-and-guidance.md` | New | Yes | Planned floating Retro conversation, grounding, summaries, shortcuts and tours. |
| `docs/tickets/RET-008-deliver-retro-animated-crud.md` | New | Yes | Planned editable form animation, inline confirmation and chat Undo. |
| `docs/tickets/RET-009-complete-exports-and-session-lifecycle.md` | New | Yes | Planned revision-bound exports, invoice PDFs and complete session lifecycle. |
| `docs/tickets/RET-010-harden-privacy-admission-and-spend.md` | New | Yes | Planned integrated privacy, private transport, admission and measured spend readiness. |
| `docs/tickets/RET-011-verify-product-and-audit-release.md` | New | Yes | Planned responsive/accessibility/performance verification and release audit. |
| `docs/tickets/RET-012-deploy-and-validate-cloud-run.md` | New | Yes | Planned manual deployment, live verification, operator controls and rollback. |
| `docs/COMMIT_PLAN.md` | New in this request | Yes | Records the exact whole-file grouping and commit subject for this checkpoint. |

## Evidence and execution boundaries

- Current inspection found seven modified tracked files and fourteen untracked documentation files before this plan was added; no staged files.
- The earlier documentation pass checked active local links, ticket dependencies, financial/budget arithmetic and desktop/narrow-phone HTML interactions. Those are documentation/preview checks, not live AI or application implementation evidence.
- The current whitespace check passes. Before executing, recheck the worktree against this exact file list and inspect any additional changes rather than automatically including them.
- No application source, sample PDF binaries, credentials, paid/provider evidence, cloud changes or deployment is part of this commit.
- The screenshot stored outside this repository is a preview artifact and is not part of the commit.
- Do not stage unrelated files with a blanket `git add .`. The manifest above is the complete assignment for this checkpoint.

If the worktree changes after this plan, refresh the assignment before committing. No changes are intentionally deferred from the inspected documentation work.
