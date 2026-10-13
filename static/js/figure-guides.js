'use strict';
(() => {
  // Regions use percentages of the unmodified author-provided image.
  // Guided steps explain signals; they do not assert measured timing or performance.
  const figures={
    'experimental-scene':{hint:'Select an object to see its role in the experiment.',items:[
      ['Overhead camera',[45,0,14,19],'An overhead RGB camera observes the workspace and provides images for localization.',"\\(\\theta=h(p)\\)"],
      ['Signal source',[22,39,21,13],'The robot seeks the maximizer of the scalar field. The field sensor measures the signal at the current robot position.',"\\(\\mathcal A_J=\\operatorname*{arg\\,max}_{p\\in\\mathcal W}J(p)\\)"],
      ['Obstacle',[40,47,20,28],'The rock marks the obstacle region. The controller uses obstacle-relative geometry and clearance terms to navigate around it.','Maintain obstacle clearance'],
      ['Robot',[60,65,17,21],'The blue robot is the moving plant. The controller receives an estimated position from visual perception.',"\\(\\hat p=p+e_\\sigma\\)"],
      ['Camera footprint',[9,36,80,57],'The cyan rays and ground outline illustrate the camera field of view. They describe the sensing setup, not a measured error bound.','Illustrated field of view']
    ]},
    'framework':{tour:true,hint:'Walk through one pass around the perception–control loop.',items:[
      ['Observe',[0,2,45,44],'A camera image is generated from the physical state of the robot and its surroundings.',"\\(\\theta=h(p)\\)"],
      ['Encode',[56,18,10,19],'RT-DETR extracts visual features used by the perception paths.','Shared visual features'],
      ['Adapt',[68,18,18,20],'CAP compares estimated localization error with the controller tolerance and checks presence and miss history.','Controller-aware routing'],
      ['Estimate',[89,18,10,20],'The selected visual observation updates the position estimate supplied to the controller. If no observation is selected, the prediction is retained.',"\\(\\hat p=\\ell_\\sigma(\\theta,\\zeta_\\sigma)\\)"],
      ['Control',[65,70,34,19],'The hybrid source-seeking controller combines the position estimate, measured scalar signal, and active mode to generate the control input.','Estimate → hybrid feedback → u'],
      ['Move',[34,70,22,19],'The input changes the robot state, producing the scene observed at the next image update.','Robot dynamics → next observation']
    ]},
    'cap-architecture':{tour:true,kind:'routing',hint:'Select a module, or change the inputs below to try the CAP routing rule.',items:[
      ['Shared features',[2,13,30,35],'A 640 × 640 RGB image is processed by RT-DETR. The expert paths reuse its shared visual features.','One image, shared features'],
      ['Local expert',[1,60,10,28],'The Local Expert searches around the predicted robot location. It is evaluated first at each image update.','Local candidate + presence probability'],
      ['Adaptation criteria',[37,12,15,76],'The gate uses estimated error relative to the controller tolerance, the consecutive-miss count, and local presence probability.',"\\(\\hat\\epsilon_k/r_k^{\\mathrm{ctrl}},\\quad m_k,\\quad\\pi_{\\mathrm{local},k}\\)"],
      ['Full-frame',[66,14,8,22],'Full-frame processing is invoked if estimated error exceeds 0.8 times the controller tolerance, or there have been at least two consecutive misses.',"\\(\\hat\\epsilon_k>0.8r_k^{\\mathrm{ctrl}}\\ \\text{or}\\ m_k\\ge2\\)"],
      ['Context',[66,42,8,22],'When the full-frame condition is false, low local presence probability requests the Context Expert.',"\\(\\text{Otherwise, }\\pi_{\\mathrm{local},k}<0.5\\)"],
      ['Local retained',[66,68,8,22],'When the full-frame condition is false and presence is at least 0.5, the local observation is retained.',"\\(\\text{Otherwise, }\\pi_{\\mathrm{local},k}\\ge0.5\\)"],
      ['Update & predict',[79,13,20,76],'At most one observation updates the estimate. With no selected observation, retain the prediction. The position and miss count feed the next update.',"\\(\\text{Observation}\\to\\hat p_k\\to\\text{next search location}\\)"]
    ]},
    'nonholonomic-loop':{tour:true,hint:'Follow the estimated state through the nonholonomic controller.',items:[
      ['Camera',[89,49,10,38],'The camera observes the robot in the physical workspace.',"\\(\\theta=h(p)\\)"],
      ['CAP estimate',[71,50,17,29],'CAP supplies a position estimate using current observations and causal internal state.',"\\(\\hat p=\\ell_\\sigma(\\theta,\\zeta_\\sigma)\\)"],
      ['Manifold chart',[32,50,28,28],'Map estimated clearance and direction into manifold coordinates. The chart is defined outside the clearance boundary.',"\\(\\hat\\rho=\\log(\\|\\hat p-p_{\\mathcal O}\\|-d^\\star),\\quad\\hat\\vartheta=\\frac{\\hat p-p_{\\mathcal O}}{\\|\\hat p-p_{\\mathcal O}\\|}\\)"],
      ['Hybrid supervisor',[14,82,31,17],'Compare the active potential with the smallest mode potential. A jump selects a minimizing mode when permitted by the hysteresis condition; continuous states remain unchanged.',"\\(\\Gamma_{\\mathrm{noh}}(\\hat z,q)=V_q(\\hat z)-\\min_{r\\in\\mathcal Q}V_r(\\hat z);\\quad\\Gamma_{\\mathrm{noh}}\\ge\\delta_{\\mathrm{noh}}\\)"],
      ['Mode potential',[9,50,10,28],'The active localization function combines the measured scalar signal, radial safety barrier, and mode-dependent angular correction.',"\\(V_q(z)=-\\hat J_{\\mathcal M}(z)+B_{\\mathrm{safety}}(e^\\rho)+\\Psi_q(\\vartheta)\\)"],
      ['Oscillatory inputs',[0,7,41,35],"The signed translational input acts along \\(\\psi\\), while \\(u_2\\) rotates the heading continuously. The internal oscillator satisfies \\(\\dot\\eta=2\\pi\\omega S\\eta\\). Negative \\(u_1\\) reverses translation without reversing the heading.","\\(u_1=\\sqrt{\\frac{4\\pi\\gamma\\omega}{\\kappa}}\\langle e^{-\\kappa V_q(\\hat z)S}e_1,\\eta\\rangle;\\quad u_2=2\\pi\\sqrt\\omega\\)"],
      ['Dynamics & position',[49,12,49,29],'The input drives admissible robot motion. The inverse chart maps manifold coordinates back to the physical position.',"\\(p=p_{\\mathcal O}+(d^\\star+e^\\rho)\\vartheta;\\quad\\dot p=u_1\\psi,\\quad\\dot\\psi=u_2S\\psi\\)"]
    ]},
    'holonomic-loop':{tour:true,hint:'Follow the estimated state through the holonomic controller.',items:[
      ['Camera',[86,3,13,63],'Camera observations provide the input to learned visual perception.',"\\(\\theta=h(p)\\)"],
      ['CAP estimate',[53,49,27,24],'The perception policy supplies the estimated robot position.',"\\(\\hat p=\\ell_\\sigma(\\theta,\\zeta_\\sigma)\\)"],
      ['Hybrid supervisor',[18,75,28,20],'The supervisor checks the active potential against the best available mode using hysteresis.',"\\(\\Gamma_{\\mathrm{hol}}(\\hat p,q)=V_q(\\hat p)-\\min_{r\\in\\mathcal Q}V_r(\\hat p)\\)"],
      ['Mode potential',[20,47,13,26],'The selected potential uses the scalar signal and a barrier for its covering region. It is infinite outside that mode’s domain.',"\\(V_q(p)=\\begin{cases}-\\hat J(p)+B(d_q(p)),&p\\in\\mathcal U_q,\\\\+\\infty,&p\\notin\\mathcal U_q.\\end{cases}\\)"],
      ['Periodic exploration',[30,31,23,17],'A periodic unit-vector oscillator supplies the exploration signal used by the feedback law.',"\\(\\dot\\mu=\\omega S\\mu\\)"],
      ['Feedback input',[2,3,32,28],'The mode-dependent feedback and oscillator combine into a planar velocity command.',"\\(u=-\\mathcal F_q(\\hat p)\\mu=a\\omega S\\mu-\\frac{2k}{a}V_q(\\hat p)\\mu\\)"],
      ['Robot dynamics',[62,3,16,28],'The holonomic plant can realize planar velocity directly; its new position produces the next camera observation.',"\\(\\dot p=u\\)"]
    ]},
    'nonholonomic-geometry':{kind:'geometry',hint:'Inspect the geometry, then move the example point with the sliders.',items:[
      ['Robot position',[15,65,15,17],String.raw`The physical position \(p\) is measured relative to the obstacle center \(p_{\mathcal O}\). The interactive example below uses workspace coordinates.`,"\\(p=(x,y)\\)"],
      ['Clearance boundary',[55,15,24,36],String.raw`The disk \(p_{\mathcal O}+d^\star\mathbb B\) defines the excluded clearance region. The logarithmic chart requires \(\|p-p_{\mathcal O}\|>d^\star\).`,"\\(r>d^\\star\\)"],
      ['Radial clearance',[18,41,32,7],'Subtract the clearance radius from the obstacle-relative distance. Its logarithm is the radial manifold coordinate.',"\\(c=r-d^\\star,\\quad\\rho=\\log c\\)"],
      ['Obstacle direction',[19,28,24,13],'The normalized obstacle-to-robot direction is a unit vector on the circle. It differs from the robot’s heading.',"\\(\\vartheta=\\frac{p-p_{\\mathcal O}}{\\|p-p_{\\mathcal O}\\|}\\)"],
      ['Robot heading',[31,55,31,17],'The heading constrains the direction of translational motion for the nonholonomic plant.',"\\(\\psi=[\\cos\\alpha,\\sin\\alpha]^\\top\\)"]
    ]},
    'nonholonomic-trajectories':{kind:'comparison',model:'nonholonomic',hint:'Select a panel or magnified region to inspect the original paper figure.',items:[
      ['Leaf panel',[11,2,39,88],'Inspect the paper’s trajectories against the leaf background. Red denotes ground truth; white denotes the predicted state.','Original paper figure'],
      ['Garden panel',[57,2,40,88],'Inspect the paper’s trajectories against the garden background. The cyan box identifies a region shown at higher magnification.','Original paper figure'],
      ['Leaf detail',[31,47,20,42],'The inset makes the red and white trajectories visible at local scale, including the repeated exploration strokes.','Magnified region from the original figure'],
      ['Garden detail',[77,47,20,42],'Compare the local red and white paths against a different visual background.','Magnified region from the original figure']
    ]},
    'holonomic-trajectories':{kind:'comparison',model:'holonomic',hint:'Select a panel or local trajectory region to inspect the original paper figure.',items:[
      ['Textured-ground panel',[11,1,39,91],'Inspect the red ground-truth path and white predicted path in the original holonomic figure.','Original paper figure'],
      ['Cracked-earth panel',[56,1,39,91],'Inspect the original trajectories over the cracked-earth background.','Original paper figure'],
      ['Exploration detail',[14,38,14,39],'A local view separates the repeated exploratory motion from the overall approach toward the source.','Crop of the original textured-ground panel'],
      ['Near-source detail',[20,19,12,20],'Inspect how the displayed true and predicted paths approach the source neighborhood.','Crop of the original figure; no new arrival metric']
    ]}
  };
  const svgNS='http://www.w3.org/2000/svg';
  const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)CAPMath.text(e,text);return e;};
  function button(text,cls,fn){const b=make('button',cls,text);b.type='button';if(fn)b.addEventListener('click',fn);return b;}
  function svg(tag,attrs={}){const e=document.createElementNS(svgNS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e;}
  const instances=new Map();let modalKey=null;
  for(const opener of document.querySelectorAll('.figure-open')){
    const image=opener.querySelector('img'),key=image.getAttribute('src').split('/').pop().replace('.webp',''),spec=figures[key];
    if(!spec)continue;
    const figure=opener.closest('figure'),stage=make('div','figure-stage'),overlay=make('div','figure-hotspots');
    figure.classList.add('has-figure-guide');figure.dataset.figureKey=key;
    opener.before(stage);stage.append(opener,overlay);
    const selectedRegion=make('div','figure-selected-region');selectedRegion.setAttribute('aria-hidden','true');overlay.append(selectedRegion);
    const guide=make('details','figure-guide'),bar=make('div','figure-guide-bar');
    guide.id=`guide-${key}`;
    const summary=make('summary','figure-guide-summary');
    summary.append(make('span','guide-summary-icon','⌘'),make('span',null,spec.kind==='comparison'?'Explore the trajectories':'Explore this figure'),make('span','guide-summary-note',spec.kind==='routing'?'Follow the flow · try the routing rule':spec.kind==='geometry'?'Inspect the geometry':spec.tour?'Follow the flow':'Discover the scene'),make('span','guide-summary-plus','+'));
    guide.append(summary);const body=make('div','figure-guide-body');guide.append(body);
    overlay.hidden=true;guide.addEventListener('toggle',()=>{overlay.hidden=!guide.open;markers.textContent=guide.open?'Hide markers':'Show markers';markers.setAttribute('aria-pressed',String(guide.open));if(!guide.open)stop();});
    bar.append(make('span','figure-guide-label','IN THIS FIGURE'));
    let selected=0,timer=null;
    const markers=button('Hide markers','guide-small-button',()=>{const hidden=overlay.hidden=!overlay.hidden;markers.textContent=hidden?'Show markers':'Hide markers';markers.setAttribute('aria-pressed',String(!hidden));});markers.setAttribute('aria-pressed','true');bar.append(markers);body.append(bar);
    const choices=make('div','figure-guide-choices');choices.setAttribute('role','group');choices.setAttribute('aria-label',`Parts of ${opener.dataset.figureTitle}`);
    const regionButtons=[],choiceButtons=[];
    spec.items.forEach(([label,rect],i)=>{
      const b=button(String(i+1),'figure-hotspot',()=>select(i));b.dataset.label=label;b.style.left=`${rect[0]+Math.min(rect[2]/2,2)}%`;b.style.top=`${rect[1]+Math.min(rect[3]/2,3)}%`;
      b.setAttribute('aria-label',`${i+1}. ${label}`);b.title=label;b.setAttribute('aria-controls',`${guide.id}-detail`);overlay.append(b);regionButtons.push(b);
      const chip=button(label,'figure-guide-choice',()=>select(i));chip.dataset.step=String(i+1).padStart(2,'0');chip.setAttribute('aria-controls',`${guide.id}-detail`);choices.append(chip);choiceButtons.push(chip);
    });body.append(choices);
    const detail=make('div','figure-guide-detail');detail.id=`${guide.id}-detail`;detail.setAttribute('aria-live','polite');
    const count=make('span','guide-step-count'),heading=make('strong'),copy=make('p'),formula=make('p','guide-formula');detail.append(count,heading,copy,formula);body.append(detail);
    const helper=make('p','guide-hint',spec.hint);body.append(helper);
    let tour;
    if(spec.tour){const controls=make('div','guide-tour-controls');
      controls.append(button('← Previous step','guide-small-button',()=>select((selected-1+spec.items.length)%spec.items.length)),button('Next step →','guide-small-button',()=>select((selected+1)%spec.items.length)));
      tour=button('▶ Walk through','guide-small-button',()=>{if(timer){stop();return;}select(0);tour.textContent='Ⅱ Pause walkthrough';timer=setInterval(()=>{if(selected===spec.items.length-1){stop();return;}select(selected+1,false);},3200);});controls.append(tour);body.append(controls);
    }
    function stop(){clearInterval(timer);timer=null;if(tour)tour.textContent='▶ Walk through';}
    let extraUpdate=()=>{};
    function select(i,manual=true){
      if(manual)stop();selected=i;const [label,rect,text,math]=spec.items[i];
      [...regionButtons,...choiceButtons].forEach((b,j)=>b.setAttribute('aria-pressed',String(j%spec.items.length===i)));
      Object.assign(selectedRegion.style,{left:rect[0]+'%',top:rect[1]+'%',width:rect[2]+'%',height:rect[3]+'%'});
      count.textContent=`${i+1} / ${spec.items.length}`;heading.textContent=label;CAPMath.text(copy,text);CAPMath.text(formula,math);guide.dataset.selected=String(i);extraUpdate(i);
      if(modalKey===key)updateModal(key);
    }
    const navigation=make('div','figure-guide-navigation');navigation.append(bar,choices);
    const reading=make('div','figure-guide-reading');reading.append(detail,helper);
    const tourControls=body.querySelector('.guide-tour-controls');if(tourControls)reading.append(tourControls);
    body.replaceChildren(navigation,reading);
    stage.after(guide);
    if(spec.kind==='comparison'){
      const comparison=make('div','figure-comparison');const focus=svg('svg',{viewBox:'0 0 2400 1350',role:'img','aria-label':'Selected region of the original paper figure',preserveAspectRatio:'xMidYMid meet'});
      focus.append(svg('image',{href:image.getAttribute('src'),width:image.width||2400,height:image.height||1350}));
      // Use intrinsic dimensions from the HTML attributes, not responsive layout dimensions.
      const iw=+image.getAttribute('width'),ih=+image.getAttribute('height');focus.firstChild.setAttribute('width',iw);focus.firstChild.setAttribute('height',ih);
      comparison.append(focus);const note=make('div','figure-comparison-note');note.append(make('p',null,'The window shows the selected part of the original paper figure.'));
      const link=button('Open interactive trajectory →','guide-action',()=>{document.querySelector(`[data-replay="${spec.model}"]`).click();document.getElementById('trajectory-explorer').scrollIntoView({block:'start'});});note.append(link,make('p','guide-hint','The interactive replay uses the separately documented record, not data extracted from this image.'));comparison.append(note);reading.append(comparison);
      extraUpdate=i=>{const r=spec.items[i][1];focus.setAttribute('viewBox',`${r[0]*iw/100} ${r[1]*ih/100} ${r[2]*iw/100} ${r[3]*ih/100}`);focus.setAttribute('aria-label',spec.items[i][0]+' from the original paper figure');};
    }
    if(spec.kind==='routing')addRouting(reading,select);
    if(spec.kind==='geometry')addGeometry(reading);
    const instance={opener,spec,select,stop,get selected(){return selected;}};instances.set(key,instance);select(0);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
    // A collapsed figure or inactive controller panel must not keep a walkthrough running.
    figure.closest('details')?.addEventListener('toggle',e=>{if(!e.target.open)stop();});
  }

  // The concise overview uses the same figure state as the enlarged inspector.
  window.addEventListener('cap:select-figure-step',e=>{
    const {key,index}=e.detail||{},instance=instances.get(key);
    if(instance&&Number.isInteger(index)&&index>=0&&index<instance.spec.items.length)instance.select(index);
  });

  function slider(id,label,min,max,step,value,parent){
    const row=make('label','guide-slider');row.htmlFor=id;const top=make('span');const output=make('output');output.htmlFor=id;top.append(document.createTextNode(label),output);
    const input=make('input');Object.assign(input,{id,type:'range',min,max,step,value});row.append(top,input);parent.append(row);return {input,output};
  }
  function addRouting(parent,select){
    const demo=make('details','figure-mini-demo cap-routing-demo');demo.append(make('summary','demo-summary','Try the routing rule'));demo.setAttribute('aria-label','Illustrative CAP routing rule');demo.append(make('p','guide-hint','Illustrative gate inputs. The Local Expert is evaluated first; the gate decides whether to request an additional expert.'));
    const controls=make('div','guide-slider-grid');demo.append(controls);
    const ratio=slider('cap-demo-error','Estimated error / controller tolerance',0,1.2,.01,.4,controls);
    const presence=slider('cap-demo-presence','Local presence probability',0,1,.01,.8,controls);
    const misses=slider('cap-demo-misses','Consecutive misses',0,4,1,0,controls);
    const result=make('p','routing-result');result.setAttribute('role','status');const chain=make('div','routing-chain');demo.append(result,chain);
    const reset=button('Reset example','guide-small-button',()=>{ratio.input.value=.4;presence.input.value=.8;misses.input.value=0;update();});demo.append(reset);parent.append(demo);
    function update(){
      const e=+ratio.input.value,p=+presence.input.value,m=+misses.input.value;
      ratio.output.textContent=e.toFixed(2);presence.output.textContent=p.toFixed(2);misses.output.textContent=String(m);
      const full=e>.8||m>=2,context=!full&&p<.5,index=full?3:context?4:5;
      const label=full?'Full-frame':context?'Context':'Local';result.textContent=`Selected path: ${label}. `+(full?(m>=2?'Miss count is at least 2.':'Estimated error exceeds 0.8 × tolerance.'):context?'Presence is below 0.5.':'Error and miss checks pass; presence is at least 0.5.');
      chain.replaceChildren(make('span',null,'Local evaluated'),make('span',null,'→'),make('strong',null,full?'Request full-frame':context?'Request context':'Retain local'));
      demo.dataset.route=label.toLowerCase();select(index);
    }
    [ratio,presence,misses].forEach(s=>s.input.addEventListener('input',update));
    // Preserve the guided overview initially; route changes begin on input.
    ratio.output.textContent='0.40';presence.output.textContent='0.80';misses.output.textContent='0';result.textContent='Selected path: Local. Error and miss checks pass; presence is at least 0.5.';chain.append(make('span',null,'Local evaluated'),make('span',null,'→'),make('strong',null,'Retain local'));demo.dataset.route='local';
  }
  function addGeometry(parent){
    const demo=make('details','figure-mini-demo geometry-demo');demo.append(make('summary','demo-summary','Move the point. Read the geometry.'));demo.setAttribute('aria-label','Illustrative obstacle-relative geometry');demo.append(make('p','guide-hint',String.raw`Coordinate illustration with \(p_{\mathcal O}=(0,0)\) and \(d^\star=0.85\). It does not run or retune the controller.`));
    const grid=make('div','geometry-demo-grid');const canvas=svg('svg',{viewBox:'0 0 320 320',role:'img','aria-label':'Obstacle-relative point and clearance'});
    canvas.append(svg('line',{x1:15,y1:160,x2:305,y2:160,stroke:'#cfddd7'}),svg('line',{x1:160,y1:15,x2:160,y2:305,stroke:'#cfddd7'}),svg('circle',{cx:160,cy:160,r:.85*45,fill:'#e4ece6',stroke:'#668678','stroke-dasharray':'5 4'}));
    const ray=svg('line',{stroke:'#749f93','stroke-width':2}),clearance=svg('line',{stroke:'#087f83','stroke-width':5}),point=svg('circle',{r:7,fill:'#087f83',stroke:'#fff','stroke-width':2}),tag=svg('text',{'font-size':14,fill:'#087f83'});tag.textContent='p';canvas.append(ray,clearance,point,tag);
    const o=svg('text',{x:167,y:176,'font-size':12,fill:'#556b62'});o.textContent='Center';canvas.append(o);grid.append(canvas);
    const controls=make('div');const radius=slider('geometry-demo-radius','Distance r',1,3,.01,2.4,controls),angle=slider('geometry-demo-angle','Obstacle-relative angle (degrees)',-180,180,1,-140,controls);
    const readout=make('dl','geometry-readout');readout.innerHTML=String.raw`<div><dt>Clearance \(c=r-d^\star\)</dt><dd data-value="clearance"></dd></div><div><dt>\(\rho=\log c\)</dt><dd data-value="rho"></dd></div><div><dt>Unit direction \(\vartheta\)</dt><dd data-value="direction"></dd></div>`;CAPMath.typeset(readout);
    controls.append(readout,button('Reset geometry','guide-small-button',()=>{radius.input.value=2.4;angle.input.value=-140;update();}));grid.append(controls);demo.append(grid);parent.append(demo);
    function update(){const r=+radius.input.value,a=+angle.input.value*Math.PI/180,c=r-.85,x=160+r*45*Math.cos(a),y=160-r*45*Math.sin(a);
      radius.output.textContent=r.toFixed(2);angle.output.textContent=angle.input.value+'°';
      Object.entries({x1:160,y1:160,x2:x,y2:y}).forEach(([k,v])=>ray.setAttribute(k,v));Object.entries({x1:160+.85*45*Math.cos(a),y1:160-.85*45*Math.sin(a),x2:x,y2:y}).forEach(([k,v])=>clearance.setAttribute(k,v));point.setAttribute('cx',x);point.setAttribute('cy',y);tag.setAttribute('x',x+10);tag.setAttribute('y',y-8);
      readout.querySelector('[data-value=clearance]').textContent=c.toFixed(3);readout.querySelector('[data-value=rho]').textContent=Math.log(c).toFixed(3);readout.querySelector('[data-value=direction]').textContent=`(${Math.cos(a).toFixed(3)}, ${Math.sin(a).toFixed(3)})`;demo.dataset.clearance=String(c);
    }[radius,angle].forEach(s=>s.input.addEventListener('input',update));update();
  }

  // The enlarged viewer offers the same region choices as each inline figure.
  const modal=document.getElementById('figure-guide-modal');
  function updateModal(key){const instance=instances.get(key);if(!instance)return;
    const {spec,selected}=instance;const choices=make('div','figure-modal-choices');choices.setAttribute('role','group');choices.setAttribute('aria-label','Inspect figure regions');
    spec.items.forEach(([label,rect],i)=>{const b=button(label,'figure-guide-choice',()=>{instance.select(i);window.dispatchEvent(new CustomEvent('cap:focus-figure',{detail:{rect}}));modal.querySelector('[aria-pressed=true]')?.focus({preventScroll:true});});b.dataset.step=String(i+1).padStart(2,'0');b.setAttribute('aria-pressed',String(i===selected));choices.append(b);});
    const text=make('p','figure-modal-explanation',spec.items[selected][2]);const label=make('p','modal-inspect-label','EXPLORE THE FIGURE');const heading=make('h3','modal-region-title',spec.items[selected][0]);modal.replaceChildren(label,choices,heading,text);
  }
  window.addEventListener('cap:figure-opened',e=>{modalKey=e.detail.key;updateModal(modalKey);});
  document.getElementById('figure-dialog').addEventListener('close',()=>{modalKey=null;});
  function stopControllerTours(){instances.get('nonholonomic-loop')?.stop();instances.get('holonomic-loop')?.stop();}
  document.querySelectorAll('.controller-tabs button').forEach(b=>{
    b.addEventListener('click',stopControllerTours);
    b.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key))stopControllerTours();});
  });
})();
