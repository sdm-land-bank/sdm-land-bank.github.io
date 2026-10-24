/* QA only (not linked from the dashboard): a fake microphone that plays recorded test questions into Lara,
   so a full voice conversation can be tested in a browser that has no microphone. */
(function(){
const QA=window.QA={ev:[],t0:Date.now()};
const log=(k,v)=>{ QA.ev.push([((Date.now()-QA.t0)/1000).toFixed(2),k,v]); if(QA.ev.length>3000) QA.ev.shift(); };
QA.log=log;
QA.init=async function(){
  if(QA.ctx) return "ready";
  QA.ctx=new AudioContext(); QA.dest=QA.ctx.createMediaStreamDestination();
  const osc=QA.ctx.createOscillator(), g=QA.ctx.createGain(); g.gain.value=0.00001; osc.connect(g).connect(QA.dest); osc.start();   // keep the track alive
  QA.buf={};
  for(let i=1;i<=40;i++){ try{ const r=await fetch("qa/c"+i+".wav",{cache:"no-store"}); if(!r.ok) continue; QA.buf["c"+i]=await QA.ctx.decodeAudioData(await r.arrayBuffer()); }catch(e){} }
  navigator.mediaDevices.getUserMedia=async()=>{ const d=QA.ctx.createMediaStreamDestination(); const o=QA.ctx.createOscillator(), g=QA.ctx.createGain(); g.gain.value=0.00001; o.connect(g).connect(d); o.start(); QA.dest=d; log("mic","new stream"); return d.stream; };   // a fresh stream each time, like a real microphone
  await QA.ctx.resume();
  // watch Lara
  const st0=laraState; laraState=function(s){ if(s!==LARA.st) log("state",s); return st0.apply(this,arguments); };
  const pl0=laraPlay; laraPlay=function(b){ QA.audioChunks=(QA.audioChunks||0)+1; if(!QA.firstAudio) { QA.firstAudio=Date.now(); log("first audio",QA.firstAudio-(QA.upAt||QA.firstAudio)+" ms after release"); } return pl0.apply(this,arguments); };
  const cap0=laraCap; laraCap=function(w,t,r){ if(w==="l"&&String(t).trim()) QA.lastL=(r?"":(QA.lastL||""))+t; return cap0.apply(this,arguments); };
  const lg0=laraLog; laraLog=function(k,t,d){ log("log:"+k,String(t).slice(0,140)+(d?" "+JSON.stringify(d).slice(0,200):"")); return lg0.apply(this,arguments); };
  addEventListener("error",e=>log("JS ERROR",String(e.message)));
  addEventListener("unhandledrejection",e=>log("PROMISE",String(e.reason&&e.reason.message||e.reason)));
  return Object.keys(QA.buf).join(",");
};
QA.play=k=>new Promise(r=>{ const s=QA.ctx.createBufferSource(); s.buffer=QA.buf[k]; s.connect(QA.dest); s.onended=r; s.start(); });
/* hold the button, say the clip, let go - like a person (starts talking at once, before the line is open) */
QA.say=async function(k,lead){
  QA.firstAudio=0; QA.lastL=""; QA.audioChunks=0; log("SAY",k);
  window.laraPttDown();
  await new Promise(r=>setTimeout(r,lead==null?200:lead));
  await QA.play(k);
  await new Promise(r=>setTimeout(r,250));
  QA.upAt=Date.now(); await window.laraPttUp(); log("released",k);
};
/* wait until she has answered (speaking then back to listening) or the time is up */
QA.wait=async function(ms){ const t0=Date.now(); let spoke=false;
  while(Date.now()-t0<(ms||25000)){ await new Promise(r=>setTimeout(r,300)); if(LARA.st==="speaking") spoke=true; if(spoke&&LARA.st!=="speaking"&&LARA.st!=="thinking"&&Date.now()-QA.firstAudio>1200) break; }
  return {answer:(QA.lastL||"").trim().slice(0,300), firstAudioMs:QA.firstAudio?QA.firstAudio-QA.upAt:null, chunks:QA.audioChunks, st:LARA.st, model:LARA.model, lite:!!LARA.lite};
};
QA.dump=(n)=>QA.ev.slice(-(n||60));
})();
