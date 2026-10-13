'use strict';
(()=>{
 const root=document.getElementById('holonomic-amplitude-comparison');if(!root)return;
 const video=root.querySelector('video');let selection=0;
 root.querySelectorAll('[data-amplitude-video]').forEach(button=>button.addEventListener('click',()=>{
  const key=button.dataset.amplitudeVideo,a=key.replace('p','.'),stamp=++selection,time=video.currentTime,resume=!video.paused;
  root.querySelectorAll('[data-amplitude-video]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  const src=`static/videos/holonomic-amplitude-${key}.mp4?v=1`;
  video.pause();video.poster=`static/images/holonomic-amplitude-${key}.jpg?v=1`;video.querySelector('source').src=src;
  video.querySelector('track').src=`static/videos/holonomic-amplitude-${key}.vtt?v=1`;
  video.setAttribute('aria-label',key==='all'?'Synchronized comparison of four holonomic amplitudes at omega 60':`Holonomic robot: amplitude a = ${a}, omega = 60 radians per second`);
  root.querySelector('[data-amplitude-download]').href=src;
  root.querySelector('[data-amplitude-caption]').textContent=key==='all'?'Fixed ω = 60 rad/s. Full views and local insets share their respective scales across all four amplitudes at each model time. Completed runs hold their terminal position.':`a = ${a} · ω = 60 rad/s · aω = ${(Number(a)*60).toFixed(2)} · 2k/a = ${(2.8/Number(a)).toFixed(2)}. The local view uses the same scale as the other three amplitudes at this model time.`;
  video.addEventListener('loadedmetadata',async()=>{if(stamp!==selection)return;video.currentTime=Math.min(time,video.duration);if(resume)try{await video.play();}catch{}},{once:true});video.load();
 }));
 root.querySelector('[data-amplitude-fullscreen]').addEventListener('click',()=>{if(video.requestFullscreen)video.requestFullscreen().catch(()=>{});else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen();});
})();
