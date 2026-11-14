// Rolling step: pick a direction with a swipe, flick to roll the sheet one turn at a time.
'use strict';
/* =====================================================================
   ROLL STEP + SERVE (rewritten from scratch)
   Roll: first swipe from the sheet's edge toward the filling picks the
   rolling direction (any angle) and lifts the edge; every flick along the
   arrow rolls the sheet one more turn. The rolled part is a thin tube.
   Serve: a 3D khanom Tokyo shaped like a street-stall one: about one wrap,
   the outer edge running diagonally so the front opens like a scoop and
   the filling sits inside.
   ===================================================================== */
function setupRoll(){
  const W=fillLayer.width;
  const flat=mk(W,W), f=flat.getContext('2d'); f.setTransform(FLS,0,0,FLS,0,0);
  if(S.hasHen) f.drawImage(egC,G0,G0,N*CELL,N*CELL);
  f.drawImage(fillLayer,0,0,1000,1000); drawEggs(f);
  f.globalCompositeOperation='destination-in'; f.drawImage(baC,G0,G0,N*CELL,N*CELL);
  f.globalCompositeOperation='destination-over'; f.drawImage(baC,G0,G0,N*CELL,N*CELL);
  if(S.hasPat) f.drawImage(paC,G0,G0,N*CELL,N*CELL);
  const spill=mk(W,W), sp=spill.getContext('2d'); sp.setTransform(FLS,0,0,FLS,0,0);
  if(S.hasHen) sp.drawImage(egC,G0,G0,N*CELL,N*CELL);
  sp.drawImage(fillLayer,0,0,1000,1000); drawEggs(sp);
  sp.globalCompositeOperation='destination-out'; sp.drawImage(baC,G0,G0,N*CELL,N*CELL);
  const fc=mk(N,N), fx=fc.getContext('2d');
  if(S.hasHen) fx.drawImage(egC,0,0,N,N);
  fx.drawImage(fillLayer,G0*FLS,G0*FLS,N*CELL*FLS,N*CELL*FLS,0,0,N,N);
  fx.setTransform(1/CELL,0,0,1/CELL,-G0/CELL,-G0/CELL); drawEggs(fx);
  const fd=fx.getImageData(0,0,N,N).data; for(let i=0;i<NN;i++) fillAmt[i]=fd[i*4+3]/255;
  S.roll={flat,spill,alpha:null,phase:'aim',X:0,r:24,slips:0,flips:0,loose:0,lw:0,ld:0,done:false,tearFrac:0,foldCover:true,anim:null,g0:null,gc:null,dom:dominantFill()};
}
// resample the sheet so the chosen direction becomes +x (the "roll frame"); drizzled lace counts as sheet
function orientRoll(a){
  const R=S.roll; R.alpha=a; const ca=Math.cos(a), sa=Math.sin(a);
  const bR=new Float32Array(NN), bB=new Float32Array(NN), cR=new Float32Array(NN), pR=new Float32Array(NN), fR=new Float32Array(NN);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const lx=G0+(x+0.5)*CELL-GC, ly=G0+(y+0.5)*CELL-GC, wx=GC+ca*lx-sa*ly, wy=GC+sa*lx+ca*ly;
    const cx=Math.floor((wx-G0)/CELL), cy=Math.floor((wy-G0)/CELL); if(cx<0||cy<0||cx>=N||cy>=N) continue;
    const j=cy*N+cx, i=y*N+x, lace=pat[j]>0.12;
    bB[i]=batter[j]; bR[i]=Math.max(batter[j],lace?0.22:0); cR[i]=batter[j]>0.02?cook[j]:patCk[j]*1.1+0.15; pR[i]=pat[j]; fR[i]=fillAmt[j];
  }
  const rowStart=new Float32Array(N).fill(-1), rowEnd=new Float32Array(N).fill(-1), rowT=new Float32Array(N), rowTC=new Float32Array(N);
  let xmin=1e9,xmax=-1e9,ymin=N,ymax=-1,fl=1e9;
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x,t=bR[i]; if(t<=0.03) continue;
    const xl=G0+x*CELL; if(rowStart[y]<0) rowStart[y]=xl; rowEnd[y]=xl+CELL; rowT[y]+=t; rowTC[y]+=t*cR[i];
    if(xl<xmin)xmin=xl; if(xl+CELL>xmax)xmax=xl+CELL; if(y<ymin)ymin=y; if(y>ymax)ymax=y; if(fR[i]>0.3&&xl<fl) fl=xl;}
  const rowStartB=new Float32Array(N).fill(-1), rowEndB=new Float32Array(N).fill(-1);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(bB[y*N+x]>0.02){const xl=G0+x*CELL;if(rowStartB[y]<0)rowStartB[y]=xl;rowEndB[y]=xl+CELL}}
  Object.assign(R,{bR,bB,rowStartB,rowEndB,cR,pR,fR,rowStart,rowEnd,rowT,rowTC,xminL:xmin,xmaxL:xmax,y0L:G0+ymin*CELL,y1L:G0+(ymax+1)*CELL,fillLeft:fl<1e9?fl:null,X:xmin});
}
function rollToWorld(x,y){const R=S.roll,ca=Math.cos(R.alpha),sa=Math.sin(R.alpha),lx=x-GC,ly=y-GC;return{x:GC+ca*lx-sa*ly,y:GC+sa*lx+ca*ly}}
function worldDraw(c,img,x,y,w,h){const R=S.roll;c.save();c.translate(GC,GC);c.rotate(-R.alpha);c.translate(-GC,-GC);c.drawImage(img,x,y,w,h);c.restore()}
// what you see at angle th on the tube (0 = top, +pi/2 = where the flat sheet leaves): the sheet just rolled,
// or through a hole the wrap underneath (2), or the hollow inside (3); 0 = nothing there
function rollSample(R,X,r,row,th){
  let x=X-r*(Math.PI/2-th); const circ=TAU*r, st=R.rowStart[row];
  for(let layer=0;layer<5;layer++){
    if(x<st-1) return layer?3:0;
    const col=Math.floor((x-G0)/CELL);
    if(col>=0&&col<N){const i=row*N+col; if(R.bR[i]>0.03){rollSample.i=i;return layer?2:1}}
    x-=circ;
  }
  return 3;
}
function rollColor(R,kind,th){
  const sh=0.74+0.34*Math.cos(th+0.5);
  if(kind===3) return [150*sh,104*sh,52*sh];
  const i=rollSample.i; let k=(Math.min(3,kind===1?R.cR[i]+0.7:Math.max(0.45,R.cR[i]*0.65))*100|0)*3, r=LUT[k], g=LUT[k+1], b=LUT[k+2];
  if(kind===1){const pv=clamp((R.pR[i]-0.1)/0.2,0,1); r+=(252-r)*pv; g+=(226-g)*pv; b+=(140-b)*pv}
  const m=kind===1?sh:Math.min(1,sh*0.97); return [r*m,g*m,b*m];
}
function drawRollTop(c){
  const R=S.roll, X=R.X, r=R.r, cx=X-r, rows=[];
  for(let y=0;y<N;y++) if(R.rowStart[y]>=0&&R.rowStart[y]<X-1) rows.push(y);
  if(!rows.length) return;
  c.fillStyle='rgba(40,20,5,.26)'; for(const y of rows) c.fillRect(cx-r+5,G0+y*CELL+7,2*r,CELL+0.7);
  const nT=22;
  for(const y of rows){ const yy=G0+y*CELL;
    for(let j=0;j<nT;j++){const th=-Math.PI/2+(j+0.5)/nT*Math.PI, kind=rollSample(R,X,r,y,th); if(!kind) continue;
      const col=rollColor(R,kind,th), sx=cx+r*Math.sin(th), w=r*Math.PI/nT*Math.cos(th)+1.3;
      c.fillStyle=`rgb(${col[0]|0},${col[1]|0},${col[2]|0})`; c.fillRect(sx-w/2,yy,w,CELL+0.7);}}
  const fcol=R.dom?R.dom.color:null;
  for(const [y,dir] of [[rows[0],-1],[rows[rows.length-1],1]]){
    const yy=G0+y*CELL+(dir>0?CELL:0);
    c.fillStyle='rgba(55,30,10,.85)'; c.beginPath(); c.ellipse(cx,yy,r*0.9,r*0.28,0,0,TAU); c.fill();
    if(fcol){c.fillStyle=fcol; c.beginPath(); c.ellipse(cx,yy+dir*r*0.05,r*0.42,r*0.13,0,0,TAU); c.fill()}
    c.strokeStyle='rgb(250,226,150)'; c.lineWidth=3.6; c.beginPath(); c.ellipse(cx,yy,r*0.92,r*0.29,0,0,TAU); c.stroke();
  }
}
function rollGestureStart(p){const R=S.roll;if(!R||R.done||R.anim)return;R.g0={x:p.x,y:p.y,t:performance.now()};R.gc={x:p.x,y:p.y}}
function rollGestureMove(p){const R=S.roll;if(R&&R.g0)R.gc={x:p.x,y:p.y}}
function rollGestureEnd(){
  const R=S.roll; if(!R||!R.g0) return; const g0=R.g0, g1=R.gc; R.g0=null;
  const dx=g1.x-g0.x, dy=g1.y-g0.y, L=Math.hypot(dx,dy), dt=Math.max(0.03,(performance.now()-g0.t)/1000), sp=L/dt;
  if(R.phase==='aim'){
    if(L<50){toast('ปัดนิ้วยาวขึ้นอีกนิด จากขอบแผ่นเข้าหาไส้');return}
    orientRoll(Math.atan2(dy,dx));
    const m=fillMass(); R.r=clamp(20+((m.sausage||0)>0?9:0)+Math.min(7,(m.pork||0)/40+(m.hen||0)*1.5+(m.custard||0)/30),20,36);
    const to=Math.min(R.xmaxL,R.xminL+Math.PI*R.r);
    R.foldCover=R.fillLeft==null||to+R.r>=R.fillLeft;
    R.phase='roll'; R.anim={t:0,dur:0.5,p:0,from:R.xminL,to,first:true}; blip(300,0.1,0.1,'triangle'); renderPanel(); return;
  }
  if(R.phase!=='roll'||L<40||R.anim) return;
  const ca=Math.cos(R.alpha), sa=Math.sin(R.alpha), along=dx*ca+dy*sa, side=-dx*sa+dy*ca;
  if(along<=0||Math.abs(side)>along*1.4){R.slips++;toast('ปัดไปทางเดียวกับลูกศรนะ');blip(170,0.12,0.1);return}
  const dev=Math.atan2(Math.abs(side),along);
  let to=R.X+TAU*R.r; if(R.xmaxL-to<Math.PI*R.r) to=R.xmaxL; const adv=to-R.X;
  const lz=clamp((sp-1800)/1800,0,1)*0.6+clamp(dev/0.8,0,1)*0.6;
  R.lw+=lz*adv; R.ld+=adv; R.loose=R.lw/Math.max(1,R.ld); R.flips++;
  R.anim={t:0,dur:0.45,p:0,from:R.X,to}; blip(360+R.flips*45,0.1,0.11,'triangle');
  if(dev>0.45) toast('ปัดเบี้ยวไปนิด ม้วนหลวมลง'); else if(sp>2600) toast('ปัดแรงไป ม้วนหลวมลง');
}
function rollAnim(dt){
  const R=S.roll; if(!R||!R.anim) return; const A=R.anim; A.t+=dt;
  const p=clamp(A.t/A.dur,0,1), e=p<0.5?2*p*p:1-Math.pow(-2*p+2,2)/2; A.p=e;
  R.X=A.from+(A.to-A.from)*e;
  if(p<1) return;
  R.X=A.to; R.anim=null;
  if(R.X>=R.xmaxL-2){finishRoll();return}
  if(A.first){renderPanel();toast(R.foldCover?'ขอบม้วนคลุมไส้แล้ว! ปัดตามลูกศรเพื่อม้วนต่อ':'ขอบยังไม่คลุมไส้ แต่ม้วนต่อได้')}
}
function finishRoll(){
  const R=S.roll; R.done=true; R.X=R.xmaxL;
  let tm=0,tt=0,ck=0; for(let y=0;y<N;y++){const t=R.rowT[y]; if(t<=0) continue; tt+=t; ck+=R.rowTC[y]; if(R.rowTC[y]/t<0.45) tm+=t}
  R.tearFrac=tt?tm/tt:0; R.avgCook=tt?ck/tt:1;
  S.stats=computeStats();
  renderPanel(); chime();
  toast(R.tearFrac>0.3?'แป้งยังไม่สุกดี ม้วนแล้วขาดนิดหน่อย…':'ม้วนเสร็จแล้ว! กด "เสิร์ฟ" ได้เลย');
}
function drawArrow(c,x0,y0,x1,y1,col,w){
  const a=Math.atan2(y1-y0,x1-x0), hl=w*3.2;
  c.save(); c.lineCap='round'; c.lineJoin='round';
  for(const [lw,cl] of [[w+5,'rgba(30,15,5,.5)'],[w,col]]){
    c.strokeStyle=cl; c.lineWidth=lw; c.beginPath(); c.moveTo(x0,y0); c.lineTo(x1-Math.cos(a)*hl*0.6,y1-Math.sin(a)*hl*0.6); c.stroke();
    c.fillStyle=cl; c.beginPath(); c.moveTo(x1+Math.cos(a)*(lw-w)*0.6,y1+Math.sin(a)*(lw-w)*0.6);
    c.lineTo(x1-Math.cos(a)*hl+Math.cos(a+Math.PI/2)*hl*0.6,y1-Math.sin(a)*hl+Math.sin(a+Math.PI/2)*hl*0.6);
    c.lineTo(x1-Math.cos(a)*hl-Math.cos(a+Math.PI/2)*hl*0.6,y1-Math.sin(a)*hl-Math.sin(a+Math.PI/2)*hl*0.6); c.closePath(); c.fill();
  }
  c.restore();
}
function drawShells(c){
  for(const k of S.cracks){const a=1-k.t/0.6,s=k.t*90;c.globalAlpha=Math.max(0,a);c.fillStyle='#F3E6D0';c.strokeStyle='#C9A77A';c.lineWidth=2;
    for(const dir of [-1,1]){c.beginPath();c.ellipse(k.x+dir*(18+s),k.y-30-s*0.6,15,20,dir*0.6,dir>0?-Math.PI/2:Math.PI/2,dir>0?Math.PI/2:Math.PI*1.5);c.closePath();c.fill();c.stroke()}}
  c.globalAlpha=1;
}
function fillMass(){
  const m={};
  for(const a of S.actions){
    let v=0;
    if(a.kind==='cream'){const p=a.items[0].pts;let L=4;for(let k=2;k<p.length;k+=2)L+=Math.hypot(p[k]-p[k-2],p[k+1]-p[k-1]);v=L/10}
    else if(a.kind==='hen') v=a.cracks;
    else v=a.items.length;
    m[a.type]=(m[a.type]||0)+v;
  }
  return m;
}
const MW={hen:60,custard:20,pandan:20,taro:20,choco:14,chili:4,foithong:1.2,floss:1,pork:2.4,sausage:120,egg:25};
function dominantFill(){
  const m=fillMass(); let best=null,bv=0; for(const k in m){const v=m[k]*MW[k];if(v>bv){bv=v;best=k}}
  return best?FD[best]:null;
}

