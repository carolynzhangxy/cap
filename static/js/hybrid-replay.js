'use strict';
(()=>{
 const video=document.getElementById('hybrid-replay-video');if(!video)return;
 document.querySelectorAll('[data-hybrid-seek]').forEach(button=>button.addEventListener('click',()=>{video.currentTime=Number(button.dataset.hybridSeek);video.play().catch(()=>{});}));
 document.getElementById('hybrid-replay-fullscreen').addEventListener('click',()=>{if(video.requestFullscreen)video.requestFullscreen().catch(()=>{});else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen();});
})();
