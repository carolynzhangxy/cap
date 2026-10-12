// Exact-position numerical illustrations of the paper's two oscillatory laws.
// No gradient, planned path, smoothing, or projection of the integrated state.
export const SETTINGS = Object.freeze({omega:100, gamma:12, kappa:.6, dstar:.85, delta:.25,
  step:.0001, sampleStep:.0005, horizon:12, targetRadius:.35, stopOnArrival:true});
export const HOLONOMIC = Object.freeze({omega:100, a:.16, k:1.4, coverRadius:.92, delta:.15, horizon:30, step:.000025});

export function configuration(layout) {
  const model=layout.model||'nonholonomic';
  if(!['holonomic','nonholonomic'].includes(model))throw Error('Unknown vehicle model.');
  const settings={...SETTINGS,...(model==='holonomic'?HOLONOMIC:{})};
  const r=Math.hypot(layout.source[0]-layout.obstacle[0],layout.source[1]-layout.obstacle[1]);
  const ref=Math.atan2(layout.source[1]-layout.obstacle[1],layout.source[0]-layout.obstacle[0]);
  const c={...settings,model,rho:Math.min(1,.7*(r-settings.dstar)),rhoB:Math.min(.8,.95*(r/Math.SQRT2-HOLONOMIC.coverRadius)),
    ref,coverAngle:ref-Math.PI/2,heading:Math.PI/2,source:layout.source.slice(),obstacle:layout.obstacle.slice()};
  if(model==='holonomic'){
    // Select constants once per layout, reserving room for the larger dither.
    // Align the initial oscillator to start on the obstacle-facing edge of its
    // local orbit, so the first excursion moves into available free space.
    c.a=Math.min(c.a,.5*c.rhoB);
    const V0=Math.min(...potentials(...layout.vehicle,c));
    c.omega=Math.max(c.omega,2*c.k*V0/(c.a*.3));
    c.phase=Math.atan2(c.obstacle[1]-layout.vehicle[1],c.obstacle[0]-layout.vehicle[0])-Math.atan2(2*c.k*V0/(c.a*c.omega),c.a);
  }
  return c;
}
const barrier=(s,r)=>s<=0?Infinity:s<r?(r-s)**2*Math.log(r/s):0;
export function coveringDistances(x,y,c) {
  const dx=x-c.obstacle[0],dy=y-c.obstacle[1],a=c.coverAngle;
  const X=Math.cos(a)*dx+Math.sin(a)*dy,Y=-Math.sin(a)*dx+Math.cos(a)*dy;
  // Each complement is an intersection of two orthogonal half-planes.
  // The distance to that intersection includes both positive components.
  return [Math.hypot(Math.max(0,(-X-Y)/Math.SQRT2-c.coverRadius),Math.max(0,(-X+Y)/Math.SQRT2-c.coverRadius)),
    Math.hypot(Math.max(0,(X-Y)/Math.SQRT2-c.coverRadius),Math.max(0,(X+Y)/Math.SQRT2-c.coverRadius))];
}
export function potentials(x,y,c) {
  const field=.1*((x-c.source[0])**2+(y-c.source[1])**2);
  if(c.model==='holonomic')return coveringDistances(x,y,c).map(d=>field+barrier(d,c.rhoB));
  const dx=x-c.obstacle[0],dy=y-c.obstacle[1],s=Math.hypot(dx,dy)-c.dstar;
  if(s<=0)return [Infinity,Infinity];
  const alpha=Math.atan2(dy,dx)-c.ref,warp=.5*(1-Math.cos(alpha)),B=barrier(s,c.rho);
  return [field+B+1-Math.cos(alpha+warp),field+B+1-Math.cos(alpha-warp)];
}
export const headingAt=(t,c)=>c.heading+(c.model==='nonholonomic'?2*Math.PI*Math.sqrt(c.omega)*t:0);
export function velocity(t,x,y,q,c) {
  const V=potentials(x,y,c)[q-1];
  if(c.model==='holonomic'){
    const mx=Math.cos(c.omega*t+c.phase),my=Math.sin(c.omega*t+c.phase),gain=2*c.k*V/c.a;
    return [-c.a*c.omega*my-gain*mx,c.a*c.omega*mx-gain*my];
  }
  const u=Math.sqrt(4*Math.PI*c.gamma*c.omega/c.kappa)*Math.cos(2*Math.PI*c.omega*t+c.kappa*V),heading=headingAt(t,c);
  return [u*Math.cos(heading),u*Math.sin(heading)];
}
export function simulate(layout,options={}) {
  const c={...configuration(layout),...options},h=c.step,stride=Math.max(1,Math.round(c.sampleStep/h));
  const points=[],events=[];let [x,y]=layout.vehicle,q=2,arrival=null,minClearance=Infinity,reason='horizon';
  const clearance=(x,y)=>c.model==='holonomic'?Math.max(...coveringDistances(x,y,c)):Math.hypot(x-c.obstacle[0],y-c.obstacle[1])-c.dstar;
  if((c.model==='holonomic'?c.rhoB:c.rho)<=0||clearance(x,y)<=0)throw Error('Place the start and source outside the clearance boundary.');
  const total=Math.round(c.horizon/h);
  for(let i=0;i<=total;i++){
    const t=i*h,v=potentials(x,y,c),best=v[0]<=v[1]?1:2;
    if(!Number.isFinite(v[best-1])){reason='domain';break;}
    if(v[q-1]-v[best-1]>=c.delta){events.push({t,from:q,to:best});q=best;}
    minClearance=Math.min(minClearance,clearance(x,y));
    const distance=Math.hypot(x-c.source[0],y-c.source[1]),stop=c.stopOnArrival&&distance<=c.targetRadius;
    // Preserve the actual first-entry sample, including between logging intervals.
    if(i%stride===0||stop||i===total)points.push(t,x,y,q,distance);
    if(stop){arrival=t;reason='arrived';break;}
    if(i===total)break;
    const a=velocity(t,x,y,q,c),b=velocity(t+h/2,x+h*a[0]/2,y+h*a[1]/2,q,c),d=velocity(t+h/2,x+h*b[0]/2,y+h*b[1]/2,q,c),e=velocity(t+h,x+h*d[0],y+h*d[1],q,c);
    const xn=x+h*(a[0]+2*b[0]+2*d[0]+e[0])/6,yn=y+h*(a[1]+2*b[1]+2*d[1]+e[1])/6;
    if(!Number.isFinite(xn)||!Number.isFinite(yn)||clearance(xn,yn)<=0){reason='domain';break;}
    x=xn;y=yn;
  }
  return {points:new Float64Array(points),config:c,events,arrival,reason,minClearance,duration:points.length?points[points.length-5]:0};
}
