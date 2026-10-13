'use strict';
(()=>{
 const video=document.getElementById('frequency-video');if(!video)return;
 let selection=0;
 document.querySelectorAll('[data-frequency-video]').forEach(button=>button.addEventListener('click',()=>{
  const key=button.dataset.frequencyVideo,stamp=++selection,time=video.currentTime,resume=!video.paused;
  document.querySelectorAll('[data-frequency-video]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  const src=`static/videos/frequency-${key}.mp4?v=1`;
  video.pause();video.poster=`static/images/frequency-${key}.jpg`;video.querySelector('source').src=src;
  video.setAttribute('aria-label',key==='all'?'Synchronized comparison of four nonholonomic controller frequencies':`Nonholonomic controller frequency ${key}`);
  document.getElementById('frequency-download').href=src;
  document.getElementById('frequency-caption').textContent=key==='all'?'Four frequencies, one simulation clock. Each robot stops at its own first entry into the source neighborhood; completed runs hold their terminal pose.':`Frequency ω = ${key} · ${Math.sqrt(Number(key))} heading turns per model second. This clip uses the same clock and playback speed as the other three.`;
  video.addEventListener('loadedmetadata',async()=>{if(stamp!==selection)return;video.currentTime=Math.min(time,video.duration);if(resume)try{await video.play();}catch{}},{once:true});
  video.load();
 }));
})();
