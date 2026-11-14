// Main loop, griddle scene drawing, hints and pointer input.
'use strict';
/* ---------------- frame ---------------- */
const steam=[];
function updSteam(dt){
  const H=HEATS[S.heat];
  if(S.step>=POUR&&S.step<=FILL&&S.hasBatter&&H>0){
    S.steamAcc+=dt*Math.min(24,S.rawMass*0.01*H+2*H);
    while(S.steamAcc>1&&steam.length<90){S.steamAcc--;for(let tr=0;tr<8;tr++){const i=(Math.random()*NN)|0;if(batter[i]>0.05){
      steam.push({x:G0+(i%N)*CELL,y:G0+((i/N)|0)*CELL,vx:(Math.random()-0.5)*16,vy:-30-Math.random()*40,life:0,max:1.5+Math.random()*1.3,s:26+Math.random()*30});break}}}
  }
  for(let i=steam.length-1;i>=0;i--){const p=steam[i];p.life+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.s+=dt*30;if(p.life>p.max)steam.splice(i,1)}
}
let lastT=performance.now(), clock=0;
function frame(now){
  const dt=Math.min(0.05,(now-lastT)/1000); lastT=now; clock+=dt;
  update(dt); draw();
  requestAnimationFrame(frame);
}
function update(dt){
  const st=S.step, H=HEATS[S.heat];
  if(st>=LACE&&st<=FILL){
    if(S.hasPat) patUpdate(dt,H);
    if(S.pouring&&st===POUR&&P.down) pour(dt);
    if(S.hasBatter){ const it=st===POUR?3:1; for(let k=0;k<it;k++) flow(); cookUpdate(dt,H); renderBatter(); }
    if(S.hasHen){ eggFlow(); eggCook(dt,H); S.egDirty=true; }
    for(const a of S.actions) if(a.type==='egg') for(const p of a.items) p.cook+=dt*H*0.07;
    if(S.cur&&S.cur.type==='egg') for(const p of S.cur.items) p.cook+=dt*H*0.07;
  }
  if(S.buDirty) renderButter();
  if(S.paDirty) renderPattern();
  if(S.egDirty) renderEgg();
  for(let i=S.cracks.length-1;i>=0;i--){S.cracks[i].t+=dt;if(S.cracks[i].t>0.6)S.cracks.splice(i,1)}
  updSteam(dt);
  let sz=0;
  if(st===BUT&&S.rubbing) sz=0.05*H;
  else if(st===LACE&&P.down) sz=0.08*H;
  else if(st>=POUR&&st<=FILL&&S.hasBatter) sz=Math.min(0.32,0.04+S.rawMass/3200*0.28)*Math.min(1.3,H);
  setSizzle(S.muted?0:sz);
  if(st===ROLL) rollAnim(dt);
  if(st===SERVE){S.serveT+=dt;if(S.serveT>1.9&&!S.resultShown)showResult()}
  S.meterT-=dt; if(S.meterT<=0){S.meterT=0.1;updateMeters()}
}
function draw(){
  const c=ctx;
  c.setTransform(1,0,0,1,0,0);
  if(S.step===SERVE){c.drawImage(serveBg,0,0);c.setTransform(SC,0,0,SC,0,0);drawServeContent(c,S.serveT);return}
  c.drawImage(bgC,0,0); c.setTransform(SC,0,0,SC,0,0);
  const H=HEATS[S.heat];
  if(H>0&&S.step<ROLL){
    const fl=0.85+0.15*Math.sin(clock*7)*Math.sin(clock*3.1);
    const g=c.createRadialGradient(GC,GC,470,GC,GC,530); g.addColorStop(0,`rgba(255,120,30,${0.32*H*fl})`); g.addColorStop(1,'rgba(255,90,20,0)');
    c.fillStyle=g; c.beginPath(); c.arc(GC,GC,530,0,TAU); c.arc(GC,GC,476,0,TAU,true); c.fill('evenodd');
  }
  c.imageSmoothingEnabled=true; c.imageSmoothingQuality='high';
  c.globalCompositeOperation='screen'; c.drawImage(buC,G0,G0,N*CELL,N*CELL); c.globalCompositeOperation='source-over';
  if(S.step===ROLL&&S.roll){
    const R=S.roll;
    c.drawImage(R.spill,0,0,1000,1000);
    if(R.alpha==null) c.drawImage(R.flat,0,0,1000,1000);
    else{
      c.save(); c.translate(GC,GC); c.rotate(R.alpha); c.translate(-GC,-GC);
      c.save(); c.beginPath(); c.rect(R.X,-1000,3000,3000); c.clip(); worldDraw(c,R.flat,0,0,1000,1000); c.restore();
      if(R.X>R.xminL+1) drawRollTop(c);
      c.restore();
    }
  }else{
    if(S.hasPat) c.drawImage(paC,G0,G0,N*CELL,N*CELL);
    if(S.hasBatter) c.drawImage(baC,G0,G0,N*CELL,N*CELL);
    if(S.hasPat&&S.hasBatter){c.globalAlpha=.3;c.drawImage(paC,G0,G0,N*CELL,N*CELL);c.globalAlpha=1}
    if(S.hasHen) c.drawImage(egC,G0,G0,N*CELL,N*CELL);
    c.drawImage(fillLayer,0,0,1000,1000);
    drawEggs(c);
    drawShells(c);
    if(S.cur&&S.cur.kind==='cream') drawCream(c,S.cur.type,S.cur.items[0].pts);
  }
  for(const p of steam){c.globalAlpha=0.17*Math.sin(Math.PI*p.life/p.max);c.drawImage(steamSprite,p.x-p.s/2,p.y-p.s/2,p.s,p.s)} c.globalAlpha=1;
  drawHints(c); drawTool(c);
}
function hintText(c,txt,x,y,size){
  c.font=`500 ${size||30}px Mitr,sans-serif`; c.textAlign='center'; c.textBaseline='middle';
  c.lineWidth=6; c.lineJoin='round'; c.strokeStyle='rgba(30,15,5,.6)'; c.strokeText(txt,x,y); c.fillStyle='#fff8ea'; c.fillText(txt,x,y);
}
function drawHints(c){
  const pulse=0.5+0.5*Math.sin(clock*4);
  if(S.step===BUT&&butterCov()<0.04&&!P.down) hintText(c,'ถูเนยให้ทั่วกระทะ',GC,GC);
  if(S.step===LACE&&!S.hasPat&&!P.down) hintText(c,'ลากเพื่อบีบเส้นแป้งเป็นลาย',GC,GC);
  if(S.step===POUR&&!(P.inside||P.down)) drawTarget(c,GC,GC,S.poured<300?'แตะค้างเพื่อเทแป้ง':null);
  if(S.step===SPREAD&&!S.spreadStarted) hintText(c,'ลากกระบวยดันแป้งให้บาง ทรงไหนก็ได้',GC,GC+250);
  if(S.step===ROLL&&S.roll&&!S.roll.done){
    const R=S.roll;
    if(R.g0){
      const dx=R.gc.x-R.g0.x, dy=R.gc.y-R.g0.y, L=Math.hypot(dx,dy);
      if(L>8){
        let col='#ff8a3d';
        if(R.phase==='roll'){const ca=Math.cos(R.alpha),sa=Math.sin(R.alpha),along=dx*ca+dy*sa,side=-dx*sa+dy*ca;col=along>0&&Math.atan2(Math.abs(side),along)<0.45?'#7bd36a':'#ff8a3d'}
        drawArrow(c,R.g0.x,R.g0.y,R.gc.x,R.gc.y,col,8);
        if(R.phase==='aim'){const deg=((Math.round(Math.atan2(-dy,dx)*180/Math.PI)%360)+360)%360;hintText(c,`ทิศม้วน ${deg}°`,clamp(R.gc.x,140,860),clamp(R.gc.y-46,40,960),26)}
      }
    } else if(!R.anim){
      if(R.phase==='aim'){
        const a=clock*0.6, cx=GC+Math.cos(a)*250, cy=GC+Math.sin(a)*250;
        drawArrow(c,cx,cy,cx+(GC-cx)*0.4,cy+(GC-cy)*0.4,'rgba(255,248,234,.9)',7);
        hintText(c,'ปัดจากขอบแผ่นเข้าหาไส้ ทิศไหนก็ได้',GC,930,26);
      } else if(R.phase==='roll'){
        const mid=(R.y0L+R.y1L)/2, b=pulse*24;
        const p0=rollToWorld(R.X+30+b,mid), p1=rollToWorld(R.X+170+b,mid);
        drawArrow(c,p0.x,p0.y,p1.x,p1.y,'rgba(255,248,234,.92)',9);
        const left=Math.max(1,Math.ceil((R.xmaxL-R.X-Math.PI*R.r)/(TAU*R.r)));
        hintText(c,`ปัดตามลูกศรเพื่อม้วนต่อ · อีกราว ${left} ครั้ง`,GC,930,26);
      }
    }
  }
}
function butterCov(){let n=0;for(const i of innerIdx) if(butter[i]>0.15) n++;return n/innerIdx.length}
function drawTool(c){
  const st=S.step;
  if(st===ROLL) return;
  if(!(P.inside||P.down)) return;
  if(st===BUT) drawButterTool(c,P.x,P.y);
  else if(st===LACE) drawBottle(c,P.x,P.y);
  else if(st===POUR){
    const pouring=S.pouring&&P.down&&onGriddle(P.x,P.y);
    drawTarget(c,P.x,P.y,S.poured<300?'แป้งลงตรงนี้':null);
    drawPourTool(c,P.x,P.y,pouring,clock);
  }
  else if(st===SPREAD) drawLadleTop(c,P.x,P.y,0.92);
  else if(st===FILL){
    const f=FD[S.tool];
    if(f.kind==='cream') drawBag(c,P.x,P.y,f);
    else if(scatterKind(f.kind)){c.strokeStyle='rgba(255,250,235,.8)';c.lineWidth=2;c.setLineDash([6,6]);circle(c,P.x,P.y,26);c.stroke();c.setLineDash([])}
    else if(f.kind==='hen'){
      if(eggAt(P.x,P.y)>0.15){c.strokeStyle='rgba(255,250,235,.85)';c.lineWidth=2.5;c.setLineDash([6,6]);circle(c,P.x,P.y,32);c.stroke();c.setLineDash([]);if(!P.down)hintText(c,'ลากเพื่อคนไข่',P.x,P.y-52,22)}
      else{c.save();c.fillStyle='rgba(0,0,0,.2)';c.beginPath();c.ellipse(P.x+5,P.y-24,22,28,0.3,0,TAU);c.fill();
        const g=c.createRadialGradient(P.x-8,P.y-40,3,P.x,P.y-30,30);g.addColorStop(0,'#FFF8EE');g.addColorStop(1,'#DDBB90');
        c.fillStyle=g;c.beginPath();c.ellipse(P.x,P.y-30,22,28,0.3,0,TAU);c.fill();c.restore()}
    }
    else if(!P.down){c.globalAlpha=.6;const p=S.ghost&&S.ghost.type===f.id?S.ghost:(S.ghost=makePiece(f.id,0,0));p.x=P.x;p.y=P.y;p.cook=f.id==='egg'?0:1;drawPiece(c,p);c.globalAlpha=1}
  }
}

/* ---------------- input ---------------- */
function toL(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*1000,y:(e.clientY-r.top)/r.height*1000}}
cv.addEventListener('pointerdown',e=>{
  if(S.step<0||S.step>ROLL) return;
  e.preventDefault(); initAudio(); try{cv.setPointerCapture(e.pointerId)}catch(_){}
  const p=toL(e); P.down=true; P.inside=true; P.x=p.x; P.y=p.y;
  switch(S.step){
    case BUT: S.rubbing=true; rubSeg(p.x,p.y,p.x,p.y); break;
    case LACE: laceSeg(p.x,p.y,p.x,p.y); break;
    case POUR: S.pouring=true; break;
    case FILL: fillDown(p); break;
    case ROLL: rollGestureStart(p); break;
  }
});
cv.addEventListener('pointermove',e=>{
  const p=toL(e), lx=P.x, ly=P.y; P.inside=true; P.x=p.x; P.y=p.y;
  if(!P.down) return;
  switch(S.step){
    case BUT: rubSeg(lx,ly,p.x,p.y); break;
    case LACE: laceSeg(lx,ly,p.x,p.y); break;
    case SPREAD: if(S.hasBatter){spreadSeg(lx,ly,p.x,p.y);S.spreadStarted=true} break;
    case FILL: fillMove(p.x,p.y); break;
    case ROLL: rollGestureMove(p); break;
  }
});
function pUp(e){
  if(!P.down) return; P.down=false;
  switch(S.step){
    case BUT: S.rubbing=false; break;
    case LACE: renderPanel(); break;
    case POUR: S.pouring=false; break;
    case SPREAD: dropCarry(P.x,P.y); break;
    case FILL: fillUp(); break;
    case ROLL: rollGestureEnd(); break;
  }
  if(e.pointerType!=='mouse') P.inside=false;
}
cv.addEventListener('pointerup',pUp); cv.addEventListener('pointercancel',pUp);
cv.addEventListener('pointerleave',()=>{if(!P.down)P.inside=false});

function fillDown(p){
  if(!onGriddle(p.x,p.y)) return;
  const f=FD[S.tool]; S.curLast={x:p.x,y:p.y};
  if(f.kind==='hen'){
    S.cur={type:'hen',kind:'hen',items:[],cracks:0,snapW:eggW.slice(),snapY:eggY.slice(),snapC:eggCk.slice()};
    if(eggAt(p.x,p.y)<0.15){crackEgg(p.x,p.y);S.cur.cracks++;S.cur.items.push(1)}
    return;
  }
  S.cur={type:f.id,kind:f.kind,items:[]};
  if(f.kind==='cream') S.cur.items.push({pts:[p.x,p.y]});
  else if(scatterKind(f.kind)) spawnScatter(p.x,p.y,5);
  else placePiece(p.x,p.y);
}
function fillMove(x,y){
  const c=S.cur; if(!c||!onGriddle(x,y)) return;
  const f=FD[c.type], d=Math.hypot(x-S.curLast.x,y-S.curLast.y);
  if(f.kind==='hen'){stirSeg(S.curLast.x,S.curLast.y,x,y);S.curLast={x,y};c.items.push(0);return}
  if(f.kind==='cream'){if(d>=3){c.items[0].pts.push(x,y);S.curLast={x,y}}}
  else if(scatterKind(f.kind)){if(d>=5){spawnScatter(x,y,Math.ceil(d/6)+1);S.curLast={x,y}}}
  else if(d>=f.gap){placePiece(x,y);S.curLast={x,y}}
}
function fillUp(){
  const c=S.cur; if(!c) return; S.cur=null;
  if(c.kind==='hen') dropEggCarry(S.curLast.x,S.curLast.y);
  if(c.kind==='cream'){drawCream(flctx,c.type,c.items[0].pts);blip(220,0.12,0.06)}
  if(c.items.length) S.actions.push(c);
}
function spawnScatter(x,y,n){for(let i=0;i<n;i++){const f=makeScatter(S.cur.type,x,y,S.cur.type==='pork'?28:26);S.cur.items.push(f);drawScatter(flctx,f)}}
function placePiece(x,y){
  const p=makePiece(S.cur.type,x,y); S.cur.items.push(p);
  if(p.type!=='egg') drawPiece(flctx,p);
  blip(p.type==='egg'?300:480+Math.random()*240,0.09,0.1);
}

