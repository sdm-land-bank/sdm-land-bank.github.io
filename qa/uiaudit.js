/* QA only (not linked from the dashboard): page-by-page checks for the current role and window size. */
(function(){
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ERR=window.__qaErr=window.__qaErr||[];
if(!window.__qaErrHook){ window.__qaErrHook=1;
  addEventListener("error",e=>{ const m=String(e.message||""); if(!/ResizeObserver loop/.test(m)) ERR.push((S&&S.view||"?")+": "+m.slice(0,160)); });
  addEventListener("unhandledrejection",e=>ERR.push((S&&S.view||"?")+": promise "+String(e.reason&&e.reason.message||e.reason).slice(0,160)));
  const ce=console.error; console.error=function(){ try{ const m=[...arguments].map(x=>x&&x.message||String(x)).join(" "); if(!/ResizeObserver|favicon/.test(m)) ERR.push((S&&S.view||"?")+": console "+m.slice(0,160)); }catch(e){} return ce.apply(this,arguments); };
}
const vis=e=>{ const s=getComputedStyle(e); if(s.display==="none"||s.visibility==="hidden"||+s.opacity===0) return false; const r=e.getBoundingClientRect(); return r.width>0&&r.height>0; };
const name=e=>e.tagName.toLowerCase()+(e.id?"#"+e.id:"")+(e.classList.length?"."+[...e.classList].slice(0,2).join("."):"");
const clipAnc=e=>{ let x=e.parentElement; while(x&&x!==document.body){ const s=getComputedStyle(x); if(/(auto|scroll|hidden|clip)/.test(s.overflowX)) return x; x=x.parentElement; } return null; };
const IGN=/railpin|laraMs|ed-mask|nav-|rail-open-only|nt-badge|pin-t|aud-|maplibregl/;
function layout(){
  const R={}; const de=document.documentElement; R.hscroll=de.scrollWidth>de.clientWidth+1?de.scrollWidth-de.clientWidth:0;
  const off=[]; document.querySelectorAll("main *, .lara-dock, .rq-corner, .va-bar").forEach(e=>{ if(off.length>=8||!vis(e)) return; if(e.closest("#laraDock .lara-main:not(:empty) svg,.maplibregl-map,iframe,svg,canvas")) return;
    const r=e.getBoundingClientRect(); if(r.right>innerWidth+2||r.left<-2){ const c=clipAnc(e); if(c){ const cr=c.getBoundingClientRect(); if(cr.right<=innerWidth+2&&cr.left>=-2) return; }
      if(e.children.length&&[...e.children].some(k=>{const q=k.getBoundingClientRect(); return q.right>innerWidth+2||q.left<-2;})) return; const n=name(e); if(!IGN.test(n)) off.push(n+" ["+Math.round(r.left)+"→"+Math.round(r.right)+"] "+(e.innerText||"").trim().slice(0,24)); } });
  R.offscreen=off;
  const cut=[]; document.querySelectorAll("main button, main h1, main h2, main h3, main label, main th, .kpi .v, .kpi .k").forEach(e=>{ if(cut.length>=6||!vis(e)) return; const s=getComputedStyle(e);
    if(e.scrollWidth>e.clientWidth+3&&s.overflow!=="visible"&&s.textOverflow!=="ellipsis"&&e.clientWidth>0){ const n=name(e); if(!IGN.test(n)) cut.push(n+" "+(e.innerText||"").trim().slice(0,26)+" ("+e.clientWidth+"/"+e.scrollWidth+")"); } });
  R.clipped=cut;
  const fx=[...document.querySelectorAll("body *")].filter(e=>{ const p=getComputedStyle(e).position; return p==="fixed"&&vis(e)&&!e.closest("#laraEdge,.maplibregl-map"); }).map(e=>({e,r:e.getBoundingClientRect()})).filter(o=>o.r.width<innerWidth*.9&&o.r.height<innerHeight*.9&&o.r.width>8);
  const ov=[]; for(let i=0;i<fx.length;i++) for(let j=i+1;j<fx.length;j++){ const a=fx[i].r,b=fx[j].r; if(fx[i].e.contains(fx[j].e)||fx[j].e.contains(fx[i].e)) continue; const ix=Math.min(a.right,b.right)-Math.max(a.left,b.left), iy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top); if(ix>8&&iy>8) ov.push(name(fx[i].e)+" × "+name(fx[j].e)); }
  R.fixedOverlap=[...new Set(ov)].slice(0,6);
  if(innerWidth<=820){ const t=[]; document.querySelectorAll("main button, main a, main input, main select").forEach(e=>{ if(t.length>=5||!vis(e)) return; if(e.type==="checkbox"||e.type==="radio") return; const r=e.getBoundingClientRect(); if(r.height<26&&r.width<300) t.push(name(e)+" "+Math.round(r.width)+"×"+Math.round(r.height)+" "+(e.innerText||e.title||e.placeholder||"").trim().slice(0,18)); }); R.smallTargets=t; }
  const fs=[]; document.querySelectorAll("main p, main span, main td, main li, main label, main small").forEach(e=>{ if(fs.length>=4||!vis(e)) return; if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>2)) return; const f=parseFloat(getComputedStyle(e).fontSize); if(f<9.5) fs.push(name(e)+" "+f+"px "+e.textContent.trim().slice(0,20)); });
  R.tinyText=fs;
  // the map must fill its frame
  try{ if(typeof map!=="undefined"&&map&&(S.view==="inventory")){ const c=map.getCanvas(), w=document.getElementById("mapwrap").getBoundingClientRect(); const cr=c.getBoundingClientRect(); if(Math.abs(cr.height-w.height)>3||Math.abs(cr.width-w.width)>3) R.mapGap="canvas "+Math.round(cr.width)+"×"+Math.round(cr.height)+" vs frame "+Math.round(w.width)+"×"+Math.round(w.height); } }catch(e){}
  for(const k of Object.keys(R)) if(Array.isArray(R[k])&&!R[k].length||!R[k]) delete R[k];
  return R;
}
const MONEY=/\bEGP\b|\bUSD\b|price|revenue|collect|\bdeals?\b|sales value|cash value|customer|buyer|sold by|\bclient\b/i;
function leaks(){ const out=[]; const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let n;
  while((n=tw.nextNode())&&out.length<10){ const t=n.textContent.trim(); if(!t||!MONEY.test(t)) continue; const el=n.parentElement; if(!el||!vis(el)||el.closest("script,style,#laraDock .lara-set,.va-bar,#laraConv")) continue;
    if(/^(price|price \/ sqm)$/i.test(t)&&el.closest("#fbar")) continue; out.push(name(el)+": "+t.slice(0,70)); } return out; }
async function check(v){
  const F={};
  try{
    if(v==="inventory"){ F.parks=(parkPins().features||[]).length; F.kpis=[...document.querySelectorAll("#kpis .kpi .k")].filter(vis).map(k=>k.textContent).join(","); F.chips=[...document.querySelectorAll(".pfchips .chip, .legend .chip, .stchips button")].filter(vis).length; F.mapLoaded=map.loaded(); }
    if(v==="sales"){ const f=document.querySelector("iframe"); F.iframe=!!f; await sleep(2500); try{ F.lbText=(f.contentDocument.body.innerText||"").length; }catch(e){ F.lbText="n/a"; } }
    if(v==="match"){ const ta=document.querySelector(".view-match textarea"); if(ta){ ta.value="frozen vegetables"; ta.dispatchEvent(new Event("input",{bubbles:true})); const b=[...document.querySelectorAll("button")].find(b=>/find the best plots/i.test(b.textContent)); b&&b.click(); await sleep(3500); F.cards=document.querySelectorAll(".mm-card").length; F.pdf=!!document.getElementById("mmPdf")&&vis(document.getElementById("mmPdf")); } }
    if(v==="codes"){ await sleep(1200); F.text=(document.querySelector("#content, main").innerText||"").length; }
    if(v==="offer"){ await sleep(1500); F.rows=(document.querySelector("main").innerText.match(/Print again/g)||[]).length; }
    if(v==="approvals"){ await sleep(1500); F.cards=document.querySelectorAll("main .wf-card, main [class*=wf-req]").length; }
    if(v==="audit"){ await sleep(2000); F.rows=document.querySelectorAll(".aud-tbl tbody tr").length; }
    if(v==="editor"){ await sleep(1500); F.rows=(document.querySelector("main").innerText.match(/Showing ([\d,]+)/)||[])[1]||"?"; }
    if(v==="health"){ F.text=(document.querySelector("main").innerText||"").length; }
    if(v==="demand"){ await sleep(2000); F.text=(document.querySelector("main").innerText||"").length; }
    if(v==="settings"){ await sleep(1500); F.text=(document.querySelector("main").innerText||"").length; }
  }catch(e){ F.error=String(e.message||e).slice(0,120); }
  return F;
}
window.QAUI=async function(views,opts){
  opts=opts||{}; const out={w:innerWidth,h:innerHeight,role:(window.SID_VIEWAS&&SID_VIEWAS.role)||(SBME&&SBME.role),pub:!!(window.sidPublic&&sidPublic()),nav:[...document.querySelectorAll("#nav .nav-item")].map(b=>b.dataset.view||b.id),pages:{}};
  const e0=ERR.length;
  for(const v of (views||["inventory","sales","demand","match","codes","offer","approvals","audit","editor","health","settings"])){
    if(!canSee(v)){ out.pages[v]="hidden"; continue; }
    const k=ERR.length; try{ go(v); }catch(e){ out.pages[v]="go failed: "+e.message; continue; }
    await sleep(1400);
    if(S.view!==v){ out.pages[v]="did not open"; continue; }
    const P={}; if(opts.func!==false) P.func=await check(v); P.layout=layout(); if(out.pub) { const l=leaks(); if(l.length) P.LEAK=l; }
    if(ERR.length>k) P.errors=ERR.slice(k); out.pages[v]=P;
  }
  out.errorsTotal=ERR.length-e0; return out;
};
})();
