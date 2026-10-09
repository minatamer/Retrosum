# Retrosum brand and landing decisions

Date checked: 8 October 2026. RET-002 owns this implemented design direction. Owner aesthetic feedback remains pending. RET-003/006/007/008 connect the PDF viewer, financial dashboard and full Retro behavior.

## Composition and typography

**Permanent logo update, 9 October 2026:** Owner selected the existing browser favicon as the canonical Retrosum mark. `apps/frontend/public/favicon.svg` is the single asset for the ivory geometric R with warm orange dot on a rounded forest square. Shared `BrandMark`/`Wordmark` components use it directly at all app branding points. The compact rail uses the mark alone; full wordmarks pair it with the existing Fraunces product name. Processing also uses the mark instead of a serif R. Preserve the SVG's geometry/colors and do not add alternate R icons. This supersedes the earlier favicon-only role.

The photographic hero occupies exactly the first small viewport (`100svh`), with intrinsic header/content/footer rows. Phone crops keep the office visible while a forest scrim protects the HTML text. A 640 ms one-time entrance, short hover/press motion, chart entrance, paper-dialog entrance, message reveal, spotlight and form emphasis form the motion vocabulary. No animation-off setting or suppression rule exists.

Fraunces supplies professional vintage headings and wordmark character; IBM Plex Sans supplies legible interface copy and tabular financial numerals. Fraunces is an Old Style display serif informed by early twentieth-century forms; Plex was designed for readable print, web and mobile use. Primary descriptions: [Fraunces](https://github.com/google/fonts/blob/main/ofl/fraunces/DESCRIPTION.en_us.html), [IBM Plex Sans](https://github.com/google/fonts/blob/main/ofl/ibmplexsans/DESCRIPTION.en_us.html). They are selected for the actual brand rather than claiming an unsupported universal fintech font standard.

Official Latin variable WOFF2 subsets are served through `next/font/local`; no Google font request occurs at runtime. Georgia and Arial are explicit fallbacks. Weights: Fraunces 100–900, Plex 100–700. Source licenses are retained beside the files. The interface uses cents formatting from the existing money package; illustrative previews do not implement a second financial calculation engine.

## Assets and rights

| Asset                           | Source / rights                                                                                                                                                                                                                                                                                           | Bundled evidence                                                                                                                                           |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Office photo                    | [Max Vakhtbovych, Pexels 7534224](https://www.pexels.com/photo/modern-interior-design-of-a-business-office-7534224/), [Pexels license](https://www.pexels.com/license/) permits website use and modification; attribution optional (checked 9 October 2026), source retained here; no endorsement implied | Original 3840×2563 JPEG reference converted to a 706,628-byte WebP. Next Image serves responsive local variants with reserved hero dimensions and preload. |
| Fraunces                        | [Official Google Fonts family](https://github.com/google/fonts/tree/main/ofl/fraunces), bundled SIL OFL                                                                                                                                                                                                   | Latin WOFF2, 67,304 bytes; official source `https://fonts.gstatic.com/s/fraunces/v38/6NU78FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0KxC9TeA.woff2`     |
| IBM Plex Sans                   | [Official Google Fonts family](https://github.com/google/fonts/tree/main/ofl/ibmplexsans), bundled SIL OFL                                                                                                                                                                                                | Latin WOFF2, 45,712 bytes; official source `https://fonts.gstatic.com/s/ibmplexsans/v23/zYXzKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1syxeKYY.woff2`             |
| Favicon / illustrative diagrams | Original code-native SVG/CSS                                                                                                                                                                                                                                                                              | No imported logo, partner brand or customer image                                                                                                          |

SHA-256 integrity:

- Office WebP: `7a9191bfdd13bc09cdc052709a9c9c6d0541d8999bddc5ddb72a5d1bbb265f8a`
- Fraunces: `7234ed860a9cc83045413c4faee63c960a8f2d1917adcf728119307d56e0d783`
- IBM Plex Sans: `e2291e842cf5af167122a22881a740c7f2dda7716f1e8cd76680264f4a859470`

Photo masters/tool scratch remain in ignored local artifacts; the committed 4K WebP is the high-resolution app source. Binary assets have no executable content. No external runtime photo/font dependency is introduced.

**Owner photo feedback, 9 October 2026:** The original WebP is preserved in public assets and backed up under `docs/design/assets/office-original.webp` before editing. The landing now uses a 1535 × 1025, 138,532-byte WebP with AI-added uneven paper stacks on the right desk, retaining the overall office composition. The original 4K asset remains available for restoration; the edited source is not 4K. The owner removed optional footer attribution; source/license/edit provenance remains in [the asset record](HERO-PHOTO-EDIT.md). Historical asset measurements above describe the original.

## Palette, glass and focus

Forest/deep forest provide the canvas, ivory the copy, logo rust the light-surface accent, warm orange the dark-surface accent. Income is green, costs orange, cash teal, comparisons lilac and review amber. Meaning also appears in labels/numbers rather than color alone.

ClipBuilder's actual glass tokens supplied the layered sheen, backdrop blur/saturation, inset edge highlights and opaque fallback technique. ScreenPilot's actual live-captions/candidate-message CSS supplied the asymmetry: user messages are bubbles, Retro responses remain unboxed. Retrosum has its own forest palette and pill composition.

Measured WCAG relative-luminance contrast ratios for the implemented solid/fallback colors:

| Pair                             | Ratio   |
| -------------------------------- | ------- |
| Ivory on forest glass fallback   | 11.67:1 |
| Muted copy on forest fallback    | 7.57:1  |
| Orange accent on forest fallback | 6.65:1  |
| Forest ink on ivory              | 10.79:1 |
| Rust on paper                    | 5.58:1  |
| Muted ink on paper               | 4.78:1  |
| Deep forest on warm button       | 7.94:1  |

Glass uses an 88% dark surface over its backdrop; unsupported backdrop filtering keeps the solid forest fallback. Focus is rust on light surfaces, amber on dark surfaces, with an explicit light-dialog override. A native modal provides inert background and focus restoration; explicit Tab cycling handles the first/last controls, including the editable field. Body scroll locking is restored on close/unmount.

The floating composer reserves its measured height through a cleaned-up ResizeObserver. Workspace controls have matching scroll margins so scrolling/focusing an action brings it above the dock. Messages have a bounded scroll region; short viewports and safe-area insets are handled without disabling motion. A real hardware software keyboard has not been tested yet.

## Source registry and marketing scope

| Claim                                         | Population / observation                                                                     | Publication                                                    | Primary source                                                                                                                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 75% already use AI                            | 118 respondents to a UK financial-services survey, 2024                                      | 21 November 2024                                               | [Bank of England / FCA](https://www.bankofengland.co.uk/report/2024/artificial-intelligence-in-uk-financial-services-2024)                                                           |
| 42% made digital merchant payments            | Adults in low- and middle-income economies, 2024                                             | World Bank article metadata: 4 August 2025; Global Findex 2025 | [World Bank](https://blogs.worldbank.org/en/allaboutfinance/digital-technology-is-unlocking-financial-inclusion)                                                                     |
| 98% adopted its Assistant                     | Morgan Stanley Wealth Management Financial Advisor teams; internal company-reported adoption | 26 June 2024                                                   | [Morgan Stanley announcement](https://www.morganstanley.com/press-releases/ai-at-morgan-stanley-debrief-launch)                                                                      |
| Accounting, payment and finance agent example | Intuit's announced business tools; no Retrosum partnership                                   | 1 July 2025                                                    | [Intuit announcement](https://investors.intuit.com/news-events/press-releases/detail/1258/intuit-introduces-ground-breaking-virtual-team-of-ai-agents-to-fuel-growth-for-businesses) |

All checked against primary pages on 8 October 2026. Landing captions preserve population/date. AI adoption, digital payments and paperless-document adoption are distinct measures. Names are industry examples, with no affiliation claim. Recheck before public release.

The landing dashboard shows labelled fictional August/September values from the planned visible Harbor corpus. Its clicks explain meaning; they do not claim live extraction. Retro examples are explicitly interaction previews. Landing entry leads to the real `/workspace` route with sample/upload intent; later packets replace the temporary intake preview. No paid calls, persistent financial records or hidden sample dataset are created by RET-002.
