// COPY this object into assets/artworks/catalog.js, inside GolfcheArtworks.
// Replace every value marked CHANGE. Keep field names and punctuation intact.
{
  id: 'CHANGE-unique-id',                 // CHANGE: unique lowercase ID
  title: 'CHANGE-artwork-title',
  thumbnail: {
    src: 'assets/artworks/CHANGE-id/thumbnail.jpg',  // CHANGE: square preview
    alt: 'CHANGE-brief image description',
    width: 800,                           // CHANGE: actual pixel dimensions
    height: 800
  },
  fullImage: {
    src: 'assets/artworks/CHANGE-id/full.jpg',       // CHANGE: full resolution
    alt: 'CHANGE-brief image description',
    width: 2400,                          // CHANGE: actual pixel dimensions
    height: 3000
  },
  caption: '',                            // OPTIONAL: shown in the lightbox
  description: '',                        // OPTIONAL
  category: '',                           // OPTIONAL
  tags: [],                               // OPTIONAL: ['tag-one', 'tag-two']
  date: '',                               // OPTIONAL
  featured: false                         // OPTIONAL: true or false
}

// If you only have one image, use the same path and dimensions above for both
// thumbnail.src and fullImage.src. The gallery/lightbox continues to work.
