// COPY this object into assets/products/catalog.js, inside GolfcheProducts.
// Replace every value marked CHANGE. Keep field names and punctuation intact.
// Remove optional fields you do not need. Never put a paid ZIP file in assets/.
{
  id: 'CHANGE-unique-id',                 // CHANGE: unique; use lowercase and hyphens
  slug: 'CHANGE-url-slug',                // CHANGE: unique URL; keep stable after publishing
  name: 'CHANGE-product-name',
  category: 'characters',                 // CHANGE: characters, bundles, or other-assets
  badge: null,                            // CHANGE: null, 'NEW', or 'SALE'
  thumbnail: {
    src: 'assets/products/CHANGE-slug/thumbnail.jpg', // CHANGE: square catalogue image
    alt: 'CHANGE-brief image description',
    width: 1000,                          // CHANGE: actual image pixel dimensions
    height: 1000
  },
  mainImage: {
    src: 'assets/products/CHANGE-slug/main.jpg',      // CHANGE: main detail image
    alt: 'CHANGE-brief image description',
    width: 1600,                          // CHANGE: actual image pixel dimensions
    height: 1600
  },
  images: [                               // CHANGE: extra full-size images, in gallery order
    {src:'assets/products/CHANGE-slug/gallery-01.jpg',alt:'CHANGE-description',width:1600,height:1600}
  ],
  shortDescription: 'CHANGE-short card/detail summary.',
  description: 'CHANGE-full description.',
  price: null,                            // CHANGE only with confirmed price, e.g. {amount:12.5,currency:'EUR'}
  salePrice: null,                        // CHANGE only for a real sale; otherwise leave null
  compatibility: '',                      // OPTIONAL: supported software, figure, version, etc.
  compatibilityLabel: '',                 // OPTIONAL: short label if used in existing design
  features: [],                           // OPTIONAL: ['Feature one', 'Feature two']
  specifications: [],                     // OPTIONAL: [{name:'Format',value:'...'}]
  includes: [],                           // OPTIONAL: list what the buyer receives
  installation: '',                       // OPTIONAL: installation instructions
  purchaseUrl: ''                         // OPTIONAL: confirmed checkout/store URL; blank disables purchase link
}
