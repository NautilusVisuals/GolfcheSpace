(function(){
  'use strict';
  var commentsEl=document.getElementById('admin-comments'), subscribersEl=document.getElementById('admin-subscribers'), notifySelect=document.getElementById('notify-post');
  function esc(v){return String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  async function request(url,options){var r=await fetch(url,Object.assign({headers:{'content-type':'application/json','accept':'application/json'}},options||{}));var d=await r.json().catch(function(){return {};});if(!r.ok)throw Error(d.error||'Request failed.');return d;}
  function statusMessage(text,isError){var el=document.getElementById('notify-status');el.textContent=text;el.classList.toggle('is-error',!!isError);}
  function commentRows(rows){commentsEl.innerHTML=rows.length?rows.map(function(c){return '<article class="admin-row"><div><p><strong>'+esc(c.display_name)+'</strong> · '+esc(c.post_slug)+' · '+esc(c.status)+'</p><p>'+esc(c.comment_text)+'</p></div><div class="admin-actions">'+['approved','pending','rejected'].map(function(s){return '<button type="button" data-comment="'+c.id+'" data-status="'+s+'">'+(s==='approved'?'Approve':s==='rejected'?'Reject':'Pending')+'</button>';}).join('')+'<button type="button" data-delete-comment="'+c.id+'">Delete</button></div></article>';}).join(''):'<p class="admin-message">No comments yet.</p>';}
  function subscriberRows(rows){subscribersEl.innerHTML=rows.length?rows.map(function(s){return '<article class="admin-row"><div><p><strong>'+esc(s.email)+'</strong> · confirmed</p><p>Added '+new Date(s.created_at*1000).toLocaleDateString()+'</p></div><div class="admin-actions"><button type="button" data-delete-subscriber="'+s.id+'">Remove</button></div></article>';}).join(''):'<p class="admin-message">No confirmed subscribers.</p>';}
  async function load(){
    try{var data=await request('/api/admin?action=comments');commentRows(data.comments);}
    catch(e){commentsEl.innerHTML='<p class="admin-message">'+esc(e.message)+' Sign in using the administrator email allowed by Cloudflare Access.</p>';}
    try{var data=await request('/api/admin?action=subscribers');subscriberRows(data.subscribers);}
    catch(e){subscribersEl.innerHTML='<p class="admin-message">'+esc(e.message)+'</p>';}
  }
  document.addEventListener('click',async function(event){var b=event.target.closest('button');if(!b)return;
    try{
      if(b.dataset.comment){await request('/api/admin?action=comment',{method:'PATCH',body:JSON.stringify({id:Number(b.dataset.comment),status:b.dataset.status})});await load();}
      if(b.dataset.deleteComment){await request('/api/admin?action=comment&id='+b.dataset.deleteComment,{method:'DELETE'});await load();}
      if(b.dataset.deleteSubscriber){await request('/api/admin?action=subscriber&id='+b.dataset.deleteSubscriber,{method:'DELETE'});await load();}
    }catch(e){statusMessage(e.message,true);}
  });
  posts().then(function(list){if(!notifySelect)return;notifySelect.innerHTML=list.length?list.map(function(p){return '<option value="'+esc(p.slug)+'">'+esc(p.title)+' · '+esc(p.date)+'</option>';}).join(''):'<option value="">No published posts</option>';});
  async function posts(){var list=Array.isArray(window.GolfcheDiary)?window.GolfcheDiary:[];return list.filter(function(p){return p.published===true;});}
  document.getElementById('notify-button').addEventListener('click',async function(event){var button=event.currentTarget,slug=notifySelect.value;if(!slug){statusMessage('Publish a post before sending a notification.',true);return;}button.disabled=true;statusMessage('Sending…',false);try{var result=await request('/api/admin?action=notify',{method:'POST',body:JSON.stringify({slug:slug})});statusMessage(result.message+' Sent: '+result.sent+'. Failed: '+(result.failed||0)+'.',!result.ok);}catch(e){statusMessage(e.message,true);}finally{button.disabled=false;}});
  load();
})();
