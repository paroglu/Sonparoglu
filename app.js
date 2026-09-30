(() => {
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     OPENING / PAGE TRANSITIONS
  --------------------------------------------------------- */
  const loader=$('.site-loader');
  const transition=$('.page-transition');
  const isHome=document.body.dataset.home==='true';
  const storageGet=(store,key,fallback='')=>{try{return store.getItem(key)??fallback}catch{return fallback}};
  const storageSet=(store,key,value)=>{try{store.setItem(key,value)}catch{}};
  const firstHome=isHome && !storageGet(sessionStorage,'pmIntroSeenV5');
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
  const cachedHome=clamp(parseInt(storageGet(localStorage,'pmMotionHome','1350'),10)||1350,1050,1500);
  const finishIntro=()=>{
    if(!loader){document.body.classList.add('page-ready');return}
    // Only the first home visit gets the full branded opener. Inner pages open immediately.
    if(reduceMotion || !firstHome){
      loader.classList.add('is-finished');
      document.body.classList.add('page-ready');
      setTimeout(()=>loader.remove(),420);
      return;
    }
    loader.classList.add('is-running');
    setTimeout(()=>{
      loader.classList.add('is-finished');
      document.body.classList.add('page-ready');
      storageSet(sessionStorage,'pmIntroSeenV5','1');
      setTimeout(()=>loader.remove(),620);
    },cachedHome);
  };
  // Start as soon as the DOM script executes; never wait for every image/video to finish loading.
  requestAnimationFrame(finishIntro);

  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href]');
    if(!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target==='_blank' || a.hasAttribute('download')) return;
    const raw=a.getAttribute('href');
    if(!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('javascript:')) return;
    let url; try{url=new URL(raw,location.href)}catch{return}
    if(url.origin!==location.origin) return;
    if(url.pathname===location.pathname && url.hash) return;
    e.preventDefault();
    if(reduceMotion){location.href=url.href;return}
    document.body.classList.add('page-leaving');
    transition?.classList.add('active');
    setTimeout(()=>location.href=url.href,420);
  });

  /* ---------------------------------------------------------
     NAVIGATION + FAVORITE WORK MEGA MENU
  --------------------------------------------------------- */
  const menu=$('.menu-toggle'), mobile=$('.mobile-menu');
  // V14 owns the three-dot command menu interaction.


  let currentProjects=[];
  function buildWorkMega(projects=[]){
    const nav=$('.site-nav'); const workLink=$('.nav-links a[href="isler.html"]');
    if(!nav||!workLink) return;
    const categories=[
      ['TÜM İŞLER','Portfolyo','isler.html'],
      ['VİDEO / REELS','Hareketli işler','isler.html?filter=film'],
      ['FOTOĞRAF','Seçili fotoğraf serileri','fotograf.html'],
      ['KONSER','Film + fotoğraf','konser.html'],
      ['TASARIM','Grafik / kampanya','tasarim.html'],
      ['SPOR / SOSYAL','Kulüp iletişimi','isler.html?filter=sport'],
      ['DRONE','Hava çekimleri','drone.html']
    ];
    let mega=$('.work-mega',nav);
    if(!mega){
      mega=document.createElement('div'); mega.className='work-mega work-mega-categories';
      mega.innerHTML='<div class="work-mega-head"><span>İŞLER / KATEGORİLER</span><a href="isler.html">Tüm işleri gör ↗</a></div><div class="work-mega-grid"></div>';
      nav.appendChild(mega);
      const open=()=>mega.classList.add('open'), close=()=>mega.classList.remove('open');
      workLink.addEventListener('mouseenter',open); workLink.addEventListener('focus',open); mega.addEventListener('mouseenter',open);
      nav.addEventListener('mouseleave',close); workLink.addEventListener('blur',()=>setTimeout(()=>{if(!mega.matches(':hover'))close()},80));
    }
    $('.work-mega-grid',mega).innerHTML=categories.map((c,i)=>`<a class="work-mega-item" href="${c[2]}"><span>${String(i+1).padStart(2,'0')}</span><div><small>${c[0]}</small><strong>${c[1]}</strong></div><i>↗</i></a>`).join('');
    if(mobile && !$('.mobile-work-categories',mobile)){
      const box=document.createElement('div'); box.className='mobile-favorites mobile-work-categories';
      box.innerHTML='<span>İşler / Kategoriler</span>'+categories.map(c=>`<a href="${c[2]}">${c[0]} <i>↗</i></a>`).join('');
      mobile.appendChild(box);
    }
  }
  buildWorkMega();

  /* ---------------------------------------------------------
     HOME HERO MOTION
  --------------------------------------------------------- */
  const hero=$('.hero[data-motion], body[data-home="true"] .hero') || (document.body.dataset.home==='true'?$('.hero'):null);
  if(hero && document.body.dataset.home==='true'){
    if(!$('.hero-ambient',hero)) hero.insertAdjacentHTML('afterbegin','<div class="hero-ambient"><i></i><i></i><i></i></div><div class="hero-ghost" aria-hidden="true">PAROGLU MEDIA</div><div class="hero-beam" aria-hidden="true"></div>');
    if(!reduceMotion){
      hero.addEventListener('pointermove',e=>{
        const r=hero.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
        hero.style.setProperty('--mx',`${x*100}%`); hero.style.setProperty('--my',`${y*100}%`);
        hero.style.setProperty('--px',`${(x-.5)*18}px`); hero.style.setProperty('--py',`${(y-.5)*14}px`);
      });
      addEventListener('scroll',()=>{const g=$('.hero-ghost',hero);if(g)g.style.transform=`translate3d(-50%,${Math.min(scrollY*.07,45)}px,0)`},{passive:true});
    }
  }

  /* ---------------------------------------------------------
     SCROLL / TYPOGRAPHY REVEALS
  --------------------------------------------------------- */
  $$('.section-title,.inner-hero h1,.about-headline').forEach(el=>el.classList.add('motion-title'));
  const io=new IntersectionObserver(entries=>entries.forEach(x=>{if(x.isIntersecting){x.target.classList.add('visible');x.target.classList.add('motion-in');io.unobserve(x.target)}}),{threshold:.10,rootMargin:'0px 0px -4%'});
  $$('.reveal,.motion-title').forEach(el=>io.observe(el));

  /* ---------------------------------------------------------
     CMS CONTENT
  --------------------------------------------------------- */
  async function loadContent(){
    if(!window.PMData) return {};
    try{
      const rows=await PMData.content(); const map=Object.fromEntries(rows.map(r=>[r.key,r.value]));
      const uiText=v=>String(v??'').replace(/Film \/ Reels/g,'Video / Reels').replace(/\bDigital\b/g,'Dijital');
      $$('[data-cms]').forEach(el=>{const v=map[el.dataset.cms]; if(v!=null&&v!=='') el.textContent=uiText(v)});
      $$('[data-cms-html]').forEach(el=>{const v=map[el.dataset.cmsHtml]; if(v!=null&&v!=='') el.innerHTML=uiText(v)});
      $$('[data-cms-href]').forEach(el=>{const v=map[el.dataset.cmsHref]; if(v) el.setAttribute('href',v)});
      document.documentElement.style.setProperty('--marquee-speed',(map['brands.speed_seconds']||'34')+'s');
      window.PMContentMap=map;
      if(map['motion.intro_home_ms']) storageSet(localStorage,'pmMotionHome',String(clamp(parseInt(map['motion.intro_home_ms'],10)||1350,1050,1500)));
      // Inner pages intentionally do not replay the full loader in V5.
      return map;
    }catch(err){console.warn('CMS content unavailable',err);return {}}
  }

  /* ---------------------------------------------------------
     SERVICES
  --------------------------------------------------------- */
  $$('[data-service-mini]').forEach(row=>row.addEventListener('click',e=>{if(e.target.closest('a'))return;const was=row.classList.contains('open');$$('[data-service-mini].open').forEach(x=>x.classList.remove('open'));if(!was)row.classList.add('open')}));
  $$('[data-service-toggle]').forEach(btn=>btn.addEventListener('click',()=>{
    const item=btn.closest('[data-service]'); const was=item.classList.contains('open');
    $$('[data-service].open').forEach(x=>{x.classList.remove('open');const b=$('[data-service-toggle]',x);if(b){b.setAttribute('aria-expanded','false');const s=$('span',b);if(s)s.textContent='Detayı Gör'}});
    if(!was){item.classList.add('open');btn.setAttribute('aria-expanded','true');const span=btn.querySelector('span');if(span)span.textContent='Kapat'}
  }));

  /* ---------------------------------------------------------
     PROJECT CARDS / MEDIA CROSSFADE
  --------------------------------------------------------- */
  const knownProjectFallbacks=[
    {re:/karab[uü]k.*idman|idman.*karab[uü]k/i,title:'Karabük İdman Yurdu',cover_url:'karabuk-idman-yurdu-01.png',project_url:'karabuk-idman-yurdu.html',category:'Sosyal Medya',content_type:'Spor',tags:'Maç Günü, Transfer, Taraftar, Tasarım',ratio:'4:5'},
    {re:/kepez/i,title:'Maç Günü Tasarımları',client:'Kepezspor',cover_url:'kepezspor-matchday-01.jpg',project_url:'kepezspor.html',category:'Sosyal Medya',content_type:'Spor',tags:'Maç Günü, Tasarım, Spor İletişimi',ratio:'4:5'},
    {re:/çorlu|corlu/i,title:'Çorluspor 1947',cover_url:'corluspor-1947-01.jpg',project_url:'corluspor.html',category:'Sosyal Medya',content_type:'Spor',tags:'Maç Günü, İlk 11, Maç Sonucu, Kupa',ratio:'4:5'},
    {re:/konser|sefo|hakan peker|dedubl|poizi/i,title:'Konser İçerikleri',cover_url:'concert-sefo-poster.jpg',project_url:'konser.html',category:'Konser',content_type:'Reels',tags:'Sahne, Backstage, Dikey Video',ratio:'4:5'},
    {re:/tasar[iı]m|grafik/i,title:'Tasarım Çalışmaları',cover_url:'design-yilmaz-gucumuz-ekibimiz.jpg',project_url:'tasarim.html',category:'Grafik Tasarım',content_type:'Sosyal Medya',tags:'Sosyal Medya, Outdoor, Kampanya, Kurumsal',ratio:'4:5'}
  ];
  function normalizeProject(p={}){
    const q={...p};
    const hay=[q.title,q.client,q.slug,q.category,q.content_type].filter(Boolean).join(' ');
    const known=knownProjectFallbacks.find(x=>x.re.test(hay));
    if(known){for(const [k,v] of Object.entries(known)){if(k!=='re' && (!q[k] || q[k]==='#'))q[k]=v}}
    q.title=String(q.title||'').trim();
    q.project_url=String(q.project_url||'').trim();
    if(!q.title || !q.project_url || q.project_url==='#') return null;
    return q;
  }

  function mediaMarkup(p){
    const cover=p.cover_url||''; const media=p.media_url||'';
    if(!cover&&!media) return `<div class="project-visual ${p.visual_class||'visual-design'}"></div>`;
    const render=(src,kind,cls)=>{const isVideo=kind==='video'||/\.(mp4|webm|mov)(\?|$)/i.test(src);return isVideo?`<video class="${cls}" src="${esc(src)}" muted loop playsinline preload="metadata"></video>`:`<img class="${cls}" src="${esc(src)}" alt="${esc(p.title||'Proje')}" loading="lazy"/>`};
    const primary=cover||media; const secondary=cover&&media&&cover!==media?media:'';
    return `<div class="project-visual media-stack">${render(primary,cover?'image':p.media_type,'media-primary')}${secondary?render(secondary,p.media_type,'media-secondary'):''}<span class="media-sheen"></span></div>`;
  }
  function projectCard(p, cls=''){
    const tags=(p.tags||'').split(',').map(x=>x.trim()).filter(Boolean).join(' · ');
    const cats=[p.category,p.content_type].filter(Boolean).join(' · ').replace(/\bDigital\b/g,'Dijital') || 'Kreatif İş'; const url=p.project_url||'#';
    return `<article class="work-item reveal visible ${cls}" data-tags="${esc((p.filter_tags||p.tags||'').toLowerCase().replaceAll(' ',''))}" data-ratio="${esc(p.ratio||'16:9')}"><a class="project-card" href="${esc(url)}">${mediaMarkup(p)}<div class="project-meta"><div><div class="eyebrow">${esc(cats)}${p.year?' · '+esc(p.year):''}</div><h3>${esc(p.title||'Proje')}</h3>${tags?`<div class="project-tags">${esc(tags)}</div>`:''}${p.client?`<div class="project-client">${esc(p.client)}</div>`:''}</div><div class="view-chip">↗</div></div></a></article>`;
  }
  function enhanceCards(root=document){
    $$('.project-card',root).forEach(card=>{
      if(card.dataset.enhanced)return;card.dataset.enhanced='1';
      card.addEventListener('pointerenter',()=>{const v=$('.media-secondary',card);if(v?.tagName==='VIDEO')v.play().catch(()=>{});});
      card.addEventListener('pointerleave',()=>{const v=$('.media-secondary',card);if(v?.tagName==='VIDEO'){v.pause();v.currentTime=0}});
      card.addEventListener('pointermove',e=>{if(reduceMotion)return;const r=card.getBoundingClientRect();card.style.setProperty('--cx',`${((e.clientX-r.left)/r.width)*100}%`);card.style.setProperty('--cy',`${((e.clientY-r.top)/r.height)*100}%`)});
    });
  }
  enhanceCards();

  const hoverCursor=document.createElement('div');hoverCursor.className='project-cursor';hoverCursor.textContent='İNCELE';document.body.appendChild(hoverCursor);
  document.addEventListener('pointermove',e=>{if(matchMedia('(pointer:fine)').matches){hoverCursor.style.transform=`translate3d(${e.clientX+15}px,${e.clientY+15}px,0)`;hoverCursor.classList.toggle('show',!!e.target.closest('.project-card'))}});

  async function loadProjects(){
    const host=$('[data-project-grid]'); if(!host||!window.PMData) return [];
    try{
      const rows=(await PMData.projects()).map(normalizeProject).filter(Boolean);
      currentProjects=rows;
      if(rows.length){host.innerHTML=rows.map(p=>projectCard(p)).join('');enhanceCards(host);buildWorkMega(rows)}
      return rows;
    }catch(err){console.warn('Projects unavailable',err);return []}
  }
  function slideMedia(p){
    const src=p.cover_url||p.media_url||'';
    const isVideo=/\.(mp4|webm|mov)(\?|$)/i.test(src);
    if(!src)return '<div class="portfolio-slide-fallback"></div>';
    return isVideo
      ? `<video src="${esc(src)}" muted loop playsinline preload="metadata"></video>`
      : `<img src="${esc(src)}" alt="${esc(p.title||'Proje')}" loading="lazy" decoding="async">`;
  }
  function renderFeaturedShowcase(rows=[]){
    const host=$('[data-featured-grid]');if(!host||!rows.length)return;
    const picks=rows.slice(0,6);
    const slide=p=>{
      const cats=[p.category,p.content_type].filter(Boolean).join(' · ').replace(/\bDigital\b/g,'Dijital')||'KREATİF İŞ';
      const tags=(p.tags||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,4).join(' · ');
      return `<a class="portfolio-slide" href="${esc(p.project_url||'isler.html')}">${slideMedia(p)}<div class="portfolio-slide-shade"></div><div class="portfolio-slide-content"><div class="portfolio-slide-eyebrow">${esc(cats)}${p.year?' · '+esc(p.year):''}</div><h3>${esc(p.title||'Proje')}</h3>${tags?`<p>${esc(tags)}</p>`:''}<span>Projeyi İncele ↗</span></div></a>`;
    };
    const mini=p=>`<a class="portfolio-mini" href="${esc(p.project_url||'isler.html')}">${slideMedia(p)}<div><small>${esc([p.category,p.content_type].filter(Boolean).join(' · ')||'KREATİF İŞ')}</small><strong>${esc(p.title||'Proje')}</strong></div><i>↗</i></a>`;
    host.innerHTML=`<div class="portfolio-stage" aria-label="Seçili portfolyo işleri"><div class="portfolio-slides">${picks.map(slide).join('')}</div><div class="portfolio-stage-ui"><div class="portfolio-count"><strong data-portfolio-current>01</strong><span>/</span><span data-portfolio-total>${String(picks.length).padStart(2,'0')}</span></div><div class="portfolio-progress"><i></i></div><div class="portfolio-arrows"><button type="button" data-portfolio-prev aria-label="Önceki proje">←</button><button type="button" data-portfolio-next aria-label="Sonraki proje">→</button></div></div></div><div class="portfolio-mini-grid">${picks.slice(0,4).map(mini).join('')}</div>`;
    initPortfolioSlider(host);
  }
  function initPortfolioSlider(root=$('[data-portfolio-slider]')){
    if(!root||root.dataset.sliderReady==='1')return;
    const slides=$$('.portfolio-slide',root);if(!slides.length)return;
    root.dataset.sliderReady='1';
    let index=Math.max(0,slides.findIndex(x=>x.classList.contains('is-active')));if(index<0)index=0;
    slides.forEach((s,i)=>s.classList.toggle('is-active',i===index));
    const current=$('[data-portfolio-current]',root), total=$('[data-portfolio-total]',root), progress=$('.portfolio-progress i',root), stage=$('.portfolio-stage',root);
    if(total)total.textContent=String(slides.length).padStart(2,'0');
    let timer=null,startX=null;
    const resetProgress=()=>{if(!progress||reduceMotion)return;progress.style.animation='none';void progress.offsetWidth;progress.style.animation='portfolioProgress 4.8s linear forwards'};
    const playVideo=i=>{slides.forEach((s,n)=>{const v=$('video',s);if(!v)return;if(n===i)v.play().catch(()=>{});else{v.pause();v.currentTime=0}})};
    const go=(next,dir=1)=>{
      if(slides.length<2)return;
      next=(next+slides.length)%slides.length;if(next===index)return;
      root.classList.toggle('dir-prev',dir<0);
      const prev=index;slides[prev].classList.remove('is-active');slides[prev].classList.add('is-exiting');
      slides[next].classList.remove('is-exiting');void slides[next].offsetWidth;slides[next].classList.add('is-active');
      setTimeout(()=>slides[prev]?.classList.remove('is-exiting'),760);
      index=next;if(current)current.textContent=String(index+1).padStart(2,'0');playVideo(index);resetProgress();
    };
    const start=()=>{if(reduceMotion||slides.length<2)return;clearInterval(timer);timer=setInterval(()=>go(index+1,1),4800);resetProgress()};
    const pause=()=>{clearInterval(timer);timer=null;if(progress)progress.style.animationPlayState='paused'};
    const resume=()=>{if(progress)progress.style.animationPlayState='running';start()};
    $('[data-portfolio-next]',root)?.addEventListener('click',()=>{go(index+1,1);start()});
    $('[data-portfolio-prev]',root)?.addEventListener('click',()=>{go(index-1,-1);start()});
    stage?.addEventListener('mouseenter',pause);stage?.addEventListener('mouseleave',resume);
    stage?.addEventListener('focusin',pause);stage?.addEventListener('focusout',resume);
    stage?.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;startX=e.clientX},{passive:true});
    stage?.addEventListener('pointerup',e=>{if(startX==null)return;const dx=e.clientX-startX;startX=null;if(Math.abs(dx)>42){go(index+(dx<0?1:-1),dx<0?1:-1);start()}},{passive:true});
    playVideo(index);start();
  }
  async function loadFeatured(){
    const host=$('[data-featured-grid]'); if(!host) return;
    initPortfolioSlider(host);
    if(!window.PMData) return;
    try{
      const all=(await PMData.projects()).map(normalizeProject).filter(Boolean);
      const featured=all.filter(x=>x.featured);
      const rows=(featured.length?featured:all).slice(0,6);
      // Admin panel is the source of truth. Static cards remain only as offline fallback.
      if(rows.length)renderFeaturedShowcase(rows);
      buildWorkMega(all);
    }catch(err){console.warn('Featured unavailable',err)}
  }

  /* Works filtering with staged reflow instead of abrupt layout jumps */
  function filterWorks(filter){
    const items=$$('.work-item'); if(!items.length)return;
    const first=new Map(items.filter(x=>!x.hidden).map(x=>[x,x.getBoundingClientRect()]));
    const hiding=items.filter(it=>{const tags=(it.dataset.tags||'').split(',');return !(filter==='all'||tags.includes(filter))&&!it.hidden});
    const showing=items.filter(it=>{const tags=(it.dataset.tags||'').split(',');return (filter==='all'||tags.includes(filter))&&it.hidden});
    hiding.forEach(it=>it.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.97)'}],{duration:180,easing:'ease',fill:'forwards'}));
    setTimeout(()=>{
      hiding.forEach(it=>it.hidden=true);showing.forEach(it=>{it.hidden=false;it.style.opacity='0'});void document.body.offsetWidth;
      items.filter(x=>!x.hidden).forEach(it=>{
        const last=it.getBoundingClientRect(),f=first.get(it);if(f){const dx=f.left-last.left,dy=f.top-last.top;it.animate([{transform:`translate(${dx}px,${dy}px)`,opacity:1},{transform:'translate(0,0)',opacity:1}],{duration:480,easing:'cubic-bezier(.2,.75,.2,1)'})}else{it.animate([{opacity:0,transform:'translateY(18px) scale(.98)'},{opacity:1,transform:'none'}],{duration:430,easing:'cubic-bezier(.2,.75,.2,1)'})}it.style.opacity='';
      });
    },185);
  }
  $$('.filter-btn').forEach(btn=>btn.addEventListener('click',()=>{$$('.filter-btn').forEach(x=>x.classList.remove('active'));btn.classList.add('active');filterWorks(btn.dataset.filter)}));
  // Deep-link portfolio categories from the homepage, e.g. isler.html?filter=sport
  (()=>{const requested=new URLSearchParams(location.search).get('filter');if(!requested)return;const btn=$(`.filter-btn[data-filter="${requested.replace(/[^a-z-]/gi,'')}"]`);if(btn){$$('.filter-btn').forEach(x=>x.classList.remove('active'));btn.classList.add('active');filterWorks(btn.dataset.filter);setTimeout(()=>document.querySelector('.work-toolbar')?.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'start'}),90)}})();
  $$('.view-mode button').forEach(btn=>btn.addEventListener('click',()=>{$$('.view-mode button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');document.body.classList.toggle('showreel-mode',btn.dataset.view==='showreel')}));

  /* ---------------------------------------------------------
     BRAND MARQUEE
  --------------------------------------------------------- */
  async function loadBrands(){
    const wrap=$('[data-brand-area]'); if(!wrap||!window.PMData) return;
    try{
      let rows=await PMData.brands(); if(!rows.length)return;
      const limit=parseInt(window.PMContentMap?.['brands.carousel_limit']||'16',10)||16;
      rows=rows.filter((b,i,a)=>b?.name && a.findIndex(x=>String(x.name).toLocaleLowerCase('tr-TR')===String(b.name).toLocaleLowerCase('tr-TR'))===i).slice(0,limit);
      if(rows.length<2)return;
      const item=b=>`<a class="brand-tile" ${b.url?`href="${esc(b.url)}" target="_blank" rel="noreferrer"`:''}>${b.logo_url?`<img src="${esc(b.logo_url)}" alt="${esc(b.name)}"/>`:`<span>${esc(b.name)}</span>`}</a>`;
      const rowA=rows.filter((_,i)=>i%2===0), rowB=rows.filter((_,i)=>i%2===1);
      const safeA=(rowA.length?rowA:rows).map(item).join('');
      const safeB=(rowB.length?rowB:rows).map(item).join('');
      wrap.innerHTML=`<div class="brand-marquee-row"><div class="brand-marquee-track"><div class="brand-marquee-group">${safeA}</div><div class="brand-marquee-group" aria-hidden="true">${safeA}</div></div></div><div class="brand-marquee-row reverse"><div class="brand-marquee-track"><div class="brand-marquee-group">${safeB}</div><div class="brand-marquee-group" aria-hidden="true">${safeB}</div></div></div>`;
    }catch(err){console.warn('Brands unavailable',err)}
  }

  /* ---------------------------------------------------------
     PAROGLU ASSISTANT — FAQ + GUIDED LEAD FLOW
  --------------------------------------------------------- */
  const defaultKnowledge=[
    ['Reels / Video','Reels çekimi nasıl ilerliyor?','reels,video,çekim,kurgu,film','Önce hedefi ve yayın platformunu netleştiriyoruz. Ardından fikir, çekim planı, prodüksiyon, kurgu, renk/ses düzenleme ve revizyon geliyor. Teslimler 9:16 başta olmak üzere ihtiyaç varsa 16:9 ve 4:5 formatlarda hazırlanabiliyor.'],
    ['Sosyal Medya','Sosyal medya yönetimi yapıyor musunuz?','sosyal medya,yönetim,sayfa,içerik planı,instagram','Evet. İçerik planı, sayfanın görsel dili, Reels ve tasarım üretimi, çekim planlaması ve yayın akışı birlikte kurgulanabiliyor. Amaç yalnızca paylaşım yapmak değil, markanın düzenli ve tanınır bir içerik sistemine sahip olması.'],
    ['Fotoğraf','Fotoğraf çekimi yapıyor musunuz?','fotoğraf,ürün,portre,etkinlik,spor fotoğraf','Evet. Ürün, portre, spor, etkinlik ve kurumsal fotoğraf çekimleri yapılabilir. Çekim öncesinde kullanım alanına göre ışık, kadraj ve teslim oranları planlanır.'],
    ['Tasarım','Hangi tasarım hizmetlerini veriyorsunuz?','tasarım,afiş,post,story,banner,baskı,kampanya','Sosyal medya post/story, kampanya görselleri, afiş, banner, baskı işleri ve marka iletişimi tasarımları üretiyorum. Tek görselden ziyade mümkün olduğunda tekrar kullanılabilir, tutarlı bir görsel sistem kuruyorum.'],
    ['Drone','Drone çekimi yapıyor musunuz?','drone,hava çekimi,mimari,inşaat','Evet. Mimari, inşaat, etkinlik, spor, mekân ve reklam projelerinde sinematik hava çekimleri yapılabilir. Lokasyon ve uçuş koşulları çekim öncesinde değerlendirilir.'],
    ['Web / Dijital','Web sitesi yapıyor musunuz?','web,site,landing page,digital,portfolyo','Evet. Portfolyo, landing page ve kreatif web deneyimleri hazırlanabilir. Öncelik; mobil uyum, hızlı açılış, güçlü portfolyo sunumu ve gerektiğinde yönetilebilir içerik altyapısıdır.'],
    ['Spor','Spor kulüpleriyle çalışıyor musunuz?','spor,kulüp,futbol,maç günü,forma','Evet. Spor tarafında Reels, maç günü içerikleri, transfer/forma lansmanları, fotoğraf, grafik tasarım ve sosyal medya yönetimi birlikte üretilebilir. Portfolyoda Karabük İdman Yurdu gibi örnekler bulunuyor.'],
    ['Konser','Konser çekimi yapıyor musunuz?','konser,sahne,backstage,sanatçı,sefo','Evet. Sahne, backstage, kalabalık atmosferi ve sanatçı detaylarını kapsayan dikey Reels ve etkinlik videoları üretilebilir. Sefo konser çalışmaları portfolyodaki referanslardan biri.'],
    ['Fiyat / Süreç','Fiyatlar nasıl belirleniyor?','fiyat,ücret,bütçe,kaç tl,teklif','Fiyat; çekim süresi, lokasyon, ekip ihtiyacı, teslim adedi, kurgu yoğunluğu ve kullanım kapsamına göre belirlenir. En doğru fiyat için Projeyi Konuşalım bölümündeki kısa brief yeterli.'],
    ['Fiyat / Süreç','Teslim süresi ne kadar?','teslim,süre,kaç gün,ne zaman','Teslim süresi projenin kapsamına göre değişir. Kısa Reels çalışmalarında süreç daha hızlı olabilir; çoklu çekim, kampanya veya kapsamlı kurumsal işlerde takvim brief aşamasında netleştirilir.'],
    ['Fiyat / Süreç','Revizyon hakkı var mı?','revizyon,değişiklik,düzeltme','Evet. Revizyon kapsamı iş başlamadan önce netleştirilir. Amaç, projeyi sonsuz revizyon döngüsüne sokmadan briefte belirlenen hedefe en doğru şekilde ulaştırmaktır.'],
    ['Genel','Hangi şehirlerde çalışıyorsunuz?','şehir,karabük,istanbul,ankara,nerede,lokasyon','Karabük merkezli çalışıyorum; proje kapsamına göre farklı şehirlerde çekim ve prodüksiyon planlanabilir. Şehri yazarsan ulaşım ve çekim planını ona göre değerlendirebiliriz.'],
    ['Genel','İletişim bilgileri nedir?','telefon,whatsapp,iletişim,mail,email','Telefon: +90 541 662 98 62. E-posta: umutparoglu87@gmail.com. İstersen önce buradan projenin kapsamını netleştirip ardından brief bırakabilirsin.'],
    ['Genel','Ham görüntüleri teslim ediyor musunuz?','ham görüntü,raw,raw video,ham dosya','Ham dosya teslimi proje bazında ayrıca konuşulur. Standart teslim; seçilmiş, düzenlenmiş ve kullanıma hazır içeriklerdir. Ham arşiv gerekiyorsa brief aşamasında belirtilmesi iyi olur.'],
    ['Sosyal Medya','Kafe veya restoran için ne önerirsiniz?','kafe,cafe,restoran,yemek,menü,coffee','Kafe/restoran için en güçlü kombinasyon genelde düzenli Reels + ürün/mekân fotoğrafı + sosyal medya tasarım sistemidir. Menü lansmanı, mekân atmosferi ve ürün odaklı kısa videolar birlikte planlanabilir.'],
    ['Sosyal Medya','İnşaat veya emlak için ne önerirsiniz?','inşaat,emlak,konut,mimari,proje','İnşaat/emlak tarafında drone, mimari fotoğraf, kısa tanıtım Reels’leri ve proje ilerleme içerikleri güçlü çalışır. Satış odaklıysa landing page ve reklam kreatifleri de sisteme eklenebilir.']
  ].map((x,i)=>({category:x[0],question:x[1],keywords:x[2],answer:x[3],sort_order:i,active:true}));
  let assistantKnowledge=[...defaultKnowledge];
  async function loadAssistantKnowledge(){try{const rows=await PMData?.assistant?.();if(rows?.length)assistantKnowledge=[...rows,...defaultKnowledge]}catch(err){console.warn('Assistant knowledge unavailable',err)}}

  const launch=$('.assistant-launch'), assistantPanel=$('.assistant-panel'), close=$('.assistant-close'), input=$('.assistant-input input'), send=$('.assistant-input button'), messages=$('.messages');
  let leadState={stage:null,data:{}};
  const normalize=s=>String(s||'').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9çğıöşü\s]/g,' ');
  const add=(text,who='bot',html=false)=>{if(!messages)return;const d=document.createElement('div');d.className='msg '+who;if(html)d.innerHTML=text;else d.textContent=text;messages.appendChild(d);messages.scrollTop=messages.scrollHeight;return d};
  function addSuggestions(items){if(!messages)return;const row=document.createElement('div');row.className='assistant-suggestions';items.forEach(label=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>{input.value=label;submitChat()});row.appendChild(b)});messages.appendChild(row);messages.scrollTop=messages.scrollHeight}
  function matchKnowledge(txt){
    const t=normalize(txt), words=new Set(t.split(/\s+/).filter(x=>x.length>2));let best=null,bestScore=0;
    for(const k of assistantKnowledge){const kws=String(k.keywords||'').split(',').map(normalize).filter(Boolean);let score=0;kws.forEach(kw=>{if(t.includes(kw))score+=kw.includes(' ')?5:3});normalize(k.question).split(/\s+/).forEach(w=>{if(words.has(w)&&w.length>3)score+=1});if(score>bestScore){bestScore=score;best=k}}
    return bestScore>=3?best:null;
  }
  function isProjectIntent(t){return /(istiyorum|istiyoruz|yaptırmak|çektirmek|proje|teklif|çalışmak|ihtiyacım|ihtiyacımız)/.test(normalize(t))}
  function guidedReply(txt){
    if(!leadState.stage && isProjectIntent(txt)){leadState.stage='company';return {text:'Memnuniyetle. Süreci hızlandırmak için önce firma / marka adını öğrenebilir miyim?',suggest:[]}}
    if(leadState.stage==='company'){leadState.data.company=txt;leadState.stage='service';return {text:`${txt} için ilerleyelim. En çok hangi alana ihtiyacınız var?`,suggest:['Reels / Video','Sosyal Medya','Fotoğraf','Tasarım','Drone','Web Sitesi']}}
    if(leadState.stage==='service'){leadState.data.service=txt;leadState.stage='goal';return {text:'Bu çalışmayla ana hedefiniz ne?',suggest:['Daha fazla müşteri','Yeni ürün / hizmet duyurusu','Markayı daha profesyonel göstermek','Sosyal medyayı canlandırmak']}}
    if(leadState.stage==='goal'){leadState.data.goal=txt;leadState.stage='timing';return {text:'Ne zaman başlamayı düşünüyorsunuz?',suggest:['En kısa sürede','1–2 hafta','Bu ay','1–3 ay']}}
    if(leadState.stage==='timing'){leadState.data.timing=txt;leadState.stage='contact';return {text:'Son olarak size ulaşabileceğim telefon veya e-posta bilgisini yazabilirsiniz. İsterseniz proje briefine de geçebilirsiniz.',suggest:['Projeyi Konuşalım']}}
    if(leadState.stage==='contact'){
      if(/teklif al formuna geç|projeyi konuşalım/i.test(txt)){sessionStorage.setItem('pmAssistantLead',JSON.stringify(leadState.data));location.href='teklif-al.html';return {text:'Proje briefine yönlendiriyorum.',suggest:[]}}
      leadState.data.contact=txt;sessionStorage.setItem('pmAssistantLead',JSON.stringify(leadState.data));leadState.stage=null;return {text:'Teşekkürler. Bilgileri not aldım. Proje briefini tamamladığında kapsamı daha hızlı netleştirebiliriz.',suggest:['Projeyi Konuşalım','Portfolyoyu gör']}
    }
    return null;
  }
  function faqReply(txt){
    const guide=guidedReply(txt);if(guide)return guide;
    const hit=matchKnowledge(txt);if(hit)return {text:hit.answer,suggest:[]};
    const t=normalize(txt);
    if(/merhaba|selam|hey/.test(t))return {text:'Merhaba. Reels, sosyal medya, fotoğraf, tasarım, drone, web, spor ve konser prodüksiyonu hakkında sorabilirsin. Bir proje düşünüyorsan firma adını da yazabilirsin.',suggest:['Reels süreci nasıl?','Sosyal medya yönetimi','Fiyat nasıl belirleniyor?']};
    return {text:'Bu konuda en doğru yönlendirmeyi yapabilmem için firma / sektör, istediğin iş ve hedefini bir cümleyle yaz. Örneğin “bir restoran için aylık Reels ve sosyal medya yönetimi istiyorum” diyebilirsin.',suggest:['Bir proje başlatmak istiyorum','Hizmetleri anlat','İletişim bilgileri']};
  }
  const aiHistory=[];
  let aiBusy=false;
  function setAiBusy(on){
    aiBusy=on;
    if(send){send.disabled=on;send.setAttribute('aria-busy',String(on));}
    if(input)input.disabled=on;
  }
  function addTyping(){
    if(!messages)return null;
    const d=document.createElement('div');d.className='msg bot assistant-typing';d.textContent='Düşünüyor…';messages.appendChild(d);messages.scrollTop=messages.scrollHeight;return d;
  }
  async function askRealAI(v){
    if(!window.PMData?.aiChat)throw new Error('AI endpoint unavailable');
    const result=await PMData.aiChat({message:v,history:aiHistory.slice(-10),page:location.pathname});
    if(!result?.reply)throw new Error('Empty AI reply');
    return String(result.reply).trim();
  }
  launch?.addEventListener('click',()=>{assistantPanel?.classList.add('open');if(messages&&!messages.children.length){add('Merhaba. Ben Paroglu Asistan. Paroglu Media hizmetleri, portfolyo ve proje planlama konusunda yardımcı olabilirim.');addSuggestions(['Reels süreci nasıl?','Sosyal medya yönetimi','Spor kulübü içerikleri','Konser çekimi','Fiyat nasıl belirleniyor?'])}});
  close?.addEventListener('click',()=>assistantPanel?.classList.remove('open'));
  const submitChat=async()=>{
    const v=input?.value.trim();if(!v||aiBusy)return;
    add(v,'user');input.value='';$$('.assistant-suggestions',messages).forEach(x=>x.remove());
    setAiBusy(true);const typing=addTyping();
    try{
      const reply=await askRealAI(v);
      typing?.remove();add(reply);
      aiHistory.push({role:'user',content:v},{role:'assistant',content:reply});
      if(aiHistory.length>16)aiHistory.splice(0,aiHistory.length-16);
    }catch(err){
      console.warn('Paroglu AI unavailable; FAQ fallback active',err);
      typing?.remove();const r=faqReply(v);add(r.text);if(r.suggest?.length)addSuggestions(r.suggest);
    }finally{setAiBusy(false);input?.focus();}
  };
  send?.addEventListener('click',submitChat);input?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submitChat()}});

  /* ---------------------------------------------------------
     BRIEF FLOW
  --------------------------------------------------------- */
  const steps=$$('.brief-step'); let step=0; const brief={};
  try{Object.assign(brief,JSON.parse(sessionStorage.getItem('pmAssistantLead')||'{}'))}catch{}
  function showStep(n){if(!steps.length)return;step=Math.max(0,Math.min(steps.length-1,n));steps.forEach((s,i)=>s.classList.toggle('active',i===step));const bar=$('.progress span');if(bar)bar.style.width=((step+1)/steps.length*100)+'%';scrollTo({top:0,behavior:'smooth'});if(step===steps.length-1){const box=$('.brief-summary');if(box)box.innerHTML=`<strong>${esc(brief.company||brief.name||'Proje')}</strong><br>${esc(brief.service||'—')} · ${esc(brief.project_type||'—')}<br>${esc(brief.budget||'—')} · ${esc(brief.deadline||'—')}<br>${esc(brief.notes||'')}`}}
  $$('.choice').forEach(b=>b.addEventListener('click',()=>{const key=b.dataset.key;const value=b.dataset.value||b.textContent.trim();brief[key==='needType'?'project_type':key==='timeline'?'deadline':key]=value;b.parentElement.querySelectorAll('.choice').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');setTimeout(()=>showStep(step+1),140)}));
  $$('[data-next]').forEach(b=>b.addEventListener('click',()=>{const s=steps[step];$$('input,textarea,select',s).forEach(el=>{const k=el.name;if(!k)return;const map={details:'notes',website:'website',colors:'colors',sector:'sector',channel:'channel'};brief[map[k]||k]=el.value});showStep(step+1)}));
  $$('[data-prev]').forEach(b=>b.addEventListener('click',()=>showStep(step-1)));
  $('[data-submit-brief]')?.addEventListener('click',async e=>{const btn=e.currentTarget;btn.disabled=true;btn.textContent='Gönderiliyor…';try{await PMData.submitBrief({name:brief.name||'',company:brief.company||'',email:brief.email||'',phone:brief.phone||'',service:brief.service||'',project_type:brief.project_type||'',budget:brief.budget||'',deadline:brief.deadline||'',city:brief.city||'',notes:[brief.notes,brief.website&&`Web/IG: ${brief.website}`,brief.colors&&`Renkler: ${brief.colors}`,brief.sector&&`Sektör: ${brief.sector}`,brief.channel&&`İletişim: ${brief.channel}`].filter(Boolean).join('\n'),source:'website'});btn.textContent='Brief alındı ✓';sessionStorage.removeItem('pmAssistantLead')}catch(err){btn.disabled=false;btn.textContent='Tekrar Dene';alert('Brief gönderilemedi: '+err.message)}});

  /* ---------------------------------------------------------
     CASE STUDY LIGHTBOX — touch page-turn + mouse cinematic slide
  --------------------------------------------------------- */
  (()=>{
    const shots=$$('[data-lightbox-gallery] [data-full]');
    if(!shots.length)return;
    const items=shots.map(x=>x.dataset.full).filter(Boolean); let idx=0;
    const lb=document.createElement('div');lb.className='pm-lightbox';lb.innerHTML=`<button class="lb-close" aria-label="Kapat" type="button">×</button><button class="lb-prev" aria-label="Önceki" type="button">‹</button><img alt="Proje görseli"><button class="lb-next" aria-label="Sonraki" type="button">›</button><div class="lb-count"></div>`;document.body.appendChild(lb);
    const img=$('img',lb),count=$('.lb-count',lb);let touchStart=null,touchDx=0;
    const clearAnim=()=>{img.classList.remove('lb-touch-next','lb-touch-prev','lb-mouse-next','lb-mouse-prev');img.style.transform='';img.style.transformOrigin=''};
    const show=(n,mode='mouse-next')=>{
      idx=(n+items.length)%items.length;clearAnim();
      img.src=items[idx];void img.offsetWidth;
      img.classList.add(mode);count.textContent=`${idx+1} / ${items.length}`;
    };
    const open=n=>{show(n,'lb-mouse-next');lb.classList.add('open');document.documentElement.style.overflow='hidden'};
    const closeLb=()=>{lb.classList.remove('open');document.documentElement.style.overflow='';clearAnim()};
    shots.forEach((b,i)=>b.addEventListener('click',()=>open(i)));
    $('.lb-close',lb).addEventListener('click',closeLb);
    $('.lb-prev',lb).addEventListener('click',()=>show(idx-1,'lb-mouse-prev'));
    $('.lb-next',lb).addEventListener('click',()=>show(idx+1,'lb-mouse-next'));
    lb.addEventListener('click',e=>{if(e.target===lb)closeLb()});
    img.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;touchStart=e.clientX;touchDx=0;img.setPointerCapture?.(e.pointerId)});
    img.addEventListener('pointermove',e=>{if(touchStart==null)return;touchDx=e.clientX-touchStart;const angle=Math.max(-13,Math.min(13,touchDx/12));img.style.transformOrigin=touchDx<0?'left center':'right center';img.style.transform=`perspective(1200px) translateX(${touchDx*.16}px) rotateY(${angle}deg) scale(.995)`});
    const finishTouch=()=>{if(touchStart==null)return;const dx=touchDx;touchStart=null;touchDx=0;img.style.transform='';img.style.transformOrigin='';if(Math.abs(dx)>52)show(idx+(dx<0?1:-1),dx<0?'lb-touch-next':'lb-touch-prev')};
    img.addEventListener('pointerup',finishTouch);img.addEventListener('pointercancel',finishTouch);
    addEventListener('keydown',e=>{if(!lb.classList.contains('open'))return;if(e.key==='Escape')closeLb();if(e.key==='ArrowLeft')show(idx-1,'lb-mouse-prev');if(e.key==='ArrowRight')show(idx+1,'lb-mouse-next')});
  })();

  /* ---------------------------------------------------------
     V6 CURATED PORTFOLIO REEL + NAV POLISH
  --------------------------------------------------------- */
  (()=>{
    const nav=$('.site-nav');
    const onScroll=()=>nav?.classList.toggle('is-scrolled',scrollY>22);
    onScroll();addEventListener('scroll',onScroll,{passive:true});

    const root=$('[data-curated-reel]');if(!root)return;
    const viewport=$('.curated-reel-viewport',root),track=$('.curated-reel-track',root),cards=$$('.curated-card',root);
    if(!viewport||!track||!cards.length)return;
    const current=$('[data-curated-current]',root),total=$('[data-curated-total]',root),progress=$('.curated-progress i',root);
    let index=0,timer=null,startX=null,dragX=0;
    if(total)total.textContent=String(cards.length).padStart(2,'0');

    const cardStep=()=>{
      if(cards.length<2)return cards[0]?.getBoundingClientRect().width||0;
      return cards[1].offsetLeft-cards[0].offsetLeft;
    };
    const center=()=>{
      const c=cards[index];if(!c)return;
      const step=cardStep();
      const target=(c.offsetLeft - ((viewport.clientWidth-c.getBoundingClientRect().width)/2));
      track.style.transform=`translate3d(${-target}px,0,0)`;
      cards.forEach((el,i)=>el.classList.toggle('is-active',i===index));
      if(current)current.textContent=String(index+1).padStart(2,'0');
      if(!reduceMotion&&progress){progress.style.animation='none';void progress.offsetWidth;progress.style.animation='curatedProgress 5.2s linear forwards'}
      cards.forEach((el,i)=>{const v=$('video',el);if(!v)return;if(i===index)v.play().catch(()=>{});else{v.pause();v.currentTime=0}});
    };
    const go=n=>{index=(n+cards.length)%cards.length;center()};
    const start=()=>{if(reduceMotion||cards.length<2)return;clearInterval(timer);timer=setInterval(()=>go(index+1),5200)};
    const pause=()=>{clearInterval(timer);timer=null;if(progress)progress.style.animationPlayState='paused'};
    const resume=()=>{if(progress)progress.style.animationPlayState='running';start()};
    $('[data-curated-next]',root)?.addEventListener('click',()=>{go(index+1);start()});
    $('[data-curated-prev]',root)?.addEventListener('click',()=>{go(index-1);start()});
    viewport.addEventListener('mouseenter',pause);viewport.addEventListener('mouseleave',resume);
    viewport.addEventListener('focusin',pause);viewport.addEventListener('focusout',resume);

    viewport.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse'&&e.button!==0)return;
      startX=e.clientX;dragX=0;pause();viewport.setPointerCapture?.(e.pointerId);
    });
    viewport.addEventListener('pointermove',e=>{
      if(startX==null)return;
      dragX=e.clientX-startX;
      const c=cards[index],target=(c.offsetLeft-((viewport.clientWidth-c.getBoundingClientRect().width)/2));
      track.style.transition='none';track.style.transform=`translate3d(${-(target-dragX)}px,0,0)`;
    });
    const endDrag=e=>{
      if(startX==null)return;
      const dx=e.clientX-startX;startX=null;track.style.transition='';
      if(Math.abs(dx)>50)go(index+(dx<0?1:-1));else center();
      start();
    };
    viewport.addEventListener('pointerup',endDrag);viewport.addEventListener('pointercancel',()=>{startX=null;track.style.transition='';center();start()});
    cards.forEach(card=>card.addEventListener('pointermove',e=>{if(reduceMotion)return;const r=card.getBoundingClientRect();card.style.setProperty('--mx',`${((e.clientX-r.left)/r.width)*100}%`);card.style.setProperty('--my',`${((e.clientY-r.top)/r.height)*100}%`)}));
    let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(center,120)},{passive:true});
    requestAnimationFrame(()=>{center();start()});
  })();


  /* V7 compact homepage work flow: natural ratios + soft image changes */
  (()=>{
    const viewport=document.querySelector('[data-home-work]');if(!viewport)return;
    const cards=[...viewport.querySelectorAll('.home-work-card')];
    cards.forEach((card,cardIndex)=>{
      const img=card.querySelector('.home-work-media img'),media=card.querySelector('.home-work-media');
      const items=(card.dataset.rotate||'').split('|').filter(Boolean);if(!img||items.length<2)return;
      let i=0;const swap=()=>{i=(i+1)%items.length;img.classList.add('is-swapping');media?.classList.remove('is-swap');setTimeout(()=>{const next=items[i];const done=()=>{img.classList.remove('is-swapping');media?.classList.add('is-swap');setTimeout(()=>media?.classList.remove('is-swap'),760)};img.addEventListener('load',done,{once:true});img.src=next;if(img.complete)requestAnimationFrame(done);setTimeout(()=>img.classList.remove('is-swapping'),650)},210)};
      if(!reduceMotion)setInterval(swap,6500+(cardIndex*260));
    });
    const step=()=>Math.min(viewport.clientWidth*.72,520);
    document.querySelector('[data-home-next]')?.addEventListener('click',()=>viewport.scrollBy({left:step(),behavior:'smooth'}));
    document.querySelector('[data-home-prev]')?.addEventListener('click',()=>viewport.scrollBy({left:-step(),behavior:'smooth'}));
    let timer;if(!reduceMotion){timer=setInterval(()=>{const end=viewport.scrollLeft+viewport.clientWidth>=viewport.scrollWidth-20;viewport.scrollTo({left:end?0:viewport.scrollLeft+step(),behavior:'smooth'})},6200);viewport.addEventListener('pointerdown',()=>clearInterval(timer),{once:true})}
  })();

  /* ---------------------------------------------------------
     V14 LAUNCH INTERACTIONS — Instagram orb remains disabled visually; tactile helpers follow.
  --------------------------------------------------------- */

  (()=>{
    if(document.querySelector('.ig-orb-shell'))return;
    const reels=['DXoHQSrCNvx','DIBMYMBMxnh','DRPi3SPCExr','DI_meJjsVr-','DKtgLKoo0wK','DcdiUdLsL0n','DcBj3tZtcLP','DQ3Xw3fDGqB','DKZBmjHoR9u','DRBwJYZAsZk','Dc28-L-u1OV','DcBqnqNsfzw','DbyLBaKM7bd'];
    const shell=document.createElement('div');shell.className='ig-orb-shell';
    shell.innerHTML=`<button class="ig-orb" type="button" aria-expanded="false" aria-label="Instagram’dan son işleri aç"><span class="ig-orb-mark" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2"></rect><circle cx="12" cy="12" r="4.15"></circle><circle class="ig-orb-dot" cx="17.45" cy="6.85" r="1.05"></circle></svg></span><span class="ig-orb-tip">Son işler · @iamparoglu</span></button><aside class="ig-reel-dock" aria-hidden="true" aria-label="Instagram’dan son işler"><div class="ig-dock-head"><a href="https://www.instagram.com/iamparoglu/" target="_blank" rel="noopener"><strong>@iamparoglu</strong><small>Instagram · son üretimler</small></a><button class="ig-dock-close" type="button" aria-label="Kapat">×</button></div><div class="ig-dock-stage"><iframe class="ig-dock-frame" title="Paroglu Media Instagram Reel" src="about:blank" loading="eager" scrolling="no" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe><span class="ig-dock-shade" aria-hidden="true"></span></div><div class="ig-dock-foot"><span class="ig-dock-count">01 / 13</span><span class="ig-dock-progress"><i></i></span><span class="ig-dock-actions"><button type="button" data-ig-prev aria-label="Önceki Reel">←</button><button type="button" data-ig-next aria-label="Sonraki Reel">→</button></span></div><a class="ig-dock-link" data-ig-link href="https://www.instagram.com/reel/DXoHQSrCNvx/" target="_blank" rel="noopener"><span>Reel’i Instagram’da aç</span><span>↗</span></a></aside>`;
    document.body.appendChild(shell);
    const orb=$('.ig-orb',shell),dock=$('.ig-reel-dock',shell),closeBtn=$('.ig-dock-close',shell),frame=$('.ig-dock-frame',shell),count=$('.ig-dock-count',shell),reelLink=$('[data-ig-link]',shell),progress=$('.ig-dock-progress i',shell);
    let index=0,timer=null,openScroll=0;
    const url=i=>`https://www.instagram.com/reel/${reels[i]}/`;
    const resetProgress=()=>{if(!progress||reduceMotion)return;progress.style.animation='none';void progress.offsetWidth;progress.style.animation='pmIgProgress 10s linear forwards'};
    const load=()=>{frame.title=`Paroglu Media Instagram Reel ${String(index+1).padStart(2,'0')}`;frame.src=url(index)+'embed/?autoplay=1';count.textContent=`${String(index+1).padStart(2,'0')} / ${String(reels.length).padStart(2,'0')}`;reelLink.href=url(index);resetProgress()};
    const stop=()=>{if(timer){clearInterval(timer);timer=null}};
    const start=()=>{stop();if(reduceMotion||!shell.classList.contains('open'))return;timer=setInterval(()=>change(index+1),10000)};
    const change=n=>{index=(n+reels.length)%reels.length;dock.classList.add('is-changing');frame.src='about:blank';setTimeout(()=>{if(shell.classList.contains('open'))load();dock.classList.remove('is-changing')},130)};
    const open=()=>{shell.classList.add('open');orb.setAttribute('aria-expanded','true');dock.setAttribute('aria-hidden','false');openScroll=scrollY;load();start()};
    const close=()=>{shell.classList.remove('open');orb.setAttribute('aria-expanded','false');dock.setAttribute('aria-hidden','true');stop();frame.src='about:blank'};
    orb.addEventListener('click',()=>shell.classList.contains('open')?close():open());closeBtn.addEventListener('click',close);
    $('[data-ig-prev]',shell).addEventListener('click',()=>{change(index-1);start()});$('[data-ig-next]',shell).addEventListener('click',()=>{change(index+1);start()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&shell.classList.contains('open')){close();orb.focus()}});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)close()});
    let ticking=false;addEventListener('scroll',()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{ticking=false;if(shell.classList.contains('open')&&Math.abs(scrollY-openScroll)>64)close()})},{passive:true});
  })();

  (()=>{
    const viewport=document.querySelector('[data-home-work]');if(!viewport)return;
    let startX=null,card=null,moved=false,lastDx=0;
    viewport.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;startX=e.clientX;lastDx=0;moved=false;card=e.target.closest('.home-work-card');if(card)card.classList.add('is-hand-turn')},{passive:true});
    viewport.addEventListener('pointermove',e=>{if(startX==null||!card)return;lastDx=e.clientX-startX;if(Math.abs(lastDx)>8)moved=true;const angle=Math.max(-8,Math.min(8,lastDx/18));card.style.setProperty('--hand-turn',`${angle}deg`);card.style.setProperty('--fold-side',lastDx<0?'270deg':'90deg');card.style.setProperty('--fold-opacity',String(Math.min(.34,.12+Math.abs(lastDx)/360)))},{passive:true});
    const end=()=>{if(startX==null)return;startX=null;if(card){const a=Math.max(-7,Math.min(7,lastDx/18));card.classList.remove('is-hand-turn');card.style.removeProperty('--hand-turn');card.classList.add('page-settle');card.style.setProperty('--settle-angle',`${a}deg`);setTimeout(()=>{card?.classList.remove('page-settle');card?.style.removeProperty('--settle-angle')},480)}card=null};
    viewport.addEventListener('pointerup',end,{passive:true});viewport.addEventListener('pointercancel',end,{passive:true});
    viewport.addEventListener('click',e=>{if(moved&&e.target.closest('.home-work-card')){e.preventDefault();e.stopPropagation();moved=false}},true);
  })();
  /* BOOT */
  Promise.resolve(loadContent()).then(()=>loadBrands());
  loadProjects();loadFeatured();loadAssistantKnowledge();
})();
