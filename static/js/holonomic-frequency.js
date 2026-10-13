'use strict';
(()=>{
 const root=document.getElementById('holonomic-frequency-comparison');if(!root)return;
 const video=root.querySelector('video');let selection=0;
 root.querySelectorAll('[data-holonomic-frequency]').forEach(button=>button.addEventListener('click',()=>{
  const key=button.dataset.holonomicFrequency,stamp=++selection,time=video.currentTime,resume=!video.paused;
  root.querySelectorAll('[data-holonomic-frequency]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  const src=`static/videos/holonomic-frequency-${key}.mp4?v=1`;
  video.pause();video.poster=`static/images/holonomic-frequency-${key}.jpg?v=1`;video.querySelector('source').src=src;
  video.querySelector('track').src=`static/videos/holonomic-frequency-${key}.vtt?v=1`;
  video.setAttribute('aria-label',key==='all'?'Synchronized comparison of four holonomic oscillator frequencies':`Holonomic robot: omega ${key} radians per second`);
  root.querySelector('[data-holonomic-download]').href=src;
  root.querySelector('[data-holonomic-caption]').textContent=key==='all'?'Four recomputed trajectories share one model clock and the same world scale. Completed runs hold their actual terminal position.':`ω = ${key} rad/s · ${(Number(key)/(2*Math.PI)).toFixed(2)} oscillator cycles per model second. The robot body keeps a fixed orientation; the local inset enlarges the last two cycles.`;
  video.addEventListener('loadedmetadata',async()=>{if(stamp!==selection)return;video.currentTime=Math.min(time,video.duration);if(resume)try{await video.play();}catch{}},{once:true});video.load();
 }));
 root.querySelector('[data-holonomic-fullscreen]').addEventListener('click',()=>{if(video.requestFullscreen)video.requestFullscreen().catch(()=>{});else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen();});
})();
