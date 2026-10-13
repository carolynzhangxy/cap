import {panelSVG,project,unproject,routeAt,routePath,robotMarkup} from './holonomic-construction-render.js';
import {potentials,coveringDistances} from './scene-controller.js';
const root=document.getElementById('holonomic-construction');
if(root){
 const assetFiles={terrain:'scene-realism/terrain.webp',rover:'scene-realism/rover-views.webp',rock:'scene-realism/rock-views.webp',drone:'scene-realism/camera-drone-author.webp',source:'construction/source.png'};
 const asset=k=>new URL('../'+assetFiles[k],import.meta.url).href;
 const panels=root.querySelector('.construction-panels'),readout=root.querySelector('.construction-readout'),range=root.querySelector('input[type=range]'),play=root.querySelector('[data-construction-play]');
 const state={top:false,regions:true,contours:true,vectors:true,trajectories:true,drone:true};
 let data,time=190,playing=false,raf,last=0;
 const maxTime=()=>Math.max(...data.routes.map(r=>r.arrival));
 function updateMotion(){for(const q of [1,2]){const p=routePath(data,q,time,state.top);panels.querySelector(`[data-route="${q}"]`).setAttribute('d',p);panels.querySelector(`[data-route-halo="${q}"]`).setAttribute('d',p);panels.querySelector(`[data-robot="${q}"]`).innerHTML=robotMarkup(routeAt(data,q,time).row.slice(1,3),state.top,asset);}range.value=Math.round(time/maxTime()*1000);root.querySelector('output').textContent=`Averaged time: ${time.toFixed(1)} s`;root.dataset.time=time.toFixed(2);}
 function render(){panels.innerHTML=[1,2].map(q=>`<div class="construction-panel">${panelSVG(data,q,{...state,t:time},asset)}</div>`).join('');root.dataset.view=state.top?'top':'perspective';updateMotion();}
 function pause(){playing=false;cancelAnimationFrame(raf);play.textContent='Play both routes';play.setAttribute('aria-pressed','false');last=0;}
 function tick(now){if(!playing)return;if(last)time=Math.min(maxTime(),time+(now-last)/1000*maxTime()/24);last=now;updateMotion();if(time>=maxTime())pause();else raf=requestAnimationFrame(tick);}
 play.addEventListener('click',()=>{if(!data)return;if(playing)return pause();if(time>=maxTime()-.1||time===190)time=0;playing=true;play.textContent='Pause';play.setAttribute('aria-pressed','true');raf=requestAnimationFrame(tick);});
 range.addEventListener('input',()=>{if(!data)return;pause();time=Number(range.value)/1000*maxTime();updateMotion();});
 root.querySelectorAll('[data-construction-view]').forEach(b=>b.addEventListener('click',()=>{if(!data)return;state.top=b.dataset.constructionView==='top';root.querySelectorAll('[data-construction-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();}));
 root.querySelectorAll('[data-construction-layer]').forEach(b=>b.addEventListener('change',()=>{state[b.dataset.constructionLayer]=b.checked;if(data)render();}));
 root.querySelectorAll('[data-construction-focus]').forEach(b=>b.addEventListener('click',()=>{panels.dataset.focus=b.dataset.constructionFocus;root.querySelectorAll('[data-construction-focus]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}));
 function inspect(event){const svg=event.target.closest('.construction-panel svg[role=img]');if(!svg||!data)return;const pt=new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse()),p=unproject([pt.x,pt.y],state.top);if(p.some(v=>Math.abs(v)>data.bound))return;const q=Array.from(panels.children).indexOf(svg.parentElement)+1,v=potentials(...p,data.config),d=coveringDistances(...p,data.config),best=Math.min(...v);let message;
 if(!Number.isFinite(best))message='Inside the excluded inner set: neither mode is admissible.';
 else if(!Number.isFinite(v[q-1]))message=`Outside U${q}: V${q} = ∞. Select the other admissible mode; the robot position does not jump.`;
 else {const gap=v[q-1]-best;message=`Inside U${q} · d${q} = ${d[q-1].toFixed(2)} · V${q} = ${v[q-1].toFixed(3)} · Γ = ${gap.toFixed(3)}. `+(gap>=data.config.delta?`Jump set: select q = ${3-q}.`:'Flow set: the current mode can continue.');}
 readout.textContent=`p = (${p[0].toFixed(2)}, ${p[1].toFixed(2)}). ${message}`;
 }
 panels.addEventListener('pointermove',inspect);panels.addEventListener('click',inspect);
 const observer=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)pause();});observer.observe(root);
 fetch(new URL('../../data/holonomic-construction/geometry.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Geometry unavailable');return r.json();}).then(d=>{data=d;render();root.dataset.ready='true';play.disabled=false;range.disabled=false;}).catch(()=>{root.querySelector('.construction-loading').textContent='The interactive figure could not load. Download the PDF below to view the construction.';});
}
