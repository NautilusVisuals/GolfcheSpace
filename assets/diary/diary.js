(function () {
  'use strict';
  var posts = Array.isArray(window.GolfcheDiary) ? window.GolfcheDiary : [];
  var feed = document.getElementById('diary-feed');
  var detail = document.getElementById('diary-post');
  var query = new URLSearchParams(location.search);
  var postSlug = query.get('post') || document.body.dataset.post || '';

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
  function commentMarkup(post) {
    return '<section class="diary-comments" aria-labelledby="comments-title"><h2 id="comments-title">Comments</h2><div class="diary-comments-list" id="comments-list"><p class="catalog-empty">Loading comments…</p></div><form id="comment-form" class="diary-form"><label for="comment-name">Display name</label><input id="comment-name" name="name" maxlength="60" required autocomplete="nickname"><label for="comment-text">Comment</label><textarea id="comment-text" name="text" rows="5" maxlength="3000" required></textarea><label for="comment-email">Email <span>(private, never displayed)</span></label><input id="comment-email" name="email" type="email" maxlength="254" autocomplete="email"><div class="hp-field" aria-hidden="true"><label>Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label></div><div class="turnstile-slot" data-form="comment"></div><p class="diary-form-note">Comments appear after approval. Email is optional and stays private.</p><button type="submit">Send comment</button><p class="form-status" id="comment-status" role="status"></p></form></section>';
  }
  function renderPost(post) {
    detail.hidden=false;feed.hidden=true;
    document.title=post.title+' — Dear Diary · Golfche Space';
    detail.innerHTML='<a class="diary-back" href="diary.html">← All diary entries</a><header class="diary-post-head"><p class="diary-date">'+escapeHtml(dateLabel(post.date))+'</p><h1>'+escapeHtml(post.title)+'</h1>'+(post.excerpt?'<p class="diary-excerpt">'+escapeHtml(post.excerpt)+'</p>':'')+'<div class="diary-tags">'+(post.tags||[]).map(function(tag){return '<span>'+escapeHtml(tag)+'</span>';}).join('')+'</div></header>'+(post.images||[]).map(imageMarkup).join('')+'<div class="diary-body">'+markdown(post.body)+'</div>'+relatedMarkup(post.relatedLinks)+(post.commentsEnabled?commentMarkup(post):'<p class="diary-form-note">Comments are closed for this entry.</p>');
    if(post.commentsEnabled) loadComments(post.slug);
  }
  async function api(path, options) {
    var response=await fetch(path,Object.assign({headers:{'content-type':'application/json','accept':'application/json'}},options||{}));
    var data=await response.json().catch(function(){return {};});
    if(!response.ok)throw new Error(data.error||'The service could not complete this request.');
    return data;
  }
  function setStatus(id,text,error){var el=document.getElementById(id);if(el){el.textContent=text;el.classList.toggle('is-error',!!error);}}
  async function loadComments(slug){
    var list=document.getElementById('comments-list');if(!list)return;
    try{var data=await api('/api/diary/comments?slug='+encodeURIComponent(slug),{headers:{accept:'application/json'}});list.innerHTML=data.comments.length?data.comments.map(function(item){return '<article class="diary-comment"><h3>'+escapeHtml(item.display_name)+'</h3><p class="diary-date">'+escapeHtml(dateLabel(new Date(item.created_at*1000).toISOString().slice(0,10)))+'</p><p>'+escapeHtml(item.comment_text).replace(/\n/g,'<br>')+'</p></article>';}).join(''):'<p class="catalog-empty">No comments yet. You can leave the first.</p>';}
    catch(error){list.innerHTML='<p class="form-status">'+escapeHtml(error.message)+'</p>';}
  }
  var config=null, widgets={};
  function loadTurnstile(){
    if(!config||!config.turnstileSiteKey||!window.turnstile)return;
    document.querySelectorAll('.turnstile-slot').forEach(function(slot){if(widgets[slot.dataset.form])return;widgets[slot.dataset.form]=window.turnstile.render(slot,{sitekey:config.turnstileSiteKey,callback:function(token){slot.dataset.token=token;},'expired-callback':function(){slot.dataset.token='';}});});
  }
  function tokenFor(form){var slot=form.querySelector('.turnstile-slot');return slot?slot.dataset.token||'':'';}
  function wireForms(){
    var subscribe=document.getElementById('subscribe-form');
    if(subscribe)subscribe.addEventListener('submit',async function(event){event.preventDefault();var submit=subscribe.querySelector('button[type=submit]');submit.disabled=true;try{var data=await api('/api/diary/subscribe',{method:'POST',body:JSON.stringify({email:subscribe.email.value,consent:subscribe.consent.checked,website:subscribe.website.value,turnstileToken:tokenFor(subscribe)})});setStatus('subscribe-status',data.message,false);subscribe.reset();}catch(error){setStatus('subscribe-status',error.message,true);}finally{submit.disabled=false;if(window.turnstile&&widgets.subscribe)window.turnstile.reset(widgets.subscribe);}});
    var comment=document.getElementById('comment-form');
    if(comment)comment.addEventListener('submit',async function(event){event.preventDefault();var submit=comment.querySelector('button[type=submit]');submit.disabled=true;try{var data=await api('/api/diary/comments',{method:'POST',body:JSON.stringify({slug:postSlug,name:comment.name.value,text:comment.text.value,email:comment.email.value,website:comment.website.value,turnstileToken:tokenFor(comment)})});setStatus('comment-status',data.message,false);comment.reset();}catch(error){setStatus('comment-status',error.message,true);}finally{submit.disabled=false;if(window.turnstile&&widgets.comment)window.turnstile.reset(widgets.comment);}});
  }
  function renderUtilityState(){
    if(query.has('confirm')){feed.hidden=true;detail.hidden=false;detail.innerHTML='<h1>Confirming your subscription…</h1><p class="catalog-empty">Please wait.</p>';api('/api/diary/confirm?token='+encodeURIComponent(query.get('confirm')),{headers:{accept:'application/json'}}).then(function(data){detail.innerHTML='<h1>Subscription confirmed</h1><p>'+escapeHtml(data.message)+'</p><a class="diary-back" href="diary.html">Return to Dear Diary</a>';}).catch(function(error){detail.innerHTML='<h1>Confirmation unavailable</h1><p>'+escapeHtml(error.message)+'</p>';});return true;}
    if(query.has('unsubscribe')){feed.hidden=true;detail.hidden=false;detail.innerHTML='<h1>Unsubscribe from Letters from Golfche?</h1><p>Choose below to remove this email from the confirmed subscriber list.</p><button class="diary-action" id="unsubscribe-button" type="button">Unsubscribe</button><p class="form-status" id="unsubscribe-status" role="status"></p>';document.getElementById('unsubscribe-button').addEventListener('click',async function(event){event.currentTarget.disabled=true;try{var data=await api('/api/diary/unsubscribe',{method:'POST',body:JSON.stringify({token:query.get('unsubscribe')})});setStatus('unsubscribe-status',data.message,false);}catch(error){setStatus('unsubscribe-status',error.message,true);event.currentTarget.disabled=false;}});return true;}
    return false;
  }
  if(feed){
    if(!renderUtilityState()){
      var selected=posts.find(function(post){return post.slug===postSlug;});
      if(selected)renderPost(selected);
      else if(postSlug){feed.innerHTML='<p class="catalog-empty">That entry is not available.</p>';}
      else feed.innerHTML=posts.length?posts.map(renderCard).join(''):'<p class="catalog-empty">No diary entries are published yet.</p>';
      wireForms();
      fetch('/api/diary/config').then(function(r){return r.json();}).then(function(value){config=value;if(config.turnstileSiteKey){var script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.defer=true;script.onload=loadTurnstile;document.head.appendChild(script);}else{document.querySelectorAll('.diary-form button[type=submit]').forEach(function(button){button.disabled=true;});document.querySelectorAll('.form-status').forEach(function(el){el.textContent='Online comments and subscriptions are not configured yet.';});}if(!config.emailConfigured){var button=document.querySelector('#subscribe-form button[type=submit]');if(button)button.disabled=true;setStatus('subscribe-status','Email subscriptions are not configured yet.',false);}}).catch(function(){document.querySelectorAll('.diary-form button[type=submit]').forEach(function(button){button.disabled=true;});document.querySelectorAll('.form-status').forEach(function(el){el.textContent='The diary services are not connected for this preview.';});});
    }
  }
})();
