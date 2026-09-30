(function(){
  'use strict';
  const cfg=window.PM_BACKEND||{};
  const base=String(cfg.url||'').replace(/\/$/,'');
  const key=cfg.publishableKey||cfg.anonKey||'';
  if(!base||!key){console.warn('Paroglu Media backend config missing');return;}

  function getClientId(){
    const storageKey='pm_client_id_v131';
    try{
      let id=localStorage.getItem(storageKey);
      if(!id){id=(crypto?.randomUUID?.()||('pm-'+Date.now()+'-'+Math.random().toString(36).slice(2)));localStorage.setItem(storageKey,id)}
      return id;
    }catch{return 'pm-session-'+Math.random().toString(36).slice(2)}
  }
  const clientId=getClientId();

  async function request(path, options={}){
    const headers={apikey:key,Accept:'application/json',...(options.headers||{})};
    if(path.startsWith('/functions/v1/'))headers['X-PM-Client']=clientId;
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),options.timeout||18000);
    try{
      const res=await fetch(base+path,{...options,headers,signal:controller.signal});
      if(!res.ok){
        let msg=`${res.status} ${res.statusText}`;
        try{const j=await res.json();msg=j.message||j.msg||j.error_description||j.error||msg}catch{}
        const err=new Error(msg);err.status=res.status;throw err;
      }
      if(res.status===204)return null;
      const text=await res.text();
      return text?JSON.parse(text):null;
    }catch(err){
      if(err?.name==='AbortError'){const e=new Error('İstek zaman aşımına uğradı.');e.status=408;throw e}
      throw err;
    }finally{clearTimeout(timeout)}
  }

  const select=(table,query='')=>request(`/rest/v1/${table}?${query}`,{method:'GET'});

  window.PMData={
    content(){return select('site_content','select=*&order=section.asc,label.asc');},
    projects(){return select('projects','select=*&published=eq.true&order=sort_order.asc,created_at.desc');},
    brands(){return select('brands','select=*&visible=eq.true&order=row_no.asc,sort_order.asc,created_at.asc');},
    async assistant(){
      try{return await select('assistant_knowledge','select=*&active=eq.true&order=sort_order.asc,created_at.asc')}
      catch(err){if(err.status===404||err.status===400)return [];throw err}
    },
    aiChat(payload){
      return request('/functions/v1/smooth-worker',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload||{}),timeout:30000});
    },
    submitBrief(payload){
      return request('/functions/v1/submit-brief',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload||{}),timeout:15000});
    }
  };
})();
