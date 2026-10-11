# RET-013 portfolio thumbnail file-level commit plan

Owner authority, 11 October 2026: copy the existing professional thumbnail into the Desktop's `10 Main Screenshots` folder and add it to the root README. The subsequent instruction, "commit the stuff in unstaged," explicitly approves staging and committing the current deployment/portfolio allocation. No new image generation, push or additional deployment is included.

## Proposed allocation — RET-013: add the portfolio cover to the root README

- `README.md` — render the existing cover directly below the product title, using a repository-relative asset link and descriptive alternative text; replace the stale predeployment status with the verified RET-013 release and its remaining acceptance limits.
- `docs/assets/retrosum-overview.png` — exact original cover copied from the previously delivered portfolio; no pixel edits or regeneration. This explicitly requested presentation asset is distinct from excluded build output and private screenshots.
- `docs/commit-plans/RET-013-portfolio.md` — this scope, provenance and verification record.

The short completion notes in the ticket and `docs/validation/RET-013.md` belong to the [deployment evidence plan](RET-013-deployment.md); do not allocate the same files to two commits. Commit its eight documentation paths first, then these three paths. Check exact staged path equality, the full diff, whitespace and content-safe credential patterns for each allocation.

The deployment allocation is committed as `22d60c9` after exact eight-path staged equality, full diff review, clean whitespace and zero credential-pattern matches. Combined documentation formatting, all 54 relative links and matching cover hashes pass. The remaining allocation contains exactly the three paths above; no application or private evidence is included.

Desktop delivery: `10 Main Screenshots/00-Retrosum-thumbnail.png` sorts before the ten numbered original JPEG screenshots. The README copy and Desktop copy both match the original SHA-256 `cb0831ca6d38a99845421eb2a1580dab8ac253ca1e74f822514c6de2e9f1d29a`. Originals remain preserved. Verify image-link resolution, matching hashes, document formatting and Git whitespace. Application tests/builds need no repetition for this documentation/image-only change. Raw screenshots, private logs and generated build output remain excluded from Git.
