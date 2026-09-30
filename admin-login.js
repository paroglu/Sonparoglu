(function(){
'use strict';
const CFG=window.PM_BACKEND||{};
const BASE=String(CFG.url||'').replace(/\/$/,'');
const KEY=CFG.publishableKey||'';
const ADMIN=(CFG.adminEmail||'umutparoglu87@gmail.com').toLowerCase();
const SESSION_KEY='pm_admin_session_v131';
const form=document.getElementById('loginForm');
const emailEl=document.getElementById('loginEmail');
const passwordEl=document.getElementById('loginPassword');
const messageEl=document.getElementById('loginMessage');
const successEl=document.getElementById('loginSuccess');

function storeSession(s){sessionStorage.setItem(SESSION_KEY,JSON.stringify(s))}
function clearSession(){sessionStorage.removeItem(SESSION_KEY)}
function loadSession(){try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null')}catch{return null}}
async function raw(path,opt={}){
  const headers={apikey:KEY,Accept:'application/json',...(opt.headers||{})};
  const r=await fetch(BASE+path,{...opt,headers});
  const txt=await r.text();let body=null;
  if(txt){try{body=JSON.parse(txt)}catch{body=txt}}
  if(!r.ok){throw new Error(body?.message||body?.msg||body?.error_description||body?.error||'Giriş başarısız')}
  return body;
}
async function refresh(s){
  if(!s?.refresh_token) throw new Error('Oturum yok');
  const n=await raw('/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});
  if(String(n.user?.email||'').toLowerCase()!==ADMIN) throw new Error('Yetkisiz hesap');
  n.expires_at=n.expires_at||Math.floor(Date.now()/1000)+(n.expires_in||3600);storeSession(n);return n;
}
async function validateExisting(){
  let s=loadSession();if(!s)return false;
  try{
    const now=Math.floor(Date.now()/1000);
    if((s.expires_at||0)-now<90)s=await refresh(s);
    const user=await raw('/auth/v1/user',{headers:{Authorization:`Bearer ${s.access_token}`}});
    if(String(user?.email||'').toLowerCase()!==ADMIN)throw new Error('Yetkisiz');
    return true;
  }catch{clearSession();return false}
}
function goPanel(){successEl.classList.add('show');successEl.setAttribute('aria-hidden','false');setTimeout(()=>location.replace('admin-panel.html'),520)}

form.addEventListener('submit',async e=>{
  e.preventDefault();messageEl.textContent='';
  const btn=form.querySelector('button[type="submit"]');
  btn.disabled=true;btn.textContent='Giriş yapılıyor…';
  try{
    if(!BASE||!KEY)throw new Error('Supabase bağlantısı bulunamadı');
    const s=await raw('/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:emailEl.value.trim(),password:passwordEl.value})});
    if(String(s.user?.email||'').toLowerCase()!==ADMIN)throw new Error('Bu hesap admin olarak yetkili değil');
    s.expires_at=s.expires_at||Math.floor(Date.now()/1000)+(s.expires_in||3600);storeSession(s);goPanel();
  }catch(err){messageEl.textContent=err.message||'E-posta veya şifre hatalı';btn.disabled=false;btn.textContent='Giriş Yap ↗'}
});

(async()=>{if(await validateExisting())location.replace('admin-panel.html')})();
})();