# Grey Mochi with a cat collar

Edited using the built-in ImageGen tool, using `source-art/characters/companions.png` as the target/reference. The original companion sheet and puppy artwork are retained.

Saved original: `source-art/characters/mochi-grey.png`.
Delivery atlas: `dist/assets/characters/mochi-grey.webp`.
Six registered poses: idle, two walking frames, sleeping, playing and celebrating. Source pixels retain transparent alpha. `src/character-atlas.json` provides measured and clipped viewports.

## Final prompt

Use case: precise-object-edit. Input image is the edit target and style reference: its FIRST TWO ROWS show Mochi the cat. Create a clean transparent-background sprite atlas of ONLY those six CAT poses, recolored to soft medium silver-grey fur with darker slate-grey shading. Replace every pink neck bow with a simple teal cat collar and a tiny brass round tag, NO bow, NO bandana. Keep the cute expressive cat identity, pink inner ears and nose, dark glossy eyes, fluffy silhouette, crisp detailed pixel-art style, natural proportions and poses. Exactly THREE columns and TWO rows, six isolated full-body cat sprites, generous transparent margins, no overlap, same centered feet baseline within each cell. Top row: seated idle facing front, walking left-leg-forward, walking right-leg-forward. Bottom row: curled up asleep, play bow with tail raised, celebrating with both front paws raised. Preserve pose order from original first six cat sprites. No dogs, no puppy, no extra characters, no text, no labels, no backdrop, no shadows, no frame. Genuine transparent alpha around every sprite.

## Verification

The mobile companion picker and selected traveler preview show grey fur, a teal collar and brass tag with clean transparent edges. The puppy uses its original atlas. All six cat viewports were remeasured, and build plus existing model checks passed. Phone evidence: `docs/screenshots/mochi-grey-phone.jpg`. Existing companion IDs and saved profile selections remain unchanged.
