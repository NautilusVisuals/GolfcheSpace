(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var currentPage = document.body.getAttribute('data-page') || 'home';

  /* assemble email at runtime (keeps the raw address out of the HTML source) */
  document.querySelectorAll('a.email').forEach(function(a){
    var addr = a.getAttribute('data-user') + '@' + a.getAttribute('data-domain');
    a.setAttribute('href', 'mailto:' + addr);
    if(a.getAttribute('data-show') === 'true'){ a.textContent = addr; }
  });

  /* reveal-on-scroll */
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:.14});
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });

  var sections = [].slice.call(document.querySelectorAll('main section[id]'));
  function navLinkFor(id){ return document.querySelector('.nav a[data-page="' + (id === 'who' ? 'home' : id) + '"]'); }
  function setActiveNav(link){
    document.querySelectorAll('.nav a').forEach(function(a){ a.removeAttribute('aria-current'); });
    if(link) link.setAttribute('aria-current', 'true');
  }
  document.querySelectorAll('.nav a[data-page]').forEach(function(link){
    link.addEventListener('click',function(){ setActiveNav(link); });
  });

  /* nav-item scroll-progress fill + subtle hero parallax */
  var ticking = false;
  var heroImg = document.querySelector('.hero__img');
  function updateNav(){
    var vh = window.innerHeight;
    if(heroImg && !reduce){
      if(window.innerWidth > 900){
        var py = Math.min(window.scrollY || 0, vh * 0.6) * 0.24;
        heroImg.style.transform = 'translate3d(0,' + py.toFixed(1) + 'px,0)';
      } else {
        heroImg.style.transform = '';
      }
    }
    sections.forEach(function(sec){
      var link = navLinkFor(sec.id);
      if(!link) return;
      var r = sec.getBoundingClientRect();
      var p = (vh * 0.82 - r.top) / Math.max(1, r.height * 0.6);
      p = p < 0 ? 0 : (p > 1 ? 1 : p);
      link.style.setProperty('--p', (p * 100).toFixed(1) + '%');
    });
    ticking = false;
  }
  function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(updateNav); } }
  updateNav();
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll);

  /* scroll-spy: active nav item + per-section background color shift */
  var scenes = {
    home:'#0b0b0d', who:'#0c0d12', products:'#0b0e11',
    artworks:'#0c0d12', stories:'#0b0e10'
  };
  var paletteStyle = getComputedStyle(document.documentElement);
  var palette = {
    neonMagenta:paletteStyle.getPropertyValue('--neon-magenta').trim(),
    hotPink:paletteStyle.getPropertyValue('--hot-pink').trim(),
    electricPurple:paletteStyle.getPropertyValue('--electric-purple').trim(),
    vividViolet:paletteStyle.getPropertyValue('--vivid-violet').trim(),
    softLavender:paletteStyle.getPropertyValue('--soft-lavender').trim()
  };
  var pops = {
    home:palette.electricPurple, who:palette.vividViolet, products:palette.electricPurple,
    artworks:palette.vividViolet, stories:palette.electricPurple
  };
  var headlineColors = [palette.electricPurple,palette.vividViolet,palette.softLavender];
  var headlineColorIndex = headlineColors.indexOf(palette.electricPurple);
  function nextHeadlineColor(){
    headlineColorIndex = (headlineColorIndex + 1) % headlineColors.length;
    document.documentElement.style.setProperty('--headline-pop', headlineColors[headlineColorIndex]);
  }
  var spy = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting){
        var link = navLinkFor(e.target.id);
        setActiveNav(link);
        var sc = scenes[e.target.id];
        if(sc) document.documentElement.style.setProperty('--scene', sc);
        if(e.target.id === 'home'){
          document.documentElement.style.setProperty('--pop', pops.home);
        } else {
          var pc = pops[e.target.id];
          if(pc) document.documentElement.style.setProperty('--pop', pc);
        }
      }
    });
  }, {rootMargin:'-45% 0px -50% 0px'});
  sections.forEach(function(s){ spy.observe(s); });

  /* mobile hamburger menu */
  var toggle = document.querySelector('.navtoggle');
  var sidebar = document.getElementById('primary-nav');
  if(toggle && sidebar){
    function setMenu(open){
      sidebar.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if(open){
        var first = sidebar.querySelector('a');
        if(first) first.focus();
      }
    }
    toggle.addEventListener('click', function(){
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    sidebar.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ setMenu(false); });
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true'){
        setMenu(false);
        toggle.focus();
      }
    });
  }

  if(!reduce && currentPage === 'home'){ setInterval(nextHeadlineColor,650); }

  /* Product data is maintained in assets/products/catalog.js.
     Artwork data is maintained in assets/artworks/catalog.js.
     Artwork fields: id, title, thumbnail{src,alt,width,height},
     fullImage{src,alt,width,height}, optional caption/description.
     Story fields: slug, title, cover{src,alt,width,height}, synopsis, genre, status,
     description, chapters[{title,url}], readingUrl. Image dimensions must match the files. */
  var catalogData = {
    products: window.GolfcheProducts || [],
    artworks: window.GolfcheArtworks || [],
    stories: window.GolfcheStories || []
  };
  var catalogNames = {products:'3D Products',artworks:'Artworks',stories:'Stories'};
  var productsPerPage = 9;
  var productCatalogState = {category:'all',sort:'newest',page:1};
  var storyCatalogType = 'all';
  var storiesVisibleCount = 12;
  function catalogEscape(value){
    return String(value == null ? '' : value).replace(/[&<>"']/g,function(char){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];
    });
  }
  function catalogUrl(value){
    var url = String(value || '').trim();
    return /^(https?:\/\/|\/|\.\/|\.\.\/|[A-Za-z0-9_-]+\/)/i.test(url) ? catalogEscape(url) : '';
  }
  function catalogImages(kind,item){
    if(kind === 'products'){
      var productImages = [];
      if(item.mainImage) productImages.push(item.mainImage);
      if(item.images && item.images.length) productImages = productImages.concat(item.images);
      return productImages.length ? productImages : (item.thumbnail ? [item.thumbnail] : []);
    }
    if(kind === 'stories'){
      var storyImages = item.cover ? [item.cover] : [];
      if(item.pages && item.pages.length) storyImages = storyImages.concat(item.pages);
      if(item.images && item.images.length) storyImages = storyImages.concat(item.images);
      (item.characters || []).forEach(function(character){if(character && character.image) storyImages.push(character.image);});
      (item.lore || []).forEach(function(section){if(section && section.image) storyImages.push(section.image);});
      return storyImages;
    }
    if(item.images && item.images.length) return item.images;
    var image = kind === 'artworks' ? item.image : null;
    return image ? [image] : [];
  }
  function productPrice(item){
    var price = item && item.price;
    return price && typeof price.amount === 'number' && price.amount >= 0 && /^[A-Z]{3}$/.test(price.currency || '') ? price : null;
  }
  function saleProductPrice(item){
    var price = item && item.salePrice;
    return price && typeof price.amount === 'number' && price.amount >= 0 && /^[A-Z]{3}$/.test(price.currency || '') ? price : null;
  }
  function currentProductPrice(item){return saleProductPrice(item) || productPrice(item);}
  function formatPrice(price){
    if(!price) return '';
    try { return new Intl.NumberFormat(undefined,{style:'currency',currency:price.currency}).format(price.amount); }
    catch(error) { return ''; }
  }
  function catalogImageMarkup(image,className,altFallback){
    var src = image && catalogUrl(image.src);
    var width = image && parseInt(image.width,10);
    var height = image && parseInt(image.height,10);
    if(!src || !width || !height){
      return '<div class="catalog-thumb-placeholder" role="img" aria-label="Preview image not added">Preview image not added</div>';
    }
    return '<img class="'+className+'" src="'+src+'" width="'+width+'" height="'+height+'" alt="'+catalogEscape(image.alt || altFallback)+'" loading="lazy" decoding="async">';
  }
  function catalogCard(kind,item){
    var slug = catalogEscape(encodeURIComponent(item.slug || ''));
    var title = item.name || item.title || 'Untitled';
    var image = kind === 'products' && (item.thumbnail || item.cardImage) ? (item.thumbnail || item.cardImage) : (kind === 'stories' && item.cover ? item.cover : catalogImages(kind,item)[0]);
    var summary = item.shortDescription || item.synopsis || item.description || '';
    var meta = kind === 'stories' ? [({fanfiction:'Fanfiction',comic:'Comics'}[item.type] || 'Story'),item.status].filter(Boolean).join(' · ') : item.project;
    var storyReadTime = kind === 'stories' ? (item.readingTime || Math.max(1,Math.ceil(String(item.storyText || '').trim().split(/\s+/).filter(Boolean).length/200)))+' min read' : '';
    var salePrice = kind === 'products' ? saleProductPrice(item) : null;
    var badge = String(item.badge || '').toUpperCase();
    var badges = kind === 'products' ? (((badge==='NEW'||item.isNew)?'<span class="catalog-badge">NEW</span>':'')+((badge==='SALE'||salePrice)?'<span class="catalog-badge catalog-badge--sale">SALE</span>':'')) : '';
    var price = productPrice(item);
    var productMeta = kind === 'products' ? '<div class="product-card__meta"><span class="product-card__price'+(salePrice?' product-card__price--sale':'')+'">'+(salePrice&&price?'<span class="product-card__price-was">'+catalogEscape(formatPrice(price))+'</span>':'')+catalogEscape(formatPrice(salePrice || price)||'Price not set')+'</span></div>' : '';
    return '<a class="card catalog-card" data-kind="'+kind+'" href="#'+kind+'/'+slug+'">'+
      '<div class="catalog-card__media">'+catalogImageMarkup(image,'catalog-thumb',title)+(badges?'<span class="catalog-badges">'+badges+'</span>':'')+'</div>'+
      '<div class="catalog-card__copy">'+(kind==='products'?productMeta:(meta?'<span class="meta meta--pop">'+catalogEscape(meta)+'</span>':''))+
      '<h3>'+catalogEscape(title)+'</h3>'+(kind==='stories'?'<p class="story-card__reading">'+catalogEscape(storyReadTime)+'</p>':'')+(kind==='products'?'':(summary?'<p class="desc">'+catalogEscape(summary)+'</p>':''))+
      (kind==='products'?'':'<span class="go">View details <span class="ar" aria-hidden="true">&#8594;</span></span>')+'</div></a>';
  }
  function artworkImagePair(item){
    var image = item && item.image || {};
    var full = item && item.fullImage || image.full || image;
    var thumb = item && item.thumbnail || image.thumbnail || full;
    return {full:full,thumb:thumb};
  }
  function artworkCard(item,index){
    var pair = artworkImagePair(item);
    var title = item.name || item.title || 'Untitled';
    var thumb = pair.thumb && pair.thumb.src ? catalogImageMarkup(pair.thumb,'artwork-tile__image',title) : '<span class="catalog-thumb-placeholder">Preview image not added</span>';
    return '<button class="card artwork-tile" type="button" data-artwork-index="'+index+'" aria-label="View '+catalogEscape(title)+' full size"><span class="artwork-tile__thumb">'+thumb+'</span><span class="artwork-tile__title">'+catalogEscape(title)+'</span></button>';
  }
  function renderCatalogLists(){
    Object.keys(catalogNames).forEach(function(kind){
      var items = catalogData[kind];
      var grid = document.getElementById(kind+'-grid');
      var empty = document.getElementById(kind+'-empty');
      if(!grid || !empty) return;
      if(kind === 'products'){
        renderProductsCatalog(items,grid,empty);
        return;
      }
      var visibleItems = kind === 'stories' && storyCatalogType !== 'all' ? items.filter(function(item){return item.type === storyCatalogType;}) : items;
      var moreButton = kind === 'stories' ? document.getElementById('stories-more') : null;
      if(kind === 'stories' && moreButton){grid.innerHTML = visibleItems.slice(0,storiesVisibleCount).map(function(item){return catalogCard(kind,item);}).join('');moreButton.hidden = visibleItems.length <= storiesVisibleCount;}
      else grid.innerHTML = kind === 'artworks' ? items.map(artworkCard).join('') : visibleItems.map(function(item){return catalogCard(kind,item);}).join('');
      grid.hidden = visibleItems.length === 0;
      empty.hidden = kind === 'stories' ? items.length > 0 : items.length > 0;
      if(kind === 'stories' && items.length && !visibleItems.length){grid.hidden = false;grid.innerHTML = '<p class="catalog-empty">No items in this category yet.</p>';}
    });
  }
  document.querySelectorAll('.story-filter[data-type]').forEach(function(button){button.addEventListener('click',function(){storyCatalogType=button.getAttribute('data-type');storiesVisibleCount=12;document.querySelectorAll('.story-filter[data-type]').forEach(function(other){other.setAttribute('aria-pressed',other===button?'true':'false');});renderCatalogLists();});});
  var storiesMore = document.getElementById('stories-more');
  if(storiesMore) storiesMore.addEventListener('click',function(){storiesVisibleCount+=12;renderCatalogLists();});
  function normalizedProductCategory(item){
    var value = String(item.category || '').toLowerCase().replace(/[ _]+/g,'-');
    if(value === 'character' || value === 'characters') return 'characters';
    if(value === 'bundle' || value === 'bundles') return 'bundles';
    if(value === 'other' || value === 'other-asset' || value === 'other-assets') return 'other-assets';
    return '';
  }
  function renderProductsCatalog(items,grid,empty){
    var tools = document.getElementById('products-tools');
    var pagination = document.getElementById('products-pagination');
    var count = document.getElementById('products-count');
    var filtered = items.filter(function(item){
      return productCatalogState.category === 'all' || normalizedProductCategory(item) === productCatalogState.category;
    });
    var sort = productCatalogState.sort;
    filtered = filtered.map(function(item,index){return {item:item,index:index};});
    if(sort === 'name') filtered.sort(function(a,b){return String(a.item.name || a.item.title || '').localeCompare(String(b.item.name || b.item.title || ''),undefined,{sensitivity:'base'}) || a.index-b.index;});
    if(sort === 'newest') filtered.sort(function(a,b){
      var dateA = Date.parse(a.item.createdAt || a.item.dateAdded || a.item.publishedAt || '') || 0;
      var dateB = Date.parse(b.item.createdAt || b.item.dateAdded || b.item.publishedAt || '') || 0;
      return dateB-dateA || a.index-b.index;
    });
    if(sort === 'price-low' || sort === 'price-high') filtered.sort(function(a,b){
      var priceA = currentProductPrice(a.item), priceB = currentProductPrice(b.item);
      if(!priceA && !priceB) return a.index-b.index;
      if(!priceA) return 1;
      if(!priceB) return -1;
      var difference = priceA.amount-priceB.amount;
      return (sort === 'price-low' ? difference : -difference) || a.index-b.index;
    });
    var pageCount = Math.ceil(filtered.length/productsPerPage);
    productCatalogState.page = Math.max(1,Math.min(productCatalogState.page,pageCount || 1));
    var start = filtered.length ? (productCatalogState.page-1)*productsPerPage : 0;
    var pageItems = filtered.slice(start,start+productsPerPage);
    grid.innerHTML = pageItems.map(function(row){return catalogCard('products',row.item);}).join('');
    grid.hidden = items.length === 0 || filtered.length === 0;
    empty.hidden = items.length > 0;
    tools.hidden = items.length === 0;
    count.textContent = filtered.length ? 'Showing '+(start+1)+'–'+Math.min(start+productsPerPage,filtered.length)+' of '+filtered.length+' products' : 'Showing 0 products';
    pagination.innerHTML = '';
    pagination.hidden = pageCount <= 1;
    if(pageCount > 1){
      function pageButton(label,page,disabled,current){
        return '<button class="pagination-button" type="button" data-page="'+page+'"'+(disabled?' disabled':'')+(current?' aria-current="page"':'')+'>'+label+'</button>';
      }
      pagination.insertAdjacentHTML('beforeend',pageButton('Previous',productCatalogState.page-1,productCatalogState.page===1,false));
      var pages = [];
      for(var p=1;p<=pageCount;p++) if(p===1 || p===pageCount || Math.abs(p-productCatalogState.page)<=1) pages.push(p);
      var previousPage = 0;
      pages.forEach(function(p){
        if(previousPage && p-previousPage>1) pagination.insertAdjacentHTML('beforeend','<span class="pagination-ellipsis" aria-hidden="true">…</span>');
        pagination.insertAdjacentHTML('beforeend',pageButton(String(p),p,false,p===productCatalogState.page));
        previousPage=p;
      });
      pagination.insertAdjacentHTML('beforeend',pageButton('Next',productCatalogState.page+1,productCatalogState.page===pageCount,false));
    }
  }
  document.querySelectorAll('.product-filter').forEach(function(button){
    button.addEventListener('click',function(){
      productCatalogState.category=button.getAttribute('data-category');
      productCatalogState.page=1;
      document.querySelectorAll('.product-filter').forEach(function(filter){filter.setAttribute('aria-pressed',filter===button?'true':'false');});
      renderCatalogLists();
    });
  });
  var productSort = document.getElementById('products-sort');
  if(productSort) productSort.addEventListener('change',function(event){
    productCatalogState.sort=event.target.value;
    productCatalogState.page=1;
    renderCatalogLists();
  });
  var productPagination = document.getElementById('products-pagination');
  if(productPagination) productPagination.addEventListener('click',function(event){
    var button=event.target.closest('[data-page]');
    if(!button || button.disabled) return;
    productCatalogState.page=parseInt(button.getAttribute('data-page'),10)||1;
    renderCatalogLists();
  });
  function detailBlock(title,content){
    return content ? '<section class="detail-block"><h4>'+catalogEscape(title)+'</h4>'+content+'</section>' : '';
  }
  function detailList(title,items){
    if(!items || !items.length) return '';
    var values = items.map(function(item){
      return typeof item === 'string' ? item : (item && (item.name || item.title || item.value));
    }).filter(Boolean);
    return values.length ? detailBlock(title,'<ul>'+values.map(function(value){return '<li>'+catalogEscape(value)+'</li>';}).join('')+'</ul>') : '';
  }
  function detailChapters(items){
    if(!items || !items.length) return '';
    var entries = items.map(function(item){
      if(typeof item === 'string') return '<li>'+catalogEscape(item)+'</li>';
      if(!item || !item.title) return '';
      var url = catalogUrl(item.url);
      var title = url ? '<a href="'+url+'"'+(/^https?:\/\//i.test(item.url || '')?' target="_blank" rel="noopener"':'')+'>'+catalogEscape(item.title)+'</a>' : catalogEscape(item.title);
      return '<li>'+title+(item.content?'<p>'+catalogEscape(item.content)+'</p>':'')+'</li>';
    }).filter(Boolean);
    return entries.length ? detailBlock('Chapters or comic pages','<ul>'+entries.join('')+'</ul>') : '';
  }
  function storyParagraphs(value){return String(value || '').trim().split(/\n\s*\n/).filter(Boolean).map(function(paragraph){var heading=/^#{1,3}\s+(.+)$/.exec(paragraph.trim());return heading?'<h3>'+catalogEscape(heading[1])+'</h3>':'<p>'+catalogEscape(paragraph).replace(/\n/g,'<br>')+'</p>';}).join('');}
  function storyReadingTime(item){
    if(item.readingTime) return item.readingTime;
    var text=String(item.storyText || '')+' '+(item.chapters || []).map(function(chapter){return chapter && chapter.content || '';}).join(' ');
    return Math.max(1,Math.ceil((text.match(/\b[\w’'-]+\b/g)||[]).length/(item.readingWordsPerMinute||200)));
  }
  function renderDetail(kind,item){
    var title = item && (item.name || item.title) || '';
    if(!item){
      return '<a class="detail-back" href="#'+kind+'">&larr; Back to '+catalogEscape(catalogNames[kind])+'</a><p class="detail-note">This item is not in the catalogue.</p>';
    }
    var images = catalogImages(kind,item).filter(function(image){return image && image.src && image.width && image.height;});
    var mainImage = images[0];
    var media = mainImage ? catalogImageMarkup(mainImage,'detail-main-image',title) : '<div class="detail-image-placeholder">Preview image not added</div>';
    var productGallery = images.length ? images.map(function(image){
      return '<div class="detail-gallery-item">'+catalogImageMarkup(image,'detail-gallery-image',title)+'</div>';
    }).join('') : '<div class="detail-image-placeholder">Preview image not added</div>';
    var thumbs = images.length > 1 ? '<div class="detail-thumbs" role="group" aria-label="Select a product preview">'+images.slice(1).map(function(image,index){
      index += 1;
      return '<button class="detail-thumb" type="button" data-gallery-index="'+index+'" aria-label="Show preview '+(index+1)+'" aria-pressed="false">'+catalogImageMarkup(image,'',title)+'</button>';
    }).join('')+'</div>' : '';
    var intro = item.shortDescription || item.synopsis || '';
    var content = '';
    if(kind === 'products'){
      var productIntro = '<header class="detail-product-intro"><p class="eyebrow">3D Products</p><h3 class="detail-title" tabindex="-1">'+catalogEscape(title || 'Untitled')+'</h3>';
      productIntro += currentProductPrice(item) ? '<p class="detail-price">'+(saleProductPrice(item)&&productPrice(item)?'<del>'+catalogEscape(formatPrice(productPrice(item)))+'</del> ':'')+catalogEscape(formatPrice(currentProductPrice(item)))+'</p>' : '<p class="detail-note">Price not set.</p>';
      productIntro += intro ? '<p class="detail-summary">'+catalogEscape(intro)+'</p>' : '';
      productIntro += '</header>';
      var productContent = detailBlock('Description',item.description?'<p>'+catalogEscape(item.description)+'</p>':'');
      productContent += detailList('Features',item.features);
      productContent += detailBlock('Compatibility',item.compatibility?'<p>'+catalogEscape(item.compatibility)+'</p>':'');
      productContent += detailList("What's Included",item.includes);
      productContent += detailBlock('Installation',item.installation?'<p>'+catalogEscape(item.installation)+'</p>':'');
      var specs = (item.specifications || []).filter(function(spec){return spec && spec.name && spec.value;});
      productContent += specs.length ? detailBlock('Technical specifications','<dl class="detail-specs">'+specs.map(function(spec){return '<dt>'+catalogEscape(spec.name)+'</dt><dd>'+catalogEscape(spec.value)+'</dd>';}).join('')+'</dl>') : '';
      var productActions = '<div class="detail-actions"><button class="detail-purchase detail-add" type="button" data-add-to-cart="'+catalogEscape(item.slug)+'">Add to cart</button>';
      var purchaseUrl = catalogUrl(item.purchaseUrl);
      productActions += purchaseUrl ? '<a class="detail-purchase" href="'+purchaseUrl+'" target="_blank" rel="noopener">Visit store</a>' : '<p class="detail-note">Checkout is unavailable until pricing and payment are configured.</p>';
      productActions += '</div>';
      return '<a class="detail-back" href="#'+kind+'">&larr; Back to '+catalogEscape(catalogNames[kind])+'</a>'+
        '<div class="detail-product-layout"><section class="detail-product-gallery" aria-label="Product images"><div class="detail-product-gallery-list">'+productGallery+'</div></section>'+
        '<div class="detail-product-info">'+productIntro+'<div class="detail-product-body">'+productContent+'</div>'+productActions+'</div></div>';
    } else if(kind === 'artworks'){
      content += intro ? '<p>'+catalogEscape(intro)+'</p>' : '';
      content += detailBlock('Description',item.description?'<p>'+catalogEscape(item.description)+'</p>':'');
      content += detailBlock('Project or character',item.project?'<p>'+catalogEscape(item.project)+'</p>':'');
      var artworkTags = [].concat(item.category || [],item.tags || []).filter(Boolean);
      content += artworkTags.length ? '<p class="detail-note">'+catalogEscape(artworkTags.join(' · '))+'</p>' : '';
      content += item.date ? '<p class="detail-note">'+catalogEscape(item.date)+'</p>' : '';
      content += item.featured ? '<p class="detail-note">Featured</p>' : '';
    } else {
      var storyMeta = [item.genre,item.status].filter(Boolean).join(' · ');
      content += item.fandom ? '<p class="detail-note"><b>Fandom:</b> '+catalogEscape(item.fandom)+'</p>' : '';
      content += item.subtitle ? '<p class="detail-summary">'+catalogEscape(item.subtitle)+'</p>' : '';
      content += storyMeta ? '<p class="detail-note">'+catalogEscape(storyMeta)+'</p>' : '';
      content += '<p class="detail-note story-reading-time">'+catalogEscape(storyReadingTime(item)+' min read')+'</p>';
      content += item.tags && item.tags.length ? '<p class="detail-note">'+catalogEscape(item.tags.join(' · '))+'</p>' : '';
      content += item.rating ? '<p class="detail-note">Rating: '+catalogEscape(item.rating)+'</p>' : '';
      content += detailList('Content warnings',item.warnings || item.contentWarnings);
      content += intro ? '<p>'+catalogEscape(intro)+'</p>' : '';
      content += detailBlock('Story',item.storyText?storyParagraphs(item.storyText):(item.description?storyParagraphs(item.description):''));
      if(item.chapters && item.chapters.length){
        content += '<nav class="story-chapter-nav" aria-label="Chapter navigation"><h4>Chapters</h4><ol>'+item.chapters.map(function(chapter,index){return '<li><a href="#story-chapter-'+index+'">'+catalogEscape(chapter.title || ('Chapter '+(index+1)))+'</a></li>';}).join('')+'</ol></nav>';
        content += item.chapters.map(function(chapter,index){return '<section class="detail-block story-chapter" id="story-chapter-'+index+'"><h4>'+catalogEscape(chapter.title || ('Chapter '+(index+1)))+'</h4>'+storyParagraphs(chapter.content || '')+'</section>';}).join('');
      }
      if(item.characters && item.characters.length){content += '<section class="detail-block"><h4>Characters</h4>'+item.characters.map(function(character){return '<article class="story-character"><h5>'+catalogEscape(character.name || 'Character')+'</h5>'+(character.role?'<p class="story-character__role">'+catalogEscape(character.role)+'</p>':'')+storyParagraphs(character.description || '')+'</article>';}).join('')+'</section>';}
      if(item.lore && item.lore.length){content += '<section class="detail-block story-lore"><h4>Lore</h4>'+item.lore.map(function(section,index){return '<details'+(index===0?' open':'')+'><summary>'+catalogEscape(section.title || 'Lore')+'</summary>'+storyParagraphs(section.content || '')+'</details>';}).join('')+'</section>';}
      content += detailList('Author notes',item.authorNotes ? [item.authorNotes] : []);
      content += item.published ? '<p class="detail-note">Published '+catalogEscape(item.published)+'</p>' : '';
      if(item.type === 'comic' && item.pages && item.pages.length){content += detailBlock('Read the comic','<div class="comic-pages">'+item.pages.map(function(page,index){return '<figure>'+catalogImageMarkup(page,'comic-page-image',title+' page '+(index+1))+(page.caption?'<figcaption>'+catalogEscape(page.caption)+'</figcaption>':'')+'</figure>';}).join('')+'</div>');}
      var readingUrl = catalogUrl(item.readingUrl);
      content += readingUrl ? '<a class="detail-purchase" href="'+readingUrl+'">Read this story</a>' : '';
    }
    if(kind === 'stories'){
      var storyMedia = images.map(function(image,index){return '<button type="button" class="story-art-button" data-story-image="'+index+'" aria-label="Open artwork '+(index+1)+' larger">'+catalogImageMarkup(image,'story-art-image',title)+'</button>';}).join('');
      return '<a class="detail-back" href="#'+kind+'">&larr; Back to '+catalogEscape(catalogNames[kind])+'</a>'+ 
        '<div class="detail-product-layout story-detail-layout"><section class="detail-product-gallery story-gallery" aria-label="Story artwork"><div class="detail-product-gallery-list">'+(storyMedia || media)+'</div></section>'+ 
        '<div class="detail-product-info detail-copy"><header class="detail-product-intro"><p class="eyebrow">'+catalogEscape(storyTypeFor(item))+'</p><h3 class="detail-title" tabindex="-1">'+catalogEscape(title || 'Untitled')+'</h3>'+(item.synopsis?'<p class="detail-summary">'+catalogEscape(item.synopsis)+'</p>':'')+'</header><div class="detail-product-body">'+content+'</div></div></div>';
    }
    return '<a class="detail-back" href="#'+kind+'">&larr; Back to '+catalogEscape(catalogNames[kind])+'</a>'+
      '<div class="detail-layout"><div class="detail-media">'+media+thumbs+'</div><div class="detail-copy">'+
      '<p class="eyebrow">'+catalogEscape(catalogNames[kind])+'</p><h3 class="detail-title" tabindex="-1">'+catalogEscape(title || 'Untitled')+'</h3>'+content+'</div></div>';
  }
  function storyTypeFor(item){return ({fanfiction:'Fanfiction',comic:'Comics'}[item.type] || 'Story');}
  function renderCatalogRoute(scrollToSection){
    Object.keys(catalogNames).forEach(function(kind){
      var list = document.getElementById(kind+'-list');
      var detail = document.getElementById(kind+'-detail');
      if(list) list.hidden = false;
      if(detail) detail.hidden = true;
    });
    var match = /^#(products|artworks|stories)\/([^/]+)$/.exec(location.hash);
    if(!match) return;
    var kind = match[1];
    var slug;
    try { slug = decodeURIComponent(match[2]); } catch(error) { slug = match[2]; }
    var item = catalogData[kind].filter(function(entry){return entry.slug === slug;})[0];
    var detail = document.getElementById(kind+'-detail');
    var list = document.getElementById(kind+'-list');
    if(!detail || !list) return;
    list.hidden = true;
    detail.hidden = false;
    detail.innerHTML = renderDetail(kind,item);
    detail.querySelectorAll('[data-gallery-index]').forEach(function(button){
      button.addEventListener('click',function(){
        var image = detail.querySelector('.detail-main-image');
        var index = parseInt(button.getAttribute('data-gallery-index'),10);
        if(!image || !imagesForRoute[index]) return;
        image.src = imagesForRoute[index].src;
        image.alt = imagesForRoute[index].alt || (item.name || item.title || 'Preview');
        image.width = parseInt(imagesForRoute[index].width,10);
        image.height = parseInt(imagesForRoute[index].height,10);
        detail.querySelectorAll('[data-gallery-index]').forEach(function(other){other.setAttribute('aria-pressed',other===button?'true':'false');});
      });
    });
    var imagesForRoute = item ? catalogImages(kind,item).filter(function(image){return image && image.src && image.width && image.height;}) : [];
    if(scrollToSection){
      document.getElementById(kind).scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
      var detailHeading = detail.querySelector('.detail-title');
      if(detailHeading) detailHeading.focus({preventScroll:true});
    }
  }
  var cartStorageKey = 'golfche-space-cart-v1';
  var cart = [];
  try {
    var savedCart = JSON.parse(localStorage.getItem(cartStorageKey) || '[]');
    if(Array.isArray(savedCart)) cart = savedCart.filter(function(entry){return entry && typeof entry.slug === 'string' && Number.isInteger(entry.quantity) && entry.quantity > 0 && catalogData.products.some(function(product){return product.slug===entry.slug;});});
  } catch(error) { cart = []; }
  function saveCart(){
    try { localStorage.setItem(cartStorageKey,JSON.stringify(cart)); } catch(error) {}
  }
  saveCart();
  function renderCart(){
    var list = document.getElementById('cart-items');
    if(!list) return;
    var count = cart.reduce(function(total,entry){return total+entry.quantity;},0);
    var knownItems = cart.map(function(entry){return {entry:entry,item:catalogData.products.filter(function(product){return product.slug===entry.slug;})[0]};}).filter(function(row){return row.item;});
    var allPrices = knownItems.length > 0 && knownItems.length === cart.length && knownItems.every(function(row){return !!currentProductPrice(row.item);});
    var currencies = allPrices ? knownItems.map(function(row){return currentProductPrice(row.item).currency;}).filter(function(currency,index,all){return all.indexOf(currency)===index;}) : [];
    var canTotal = allPrices && currencies.length === 1;
    list.innerHTML = knownItems.map(function(row){
      var price = currentProductPrice(row.item);
      var subtotal = price && formatPrice({amount:price.amount*row.entry.quantity,currency:price.currency});
      return '<li class="cart-line"><div><span class="cart-line__name">'+catalogEscape(row.item.name)+' × '+row.entry.quantity+'</span><span class="cart-line__price">Unit: '+catalogEscape(formatPrice(price)||'Price not set')+' · Subtotal: '+catalogEscape(subtotal||'Price not set')+'</span></div><button class="cart-remove" type="button" data-cart-remove="'+catalogEscape(row.item.slug)+'" aria-label="Remove '+catalogEscape(row.item.name)+' from cart">Remove</button></li>';
    }).join('');
    document.getElementById('cart-count').textContent = count+' '+(count===1?'item':'items');
    document.getElementById('cart-empty').hidden = count > 0;
    document.getElementById('cart-total').textContent = canTotal ? formatPrice({amount:knownItems.reduce(function(sum,row){return sum+currentProductPrice(row.item).amount*row.entry.quantity;},0),currency:currencies[0]}) : (count ? (allPrices ? 'Currency mismatch' : 'Unavailable until prices are set') : '—');
    document.getElementById('cart-subtotal').textContent = document.getElementById('cart-total').textContent;
  }
  function addCartItem(slug){
    var row = cart.filter(function(entry){return entry.slug===slug;})[0];
    if(!catalogData.products.some(function(product){return product.slug===slug;})) return;
    if(row) row.quantity += 1; else cart.push({slug:slug,quantity:1});
    saveCart();renderCart();
  }
  document.addEventListener('click',function(event){
    var add = event.target.closest('[data-add-to-cart]');
    var remove = event.target.closest('[data-cart-remove]');
    if(add){addCartItem(add.getAttribute('data-add-to-cart'));}
    if(remove){cart=cart.filter(function(entry){return entry.slug!==remove.getAttribute('data-cart-remove');});saveCart();renderCart();}
  });
  window.addEventListener('storage',function(event){if(event.key===cartStorageKey){try{cart=JSON.parse(event.newValue||'[]');if(!Array.isArray(cart))cart=[];cart=cart.filter(function(entry){return entry && typeof entry.slug==='string' && Number.isInteger(entry.quantity) && entry.quantity>0 && catalogData.products.some(function(product){return product.slug===entry.slug;});});}catch(error){cart=[];}renderCart();}});
  renderCatalogLists();
  var artworkViewer = document.getElementById('artwork-lightbox');
  if(artworkViewer){
  var artworkViewerImage = artworkViewer.querySelector('.artwork-lightbox__image');
  var artworkViewerCaption = artworkViewer.querySelector('.artwork-lightbox__caption');
  var artworkViewerZoom = artworkViewer.querySelector('.artwork-lightbox__zoom');
  var artworkViewerIndex = 0;
  var artworkViewerReturnFocus = null;
  var bodyOverflowBeforeArtwork = '';
  function showArtwork(index){
    var artworks = catalogData.artworks;
    if(!artworks.length) return;
    artworkViewerIndex = (index + artworks.length) % artworks.length;
    var item = artworks[artworkViewerIndex];
    var image = artworkImagePair(item).full || {};
    var src = catalogUrl(image.src);
    if(!src) return;
    artworkViewerImage.src = src;
    artworkViewerImage.alt = image.alt || item.title || item.name || 'Artwork';
    if(image.width && image.height){artworkViewerImage.width=parseInt(image.width,10);artworkViewerImage.height=parseInt(image.height,10);}
    else{artworkViewerImage.removeAttribute('width');artworkViewerImage.removeAttribute('height');}
    artworkViewerCaption.textContent = (item.caption || item.description || item.title || item.name || 'Artwork')+' · '+(artworkViewerIndex+1)+' of '+artworks.length;
    artworkViewer.classList.remove('is-zoomed');
    artworkViewerZoom.setAttribute('aria-pressed','false');
    artworkViewerZoom.textContent = 'Zoom in';
  }
  function openArtwork(index,trigger){
    artworkViewerReturnFocus = trigger;
    bodyOverflowBeforeArtwork = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    showArtwork(index);
    artworkViewer.hidden = false;
    artworkViewer.querySelector('.artwork-lightbox__close').focus();
  }
  function closeArtwork(){
    if(artworkViewer.hidden) return;
    artworkViewer.hidden = true;
    artworkViewer.classList.remove('is-zoomed');
    document.body.style.overflow = bodyOverflowBeforeArtwork;
    if(artworkViewerReturnFocus && artworkViewerReturnFocus.isConnected) artworkViewerReturnFocus.focus();
  }
  document.getElementById('artworks-grid').addEventListener('click',function(event){
    var tile = event.target.closest('[data-artwork-index]');
    if(tile) openArtwork(parseInt(tile.getAttribute('data-artwork-index'),10)||0,tile);
  });
  artworkViewer.querySelector('.artwork-lightbox__close').addEventListener('click',closeArtwork);
  artworkViewer.querySelector('.artwork-lightbox__nav--prev').addEventListener('click',function(){showArtwork(artworkViewerIndex-1);});
  artworkViewer.querySelector('.artwork-lightbox__nav--next').addEventListener('click',function(){showArtwork(artworkViewerIndex+1);});
  artworkViewerZoom.addEventListener('click',function(){
    var zoomed = !artworkViewer.classList.contains('is-zoomed');
    artworkViewer.classList.toggle('is-zoomed',zoomed);
    artworkViewerZoom.setAttribute('aria-pressed',zoomed?'true':'false');
    artworkViewerZoom.textContent = zoomed ? 'Fit to screen' : 'Zoom in';
  });
  artworkViewer.addEventListener('click',function(event){if(event.target === artworkViewer || event.target === artworkViewer.querySelector('.artwork-lightbox__stage')) closeArtwork();});
  document.addEventListener('keydown',function(event){
    if(artworkViewer.hidden) return;
    if(event.key === 'Escape'){event.preventDefault();closeArtwork();}
    else if(event.key === 'ArrowLeft'){event.preventDefault();showArtwork(artworkViewerIndex-1);}
    else if(event.key === 'ArrowRight'){event.preventDefault();showArtwork(artworkViewerIndex+1);}
  });
  }
  var storyViewer=document.getElementById('story-lightbox');
  if(storyViewer){
    var storyViewerImage=storyViewer.querySelector('.artwork-lightbox__image');
    var storyViewerCaption=storyViewer.querySelector('.artwork-lightbox__caption');
    var storyViewerReturnFocus=null;
    document.getElementById('stories-detail').addEventListener('click',function(event){
      var trigger=event.target.closest('[data-story-image]');
      if(!trigger) return;
      var item=catalogData.stories.filter(function(entry){return entry.slug===decodeURIComponent((location.hash.split('/')[1]||''));})[0];
      var image=item && catalogImages('stories',item)[parseInt(trigger.getAttribute('data-story-image'),10)];
      if(!image || !image.src) return;
      storyViewerReturnFocus=trigger;
      storyViewerImage.src=catalogUrl(image.src);
      storyViewerImage.alt=image.alt || item.title || 'Story artwork';
      storyViewerImage.width=parseInt(image.width,10);storyViewerImage.height=parseInt(image.height,10);
      storyViewerCaption.textContent=image.alt || item.title || 'Story artwork';
      storyViewer.hidden=false;document.body.style.overflow='hidden';
      storyViewer.querySelector('.artwork-lightbox__close').focus();
    });
    function closeStoryViewer(){if(storyViewer.hidden)return;storyViewer.hidden=true;document.body.style.overflow='';if(storyViewerReturnFocus&&storyViewerReturnFocus.isConnected)storyViewerReturnFocus.focus();}
    storyViewer.querySelector('.artwork-lightbox__close').addEventListener('click',closeStoryViewer);
    storyViewer.addEventListener('click',function(event){if(event.target===storyViewer||event.target===storyViewer.querySelector('.artwork-lightbox__stage'))closeStoryViewer();});
    document.addEventListener('keydown',function(event){if(!storyViewer.hidden&&event.key==='Escape')closeStoryViewer();});
  }
  renderCart();
  renderCatalogRoute(true);
  window.addEventListener('hashchange',function(){renderCatalogRoute(true);});
})();
