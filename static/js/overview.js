'use strict';
(() => {
  const overview=document.getElementById('overview');
  if(!overview)return;
  const buttons=[...overview.querySelectorAll('[data-overview-step]')];
  const figure=overview.querySelector('.framework-figure');
  const overlay=figure.querySelector('.figure-hotspots');
  const region=figure.querySelector('.figure-selected-region');
  const guide=figure.querySelector('.figure-guide');
  if(!overlay||!region||!guide)return;
  const steps=[
    {label:'01 / OBSERVE',index:0,rect:[0,0,45,46],copy:'A camera image supports position estimation. A separate sensor measures the scalar signal at the robot’s current position.'},
    {label:'02 / ADAPT PERCEPTION',index:2,rect:[55,3,44,42],copy:'CAP starts with a local search around the predicted robot position. It requests context or full-frame processing when the localization checks call for it.'},
    {label:'03 / MOVE TOWARD THE SOURCE',index:4,rect:[34,68,65,23],copy:'Oscillatory motion explores the signal. Hybrid switching changes the active potential to avoid obstacle-induced traps as the robot seeks the source.'}
  ];
  const explanation=overview.querySelector('#overview-explanation');
  function select(index){
    const step=steps[index];
    buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
    overview.dataset.step=String(index);
    explanation.querySelector('span').textContent=step.label;
    explanation.querySelector('p').textContent=step.copy;
    window.dispatchEvent(new CustomEvent('cap:select-figure-step',{detail:{key:'framework',index:step.index}}));
    const [left,top,width,height]=step.rect;
    Object.assign(region.style,{left:left+'%',top:top+'%',width:width+'%',height:height+'%'});
  }
  // Keep the six-part inspector in the enlarged view; the overview has one three-step control.
  guide.hidden=true;
  overlay.hidden=false;
  overview.classList.add('overview-ready');
  buttons.forEach((button,index)=>{
    button.addEventListener('click',()=>select(index));
    button.addEventListener('keydown',event=>{
      let next;
      if(event.key==='ArrowRight')next=(index+1)%buttons.length;
      if(event.key==='ArrowLeft')next=(index+buttons.length-1)%buttons.length;
      if(event.key==='Home')next=0;
      if(event.key==='End')next=buttons.length-1;
      if(next===undefined)return;
      event.preventDefault();buttons[next].focus();select(next);
    });
  });
  // Restore the overview grouping after detailed inspection in the modal.
  document.getElementById('figure-dialog')?.addEventListener('close',()=>select(Number(overview.dataset.step)));
  select(0);
})();
