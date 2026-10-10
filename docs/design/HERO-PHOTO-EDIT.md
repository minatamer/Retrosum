# Hero photograph edit — 9 October 2026

Owner request: preserve the background photograph first, then add a casually messy pile of paper documents to the wooden desk at the right. The subsequent typewriter-color request was handled before generation.

## Assets and provenance

- Original: `apps/frontend/public/images/office.webp`, 3840 × 2563, 706,628 bytes. Photo by [Max Vakhtbovych / Pexels](https://www.pexels.com/photo/modern-interior-design-of-a-business-office-7534224/), with the existing [Pexels license](https://www.pexels.com/license/) record. No endorsement implied.
- Durable backup made **before generation**: [office-original.webp](assets/office-original.webp). Backup and original both have SHA-256 `7a9191bfdd13bc09cdc052709a9c9c6d0541d8999bddc5ddb72a5d1bbb265f8a`. Original public asset also remains untouched.
- Current app hero: [office-paperwork.webp](../../apps/frontend/public/images/office-paperwork.webp), 1535 × 1025, 138,532 bytes, SHA-256 `7978f3d2a9ee9f637592b702b0c9f99a9a3eecc643696cdf7bdab2d377968426`. Built-in image-generation edit, then WebP encoding through installed Sharp 0.35.5 at quality 92, with no resizing or additional content editing. The generated source is lower resolution than the original; it has not been upscaled or described as 4K.
- Generated PNG copied into ignored local workspace evidence: `artifacts/local/RET-011-imagegen/office-paperwork.png`. The consuming asset is committed-project eligible and does not depend on the tool's output directory.
- The app footer omits the optional photo credit following owner feedback. The [official Pexels license](https://www.pexels.com/license/), checked 9 October 2026, permits modification and does not require attribution. This document retains the photographer/source, license and AI-edit provenance. The current HTML brief references the edited project asset and retains the original/source/license/edit credit; the original remains available for restoration.

The requested GPT-6.1 Sol selector is unavailable in the built-in image tool; this edit used that tool's configured image model. No app API key, paid-processing mode or external deployment was involved.

## Final prompt

```text
Use case: precise-object-edit
Asset type: photorealistic background photograph for the Retrosum landing page hero.
Input image: Image 1 is the edit target: the clean original office photograph.
Primary request: Add a conspicuous, casually messy pile of paper documents on the wooden desk at the far right, beside and behind the black mesh office chair. Use a thick, uneven stack of off-white A4/letter paper with slightly skewed edges, another smaller overlapping stack, and a few loose sheets resting on the tabletop. The piles should be visible above the chair back and on its right side, without covering the chair itself. Make it look like real everyday accumulated invoices and business paperwork, with subtle unidentifiable printed lines and tables.
Style/medium: Preserve photographic realism, natural paper textures, original indoor light, realistic perspective and soft contact shadows on the wood.
Composition/framing: Preserve the original image's landscape aspect ratio, camera viewpoint, exact crop and office geometry. Keep the entire left and center of the photo unchanged as negative space for HTML copy. Only edit the paperwork area on the right tabletop.
Constraints: Keep the walls, blue upholstered seating, framed wall panels, cabinets, hallway, ceiling pipes, floor, desk and chair unchanged. Preserve original color and brightness. Do not add people, other props, logos, watermarks, UI, headings or readable identifying text. Do not recolor the office or add an overlay. Output a high-resolution opaque photo; change only the added paper pile.
```

## Local evidence

Viewed the clean input before generation and inspected the generated/encoded output afterward. The result retains the overall office composition with two uneven paper stacks and loose sheets on the desk. Local laptop browser preview shows the papers behind/right of the chair beneath the existing forest scrim and loads the new responsive Next Image asset. Owner aesthetic approval and physical-device checks remain pending. The settled automated checks passed in the later RET-011 acceptance. Refreshing Linux images for the changed assets/code belongs to deployment preparation; see [current status](../CURRENT-STATUS.md).
