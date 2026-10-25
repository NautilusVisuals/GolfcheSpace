// COPY this object into assets/stories/catalog.js, inside GolfcheStories.
// Replace every value marked CHANGE. Keep field names and punctuation intact.
{
  id: 'CHANGE-unique-id',                 // CHANGE: unique lowercase ID
  slug: 'CHANGE-url-slug',                // CHANGE: unique lowercase URL slug
  title: 'CHANGE-story-title',
  cover: {
    src: 'assets/stories/CHANGE-slug/cover.jpg',     // CHANGE: story card/detail cover
    alt: 'CHANGE-brief image description',
    width: 1200,                          // CHANGE: actual image pixel dimensions
    height: 1800
  },
  synopsis: 'CHANGE-short summary shown on the story card.',
  description: '',                        // OPTIONAL: full story description
  genre: '',                              // OPTIONAL
  status: '',                             // OPTIONAL: for example Ongoing or Complete
  tags: [],                               // OPTIONAL: ['tag-one', 'tag-two']
  chapters: [                             // OPTIONAL: titles, text, and/or external links
    // {title:'Chapter 1',content:'Optional short text.'},
    // {title:'Read Chapter 1',url:'https://example.com/chapter-1'}
  ],
  pages: [                                // OPTIONAL: comic page images, in display order
    // {src:'assets/stories/CHANGE-slug/page-01.jpg',alt:'Page 1',width:1600,height:2400}
  ],
  readingUrl: ''                          // OPTIONAL: link to an external reading page
}
