/*
 * ARTWORKS GALLERY DATA
 *
 * Add an artwork by copying assets/artworks/_template/artwork.js.txt into this
 * array, assigning a unique id, and changing its title and image paths. Keep
 * files in assets/artworks/<id>/. The template file is not loaded by the site.
 * Set thumbnail.src and fullImage.src to the same path to reuse one file.
 * Keep image dimensions accurate.
 */
window.GolfcheArtworks = [
  {
    id: 'current-hero-artwork',
    title: 'Current hero artwork',
    thumbnail: {
      src: 'assets/hero-final.jpg',
      alt: 'A woman in a blue jacket sits on a car at night.',
      width: 1800,
      height: 1013
    },
    fullImage: {
      src: 'assets/hero-final.jpg',
      alt: 'A woman in a blue jacket sits on a car at night.',
      width: 1800,
      height: 1013
    },
    caption: 'A woman in a blue jacket sits on a car at night.'
  }

  // Example: copy this complete object, add a comma after the object above,
  // then change id, title, thumbnail.src, and fullImage.src.
  // {
  //   id: 'night-study-02',
  //   title: 'Night Study',
  //   thumbnail: {
  //     src: 'assets/artworks/thumbnails/night-study-02.jpg',
  //     alt: 'Night Study artwork preview.',
  //     width: 800,
  //     height: 800
  //   },
  //   fullImage: {
  //     src: 'assets/artworks/originals/night-study-02.jpg',
  //     alt: 'Full-resolution Night Study artwork.',
  //     width: 2400,
  //     height: 3600
  //   },
  //   caption: 'Optional description shown in the viewer.'
  // }
];
