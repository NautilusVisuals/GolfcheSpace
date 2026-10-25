(function () {
  'use strict';
  var posts = Array.isArray(window.GolfcheDiary) ? window.GolfcheDiary : [];
  var feed = document.getElementById('diary-feed');
  var detail = document.getElementById('diary-post');
  var postSlug = document.body.dataset.post || '';

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (ch) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]; });
  }
  function inline(value) {
    var text = escapeHtml(value);
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*|#[^\s)]*)\)/g, '<a href="$2" rel="noopener">$1</a>');
    return text;
  }
  function markdown(source) {
    var lines = String(source || '').replace(/\r/g, '').split('\n'), out = [], paragraph = [], list = [], quote = [];
    function flushParagraph(){ if(paragraph.length){out.push('<p>'+paragraph.map(inline).join('<br>')+'</p>');paragraph=[];} }
    function flushList(){ if(list.length){out.push('<ul>'+list.map(function(x){return '<li>'+inline(x)+'</li>';}).join('')+'</ul>');list=[];} }
    function flushQuote(){ if(quote.length){out.push('<blockquote><p>'+quote.map(inline).join('<br>')+'</p></blockquote>');quote=[];} }
    lines.forEach(function(line){
      var heading=/^(#{1,3})\s+(.+)$/.exec(line), bullet=/^\s*[-*+]\s+(.+)$/.exec(line), q=/^>\s?(.*)$/.exec(line);
      if(!line.trim()){flushParagraph();flushList();flushQuote();return;}
      if(heading){flushParagraph();flushList();flushQuote();var level=heading[1].length+1;out.push('<h'+level+'>'+inline(heading[2])+'</h'+level+'>');return;}
      if(bullet){flushParagraph();flushQuote();list.push(bullet[1]);return;}
      if(q){flushParagraph();flushList();quote.push(q[1]);return;}
      flushList();flushQuote();paragraph.push(line);
    });
    flushParagraph();flushList();flushQuote();return out.join('');
  }
  function dateLabel(value) { var d=new Date(value+'T12:00:00');return isNaN(d)?value:new Intl.DateTimeFormat(undefined,{year:'numeric',month:'long',day:'numeric'}).format(d); }
  function imageMarkup(image) {
    return '<figure class="diary-figure"><img src="'+escapeHtml(image.src)+'" width="'+Number(image.width)+'" height="'+Number(image.height)+'" alt="'+escapeHtml(image.alt)+'" loading="lazy" decoding="async">'+(image.caption?'<figcaption>'+escapeHtml(image.caption)+'</figcaption>':'')+'</figure>';
  }
  function renderCard(post) {
    var href='diary/'+encodeURIComponent(post.slug)+'.html';
    return '<article class="diary-card reveal"><a class="diary-card-link" href="'+href+'"><div class="diary-card-media">'+(post.images&&post.images[0]?imageMarkup(post.images[0]):'<span class="diary-card-mark" aria-hidden="true">✦</span>')+'</div><div class="diary-card-copy"><p class="diary-date">'+escapeHtml(dateLabel(post.date))+'</p><h2>'+escapeHtml(post.title)+'</h2>'+(post.excerpt?'<p class="diary-excerpt">'+escapeHtml(post.excerpt)+'</p>':'')+'<div class="diary-tags">'+(post.tags||[]).map(function(tag){return '<span>'+escapeHtml(tag)+'</span>';}).join('')+'</div><span class="diary-read">Open entry <span aria-hidden="true">↗</span></span></div></a></article>';
  }
  function relatedMarkup(links) {
    if(!links||!links.length)return '';
    return '<aside class="diary-related"><h2>Related</h2><ul>'+links.map(function(link){var external=/^https?:\/\//i.test(link.url);return '<li><a href="'+escapeHtml(link.url)+'"'+(external?' target="_blank" rel="noopener"':'')+'>'+escapeHtml(link.title)+'</a></li>';}).join('')+'</ul></aside>';
  }
  function renderPost(post) {
    detail.hidden=false;feed.hidden=true;
    document.title=post.title+' — Dear Diary · Golfche Space';
    detail.innerHTML='<a class="diary-back" href="diary.html">← All diary entries</a><header class="diary-post-head"><p class="diary-date">'+escapeHtml(dateLabel(post.date))+'</p><h1>'+escapeHtml(post.title)+'</h1>'+(post.excerpt?'<p class="diary-excerpt">'+escapeHtml(post.excerpt)+'</p>':'')+'<div class="diary-tags">'+(post.tags||[]).map(function(tag){return '<span>'+escapeHtml(tag)+'</span>';}).join('')+'</div></header>'+(post.images||[]).map(imageMarkup).join('')+'<div class="diary-body">'+markdown(post.body)+'</div>'+relatedMarkup(post.relatedLinks);
  }
  if(feed){
    var selected=posts.find(function(post){return post.slug===postSlug;});
    if(selected)renderPost(selected);
    else if(postSlug){feed.innerHTML='<p class="catalog-empty">That entry is not available.</p>';}
    else feed.innerHTML=posts.length?posts.map(renderCard).join(''):'<p class="catalog-empty">No diary entries are published yet.</p>';
  }
})();
