// Orthographic scientific diagram: all floor geometry uses one world projection.
export const modeColor=q=>q===1?'#087e8a':'#b56a17';
const round=n=>Number(n.toFixed(3));
export function project(p,top=false){const [x,y,z=0]=p;return top?[410+x*87,410-y*87-z*30]:[410+(x+.45*y)*72,445+(.22*x-.55*y)*72-z*67];}
export function unproject([x,y],top=false){if(top)return [(x-410)/87,(410-y)/87];const a=(x-410)/72,b=(y-445)/72;return [(a*.55+b*.45)/.649,(a*.22-b)/.649];}
const points=p=>p.map(x=>x.map(round).join(',')).join(' ');
const poly=(p,fill,extra='')=>`<polygon points="${points(p)}" fill="${fill}" ${extra}/>`;
const text=(x,y,s,size=20,color='#253c33',extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-family="DejaVu Sans,Arial,sans-serif" ${extra}>${s}</text>`;
function clip(p,a,b,c){const result=[];for(let i=0;i<p.length;i++){const u=p[i],v=p[(i+1)%p.length],su=a*u[0]+b*u[1]+c,sv=a*v[0]+b*v[1]+c;if(su>=-1e-9)result.push(u);if((su<0)!==(sv<0)){const t=su/(su-sv);result.push(u.map((n,j)=>n+t*(v[j]-n)));}}return result;}
const path=p=>'M'+p.map(v=>v.map(round).join(',')).join('L');
function sprite(asset,key,p,w,h,top=false){let crop,width,height;if(key==='rover'){crop=top?[980,85,710,710]:[75,130,860,680];width=1774;height=887;}else if(key==='rock'){crop=top?[899,102,844,731]:[32,96,867,700];width=1774;height=887;}else{crop=[20,45,1500,860];width=1536;height=1024;}return `<svg x="${round(p[0]-w/2)}" y="${round(p[1]-h)}" width="${w}" height="${h}" viewBox="${crop.join(' ')}" preserveAspectRatio="none"><image href="${asset(key)}" x="0" y="0" width="${width}" height="${height}"/></svg>`;}
export function robotMarkup(pos,top,asset){const p=project(pos,top);return sprite(asset,'rover',[p[0],p[1]+(top?22:15)],top?49:69,top?49:54,top);}
export function routeAt(data,q,t){const rows=data.routes[q-1].rows;let lo=0,hi=rows.length-1;while(lo<hi){const m=Math.ceil((lo+hi)/2);if(rows[m][0]<=t)lo=m;else hi=m-1;}return {row:rows[lo],index:lo};}
export function routePath(data,q,t,top){const {row,index}=routeAt(data,q,t);return path(data.routes[q-1].rows.slice(0,index+1).map(r=>project(r.slice(1,3),top)));}
export function panelSVG(data,q,{top=false,regions=true,contours=true,vectors=true,trajectories=true,drone=true,t=190}={},asset){
 const id=`hc-${q}`,C=modeColor(q),R=data.bound,r=data.config.coverRadius*Math.SQRT2,P=p=>project(p,top),world=[[-R,-R],[R,-R],[R,R],[-R,R]],floor=world.map(P);
 let invalid=q===1?clip(clip(world,1,1,r),1,-1,r):clip(clip(world,-1,1,r),-1,-1,r);
 const unavailable=invalid.map(P),admissiblePath=path(floor)+'Z'+path(unavailable)+'Z';
 let s=`<svg xmlns="http://www.w3.org/2000/svg" width="820" height="735" viewBox="0 0 820 735" role="img" aria-label="Holonomic region U${q}, its potential level sets, flow directions and switching boundary"><defs><clipPath id="${id}-floor">${poly(floor,'white')}</clipPath><clipPath id="${id}-finite"><path d="${admissiblePath}" clip-rule="evenodd"/></clipPath><pattern id="${id}-hatch" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M-3 3L3-3M0 12L12 0M9 15L15 9" stroke="#7d6973" stroke-opacity=".18" stroke-width="1"/></pattern><marker id="${id}-arrow" viewBox="0 0 10 8" refX="9" refY="4" markerWidth="8" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 4L0 8Z" fill="#1465a1"/></marker><marker id="${id}-route-arrow" viewBox="0 0 10 8" refX="9" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 4L0 8Z" fill="${C}"/></marker></defs>`;
 s+=`<rect width="820" height="735" rx="20" fill="#fafbf7"/>`;
 s+=`<rect x="25" y="24" width="92" height="42" rx="21" fill="${C}"/>`+text(71,53,`q = ${q}`,24,'#fff','text-anchor="middle" font-weight="bold"');
 s+=text(137,52,`Region U${q===1?'₁':'₂'}`,29,C);
 s+=text(795,51,top?'TOP VIEW':'3D CONSTRUCTION',13,'#69796f','text-anchor="end" letter-spacing="1.5"');
 s+=text(26,96,q===1?'The left-side cover connects the start to the source.':'The right-side cover gives a second route to the source.',17);
 if(!top){const edges=[world[0],world[1],world[2]].map(P);s+=poly([...edges,...edges.slice().reverse().map(([x,y])=>[x,y+13])],'#726046');}
 const origin=P([-R,R]),u=P([R,R]),v=P([-R,-R]);
 s+=`<image href="${asset('terrain')}" width="1" height="1" preserveAspectRatio="none" transform="matrix(${u[0]-origin[0]} ${u[1]-origin[1]} ${v[0]-origin[0]} ${v[1]-origin[1]} ${origin[0]} ${origin[1]})"/>`;
 s+=`<g class="construction-regions" ${regions?'':'display="none"'}><path d="${admissiblePath}" fill="${q===1?'#8be3e6':'#f8dc92'}" fill-rule="evenodd" opacity=".28"/>${poly(unavailable,'#f5f1f0','opacity=".80"')}${poly(unavailable,`url(#${id}-hatch)`)}</g>`;
 s+=`<g clip-path="url(#${id}-finite)" class="construction-contours" ${contours?'':'display="none"'}>`;
 for(const level of data.contours[q-1])for(const line of level.lines)s+=`<path d="${path(line.map(P))}" fill="none" stroke="#e6fdff" stroke-opacity=".85" stroke-width="1.45"><title>V${q} = ${level.value}</title></path>`;
 s+='</g>';
 // Draw the exact covering boundary. No spatial jump is implied by a mode change.
 for(const sign of [-1,1]){const edge=[];for(let y=0;y<=R+.0001;y+=.02){const x=(q===1?1:-1)*(y-r);if(Math.abs(x)<=R)edge.push(P([x,sign*y]));}s+=`<path d="${path(edge)}" fill="none" stroke="${C}" stroke-width="2.8"/>`;}
 const diamond=[[r,0],[0,r],[-r,0],[0,-r]].map(P);
 s+=poly(diamond,'#2a2e2910','stroke="#26382e" stroke-width="2" stroke-dasharray="5 5"');
 for(const line of data.switchBoundaries[q-1])s+=`<path class="construction-switch" d="${path(line.map(P))}" fill="none" stroke="#fff9f4" stroke-width="4.4"/><path class="construction-switch" d="${path(line.map(P))}" fill="none" stroke="#b03546" stroke-width="2" stroke-dasharray="6 5"><title>Γ(p, ${q}) = δ. Beyond this boundary, jump to mode ${3-q}.</title></path>`;
 s+=`<g class="construction-vectors" ${vectors?'':'display="none"'}>`;
 for(const {p,v} of data.arrows[q-1]){const a=P(p),b=P(p.map((n,j)=>n+.24*v[j]));s+=`<path d="${path([a,b])}" stroke="#effaff" stroke-width="4.3" fill="none"/><path d="${path([a,b])}" stroke="#1465a1" stroke-width="1.9" fill="none" marker-end="url(#${id}-arrow)"/>`;}
 s+='</g>';
 const route=data.routes[q-1],full=route.rows.map(r=>P(r.slice(1,3)));
 s+=`<g class="construction-trajectories" ${trajectories?'':'display="none"'}><path d="${path(full)}" fill="none" stroke="#fff" stroke-width="7" opacity=".7"/><path d="${path(full)}" fill="none" stroke="${C}" stroke-width="2.4" stroke-dasharray="7 6" opacity=".7"/><path data-route-halo="${q}" d="${routePath(data,q,t,top)}" fill="none" stroke="#fff" stroke-width="8"/><path data-route="${q}" d="${routePath(data,q,t,top)}" fill="none" stroke="${C}" stroke-width="4"/>`;
 for(const frac of [.20,.49,.75]){const i=Math.floor(route.rows.length*frac),a=full[i],b=full[Math.min(i+12,full.length-1)];s+=`<path d="${path([a,b])}" fill="none" stroke="${C}" stroke-width="3" marker-end="url(#${id}-route-arrow)"/>`;}
 s+='</g>';
 // Physical objects are grounded in the same world frame as the covers.
 const rock=P([0,0]);s+=sprite(asset,'rock',[rock[0],rock[1]+17],top?98:108,top?90:94,top);
 const source=P(data.layout.source),start=P(data.layout.vehicle);
 s+=`<image href="${asset('source')}" x="${source[0]-17}" y="${source[1]-42}" width="34" height="48"/>`;
 s+=`<circle cx="${start[0]}" cy="${start[1]}" r="6" fill="#fff" stroke="${C}" stroke-width="2"/>`;
 s+=text(start[0],start[1]+27,'p₀',20,'#23392d','text-anchor="middle" paint-order="stroke" stroke="#fff" stroke-width="4" stroke-linejoin="round"');
 s+=text(source[0]+25,source[1]-13,'p★',20,'#23392d','paint-order="stroke" stroke="#fff" stroke-width="4"');
 const label=P([q===1?-2.05:2.05,.65]);s+=text(label[0],label[1],`U${q===1?'₁':'₂'}`,37,C,'text-anchor="middle" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round"');
 const inf=P([q===1?2.0:-2.0,-.2]);s+=text(inf[0],inf[1],`V${q===1?'₁':'₂'} = ∞`,27,'#6a4050','text-anchor="middle" paint-order="stroke" stroke="#faf7f5" stroke-width="4"');
 s+=text(inf[0],inf[1]+25,'outside this cover',14,'#725d64','text-anchor="middle"');
 s+=`<g data-robot="${q}">${robotMarkup(routeAt(data,q,t).row.slice(1,3),top,asset)}</g>`;
 if(drone&&!top){const lens=P([0,0,3.35]);s+=`<path d="${path([lens,rock])}" stroke="#49a6b2" stroke-width="1" stroke-dasharray="4 6" opacity=".55"/>`;s+=sprite(asset,'drone',[lens[0],lens[1]+7],158,91);}
 const axesOrigin=P([-R,-R]);for(const [delta,label] of [[[.65,0],'x'],[[0,.65],'y']]){const a=P([-R+delta[0],-R+delta[1]]);s+=`<path d="${path([axesOrigin,a])}" stroke="#253c33" stroke-width="1.6"/>`+text(a[0]+6,a[1],label,16);}
 s+=`<line x1="26" y1="676" x2="794" y2="676" stroke="#dfe5dc"/>`;
 s+=text(27,704,'Solid boundary: ∂U'+(q===1?'₁':'₂')+'     Dashed diamond: excluded inner set',16);
 s+=text(27,727,`Red dashes: Γ(p, ${q}) = δ  →  select q⁺ = ${3-q}; position stays fixed.`,15,'#96374b');
 return s+'</svg>';
}
