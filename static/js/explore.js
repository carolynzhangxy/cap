'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // Shared pointer gestures: one pointer pans; two pointers pinch around their midpoint.
  function gestures(element, {pan, zoom, hover, leave}) {
    const points = new Map();
    const local = e => { const r = element.getBoundingClientRect(); return {x:e.clientX-r.left, y:e.clientY-r.top}; };
    const pair = () => { const [a,b] = [...points.values()]; return {x:(a.x+b.x)/2, y:(a.y+b.y)/2, d:Math.hypot(a.x-b.x,a.y-b.y)}; };
    element.addEventListener('pointerdown', e => {
      if(e.button && e.pointerType==='mouse') return;
      e.preventDefault();
      element.focus({preventScroll:true}); points.set(e.pointerId,local(e)); element.setPointerCapture(e.pointerId);
    });
    element.addEventListener('dragstart', e => e.preventDefault());
    element.addEventListener('pointermove', e => {
      const p=local(e), old=points.get(e.pointerId);
      hover?.(p);
      if(!old) return;
      if(points.size===2){const before=pair();points.set(e.pointerId,p);const after=pair();pan(after.x-before.x,after.y-before.y);if(before.d>5)zoom(after.d/before.d,after);}
      else{points.set(e.pointerId,p);pan(p.x-old.x,p.y-old.y);}
    });
    ['pointerup','pointercancel','lostpointercapture'].forEach(name=>element.addEventListener(name,e=>points.delete(e.pointerId)));
    element.addEventListener('pointerleave',()=>leave?.());
    element.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(-clamp(e.deltaY,-150,150)*.005),local(e));},{passive:false});
    element.addEventListener('dblclick',e=>zoom(2,local(e)));
  }

  // Accessible, full-resolution figure gallery.
  const gallery=[...document.querySelectorAll('.figure-open')], dialog=$('figure-dialog');
  const viewport=$('figure-viewport'), picture=$('figure-dialog-image');
  let figure=0, scale=1, offset={x:0,y:0};
  function figureTransform(){
    const r=viewport.getBoundingClientRect();
    // Keep the fitted image within reachable pan limits.
    offset.x=clamp(offset.x,-r.width*(scale-1)/2,r.width*(scale-1)/2);
    offset.y=clamp(offset.y,-r.height*(scale-1)/2,r.height*(scale-1)/2);
    picture.style.transform=`translate(${offset.x}px,${offset.y}px) scale(${scale})`;
    $('figure-zoom').textContent=`${Math.round(scale*100)}%`;
    $('figure-minus').disabled=scale<=1; $('figure-plus').disabled=scale>=8;
  }
  function fitFigure(){scale=1;offset={x:0,y:0};figureTransform();}
  function zoomFigure(factor,point){
    const r=viewport.getBoundingClientRect(), next=clamp(scale*factor,1,8);
    const p=point||{x:r.width/2,y:r.height/2};
    offset={x:p.x-r.width/2-(p.x-r.width/2-offset.x)*next/scale,y:p.y-r.height/2-(p.y-r.height/2-offset.y)*next/scale};
    scale=next;figureTransform();
  }
  function showFigure(index){
    figure=clamp(index,0,gallery.length-1);
    const button=gallery[figure], original=button.querySelector('img');
    picture.src=original.src;picture.alt=original.alt;
    $('figure-dialog-title').textContent=button.dataset.figureTitle;
    $('figure-description').textContent=original.alt;
    $('figure-counter').textContent=`${figure+1} / ${gallery.length}`;
    $('figure-prev').disabled=figure===0;$('figure-next').disabled=figure===gallery.length-1;
    if(!dialog.open)dialog.showModal();fitFigure();
    const key=original.getAttribute('src').split('/').pop().replace('.webp','');
    window.dispatchEvent(new CustomEvent('cap:figure-opened',{detail:{key}}));
  }
  window.addEventListener('cap:focus-figure',event=>{
    if(!dialog.open)return;
    const [x,y,w,h]=event.detail.rect,r=viewport.getBoundingClientRect();
    const fit=Math.min(r.width/picture.naturalWidth,r.height/picture.naturalHeight);
    if(!Number.isFinite(fit)||fit<=0)return;
    const iw=picture.naturalWidth*fit,ih=picture.naturalHeight*fit;
    scale=clamp(Math.min(r.width*.85/(iw*w/100),r.height*.85/(ih*h/100)),1,8);
    offset={x:-((x+w/2)/100-.5)*iw*scale,y:-((y+h/2)/100-.5)*ih*scale};
    figureTransform();
  });
  gallery.forEach((button,i)=>button.addEventListener('click',()=>showFigure(i)));
  document.querySelector('.figure-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{
    // Only a backdrop click dismisses the gallery. Keyboard-activated toolbar
    // buttons have zero client coordinates and must remain inside the dialog.
    if(e.target!==dialog)return;
    const r=dialog.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();
  });
  dialog.addEventListener('close',()=>{gallery[figure]?.focus({preventScroll:true});});
  $('figure-prev').addEventListener('click',()=>showFigure(figure-1));
  $('figure-next').addEventListener('click',()=>showFigure(figure+1));
  $('figure-plus').addEventListener('click',()=>zoomFigure(1.5));
  $('figure-minus').addEventListener('click',()=>zoomFigure(1/1.5));
  $('figure-reset').addEventListener('click',fitFigure);
  gestures(viewport,{pan:(dx,dy)=>{offset.x+=dx;offset.y+=dy;figureTransform();},zoom:zoomFigure});
  dialog.addEventListener('keydown',e=>{
    if(e.key==='+'||e.key==='='){e.preventDefault();zoomFigure(1.4);}
    else if(e.key==='-'){e.preventDefault();zoomFigure(1/1.4);}
    else if(e.key==='0'){e.preventDefault();fitFigure();}
    else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
      e.preventDefault();
      if(scale===1){if(e.key==='ArrowLeft')showFigure(figure-1);if(e.key==='ArrowRight')showFigure(figure+1);}
      else{offset.x+=e.key==='ArrowLeft'?50:e.key==='ArrowRight'?-50:0;offset.y+=e.key==='ArrowUp'?50:e.key==='ArrowDown'?-50:0;figureTransform();}
    }
  });
  new ResizeObserver(()=>{if(dialog.open)figureTransform();}).observe(viewport);

  // Replay saved samples at their original coordinates. The camera changes; the data do not.
  const root=$('trajectory-explorer'),canvas=$('trajectory-canvas'),ctx=canvas.getContext('2d');
  const cache=new Map(),images=new Map();
  let data=null,model='nonholonomic',now=0,playing=false,follow=false,frameId=0,lastFrame=0,requestId=0;
  let camera={x:0,y:0,z:1},width=600,height=570,plot={x:55,y:20,w:400,h:500,s:60};
  let renderId=0,loadingPromise=null;
  function loadImage(name){
    if(images.has(name))return images.get(name);
    const promise=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Could not load scene image.'));image.src=`static/explorer/${name}`;}).catch(error=>{images.delete(name);throw error;});
    images.set(name,promise);return promise;
  }
  let sprites={},backgrounds={};
  function firstAfter(time){let lo=0,hi=data.samples.length;while(lo<hi){const mid=(lo+hi)>>1;if(data.samples[mid][0]<=time)lo=mid+1;else hi=mid;}return lo;}
  function state(){
    const n=firstAfter(now),a=data.samples[Math.max(0,n-1)],b=data.samples[Math.min(n,data.samples.length-1)];
    const f=b[0]>a[0]?clamp((now-a[0])/(b[0]-a[0]),0,1):0;
    return {n,row:[now,...[1,2,3,4].map(i=>a[i]+(b[i]-a[i])*f),a[5]]};
  }
  function world(p){return {x:camera.x+(p.x-plot.x-plot.w/2)/(plot.s*camera.z),y:camera.y-(p.y-plot.y-plot.h/2)/(plot.s*camera.z)};}
  function screen(x,y){return [plot.x+plot.w/2+(x-camera.x)*plot.s*camera.z,plot.y+plot.h/2-(y-camera.y)*plot.s*camera.z];}
  function clampCamera(){
    const [x0,x1,y0,y1]=data.bounds;
    camera.x=clamp(camera.x,x0+(x1-x0)/camera.z/2,x1-(x1-x0)/camera.z/2);
    camera.y=clamp(camera.y,y0+(y1-y0)/camera.z/2,y1-(y1-y0)/camera.z/2);
  }
  function setFollow(value){follow=value;$('explorer-follow').setAttribute('aria-pressed',String(value));}
  function fitPlot(){if(!data)return;const [x0,x1,y0,y1]=data.bounds;camera={x:(x0+x1)/2,y:(y0+y1)/2,z:1};setFollow(false);scheduleDraw();}
  function zoomPlot(factor,point){
    if(!data)return;const p=point||{x:plot.x+plot.w/2,y:plot.y+plot.h/2},before=world(p);
    camera.z=clamp(camera.z*factor,1,16);const after=world(p);
    camera.x+=before.x-after.x;camera.y+=before.y-after.y;setFollow(false);clampCamera();scheduleDraw();
  }
  function panPlot(dx,dy){if(!data)return;setFollow(false);camera.x-=dx/(plot.s*camera.z);camera.y+=dy/(plot.s*camera.z);clampCamera();scheduleDraw();}
  function scheduleDraw(){if(!renderId)renderId=requestAnimationFrame(()=>{renderId=0;draw();});}
  function resize(){
    const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);scheduleDraw();
  }
  function objectFit(image,rectangle){
    const sourceRatio=image.width/image.height,targetRatio=rectangle[2]/rectangle[3];
    let sw=image.width,sh=image.height;if(sourceRatio>targetRatio)sw=sh*targetRatio;else sh=sw/targetRatio;
    ctx.drawImage(image,(image.width-sw)/2,(image.height-sh)/2,sw,sh,...rectangle);
  }
  function sprite(image,pos,sx,sy){
    const [x,y]=screen(...pos),unit=plot.s*camera.z;
    const destination=[x-sx*unit/2,y-sy*unit/2,sx*unit,sy*unit];
    // The supplied car sprite has transparent margins; preserve its fixed pose.
    if(image===sprites.car)ctx.drawImage(image,136,47,228,406,...destination);
    else ctx.drawImage(image,...destination);
  }
  function label(text,pos,dx,dy){const [x,y]=screen(...pos);ctx.font='600 12px Arial';ctx.lineWidth=4;ctx.strokeStyle='#ffffff';ctx.fillStyle='#24343d';ctx.strokeText(text,x+dx,y+dy);ctx.fillText(text,x+dx,y+dy);}
  function path(offset,lo,n,row){
    ctx.beginPath();let moved=false;
    for(let i=lo;i<n;i++){const r=data.samples[i],p=screen(r[offset],r[offset+1]);if(!moved){ctx.moveTo(...p);moved=true;}else ctx.lineTo(...p);}
    const p=screen(row[offset],row[offset+1]);if(moved)ctx.lineTo(...p);else ctx.moveTo(...p);
  }
  function tickStep(span){const raw=span/5,base=10**Math.floor(Math.log10(raw)),m=raw/base;return (m<=1?1:m<=2?2:m<=5?5:10)*base;}
  function draw(){
    ctx.clearRect(0,0,width,height);if(!data)return;
    const [x0,x1,y0,y1]=data.bounds,s=Math.min((width-74)/(x1-x0),(height-66)/(y1-y0));
    plot={x:52+(width-74-(x1-x0)*s)/2,y:20+(height-66-(y1-y0)*s)/2,w:(x1-x0)*s,h:(y1-y0)*s,s};
    const {n,row}=state();if(follow){camera.x=row[1];camera.y=row[2];clampCamera();}
    ctx.save();ctx.beginPath();ctx.rect(plot.x,plot.y,plot.w,plot.h);ctx.clip();
    ctx.fillStyle='#edf2ed';ctx.fillRect(plot.x,plot.y,plot.w,plot.h);
    const bg=$('explorer-background').value,image=backgrounds[bg];
    if(image){const a=screen(x0,y1);objectFit(image,[...a,(x1-x0)*s*camera.z,(y1-y0)*s*camera.z]);}
    else{
      ctx.strokeStyle='#d7e3dc';ctx.lineWidth=1;
      for(let x=Math.ceil(x0);x<=x1;x++){ctx.beginPath();ctx.moveTo(...screen(x,y0));ctx.lineTo(...screen(x,y1));ctx.stroke();}
      for(let y=Math.ceil(y0);y<=y1;y++){ctx.beginPath();ctx.moveTo(...screen(x0,y));ctx.lineTo(...screen(x1,y));ctx.stroke();}
    }
    const recent=$('explorer-recent').checked;
    const lo=recent?Math.max(0,firstAfter(Math.max(0,now-data.recent))-1):0;
    ctx.lineJoin='round';ctx.lineCap='round';
    if($('explorer-truth').checked){path(1,lo,n,row);ctx.strokeStyle='#6e302477';ctx.lineWidth=3.5;ctx.stroke();ctx.strokeStyle='#ed392b';ctx.lineWidth=2.4;ctx.stroke();}
    if($('explorer-estimate').checked){path(3,lo,n,row);ctx.setLineDash([6,5]);ctx.strokeStyle='#24382dbb';ctx.lineWidth=3.2;ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=1.6;ctx.stroke();ctx.setLineDash([]);}
    sprite(sprites.rock,data.obstacle,data.radius*2,data.radius*2);
    sprite(sprites.gas,data.source,.48,.64);sprite(sprites.car,data.initial,.36,.61);
    if(camera.z<3){label('Source',data.source,18,-8);label('Initial',data.initial,16,20);label('Obstacle',data.obstacle,12,0);}
    if($('explorer-truth').checked){const p=screen(row[1],row[2]);ctx.beginPath();ctx.arc(...p,4.5,0,2*Math.PI);ctx.fillStyle='#f5bf42';ctx.fill();ctx.strokeStyle='#263e35';ctx.lineWidth=1.3;ctx.stroke();}
    if($('explorer-estimate').checked){const [x,y]=screen(row[3],row[4]);ctx.beginPath();ctx.moveTo(x-5,y);ctx.lineTo(x+5,y);ctx.moveTo(x,y-5);ctx.lineTo(x,y+5);ctx.strokeStyle='#234736';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=1.2;ctx.stroke();}
    ctx.restore();ctx.strokeStyle='#758981';ctx.lineWidth=1;ctx.strokeRect(plot.x,plot.y,plot.w,plot.h);
    ctx.fillStyle='#455950';ctx.font='11px Arial';
    const left=world({x:plot.x,y:plot.y+plot.h}),right=world({x:plot.x+plot.w,y:plot.y});
    for(const axis of ['x','y']){
      const min=left[axis],max=right[axis],step=tickStep(max-min),digits=Math.max(0,-Math.floor(Math.log10(step)));
      for(let v=Math.ceil((min-1e-9)/step)*step;v<=max+1e-9;v+=step){
        const text=Math.abs(v)<step/100?'0':v.toFixed(digits);
        if(axis==='x'){const [x]=screen(v,0);ctx.textAlign='center';ctx.fillText(text,x,plot.y+plot.h+17);}
        else{const [,y]=screen(0,v);ctx.textAlign='right';ctx.fillText(text,plot.x-9,y+4);}
      }
    }
    ctx.textAlign='center';ctx.fillText('x-coordinate',plot.x+plot.w/2,plot.y+plot.h+37);
    ctx.save();ctx.translate(14,plot.y+plot.h/2);ctx.rotate(-Math.PI/2);ctx.fillText('y-coordinate',0,0);ctx.restore();
    $('explorer-view-label').textContent=(follow?'Following tip · ':camera.z===1?'Full view · ':'Detail · ')+camera.z.toFixed(1)+'×';
    $('explorer-time-value').textContent=now.toFixed(3);$('explorer-time').value=String(now);
    $('explorer-position').textContent=`(${row[1].toFixed(3)}, ${row[2].toFixed(3)})`;
    $('explorer-error').textContent=Math.hypot(row[1]-row[3],row[2]-row[4]).toFixed(4)+' units';
    $('explorer-mode').textContent='q = '+row[5];
    $('explorer-trail-note').textContent=recent?`Last ${data.recent} ${data.units}; earlier strokes are hidden.`:'The complete path up to the selected time.';
    // Semantic state supports QA without exposing private source data or adding UI clutter.
    canvas.dataset.time=String(now);canvas.dataset.sampleCount=String(n);canvas.dataset.mode=String(row[5]);canvas.dataset.zoom=String(camera.z);
  }
  function pause(){playing=false;cancelAnimationFrame(frameId);frameId=0;$('explorer-play').textContent='▶ Play';}
  function animate(stamp){
    if(!playing||!data)return;
    const dt=Math.min((stamp-lastFrame)/1000,.1);lastFrame=stamp;
    now=Math.min(data.end,now+dt*Number($('explorer-speed').value));draw();
    if(now>=data.end)pause();else frameId=requestAnimationFrame(animate);
  }
  function play(){
    if(!data)return;document.querySelectorAll('video').forEach(v=>v.pause());if(now>=data.end)now=0;
    playing=true;$('explorer-play').textContent='Ⅱ Pause';lastFrame=performance.now();frameId=requestAnimationFrame(animate);
  }
  async function load(kind){
    const id=++requestId;pause();data=null;model=kind;
    $('explorer-loading').hidden=false;$('explorer-loading').textContent='Loading recorded positions…';
    ['explorer-play','explorer-restart','explorer-time'].forEach(x=>$(x).disabled=true);
    document.querySelectorAll('[data-replay]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.replay===kind)));
    try{
      if(!cache.has(kind))cache.set(kind,fetch(`data/explorer/${kind}.json?v=2`).then(r=>{if(!r.ok)throw new Error('Could not load the replay.');return r.json();}).catch(e=>{cache.delete(kind);throw e;}));
      const record=await cache.get(kind);
      const names=[...record.backgrounds.map(x=>x[1]),'rock.png','gas.png','paper-car.png'];
      const assets=await Promise.all(names.map(loadImage));if(id!==requestId)return;
      const loaded=Object.fromEntries(names.map((name,i)=>[name,assets[i]]));
      backgrounds=loaded;sprites={rock:loaded['rock.png'],gas:loaded['gas.png'],car:loaded['paper-car.png']};
      data=record;now=record.defaultTime;
      $('explorer-background').replaceChildren(...record.backgrounds.map(([text,value])=>new Option(text,value)),new Option('Plain','plain'));
      $('explorer-record-title').textContent=record.title;$('explorer-scope').textContent=record.scope;
      $('explorer-parameters').textContent=record.parameters;$('explorer-time-end').textContent=`${record.end} ${record.units}`;
      $('explorer-time').max=String(record.end);$('explorer-time').step=kind==='nonholonomic'?'0.0001':'0.005';
      $('explorer-speed').value=String(record.speed);$('explorer-recent').checked=false;
      ['explorer-play','explorer-restart','explorer-time'].forEach(x=>$(x).disabled=false);
      $('explorer-loading').hidden=true;fitPlot();resize();
    }catch(error){if(id!==requestId)return;const message=document.createElement('span');message.textContent='Replay unavailable. The downloadable videos remain available below.';const retry=document.createElement('button');retry.textContent='Try again';retry.onclick=()=>load(kind);$('explorer-loading').replaceChildren(message,retry);}
  }
  document.querySelectorAll('[data-replay]').forEach(button=>button.addEventListener('click',()=>{loadingPromise=load(button.dataset.replay);}));
  $('explorer-play').addEventListener('click',()=>playing?pause():play());
  $('explorer-restart').addEventListener('click',()=>{now=0;pause();play();});
  $('explorer-time').addEventListener('input',e=>{pause();now=Number(e.target.value);scheduleDraw();});
  ['explorer-truth','explorer-estimate','explorer-recent','explorer-background'].forEach(id=>$(id).addEventListener('change',scheduleDraw));
  $('explorer-zoom-in').addEventListener('click',()=>zoomPlot(1.5));
  $('explorer-zoom-out').addEventListener('click',()=>zoomPlot(1/1.5));
  $('explorer-fit').addEventListener('click',fitPlot);
  $('explorer-follow').addEventListener('click',()=>{if(!data)return;setFollow(!follow);if(follow){camera.z=Math.max(6,camera.z);$('explorer-recent').checked=true;}scheduleDraw();});
  $('explorer-fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement===root)await document.exitFullscreen();else if(root.requestFullscreen)await root.requestFullscreen();else root.scrollIntoView({block:'start'});}catch{root.scrollIntoView({block:'start'});}});
  document.addEventListener('fullscreenchange',()=>{$('explorer-fullscreen').textContent=document.fullscreenElement===root?'Exit full screen':'Full screen ↗';resize();});
  document.querySelectorAll('video').forEach(v=>v.addEventListener('play',pause));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  canvas.addEventListener('keydown',e=>{
    if(!data)return;
    if(e.key===' '){e.preventDefault();playing?pause():play();}
    else if(e.key==='+'||e.key==='='){e.preventDefault();zoomPlot(1.5);}
    else if(e.key==='-'){e.preventDefault();zoomPlot(1/1.5);}
    else if(e.key==='0'){e.preventDefault();fitPlot();}
    else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();panPlot(e.key==='ArrowLeft'?40:e.key==='ArrowRight'?-40:0,e.key==='ArrowUp'?40:e.key==='ArrowDown'?-40:0);}
  });
  gestures(canvas,{pan:panPlot,zoom:zoomPlot,hover:p=>{if(!data)return;const a=world(p);$('explorer-cursor').textContent=`x ${a.x.toFixed(2)} · y ${a.y.toFixed(2)}`;},leave:()=>{$('explorer-cursor').textContent='';}});
  new ResizeObserver(resize).observe(canvas.parentElement);
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){if(!loadingPromise)loadingPromise=load(model);observer.disconnect();}},{rootMargin:'500px'});observer.observe(root);}
  else loadingPromise=load(model);
})();
