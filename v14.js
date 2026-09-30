(()=>{
'use strict';
const d=document,$=(s,r=d)=>r.querySelector(s),$$=(s,r=d)=>[...r.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function nav(){
 const header=$('.site-nav'),toggle=$('.menu-toggle'),panel=$('.mobile-menu'),close=$('.v14-command-close');
 const sync=()=>header?.classList.toggle('is-scrolled',scrollY>22);sync();addEventListener('scroll',sync,{passive:true});
 if(!toggle||!panel)return;
 const set=open=>{panel.classList.toggle('open',open);toggle.setAttribute('aria-expanded',open?'true':'false');panel.setAttribute('aria-hidden',open?'false':'true');d.body.classList.toggle('mobile-nav-open',open)};
 toggle.addEventListener('click',e=>{e.stopPropagation();set(!panel.classList.contains('open'))});close?.addEventListener('click',()=>set(false));
 panel.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>set(false)));d.addEventListener('keydown',e=>{if(e.key==='Escape')set(false)});
 const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();panel.querySelectorAll('a[href]').forEach(a=>{if((a.getAttribute('href')||'').split('?')[0].toLowerCase()===page)a.classList.add('is-current')});$$('.nav-links a[href]').forEach(a=>{if((a.getAttribute('href')||'').split('?')[0].toLowerCase()===page)a.classList.add('active')});d.addEventListener('pointerdown',e=>{if(panel.classList.contains('open')&&!panel.contains(e.target)&&!toggle.contains(e.target))set(false)},{passive:true});
}
function reveal(){
 const els=$$('[data-v14-reveal]');if(reduced){els.forEach(x=>x.classList.add('v14-in'));return}
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('v14-in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -7%'});els.forEach(x=>io.observe(x));
}
function services(){
 const links=$$('[data-v14-service-list] a'),fig=$('[data-v14-service-preview]'),img=fig?.querySelector('img'),cap=fig?.querySelector('figcaption');if(!links.length||!fig||!img)return;
 const activate=a=>{links.forEach(x=>x.classList.toggle('is-active',x===a));const src=a.dataset.preview,label=a.dataset.label||'';if(!src||img.getAttribute('src')===src)return;fig.classList.add('is-switching');setTimeout(()=>{img.src=src;img.alt=label;cap.textContent=label;fig.classList.remove('is-switching')},150)};
 links.forEach(a=>{a.addEventListener('mouseenter',()=>activate(a));a.addEventListener('focus',()=>activate(a))});activate(links[0]);
}
function film(){
 const modal=$('[data-film-modal]'),full=$('[data-film-full]');if(!modal)return;const open=()=>{modal.classList.add('open');modal.setAttribute('aria-hidden','false');d.documentElement.classList.add('film-open');if(full){full.currentTime=0;full.play().catch(()=>{})}};const close=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true');d.documentElement.classList.remove('film-open');full?.pause()};$('[data-film-open]')?.addEventListener('click',open);$$('[data-film-close]').forEach(x=>x.addEventListener('click',close));d.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))close()});
}
function mediaDrift(){if(reduced)return;const media=$$('.v14-work-media img,.v14-work-media video,.v14-about-media img');if(!media.length)return;let raf=0;const update=()=>{raf=0;const vh=innerHeight;media.forEach(el=>{const r=el.parentElement.getBoundingClientRect();if(r.bottom<0||r.top>vh)return;const p=(r.top+r.height/2-vh/2)/vh;el.style.transform=`translate3d(0,${Math.max(-10,Math.min(10,-p*12))}px,0) scale(1.025)`})};addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(update)},{passive:true});addEventListener('resize',update,{passive:true});update()}
function assistantLabel(){$$('.assistant-launch span').forEach(x=>x.textContent='Sor')}
function renderMedia(p){const src=p.cover_url||p.media_url||'';if(!src)return '<div class="v14-work-placeholder"></div>';const video=(p.media_type==='video'||/\.(mp4|webm|mov)(\?|$)/i.test(src));return video?`<video src="${esc(src)}" muted loop playsinline preload="metadata"></video>`:`<img src="${esc(src)}" alt="${esc(p.title||'Proje')}" loading="lazy"/>`}
async function cmsSelected(){
 const host=$('[data-v14-selected]');if(!host||!window.PMData)return;try{const rows=(await PMData.projects()).filter(p=>p&&p.published!==false&&p.title&&p.project_url);if(!rows.length)return;const featured=rows.filter(p=>p.featured);const picks=(featured.length?featured:rows).slice(0,4);host.innerHTML=picks.map(p=>`<a class="v14-work-card v14-in" href="${esc(p.project_url)}"><div class="v14-work-media">${renderMedia(p)}</div><div class="v14-work-copy"><span>${esc([p.category,p.content_type].filter(Boolean).join(' / ')||'SELECTED WORK')}</span><h3>${esc(p.title)}</h3><p>${esc((p.tags||p.client||'').split(',').slice(0,3).join(' · '))}</p><i>↗</i></div></a>`).join('');host.querySelectorAll('video').forEach(v=>v.play().catch(()=>{}));mediaDrift();updateArchive(rows)}catch(e){console.warn('V14 selected work fallback active',e)}}
function updateArchive(rows){if(!rows?.length)return;const low=v=>String(v||'').toLocaleLowerCase('tr-TR');const count=q=>rows.filter(p=>q.test(low([p.category,p.content_type,p.tags,p.filter_tags].join(' ')))).length;const film=count(/film|video|reels|konser/),photo=count(/foto/),design=count(/tasar|design/);const set=(k,n,label)=>{const el=$(`[data-v14-count="${k}"]`);if(el&&n)el.textContent=`${String(n).padStart(2,'0')} ${label}`};set('film',film,'iş');set('photo',photo,'iş');set('design',design,'iş')}
async function brands(){const host=$('[data-v14-brands]');if(!host||!window.PMData)return;try{const rows=(await PMData.brands()).filter(x=>x?.name).slice(0,12);if(!rows.length)return;host.innerHTML=rows.map(b=>b.url?`<a href="${esc(b.url)}" target="_blank" rel="noopener">${b.logo_url?`<img src="${esc(b.logo_url)}" alt="${esc(b.name)}"/>`:esc(b.name)}</a>`:`<span>${b.logo_url?`<img src="${esc(b.logo_url)}" alt="${esc(b.name)}"/>`:esc(b.name)}</span>`).join('')}catch(e){console.warn('V14 brand fallback active',e)}}
function boot(){nav();reveal();services();film();assistantLabel();cmsSelected();brands();setTimeout(()=>d.body.classList.add('v14-ready'),20)}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
