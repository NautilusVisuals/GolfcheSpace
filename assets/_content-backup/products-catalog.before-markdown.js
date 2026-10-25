/*
 * PRODUCT CATALOGUE DATA
 *
 * TO ADD A PRODUCT: Copy one product object below, give it a unique id and slug,
 * update its details and image paths, and save. Put public preview images in
 * assets/products/<id>/ and use paths relative to the website root, for example
 * assets/products/nyxi/03.webp. The downloadable product ZIP belongs in private
 * storage outside this public website folder; never add its path here.
 *
 * Copy the complete example from assets/products/_template/product.js.txt into
 * this array (with a comma between entries). That file is a template only and
 * is not loaded by the website. Keep each new item's public images in its own
 * assets/products/<slug>/ folder. Put paid ZIPs in private storage, never here.
 *
 * To edit a product, change its fields in this array. To remove one from the
 * catalogue, remove its object; stale cart entries for removed products are
 * discarded when the page loads. Keep IDs/slugs unique and stable for links.
 * Set price/salePrice to { amount: 12.50, currency: 'EUR' } only when those are
 * the real values. Leave them null until price and currency are confirmed.
 */
window.GolfcheProducts = [
  {
    id: 'nyxi',
    slug: 'nyxi',
    name: 'Nyxi',
    thumbnail: {
      src: 'assets/products/nyxi/03.webp',
      alt: 'Nyxi character in a dark fantasy look.',
      width: 1800,
      height: 1800
    },
    images: [
      {src:'assets/products/nyxi/02.webp',alt:'Nyxi character promotional render.',width:1160,height:1800},
      {src:'assets/products/nyxi/01.webp',alt:'Nyxi character and close-up material previews.',width:1800,height:1800},
      {src:'assets/products/nyxi/03.webp',alt:'Nyxi character in a dark fantasy look.',width:1800,height:1800},
      {src:'assets/products/nyxi/04.webp',alt:'Nyxi character promotional render.',width:1160,height:1800},
      {src:'assets/products/nyxi/05.webp',alt:'Nyxi character promotional render.',width:1800,height:1800},
      {src:'assets/products/nyxi/06.webp',alt:'Nyxi character in a dark outfit.',width:1160,height:1800}
    ],
    shortDescription: 'A Genesis 9 character package with body, head, full-character, nail, brow, and fang morphs and presets.',
    description: 'Nyxi is a custom Genesis 9 character package. The supplied archive contains character morphs and apply/removal presets, plus skin, eye, makeup, lip, nail, and heart material files with their texture maps. The archive includes no separate product description or license document.',
    price: null,
    salePrice: null,
    compatibility: 'The archive paths identify Genesis 9 content and use DAZ Studio .duf and .dsf files. No minimum DAZ Studio version is stated in the supplied archive.',
    compatibilityLabel: 'Genesis 9',
    badge: null,
    features: [
      'Body, head, full-character, and nail morph files',
      'Character apply and removal presets',
      'Brow and fang presets',
      'Skin, eyes, makeup, lips, nails, and heart material presets'
    ],
    specifications: [
      {name:'Package formats',value:'DAZ Studio .duf presets and .dsf assets'},
      {name:'Figure paths',value:'Genesis 9'}
    ],
    includes: [
      'Body, head, full-character, and nail morph assets in the data/ folder',
      'Genesis 9 body, head, full-character, nail, brow, and fang apply/removal presets in People/Genesis 9/Characters/Golfche/Nyxi/',
      'Skin, heart, eye, makeup, lip, and nail material presets',
      'Character skin and feature texture maps in Runtime/Textures/Golfche/Nyxi/',
      'Preset PNG thumbnails and tip images'
    ],
    installation: 'Extract the archive while preserving its data/, People/, and Runtime/ folder structure into a DAZ Studio content library. Presets are located under People/Genesis 9/Characters/Golfche/Nyxi/. The archive contains no separate installation guide.',
    purchaseUrl: ''
  }
];
