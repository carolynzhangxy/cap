'use strict';
(() => {
  const root=document.getElementById('scene-lab'),canvas=document.getElementById('setup-canvas');
  if(!root||!canvas)return;
  const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
  const initial={vehicle:[1.8,-.9],source:[-1.8,.9],obstacle:[0,0]};
  let positions=structuredClone(initial),height=4.2,view=matchMedia('(max-width:550px)').matches?'top':'perspective',selected='vehicle',drag=null,model='nonholonomic';
  const radius=.62,bodyRadius=.2;
  let startPosition=initial.vehicle.slice(),run=null,worker=null,playTime=0,playing=false,lastFrame=0,raf=0,rerunTimer=0,trailLengths=[],trailIndices=[],trailStyle='sampled',runNumber=0;
  // The terrain and overview scale are fixed; a future trajectory never changes them.
  const frameRadius=3;
  const cameraCenter=[0,0];
  let cameraViewScale=1,cameraReframes=0;
  const workerURL=new URL('scene-worker.js?v=6',document.currentScript.src);
  const colors={vehicle:'#155681',source:'#b3412d',obstacle:'#46583f',camera:'#17476a'};
  const assetRoot=new URL('../scene-realism/',document.currentScript.src).href;
  const artwork={
    rover:{file:'rover-views.webp',width:1774,height:887,angle:[75,130,860,680],top:[980,85,710,710]},
    rock:{file:'rock-views.webp',width:1774,height:887,angle:[32,96,867,700],top:[899,102,844,731]},
    camera:{file:'camera-drone-author.webp',width:1536,height:1024,angle:[20,45,1500,860]}
  };
  const sprite=(key,pose,x,y,w,h)=>{const a=artwork[key],box=a[pose]||a.angle;return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${box.join(' ')}" preserveAspectRatio="none" overflow="hidden" class="scene-real-object"><image href="${assetRoot+a.file}" width="${a.width}" height="${a.height}"/></svg>`;};
  // Full-resolution scene assets are cached once; each object stays independently draggable.
  for(const file of ['terrain.webp',...Object.values(artwork).map(a=>a.file)]){const img=new Image();img.src=assetRoot+file;}

  const descriptions={vehicle:['Move the vehicle','Drag the blue vehicle to choose a new starting point. Release to run; arrow keys work too.'],source:['Place the signal source','Place the source anywhere in the free space. Release it to integrate a new closed-loop trajectory.'],obstacle:['Place the obstacle','Reposition the rock. Release it to see the controller navigate the new layout.'],camera:['Adjust the camera drone','The drone stays directly above the workspace center, looking straight down. Only its field of view widens if the vehicle leaves the image. Drag vertically to adjust its height.']};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const compact=()=>canvas.clientWidth<550;
  const project=(wx,wy,z=0)=>{const x=wx*3/frameRadius,y=wy*3/frameRadius;return view==='top'?(compact()?[550+x*145,465-y*110]:[620+x*87,340-y*87]):[570+(x-y)*76,370+(x+y)*38-z*70*3/frameRadius];};
  const inverse=(x,y)=>(view==='top'?(compact()?[(x-550)/145,(465-y)/110]:[(x-620)/87,(340-y)/87]):[((x-570)/76+(y-370)/38)/2,((y-370)/38-(x-570)/76)/2]).map(v=>v*frameRadius/3);
  const pts=p=>p.map(v=>v.map(n=>n.toFixed(2)).join(',')).join(' ');
  const polygon=(p,fill,stroke='none',extra='')=>`<polygon points="${pts(p)}" fill="${fill}" stroke="${stroke}" ${extra}/>`;
  const line=(a,b,stroke,extra='')=>`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${stroke}" ${extra}/>`;
  const circle=(p,r,fill,extra='')=>`<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${fill}" ${extra}/>`;
  const ring=(pos,r,z=0,n=72)=>Array.from({length:n},(_,i)=>{const t=i/n*2*Math.PI;return project(pos[0]+r*Math.cos(t),pos[1]+r*Math.sin(t),z);});
  const floor=()=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(p=>project(p[0]*frameRadius,p[1]*frameRadius));
  canvas.innerHTML=`<defs><filter id="lab-rover-shadow" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="3"/></filter><filter id="lab-ground-shadow" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur stdDeviation="12"/></filter><linearGradient id="lab-soil-edge" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8d7050"/><stop offset="1" stop-color="#473c2b"/></linearGradient><linearGradient id="lab-ground" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f1f4e9"/><stop offset="1" stop-color="#e4ebd8"/></linearGradient><linearGradient id="lab-cone" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#aecbd3" stop-opacity=".14"/><stop offset="1" stop-color="#a7c7ca" stop-opacity=".02"/></linearGradient><radialGradient id="lab-glow"><stop stop-color="#d18a52" stop-opacity=".21"/><stop offset="1" stop-color="#d18a52" stop-opacity="0"/></radialGradient><filter id="lab-shadow" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="9"/></filter><clipPath id="lab-floor-clip"><polygon id="lab-floor-shape"/></clipPath><clipPath id="lab-preview-clip"><rect x="31" y="28" width="192" height="192" rx="6"/></clipPath></defs><g id="lab-ground-layer"></g><g id="lab-field-layer" clip-path="url(#lab-floor-clip)" pointer-events="none"></g><g id="lab-frustum-layer" pointer-events="none"></g><g id="lab-trail-layer" pointer-events="none"></g><g id="lab-actors"></g><g id="lab-preview" pointer-events="none"></g>`;
  const actors={};
  ['source','obstacle','vehicle','camera'].forEach(k=>{const g=document.createElementNS(NS,'g');g.dataset.object=k;g.setAttribute('role','button');g.setAttribute('tabindex','0');g.setAttribute('aria-label',`${k==='camera'?'Drone with downward-facing overhead camera':k}. Use arrow keys to ${k==='camera'?'adjust height':'move'}.`);$('lab-actors').append(g);actors[k]=g;});
  function vehicleHeading(){return run?run.config.heading+(model==='nonholonomic'?2*Math.PI*Math.sqrt(run.config.omega)*run.points[sampleIndex()*5]:0):Math.PI/2;}
  function roverOnPlane(pos,heading,projection){
    const right=[Math.sin(heading),-Math.cos(heading)],front=[Math.cos(heading),Math.sin(heading)];
    const world=(x,y,z=0)=>projection(pos[0]+right[0]*x+front[0]*y,pos[1]+right[1]*x+front[1]*y,z);
    let s='';
    // Rounded wheel cylinders are projected in the same heading frame as the body.
    for(const x of [-.255,.255])for(const y of [-.245,.245]){
      const face=dx=>Array.from({length:16},(_,i)=>{const a=i*Math.PI/8;return world(x+dx,y+.115*Math.cos(a),.115+.105*Math.sin(a));});
      const f=face(-.065),g=face(.065);
      for(let i=0;i<16;i++)s+=polygon([f[i],f[(i+1)%16],g[(i+1)%16],g[i]],i<8?'#343c3c':'#202829');
      s+=polygon(x<0?f:g,'#263032');
    }
    const o=world(-.34,-.42,.16),u=world(.34,-.42,.16),v=world(-.34,.42,.16);
    s+=`<g class="scene-rover-pose" transform="matrix(${u[0]-o[0]} ${u[1]-o[1]} ${v[0]-o[0]} ${v[1]-o[1]} ${o[0]} ${o[1]})">${sprite('rover','top',0,0,1,1)}</g>`;
    return s;
  }
  function roverVolume(pos,heading){
    // An orthographic solid in the same world/heading frame as the trajectory.
    const right=[Math.sin(heading),-Math.cos(heading)],front=[Math.cos(heading),Math.sin(heading)];
    const world=([x,y,z])=>[pos[0]+right[0]*x+front[0]*y,pos[1]+right[1]*x+front[1]*y,z];
    const screen=p=>project(...world(p)),depth=p=>{const [x,y,z]=world(p);return x+y+76/70*z;};
    const faces=[],viewDirection=[right[0]+right[1],front[0]+front[1],76/70];
    const normal=v=>{const a=v[1].map((x,i)=>x-v[0][i]),b=v[2].map((x,i)=>x-v[0][i]);return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];};
    const visible=n=>n.reduce((sum,x,i)=>sum+x*viewDirection[i],0)>1e-9;
    const shade=(color,n)=>{
      const l=Math.hypot(...n),nx=(right[0]*n[0]+front[0]*n[1])/l,ny=(right[1]*n[0]+front[1]*n[1])/l,nz=n[2]/l;
      const k=.64+.36*Math.max(0,-.36*nx-.48*ny+.8*nz);
      return '#'+color.match(/\w\w/g).map(c=>Math.round(parseInt(c,16)*k).toString(16).padStart(2,'0')).join('');
    };
    function add(v,color,detail='',extra='',n=normal(v)){
      if(!visible(n))return;
      faces.push({depth:v.reduce((sum,p)=>sum+depth(p),0)/v.length,html:polygon(v.map(screen),shade(color,n),'#08131a24',`stroke-width=".45" stroke-linejoin="round" ${extra}`)+detail});
    }
    function prism(hx,hy,z0,z1,color,bevel=.025,center=[0,0],topDetail='',taper=0){
      const [x,y]=center,c=[[-hx+bevel,-hy],[hx-bevel,-hy],[hx,-hy+bevel],[hx,hy-bevel],[hx-bevel,hy],[-hx+bevel,hy],[-hx,hy-bevel],[-hx,-hy+bevel]].map(p=>[p[0]+x,p[1]+y]);
      const low=c.map(p=>[...p,z0]),high=c.map(p=>[x+(p[0]-x)*(1-taper/hx),y+(p[1]-y)*(1-taper/hy),z1]);
      for(let i=0;i<c.length;i++){const j=(i+1)%c.length;add([low[i],low[j],high[j],high[i]],color);}
      add(high,color,topDetail);
    }
    function wheel(cx,cy){
      const r=.165,z=.17,half=.072,n=24;
      const p=(x,a,radius=r)=>[x,cy+radius*Math.cos(a),z+radius*Math.sin(a)];
      for(let i=0;i<n;i++){
        const a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n,m=(a+b)/2;
        add([p(cx-half,a),p(cx+half,a),p(cx+half,b),p(cx-half,b)],'#323a40','', '',[0,Math.cos(m),Math.sin(m)]);
        // Raised tread blocks, with alternating grooves across the tire.
        const a1=a+.025,b1=b-.04,edge=(i%2?1:-1)*.015;
        add([p(cx-half+.012,a1,r+.009),p(cx+edge,a1,r+.009),p(cx+edge,b1,r+.009),p(cx-half+.012,b1,r+.009)],'#50575b','', '',[0,Math.cos(m),Math.sin(m)]);
        add([p(cx+edge+.013,a1,r+.009),p(cx+half-.012,a1,r+.009),p(cx+half-.012,b1,r+.009),p(cx+edge+.013,b1,r+.009)],'#485054','', '',[0,Math.cos(m),Math.sin(m)]);
      }
      for(const sign of [-1,1]){
        const x=cx+sign*half,norm=[sign,0,0];if(!visible(norm))continue;
        const disk=radius=>Array.from({length:32},(_,i)=>p(x,2*Math.PI*i/32,radius));
        let detail=polygon(disk(.123).map(screen),'#161f25','#5b6469','stroke-width=".7"');
        detail+=polygon(disk(.077).map(screen),'#66717b','#a6b1b9','stroke-width=".65"');
        for(let j=0;j<5;j++){
          const a=j*2*Math.PI/5,hole=Array.from({length:12},(_,i)=>[x,cy+.049*Math.cos(a)+.016*Math.cos(i*Math.PI/6),z+.049*Math.sin(a)+.016*Math.sin(i*Math.PI/6)]);
          detail+=polygon(hole.map(screen),'#17242b');
        }
        detail+=polygon(disk(.023).map(screen),'#d0dae0','#43515b','stroke-width=".6"');
        add(disk(r), '#2b343a',detail,'',norm);
      }
    }
    // Suspension, a substantial blue chassis, and the raised electronics enclosure.
    prism(.28,.026,.14,.19,'#6a7983',.01,[0,-.25]);
    prism(.28,.026,.14,.19,'#6a7983',.01,[0,.25]);
    prism(.215,.325,.14,.255,'#225f9e');
    let deck='';
    for(const x of [-.19,.19])for(const y of [-.29,.29]){
      const c=screen([x,y,.279]);deck+=circle(c,1.7*3/frameRadius,'#b8cbd6','stroke="#2a4056" stroke-width=".6"')+circle(c,.6*3/frameRadius,'#30465a');
    }
    prism(.235,.35,.255,.278,'#288dd9',.035,[0,0],deck);
    // Preserve photographic surface detail on the solid's raised top face.
    const a=screen([-.14,-.17,.39]),b=screen([.14,-.17,.39]),c=screen([-.14,.20,.39]);
    let texture=`<g transform="matrix(${b[0]-a[0]} ${b[1]-a[1]} ${c[0]-a[0]} ${c[1]-a[1]} ${a[0]} ${a[1]})"><svg width="1" height="1" viewBox="1240 315 200 205" preserveAspectRatio="none" overflow="hidden"><image href="${assetRoot}rover-views.webp" width="1774" height="887"/></svg></g>`;
    for(const x of [-.127,.127])for(const y of [-.169,.199])texture+=circle(screen([x,y,.391]),1.05*3/frameRadius,'#b1bac0','stroke="#293a47" stroke-width=".5"');
    prism(.17,.225,.278,.357,'#3a424b',.032,[0,.015]);
    prism(.17,.225,.357,.39,'#65717e',.032,[0,.015],texture,.018);
    prism(.165,.031,.175,.222,'#333f48',.015,[0,.38]);
    // Front lamps and a compact sensor make the heading visible in oblique views.
    for(const x of [-.16,.16])add([[x-.035,.351,.215],[x+.035,.351,.215],[x+.035,.351,.251],[x-.035,.351,.251]],'#a4e5ff','', '',[0,1,0]);
    prism(.04,.04,.278,.385,'#28343f',.02,[0,.295]);
    for(const x of [-.285,.285])for(const y of [-.25,.25])wheel(x,y);
    faces.sort((a,b)=>a.depth-b.depth);
    return `<g class="scene-rover-volume" pointer-events="none">${faces.map(f=>f.html).join('')}</g>`;
  }
  function drawVehicle(){
    const p=positions.vehicle,b=project(...p),heading=vehicleHeading();
    const shadow=view==='perspective'?polygon(ring(p,.43),'#101d2666','none','filter="url(#lab-rover-shadow)"')+polygon(ring(p,.29),'#101d2633'):polygon(ring(p,.36),'#142c3438');
    actors.vehicle.innerHTML=shadow+(view==='perspective'?roverVolume(p,heading):roverOnPlane(p,heading,project))+hitArea('vehicle',b);
    actors.vehicle.dataset.heading=heading.toFixed(6);root.dataset.heading=heading.toFixed(6);
  }
  function drawSource(){const p=positions.source,b=project(...p);let s=polygon(ring(p,.42),'#d7935313');
    s+=`<ellipse cx="${b[0]}" cy="${b[1]}" rx="20" ry="${view==='top'?20:10}" fill="#e8c8a5"/>`;
    if(view==='top')s+=circle(b,compact()?22:12,'#ca784f','stroke="#fff" stroke-width="3"')+circle(b,compact()?7:4,'#f8e9ce');
    else{s+=line(b,[b[0],b[1]-28],'#b56f4a','stroke-width="2"')+circle([b[0],b[1]-29],13,'#cb7d53','stroke="#fff" stroke-width="3"')+circle([b[0]-3,b[1]-33],4,'#f9e2bd');}
    actors.source.innerHTML=s+hitArea('source',b);
  }
  function drawObstacle(){
    const p=positions.obstacle,b=project(...p),scale=3/frameRadius;
    let s=polygon(ring(p,radius+.08),'#172b3638');
    if(view==='top'){const w=(compact()?145:87)*radius*2*scale,h=(compact()?110:87)*radius*2*scale;s+=sprite('rock','top',b[0]-w/2,b[1]-h/2,w,h);}
    else{s+=`<ellipse cx="${b[0]+11}" cy="${b[1]+14}" rx="${65*scale}" ry="${31*scale}" fill="#17201899" filter="url(#lab-shadow)"/>`+sprite('rock','angle',b[0]-67*scale,b[1]-78*scale,134*scale,108*scale);}
    actors.obstacle.innerHTML=s+hitArea('obstacle',b,radius*80);
  }
  const cameraSize=()=>view==='top'?(compact()?220:180):(compact()?270:240);
  const cameraLens=()=>project(...cameraCenter,height);
  // Glass center (768,814) in the author-supplied cutout; the whole drone moves with it.
  const cameraAnchor={x:(768-20)/1500,y:(814-45)/860};
  // The off-ground drone in the top overview controls height. The camera itself
  // remains directly above the workspace center, pointing down in both views.
  function cameraPoint(){return view==='top'?(compact()?[950,67]:[990,85]):[cameraLens()[0],cameraLens()[1]-cameraSize()*860/1500*.46];}
  function drawCamera(){
    const w=cameraSize(),h=w*860/1500,p=cameraPoint(),lens=cameraLens();
    const x=view==='top'?p[0]-w/2:lens[0]-w*cameraAnchor.x;
    const y=view==='top'?p[1]-h*.5:lens[1]-h*cameraAnchor.y;
    actors.camera.innerHTML=sprite('camera','angle',x,y,w,h)+hitArea('camera',p,w*.34);
    actors.camera.dataset.worldPosition=`${cameraCenter[0]},${cameraCenter[1]},${height}`;actors.camera.dataset.lookDirection='0,0,-1';
  }
  function hitArea(k,p,r=35){const size=Math.max(r,24*1100/Math.max(300,canvas.clientWidth));return circle(p,size,'transparent','class="scene-hit"')+circle(p,size,'none',`class="scene-focus-ring" stroke="${colors[k]}" opacity="0" pointer-events="none"`);}
  function drawGround(){
    const f=floor();$('lab-floor-shape').setAttribute('points',pts(f));
    let s=polygon(f,'#17271e33','none','filter="url(#lab-ground-shadow)" transform="translate(0 13)"');
    if(view==='perspective'){
      s+=polygon([f[1],f[2],f[3],...[f[3],f[2],f[1]].map(([x,y])=>[x,y+13])],'url(#lab-soil-edge)');
    }
    // Affine map of the terrain onto the same ground plane used by the trajectories.
    const o=f[3],u=[f[2][0]-o[0],f[2][1]-o[1]],v=[f[0][0]-o[0],f[0][1]-o[1]];
    s+=`<image href="${assetRoot}terrain.webp" width="1" height="1" preserveAspectRatio="none" transform="matrix(${u[0]} ${u[1]} ${v[0]} ${v[1]} ${o[0]} ${o[1]})"/>`;
    s+=polygon(f,'none','#896d4740','stroke-width="1"');$('lab-ground-layer').innerHTML=s;
  }
  function drawField(){let s='';if($('scene-field').checked){const p=positions.source;for(let i=1;i<=6;i++)s+=polygon(ring(p,i*.55),'none','#fff2c7',`stroke-width="${i===1?1.6:1}" stroke-opacity="${.48-i*.05}"`);} $('lab-field-layer').innerHTML=s;}
  const cameraHalfExtent=()=>height*.64*cameraViewScale;
  const vehicleInCamera=()=>positions.vehicle.every((p,i)=>Math.abs(p-cameraCenter[i])<=cameraHalfExtent()+1e-9);
  function reacquireVehicle(){
    if(vehicleInCamera())return false;
    // Keep the drone centered overhead: widen the lens field instead of translating it.
    // Retain the wider view, with margin, until the user resets the scene.
    const extent=Math.max(...positions.vehicle.map((p,i)=>Math.abs(p-cameraCenter[i])));
    cameraViewScale=Math.max(cameraViewScale,extent/(height*.64*.82));
    cameraReframes++;
    return true;
  }
  function drawFrustum(){const half=cameraHalfExtent(),foot=[[-half,-half],[half,-half],[half,half],[-half,half]].map(p=>project(p[0]+cameraCenter[0],p[1]+cameraCenter[1]));let s='';if($('scene-fov').checked){
    s+=polygon(foot,'#32cfdf07','#3cdeed','class="camera-footprint" stroke-width="2" stroke-dasharray="7 7"');
    if(view==='perspective'){
      const lens=cameraLens();
      for(let i=0;i<4;i++)s+=polygon([lens,foot[i],foot[(i+1)%4]],'url(#lab-cone)');
      for(const f of foot)s+=line(lens,f,'#29c9df','class="camera-ray" stroke-width="1.8" stroke-dasharray="5 8" stroke-opacity=".8"');
      const ground=project(...cameraCenter);
      s+=line(lens,ground,'#178d9b','class="camera-axis" stroke-width="1.3" stroke-dasharray="3 6" stroke-opacity=".55"');
    }
  }$('lab-frustum-layer').innerHTML=s;}
  function drawPreview(){const half=cameraHalfExtent(),cx=127,cy=124,sx=96/half,sy=sx;const pos=p=>[cx+(p[0]-cameraCenter[0])*sx,cy-(p[1]-cameraCenter[1])*sy];let s=`<rect x="20" y="17" width="214" height="214" rx="12" fill="#fff" stroke="#e5ebdf"/><rect x="31" y="28" width="192" height="192" rx="6" fill="#edf2e7"/><g clip-path="url(#lab-preview-clip)">`;
    const corner=pos([-frameRadius,frameRadius]);s+=`<image href="${assetRoot}terrain.webp" x="${corner[0]}" y="${corner[1]}" width="${frameRadius*2*sx}" height="${frameRadius*2*sy}" preserveAspectRatio="none"/>`;
    if(run){const current=sampleIndex(),visible=[];for(const index of trailIndices){if(index>current)break;visible.push(pos([run.points[index*5+1],run.points[index*5+2]]));}visible.push(pos(positions.vehicle));s+=`<polyline points="${pts(visible)}" fill="none" stroke="#e6ffff" stroke-width="1.6" stroke-linejoin="miter"/><polyline points="${pts(visible)}" fill="none" stroke="#05a7b5" stroke-width=".65" stroke-linejoin="miter"/>`;}
    const o=pos(positions.obstacle);s+=sprite('rock','top',o[0]-radius*sx,o[1]-radius*sy,2*radius*sx,2*radius*sy);
    const sr=pos(positions.source);s+=circle(sr,5,'#dd5c3b','stroke="#fff" stroke-width="1"');s+=roverOnPlane(positions.vehicle,vehicleHeading(),(x,y)=>pos([x,y]));
    s+=`</g>`;
    $('lab-preview').innerHTML=s;$('lab-preview').style.display=canvas.clientWidth<550?'none':'';
  }
  function render(){const active=document.activeElement;canvas.setAttribute('viewBox',view==='perspective'?'0 -90 1100 740':compact()?'0 0 1100 850':'0 0 1100 650');drawGround();drawField();drawFrustum();buildTrail();drawObstacle();drawSource();drawVehicle();drawCamera();drawPreview();
    // Maintain painter order while retaining each focusable SVG object.
    const keys=['vehicle','obstacle','source'].sort((a,b)=>project(...positions[a])[1]-project(...positions[b])[1]);keys.forEach(k=>$('lab-actors').append(actors[k]));$('lab-actors').append(actors.camera);if(active?.matches('#setup-canvas [data-object]'))active.focus({preventScroll:true});
    updateReadings();
  }
  function updateReadings(){
    const d=Math.hypot(positions.vehicle[0]-positions.source[0],positions.vehicle[1]-positions.source[1]),c=Math.hypot(positions.vehicle[0]-positions.obstacle[0],positions.vehicle[1]-positions.obstacle[1])-radius-bodyRadius,visible=vehicleInCamera();
    $('scene-distance').textContent=d.toFixed(2);$('scene-clearance').textContent=c.toFixed(2);$('scene-visibility').textContent=visible?'In view':'Outside view';$('scene-visibility').dataset.visible=String(visible);$('scene-height').value=height;$('scene-height-value').textContent=height.toFixed(2);
    $('scene-selection-title').textContent=descriptions[selected][0];$('scene-selection-copy').textContent=descriptions[selected][1];$('scene-position').textContent=selected==='camera'?`Height ${height.toFixed(2)} · center (${cameraCenter[0].toFixed(2)}, ${cameraCenter[1].toFixed(2)})`:`Position (${positions[selected][0].toFixed(2)}, ${positions[selected][1].toFixed(2)})`;
    document.querySelectorAll('[data-scene-select]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sceneSelect===selected)));document.querySelectorAll('[data-scene-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sceneView===view)));
    root.dataset.model=model;root.dataset.view=view;root.dataset.selected=selected;root.dataset.height=height.toFixed(2);for(const [k,p] of Object.entries(positions)){root.dataset[k+'X']=p[0].toFixed(4);root.dataset[k+'Y']=p[1].toFixed(4);actors[k].setAttribute('aria-label',`${k}, position ${p[0].toFixed(2)}, ${p[1].toFixed(2)}. Use arrow keys to move.`);}
    root.dataset.cameraX=cameraCenter[0];root.dataset.cameraY=cameraCenter[1];root.dataset.cameraReframes=cameraReframes;
    root.dataset.cameraHalfExtent=cameraHalfExtent();root.dataset.cameraViewScale=cameraViewScale;
    updateModePanel();
  }
  function updateModePanel(){
    // Use the same logged sample as the visible vehicle, not a future mode or an interpolated q.
    const i=run?sampleIndex()*5:0,t=run?run.points[i]:0,q=run?run.points[i+3]:null;
    const panel=$('scene-mode-panel'),phase=root.dataset.phase||'ready';
    panel.dataset.mode=q??'';panel.dataset.time=t;panel.dataset.playing=String(playing);
    const label=q===null?'q = —':`q = ${q}`;
    if($('scene-mode-live').textContent!==label)$('scene-mode-live').textContent=label;
    $('scene-mode').textContent=q??'—';
    $('scene-mode-position').textContent=`(${positions.vehicle[0].toFixed(2)}, ${positions.vehicle[1].toFixed(2)})`;
    $('scene-mode-time').textContent=t.toFixed(2)+' s';
    $('scene-mode-status').textContent=phase==='computing'?'Computing':phase==='error'?'Unavailable':!run?'Ready':t>=run.duration?'Stopped':playing?'Live':'Paused';
    $('scene-mode-cursor').setAttribute('visibility',run?'visible':'hidden');
    if(!run){
      $('scene-mode-history-path').setAttribute('d','');$('scene-mode-count').textContent='—';$('scene-mode-end').textContent='t (s)';
      $('scene-mode-event').textContent=phase==='computing'?'Computing this trajectory…':phase==='error'?'Run the trajectory again.':'Run a trajectory to see q(t).';
      $('scene-mode-chart-title').textContent='Run a trajectory to see its mode history.';
      return;
    }
    const events=run.events.filter(e=>e.t<=t+1e-10),x=time=>24+204*(run.duration>0?time/run.duration:0),y=mode=>mode===2?17:51;
    let previous=run.events[0]?.from??run.points[3],path=`M24 ${y(previous)}`;
    for(const e of events){path+=`H${x(e.t).toFixed(2)}V${y(e.to)}`;previous=e.to;}
    path+=`H${x(t).toFixed(2)}`;
    $('scene-mode-history-path').setAttribute('d',path);
    $('scene-mode-cursor-line').setAttribute('d',`M${x(t)} 9V59`);
    $('scene-mode-cursor-dot').setAttribute('cx',x(t));$('scene-mode-cursor-dot').setAttribute('cy',y(q));
    $('scene-mode-end').textContent=run.duration.toFixed(2)+' s';
    $('scene-mode-count').textContent=events.length===1?'1 switch':`${events.length} switches`;
    const last=events.at(-1);
    $('scene-mode-event').textContent=last?`Last: q ${last.from} → ${last.to} at ${last.t.toFixed(3)} s`:'No switches yet';
    $('scene-mode-chart-title').textContent=`Mode history through ${t.toFixed(3)} seconds. Current mode ${q}; ${events.length} switches.`;
  }
  function select(k){selected=k;render();}
  function move(k,p){p=p.map(n=>clamp(n,-2.55,2.55));
    // Placement only: reserve room for oscillations. The integrated state is never projected.
    const avoid=k==='obstacle'?['vehicle','source']:[k==='vehicle'||k==='source'?'obstacle':null].filter(Boolean);
    for(let pass=0;pass<5;pass++)for(const other of avoid){const q=positions[other],min=(k==='vehicle'||other==='vehicle'?1.45:1.6);let dx=p[0]-q[0],dy=p[1]-q[1],d=Math.hypot(dx,dy);if(d<min){if(d<1e-8){dx=1;dy=0;d=1;}p=[q[0]+dx/d*min,q[1]+dy/d*min].map(n=>clamp(n,-2.55,2.55));}}
    const valid=avoid.every(other=>Math.hypot(p[0]-positions[other][0],p[1]-positions[other][1])>=(k==='vehicle'||other==='vehicle'?1.449:1.599));
    if(valid)positions[k]=p;if(k==='vehicle')startPosition=positions.vehicle.slice();render();
  }
  function eventPoint(e){const p=canvas.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(canvas.getScreenCTM().inverse());}
  canvas.addEventListener('pointerdown',e=>{const node=e.target.closest('[data-object]');if(!node||e.button>0)return;e.preventDefault();selected=node.dataset.object;if(selected!=='camera')beginEdit(selected);node.focus({preventScroll:true});const p=eventPoint(e),world=inverse(p.x,p.y);drag={id:e.pointerId,key:selected,y:p.y,height,offset:selected==='camera'?[0,0]:[positions[selected][0]-world[0],positions[selected][1]-world[1]]};canvas.setPointerCapture(e.pointerId);root.dataset.interacted='true';render();});
  canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;e.preventDefault();const p=eventPoint(e);if(drag.key==='camera'){height=clamp(drag.height+(drag.y-p.y)/(view==='perspective'?70*3/frameRadius:48),1.8,4.5);render();}else{const w=inverse(p.x,p.y);move(drag.key,[w[0]+drag.offset[0],w[1]+drag.offset[1]]);}});
  ['pointerup','pointercancel','lostpointercapture'].forEach(n=>canvas.addEventListener(n,()=>{const k=drag?.key;drag=null;if(k&&k!=='camera')scheduleRun();else if(k==='camera'&&reacquireVehicle())render();}));
  canvas.addEventListener('keydown',e=>{const n=e.target.closest('[data-object]');if(!n)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();select(n.dataset.object);return;}if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();selected=n.dataset.object;root.dataset.interacted='true';if(selected==='camera'){height=clamp(height+(['ArrowUp','ArrowRight'].includes(e.key)?.1:-.1),1.8,4.5);reacquireVehicle();render();}else{beginEdit(selected);const p=positions[selected].slice(),step=e.shiftKey?.25:.1;p[0]+=e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0;p[1]+=e.key==='ArrowUp'?step:e.key==='ArrowDown'?-step:0;move(selected,p);scheduleRun();}});
  document.querySelectorAll('[data-scene-select]').forEach(b=>b.addEventListener('click',()=>{select(b.dataset.sceneSelect);actors[selected].focus({preventScroll:true});}));
  document.querySelectorAll('[data-scene-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.sceneView;render();}));
  $('scene-height').addEventListener('input',e=>{height=+e.target.value;root.dataset.interacted='true';select('camera');});['scene-fov','scene-field'].forEach(id=>$(id).addEventListener('change',render));
  $('scene-height').addEventListener('change',()=>{if(reacquireVehicle())render();});
  $('scene-reset').addEventListener('click',()=>{clearRun();positions=structuredClone(initial);startPosition=initial.vehicle.slice();height=4.2;cameraViewScale=1;cameraReframes=0;selected='vehicle';$('scene-fov').checked=true;$('scene-field').checked=true;root.dataset.interacted='false';setStatus('Ready. Run this layout, or drag an object to start a new trajectory.');render();});

  function setStatus(text){if($('scene-status').textContent!==text)$('scene-status').textContent=text;}
  function clearRun(){clearTimeout(rerunTimer);cancelAnimationFrame(raf);worker?.terminate();worker=null;run=null;playing=false;playTime=0;trailLengths=[];root.dataset.running='false';root.dataset.phase='ready';root.dataset.arrived='false';$('scene-pause').disabled=true;$('scene-pause').textContent='Pause';$('scene-run').disabled=false;$('scene-run').innerHTML='<span aria-hidden="true">▶</span> Run trajectory';$('scene-time').disabled=true;$('scene-time').value=0;$('scene-time-value').textContent='0.00 s';updateModePanel();}
  function beginEdit(k){if(run||worker){if(k!=='vehicle')positions.vehicle=startPosition.slice();clearRun();}else{clearTimeout(rerunTimer);}setStatus('Release to run the controller from this new layout.');}
  function scheduleRun(){clearTimeout(rerunTimer);rerunTimer=setTimeout(runSimulation,350);}
  function runSimulation(){
    positions.vehicle=startPosition.slice();clearRun();reacquireVehicle();render();
    const layout={...structuredClone(positions),model,omega:Number($('scene-frequency').value)};worker=new Worker(workerURL,{type:'module'});const task=worker;
    root.dataset.phase='computing';$('scene-run').disabled=true;setStatus('Computing a new closed-loop trajectory…');updateModePanel();
    worker.onmessage=({data})=>{
      if(worker!==task)return;worker.terminate();worker=null;$('scene-run').disabled=false;
      if(data.error){root.dataset.phase='error';setStatus(data.error);updateModePanel();return;}
      run=data;
      root.dataset.frequency=run.config.omega;
      if(model==='holonomic'){
        root.dataset.amplitude=run.config.a;root.dataset.frequency=run.config.omega;
        CAPMath.text($('scene-holo-parameters'),String.raw`This layout: \(a=${run.config.a.toFixed(3)},\ \omega=${run.config.omega.toFixed(1)}\,\mathrm{rad/s}\).`);
      }
      runNumber++;root.dataset.runNumber=runNumber;root.dataset.result=run.reason;root.dataset.arrival=run.arrival??'';root.dataset.minClearance=run.minClearance;root.dataset.samples=run.points.length/5;root.dataset.switches=run.events.length;
      $('scene-time').max=run.duration;$('scene-time').step='any';$('scene-time').disabled=false;$('scene-pause').disabled=false;$('scene-run').innerHTML='<span aria-hidden="true">↺</span> Run again';
      render();seek(0);resume();
    };
    worker.onerror=()=>{if(worker!==task)return;worker?.terminate();worker=null;root.dataset.phase='error';$('scene-run').disabled=false;setStatus('The simulation could not start. Please try Run trajectory again.');updateModePanel();};
    worker.postMessage(layout);
  }
  function sampleIndex(){
    if(!run)return 0;let low=0,high=run.points.length/5-1;
    while(low<high){const mid=Math.ceil((low+high)/2);if(run.points[mid*5]<=playTime+1e-10)low=mid;else high=mid-1;}return low;
  }
  function buildTrail(){
    let s=polygon(ring(positions.source,.35),'#efab3822','#ffd37b','stroke-width="1.2" stroke-dasharray="3 5"');
    trailIndices=[];trailLengths=[];
    if(run){
      const sampled=model==='holonomic'&&trailStyle==='sampled',interval=sampled?2*Math.PI/(10*run.config.omega):0,count=run.points.length/5;
      // Display actual integrated samples at about ten points per oscillator turn.
      // The full numerical record still drives position, heading, q and arrival.
      // Retain samples around mode transitions and the exact terminal sample.
      let bucket=-1;
      for(let index=0;index<count;index++){
        const i=index*5,b=sampled?Math.floor((run.points[i]+1e-12)/interval):index;
        const modeEdge=(index>0&&run.points[i+3]!==run.points[i-2])||(index<count-1&&run.points[i+3]!==run.points[i+8]);
        if(!sampled||b>bucket||modeEdge||index===count-1){trailIndices.push(index);bucket=b;}
      }
      let length=0,previous=null;const points=[];
      for(const index of trailIndices){const i=index*5,p=project(run.points[i+1],run.points[i+2]);if(previous)length+=Math.hypot(p[0]-previous[0],p[1]-previous[1]);points.push(p);trailLengths.push(length);previous=p;}
      const poly=pts(points),join=sampled?'miter':'round';
      const strokes=model==='holonomic'?[['#173c4544',3.6],['#ffffff',2.3],['#05a7b5',1.1]]:[['#173c4566',6],['#ffffff',4],['#05a7b5',1.8]];
      for(const [color,width] of strokes){
        s+=`<polyline class="scene-trail" points="${poly}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="${join}" stroke-dasharray="${length} ${length}"/>`;
        s+=`<polyline class="scene-trail-tip" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="${join}"/>`;
      }
      const start=project(...startPosition);s+=circle(start,7,'#fff','stroke="#7b9ca0" stroke-width="2"');
    }
    $('lab-trail-layer').innerHTML=s;
    root.dataset.trailStyle=model==='holonomic'?trailStyle:'fine';root.dataset.trailVertices=trailIndices.length;
    updateTrail();
  }
  function updateTrail(){
    if(!run||!trailIndices.length)return;
    const index=sampleIndex();let low=0,high=trailIndices.length-1;
    while(low<high){const mid=Math.ceil((low+high)/2);if(trailIndices[mid]<=index)low=mid;else high=mid-1;}
    const offset=trailLengths.at(-1)-trailLengths[low],i=trailIndices[low]*5,j=index*5;
    document.querySelectorAll('.scene-trail').forEach(p=>p.setAttribute('stroke-dashoffset',offset));
    // Complete only the current, unfinished segment to the actual vehicle.
    const tip=pts([project(run.points[i+1],run.points[i+2]),project(run.points[j+1],run.points[j+2])]);
    document.querySelectorAll('.scene-trail-tip').forEach(p=>p.setAttribute('points',tip));
  }
  function seek(t){
    if(!run)return;playTime=run.duration-t<1e-9?run.duration:clamp(t,0,run.duration);const i=sampleIndex()*5;
    positions.vehicle=[run.points[i+1],run.points[i+2]];$('scene-time').value=playTime;$('scene-time-value').textContent=playTime.toFixed(2)+' s';$('scene-mode').textContent=run.points[i+3];
    updateTrail();
    if(reacquireVehicle()){drawFrustum();drawCamera();}
    drawVehicle();drawPreview();const active=document.activeElement;
    ['vehicle','obstacle','source'].sort((a,b)=>project(...positions[a])[1]-project(...positions[b])[1]).forEach(k=>$('lab-actors').append(actors[k]));$('lab-actors').append(actors.camera);if(active?.matches('#setup-canvas [data-object]'))active.focus({preventScroll:true});
    const reached=run.arrival!==null&&playTime>=run.arrival;
    root.dataset.arrived=String(reached);root.dataset.time=playTime.toFixed(4);
    setStatus(reached?'Source neighborhood reached. The demonstration stopping rule is active.':playTime>=run.duration?(run.reason==='domain'?'Stopped at the controller domain boundary. Try another layout.':'Simulation horizon reached without entering the source neighborhood.'):'Seeking the source · the trail follows the integrated motion.');
    updateReadings();
  }
  function frame(now){if(!playing||!run)return;const dt=lastFrame?Math.min((now-lastFrame)/1000,.08):0;lastFrame=now;seek(playTime+dt*+$('scene-speed').value);
    if(playTime>=run.duration){playing=false;root.dataset.running='false';root.dataset.phase='finished';$('scene-pause').textContent='Replay';if(root.dataset.arrived==='true')setStatus('Source neighborhood reached. Motion stopped for this illustration.');updateModePanel();return;}raf=requestAnimationFrame(frame);
  }
  function resume(){if(!run)return;if(playTime>=run.duration)seek(0);playing=true;lastFrame=0;root.dataset.running='true';root.dataset.phase='playing';$('scene-pause').textContent='Pause';updateModePanel();raf=requestAnimationFrame(frame);}
  function pause(){playing=false;cancelAnimationFrame(raf);root.dataset.running='false';root.dataset.phase='paused';$('scene-pause').textContent='Resume';updateModePanel();}
  document.querySelectorAll('[data-scene-model]').forEach(b=>b.addEventListener('click',()=>{
    if(model===b.dataset.sceneModel)return;
    model=b.dataset.sceneModel;
    document.querySelectorAll('[data-scene-model]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.sceneModel===model)));
    document.querySelectorAll('[data-model-details]').forEach(panel=>panel.hidden=panel.dataset.modelDetails!==model);
    $('scene-trail-controls').hidden=model!=='holonomic';
    $('scene-frequency-controls').hidden=model!=='nonholonomic';
    CAPMath.text($('scene-model-copy'),model==='holonomic'?'Planar velocity input · oscillatory hybrid extremum seeking':String.raw`Translation along \(\psi\) · heading rotation governed by \(u_2\)`);
    $('scene-vehicle-description').textContent=model==='holonomic'?'Holonomic robot':'Nonholonomic robot';
    runSimulation();
  }));
  $('scene-run').addEventListener('click',runSimulation);
  $('scene-pause').addEventListener('click',()=>playing?pause():resume());
  $('scene-time').addEventListener('input',e=>{pause();seek(+e.target.value);});
  $('scene-frequency').addEventListener('change',()=>{
    const omega=Number($('scene-frequency').value),reduction=100-10*Math.sqrt(omega);
    CAPMath.text($('scene-nh-frequency'),String.raw`\(\omega=${omega}\)`);
    $('scene-frequency-copy').textContent=reduction?`${reduction}% lower heading rate than the original setting.`:'Original frequency and heading rate.';
    runSimulation();
  });
  document.querySelectorAll('[data-trail-style]').forEach(b=>b.addEventListener('click',()=>{
    trailStyle=b.dataset.trailStyle;
    document.querySelectorAll('[data-trail-style]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.trailStyle===trailStyle)));
    $('scene-trail-description').textContent=trailStyle==='sampled'?'About 10 computed points per loop, joined by straight segments.':'All computed trajectory samples, shown at full detail.';
    buildTrail();drawPreview();
  }));
  document.querySelectorAll('[data-scene-preset]').forEach(b=>b.addEventListener('click',()=>{
    clearRun();positions=b.dataset.scenePreset==='cross'?{vehicle:[0,-2.5],source:[0,2.3],obstacle:[0,0]}:{vehicle:[-2.2,1.8],source:[2.2,-1.7],obstacle:[.15,-.15]};startPosition=positions.vehicle.slice();selected='vehicle';root.dataset.interacted='true';runSimulation();
  }));
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)pause();});
  new ResizeObserver(render).observe(canvas);render();

})();
