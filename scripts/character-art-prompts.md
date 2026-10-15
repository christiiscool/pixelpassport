# Character and companion artwork

Generated with the built-in ImageGen tool from the supplied reference. The blonde retains her straw hat, blue ribbon, flowers and blue-and-cream dress; the brunette retains her pink beanie and sage backpack. White cat and puppy artwork is independent of both travelers.

Originals: `source-art/characters/`. Optimized transparent WebP atlases: `dist/assets/characters/`. Registration metadata: `src/character-atlas.json`. Run `python scripts/prepare-characters.py --bounds-only` to remeasure viewports without editing artwork. SVG clips select isolated sprites at their natural aspect ratio. The complete reference is retained as source material and is never used as interactive UI.

## blonde-actions

Original: `source-art/characters/blonde-actions.png`  
Delivery: `dist/assets/characters/blonde-actions.webp`

Use case: background-extraction / identity-preserve. Extract and faithfully adapt the BLONDE TRAVELER from the supplied Pixel Passport reference art into an independent transparent sprite atlas. Preserve her actual golden curls, straw hat with blue ribbon and little white flowers, blue-and-white cottagecore travel dress, cream cardigan, brown boots and vintage brown backpack; preserve exactly the cute pixel-art face, coloring and illustrated style from the picture. No brunette, no pink beanie, no animals. Remove ALL parchment, labels, borders, landscapes and UI. Output EXACTLY 3 equal columns x4 equal rows with 12 full-body character sprites, same size, centered within each cell, feet at consistent cell baseline, clean TRANSPARENT alpha, no shadows. In row-major order: 1 idle standing open eyes; 2 identical standing with eyes closed blinking; 3 walking LEFT foot forward; 4 walking RIGHT foot forward; 5 waving; 6 happy; 7 excited; 8 thoughtful with hand near chin; 9 tired eyes closed; 10 cheering both arms raised; 11 reading an unfolded map; 12 holding camera taking photo. Reuse the existing illustrated poses from the reference where applicable; complete the missing states in that identical artwork style. No pet baked into any sprite, no text or labels.

## blonde-wardrobe

Original: `source-art/characters/blonde-wardrobe.png`  
Delivery: `dist/assets/characters/blonde-wardrobe.webp`

Use case: identity-preserve / background-extraction. Pixel Passport wardrobe sprite sheet, use the actual blonde traveler artwork in the reference as source; faithfully isolate/adapt her illustrated body, golden curly hair, red-brown eyes, flowered straw hat and blue ribbon. EXACTLY 3 equal columns x2 equal rows, six FULL BODY standing sprites with boots and feet aligned, same scale. Clean transparent alpha. No animals, no scenery, no lettering, no borders. Row-major outfits: 1 CASUAL: directly use her default travel look from reference, blue white floral cottagecore dress, cream cardigan, blue-ribbon straw hat, vintage brown backpack and brown boots. 2 SKI: distinct pale blue puffer jacket, navy ski trousers, cream snow boots, blue wool winter hat with tiny flowers, goggles on hat, gloves and brown backpack; golden curls visible. 3 SUMMER: directly use the cottagecore dress variant in reference, airy cream floral dress with blue trim, straw hat, brown boots. 4 CITY: directly use pink/coral city coat, blue dress, floral beret from reference. 5 RAIN: directly use blue floral hooded raincoat and blue waterproof boots from reference. 6 HIKING: directly use green outdoor jacket, shorts, larger brown backpack and green hat from reference. Keep her blonde cottagecore identity; never pink beanie, never brunette recoloring. Keep crisp detailed original pixel illustrated style.

## brunette-wardrobe

Original: `source-art/characters/brunette-wardrobe.png`  
Delivery: `dist/assets/characters/brunette-wardrobe.webp`

Use case: identity-preserve. Pixel Passport character wardrobe, preserve the existing brunette traveler's long wavy dark-brown hair, expressive brown eyes, cute face and green backpack from first reference. Match the delicate detailed pixel-art sprite style of the second blonde reference. EXACTLY 3 equal columns x2 equal rows, six independent FULL-BODY standing sprites, same scale and aligned feet. Fully transparent alpha, no animals, no labels, no scenery, no borders. Row-major: 1 CASUAL SIGNATURE: pink knitted beanie, cozy dusty-pink jacket, dark navy jeans, green travel backpack, brown boots. 2 SKI: rose and sage puffer coat, dark ski pants, pink knitted hat with goggles, gloves and snow boots. 3 SUMMER: cream short-sleeved shirt, sage shorts, pink ribbon straw hat, comfortable brown shoes, green backpack. 4 CITY: burgundy beret, sage blazer over cream shirt, dark jeans, brown boots, small leather bag. 5 RAIN: yellow raincoat, pink scarf, navy waterproof boots and umbrella. 6 HIKING: dark sage outdoor jacket, olive hiking trousers, rose beanie, sturdy boots and large green backpack. Preserve brunette pink/sage visual identity; no blonde hair, no blue floral cottagecore dress. Crisp high-quality original pixel art. Distinct outfits, no pet baked in.

## companions

Original: `source-art/characters/companions.png`  
Delivery: `dist/assets/characters/companions.webp`

Use case: background-extraction / identity-preserve. Use the actual fluffy white PUPPY from the reference art, rounded floppy ears, black expressive eyes, cream-white soft fur, pink bandana; isolate its exact illustrated pixel-art identity from reference. Also create a matching fluffy WHITE CAT with pointy pink ears, expressive dark eyes and small pink bow, in exactly that cute pixel-art style. Independent transparent pet sprite atlas, EXACTLY 3 columns x4 rows, 12 pets with NO human character, no UI, no landscape, no writing, no borders, no ground shadows. Row 1 white CAT sitting, walking left foot forward, walking opposite foot forward. Row 2 CAT sleeping curled with closed eyes, playful bow, celebrating happy. Row 3 PUPPY sitting, walking left foot forward, walking opposite foot forward. Row 4 PUPPY sleeping curled, playful bow copied from reference, celebrating happy. Same pet scale in each cell, centered with consistent ground baseline; generous transparent space between sprites. All cells transparent alpha clean cutouts. Fluffy details, pink accessories, warm dark outlines, no brown cat patches. Faithfully preserve the supplied puppy design.

## brunette-actions

Original: `source-art/characters/brunette-actions.png`  
Delivery: `dist/assets/characters/brunette-actions.webp`

Use case: identity-preserve. Production Pixel Passport brunette animation atlas. First reference gives identity, second gives exact style/proportions and cell layout. Make the brunette the SAME CHIBI SIZE and cute large-head/full-body proportions as the blonde action sprites, with long wavy dark-brown hair, pink knit beanie, dusty-pink cozy jacket, dark jeans, green backpack and brown boots. Do NOT use adult proportions. EXACTLY 4 equal columns x3 equal rows, 12 independent full-body sprites, same scale, centered feet baseline, generous TRANSPARENT alpha padding, no pets, no scenery, no lettering. Row-major: idle open eyes, SAME idle eyes closed blinking, walking left leg forward, walking opposite right leg forward, waving, happy smile, excited, thinking hand at chin, tired eyes closed, celebrating arms raised, reading map, taking photo with camera. Match detailed crisp pixel-art style of blonde reference; preserve brunette identity and pink jacket across all poses, do not recolor blonde. No animals or shadows. Distinct actual walk leg poses.
