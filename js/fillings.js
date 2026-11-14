// Filling types and how each one is drawn on the sheet.
'use strict';
/* ---------------- fillings ---------------- */
const FILLS=[
  {id:'custard',name:'ครีมคัสตาร์ด',kind:'cream',color:'#F6C431',hi:'#FFF1A8',w:20,sweet:1},
  {id:'pandan',name:'สังขยาใบเตย',kind:'cream',color:'#7DB544',hi:'#D9F2AE',w:20,sweet:1},
  {id:'taro',name:'ครีมเผือก',kind:'cream',color:'#A983CB',hi:'#EADCF4',w:20,sweet:1},
  {id:'choco',name:'ช็อกโกแลต',kind:'cream',color:'#5B3421',hi:'#B07E60',w:14,sweet:1},
  {id:'foithong',name:'ฝอยทอง',kind:'fiber',color:'#F3B320',sweet:1},
  {id:'sausage',name:'ไส้กรอก',kind:'piece',gap:70,color:'#C8452E',savory:1},
  {id:'pork',name:'หมูสับผัด',kind:'crumb',color:'#B07F4F',savory:1},
  {id:'hen',name:'ไข่ไก่ ตอกแล้วคน',kind:'hen',color:'#F7A21B',savory:1},
  {id:'egg',name:'ไข่นกกระทา',kind:'piece',gap:58,color:'#F5A623',savory:1},
  {id:'floss',name:'หมูหยอง',kind:'fiber',color:'#C57B3B',savory:1},
  {id:'chili',name:'ซอสพริก',kind:'cream',color:'#D3321C',hi:'#FF9A7A',w:7,savory:1},
];
const FD={}; FILLS.forEach(f=>FD[f.id]=f);
const scatterKind=k=>k==='fiber'||k==='crumb';

function creamPath(c,pts,ox,oy){
  c.beginPath(); c.moveTo(pts[0]+ox,pts[1]+oy);
  if(pts.length<=2){c.lineTo(pts[0]+ox+0.1,pts[1]+oy);return}
  for(let k=2;k<pts.length-2;k+=2){const mx=(pts[k]+pts[k+2])/2,my=(pts[k+1]+pts[k+3])/2;c.quadraticCurveTo(pts[k]+ox,pts[k+1]+oy,mx+ox,my+oy)}
  c.lineTo(pts[pts.length-2]+ox,pts[pts.length-1]+oy);
}
function drawCream(c,type,pts){
  const f=FD[type], w=f.w;
  c.save(); c.lineCap='round'; c.lineJoin='round';
  creamPath(c,pts,2,3.5); c.strokeStyle='rgba(70,35,5,.22)'; c.lineWidth=w+2; c.stroke();
  creamPath(c,pts,0,0); c.strokeStyle=f.color; c.lineWidth=w; c.stroke();
  creamPath(c,pts,w*0.1,w*0.12); c.strokeStyle='rgba(0,0,0,.08)'; c.lineWidth=w*0.5; c.stroke();
  creamPath(c,pts,-w*0.17,-w*0.2); c.strokeStyle=f.hi; c.globalAlpha=.6; c.lineWidth=w*0.3; c.stroke();
  c.restore();
}
const PAL={foithong:['#F7B81E','#F2A413','#FFCB3D','#E89A0C','#FFD45A'],floss:['#C9823F','#B56E31','#D99A57','#A85F28','#E0AE6C'],pork:['#B88A5C','#A0703F','#C9A06E','#8C5E35','#D2AE80']};
function makeScatter(type,x,y,sp){
  const a=Math.random()*TAU, d=Math.sqrt(Math.random())*sp, pal=PAL[type], col=pal[(Math.random()*pal.length)|0];
  const X=x+Math.cos(a)*d, Y=y+Math.sin(a)*d;
  if(type==='pork') return {crumb:1,x:X,y:Y,r:3.4+Math.random()*3.6,col,seed:(Math.random()*1e9)|0};
  const fo=type==='foithong';
  return {x:X,y:Y,a:Math.random()*TAU,len:fo?20+Math.random()*26:6+Math.random()*11,w:fo?1.1+Math.random()*0.8:1.8+Math.random()*1.3,curl:(Math.random()-0.5)*(fo?0.9:1.7),col};
}
function fiberPath(c,f,ox,oy){
  let x=f.x,y=f.y,a=f.a; const st=f.len/5; c.beginPath(); c.moveTo(x+ox,y+oy);
  for(let k=0;k<5;k++){a+=f.curl;x+=Math.cos(a)*st;y+=Math.sin(a)*st;c.lineTo(x+ox,y+oy)}
}
function crumbPath(c,f,ox,oy){
  const r=rng(f.seed); c.beginPath();
  for(let k=0;k<6;k++){const a=k/6*TAU,d=f.r*(0.7+r()*0.5);const x=f.x+Math.cos(a)*d+ox,y=f.y+Math.sin(a)*d+oy;k?c.lineTo(x,y):c.moveTo(x,y)}
  c.closePath();
}
function drawScatter(c,f){
  if(f.crumb){
    crumbPath(c,f,1.2,1.8); c.fillStyle='rgba(70,35,5,.25)'; c.fill();
    crumbPath(c,f,0,0); c.fillStyle=f.col; c.fill();
    c.fillStyle='rgba(255,240,210,.35)'; circle(c,f.x-f.r*0.3,f.y-f.r*0.3,f.r*0.3); c.fill();
    return;
  }
  c.lineCap='round'; c.lineJoin='round';
  fiberPath(c,f,1,1.6); c.strokeStyle='rgba(80,40,0,.2)'; c.lineWidth=f.w+0.6; c.stroke();
  fiberPath(c,f,0,0); c.strokeStyle=f.col; c.lineWidth=f.w; c.stroke();
}
function makePiece(type,x,y){
  return {type,x,y,seed:(Math.random()*1e9)|0,rot:type==='sausage'?(Math.random()-0.5)*0.22:Math.random()*TAU,cook:0};
}
function drawSausage(c,L,W){
  c.fillStyle='rgba(70,20,0,.25)'; rr(c,-W+3,-L+5,2*W,2*L,W); c.fill();
  const g=c.createLinearGradient(-W,0,W,0); g.addColorStop(0,'#8E2414'); g.addColorStop(.3,'#E8774E'); g.addColorStop(.6,'#C8452E'); g.addColorStop(1,'#8A2312');
  c.fillStyle=g; rr(c,-W,-L,2*W,2*L,W); c.fill();
  c.fillStyle='rgba(255,225,200,.45)'; rr(c,-W*0.5,-L+8,W*0.36,2*L-16,W*0.18); c.fill();
  c.strokeStyle='rgba(110,25,10,.45)'; c.lineWidth=1.4;
  c.beginPath(); c.moveTo(-W*0.5,-L+W*0.55); c.quadraticCurveTo(0,-L+W*0.85,W*0.5,-L+W*0.55); c.stroke();
  c.beginPath(); c.moveTo(-W*0.5,L-W*0.55); c.quadraticCurveTo(0,L-W*0.85,W*0.5,L-W*0.55); c.stroke();
}
function drawPiece(c,p){
  const r=rng(p.seed);
  c.save(); c.translate(p.x,p.y);
  if(p.type==='sausage'){ c.rotate(p.rot); drawSausage(c,56,12); }
  else if(p.type==='egg'){
    const ck=Math.min(1,p.cook), pts=[], n=12;
    for(let i=0;i<n;i++){const a=i/n*TAU+p.rot;const d=25+r()*8;pts.push(Math.cos(a)*d,Math.sin(a)*d)}
    const blob=()=>{c.beginPath();for(let i=0;i<n;i++){const x0=pts[i*2],y0=pts[i*2+1],x1=pts[((i+1)%n)*2],y1=pts[((i+1)%n)*2+1];const mx=(x0+x1)/2,my=(y0+y1)/2;if(i===0)c.moveTo((pts[(n-1)*2]+x0)/2,(pts[(n-1)*2+1]+y0)/2);c.quadraticCurveTo(x0,y0,mx,my)}c.closePath()};
    blob(); c.fillStyle=`rgba(255,253,246,${0.32+0.63*ck})`; c.fill();
    if(p.cook>1.3){c.lineWidth=3;c.strokeStyle=`rgba(175,112,48,${Math.min(.65,(p.cook-1.3)*0.8)})`;c.stroke()}
    c.strokeStyle=`rgba(255,255,255,${0.5-0.3*ck})`; c.lineWidth=1.5; blob(); c.stroke();
    const yx=(r()-0.5)*8, yy=(r()-0.5)*8;
    c.fillStyle='rgba(120,60,0,.2)'; circle(c,yx+1.5,yy+2,11); c.fill();
    c.fillStyle=p.cook>1.4?'#F6BE52':'#F59A12'; circle(c,yx,yy,10.5); c.fill();
    c.fillStyle='rgba(255,255,255,.65)'; c.beginPath(); c.ellipse(yx-3.5,yy-4,3.6,2.2,-0.6,0,TAU); c.fill();
  }
  c.restore();
}
function drawIcon(cnv,f){
  const c=cnv.getContext('2d'); c.setTransform(cnv.width/100,0,0,cnv.width/100,0,0);
  if(f.kind==='cream'){ drawCream(c,f.id,f.id==='chili'?[18,62,32,40,48,62,64,40,82,58]:[20,72,30,40,50,58,68,74,80,34]); }
  else if(scatterKind(f.kind)){ const n=f.id==='foithong'?18:f.id==='pork'?26:34; for(let i=0;i<n;i++) drawScatter(c,makeScatter(f.id,50,50,f.id==='pork'?26:22)); }
  else if(f.id==='hen'){ c.fillStyle='#FFFCF2'; c.beginPath(); c.ellipse(50,52,38,28,0.3,0,TAU); c.fill(); c.strokeStyle='#F7A21B'; c.lineWidth=7; c.lineCap='round'; c.beginPath(); c.moveTo(24,60); c.bezierCurveTo(40,34,56,72,76,42); c.stroke(); c.fillStyle='#F59A12'; circle(c,52,50,11); c.fill(); c.fillStyle='rgba(255,255,255,.6)'; circle(c,48,46,3.5); c.fill(); }
  else if(f.id==='sausage'){ c.translate(50,50); c.rotate(0.6); drawSausage(c,36,10); }
  else { const p=makePiece(f.id,0,0); p.cook=1; c.translate(50,50); c.scale(1.35,1.35); drawPiece(c,p); }
}

