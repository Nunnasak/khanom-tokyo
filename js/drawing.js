// Table, griddle, tools and filling layer drawing.
'use strict';
/* ---------------- background ---------------- */
function drawTable(c){
  const r=rng(7);
  c.fillStyle='#b98152'; c.fillRect(0,0,1000,1000);
  for(let p=0;p<5;p++){
    c.fillStyle=p%2?'rgba(255,225,180,.07)':'rgba(80,40,10,.07)'; c.fillRect(p*200,0,200,1000);
    for(let k=0;k<22;k++){
      c.strokeStyle=`rgba(95,52,22,${0.05+r()*0.09})`; c.lineWidth=0.8+r()*2.2;
      const x0=p*200+r()*200, amp=2+r()*7, ph=r()*6, fr=0.004+r()*0.01;
      c.beginPath(); c.moveTo(x0,0); for(let y=0;y<=1000;y+=25) c.lineTo(x0+Math.sin(y*fr+ph)*amp,y); c.stroke();
    }
    if(r()<.9){const kx=p*200+30+r()*140,ky=r()*1000;c.strokeStyle='rgba(90,48,20,.18)';c.lineWidth=2;c.beginPath();c.ellipse(kx,ky,6+r()*6,14+r()*12,0,0,TAU);c.stroke()}
    c.fillStyle='rgba(60,30,10,.4)'; c.fillRect(p*200-1.5,0,3,1000);
  }
  const v=c.createRadialGradient(500,500,300,500,500,760); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(40,20,5,.35)');
  c.fillStyle=v; c.fillRect(0,0,1000,1000);
}
function drawGriddle(c){
  c.save(); c.shadowColor='rgba(20,10,0,.5)'; c.shadowBlur=40; c.shadowOffsetY=18;
  c.fillStyle='#202022'; circle(c,GC,GC,478); c.fill(); c.restore();
  let g=c.createLinearGradient(100,100,900,900); g.addColorStop(0,'#77787d'); g.addColorStop(.5,'#36373b'); g.addColorStop(1,'#151517');
  c.fillStyle=g; circle(c,GC,GC,478); c.fill();
  g=c.createRadialGradient(440,420,10,GC,GC,460); g.addColorStop(0,'#4a4b50'); g.addColorStop(.65,'#2f3034'); g.addColorStop(1,'#222326');
  c.fillStyle=g; circle(c,GC,GC,450); c.fill();
  c.lineWidth=5; c.strokeStyle='rgba(0,0,0,.55)'; circle(c,GC,GC,449); c.stroke();
  c.lineWidth=2; c.strokeStyle='rgba(255,255,255,.1)'; circle(c,GC,GC,455); c.stroke();
  const r=rng(11);
  for(let i=0;i<70;i++){const a=r()*TAU;c.strokeStyle=`rgba(255,255,255,${0.012+r()*0.03})`;c.lineWidth=1+r()*3;c.beginPath();c.arc(GC,GC,30+r()*400,a,a+0.3+r()*1.4);c.stroke()}
  for(let i=0;i<26;i++){const x=GC+(r()-0.5)*640,y=GC+(r()-0.5)*640;if(Math.hypot(x-GC,y-GC)>400)continue;const rr2=20+r()*70;const gg=c.createRadialGradient(x,y,0,x,y,rr2);gg.addColorStop(0,'rgba(110,70,35,.10)');gg.addColorStop(1,'rgba(110,70,35,0)');c.fillStyle=gg;circle(c,x,y,rr2);c.fill()}
}
function resize(){
  const st=$('#stage'), w=st.clientWidth, h=st.clientHeight;
  const size=Math.max(200,Math.floor(Math.min(w,h)));
  cv.style.width=cv.style.height=size+'px';
  const vb=$('#v3d'); vb.style.width=vb.style.height=size+'px'; vb.style.left=((w-size)/2)+'px'; vb.style.top=((h-size)/2)+'px';
  if(V3) V3.resize(size);
  const dpr=Math.min(2.5,window.devicePixelRatio||1);
  cv.width=cv.height=Math.round(size*dpr); SC=cv.width/1000;
  bgC=mk(cv.width,cv.height); let c=bgC.getContext('2d'); c.setTransform(SC,0,0,SC,0,0); drawTable(c); drawGriddle(c);
  serveBg=mk(cv.width,cv.height); c=serveBg.getContext('2d'); c.setTransform(SC,0,0,SC,0,0); drawTable(c); drawPlate(c);
}

/* ---------------- tools drawing ---------------- */
function line(c,x0,y0,x1,y1){c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke()}
function drawButterTool(c,x,y){
  c.save(); c.translate(x,y); c.rotate(-0.25);
  c.fillStyle='rgba(0,0,0,.25)'; rr(c,-38,-22,84,56,12); c.fill();
  let g=c.createLinearGradient(0,-26,0,26); g.addColorStop(0,'#fff6c9'); g.addColorStop(1,'#f3d77a');
  c.fillStyle=g; rr(c,-42,-28,84,56,12); c.fill();
  c.fillStyle='rgba(255,255,255,.6)'; rr(c,-34,-22,40,10,5); c.fill();
  c.fillStyle='#f4efe6'; rr(c,-46,2,92,30,8); c.fill();
  c.fillStyle='#3d7fc1'; c.fillRect(-46,10,92,3); c.fillRect(-46,17,92,1.5);
  c.fillStyle='#c0392b'; c.font='600 12px Mitr,sans-serif'; c.textAlign='center'; c.fillText('เนยสด',0,29);
  c.restore();
}
function drawBottle(c,x,y){
  c.save(); c.translate(x,y); c.rotate(0.38);
  c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.moveTo(6,4); c.lineTo(-4,-26); c.lineTo(18,-26); c.closePath(); c.fill(); rr(c,-18,-150,56,124,16); c.fill();
  c.fillStyle='#f3f1ec'; c.beginPath(); c.moveTo(0,0); c.lineTo(-9,-30); c.lineTo(9,-30); c.closePath(); c.fill();
  c.fillStyle='#e0412b'; rr(c,-16,-44,32,16,5); c.fill();
  const g=c.createLinearGradient(-26,0,26,0); g.addColorStop(0,'rgba(255,255,255,.55)'); g.addColorStop(.35,'rgba(255,255,255,.9)'); g.addColorStop(1,'rgba(220,220,220,.6)');
  c.fillStyle=g; rr(c,-26,-160,52,118,16); c.fill();
  c.fillStyle='#F8DE8A'; rr(c,-22,-120,44,74,12); c.fill();
  c.fillStyle='rgba(255,255,255,.5)'; rr(c,-18,-150,8,96,4); c.fill();
  c.fillStyle='#c0392b'; c.font='600 13px Mitr,sans-serif'; c.textAlign='center'; c.fillText('แป้ง',2,-80);
  c.restore();
}
function drawLadleTop(c,x,y,alpha){
  c.save(); c.globalAlpha=alpha; c.lineCap='round';
  c.strokeStyle='rgba(0,0,0,.22)'; c.lineWidth=16; line(c,x+58,y+62,x+268,y+262);
  c.strokeStyle='#9aa1aa'; c.lineWidth=14; line(c,x+46,y+46,x+260,y+250);
  c.strokeStyle='rgba(255,255,255,.55)'; c.lineWidth=3; line(c,x+44,y+42,x+256,y+244);
  c.fillStyle='rgba(0,0,0,.22)'; circle(c,x+8,y+12,62); c.fill();
  const g=c.createRadialGradient(x-22,y-26,4,x,y,64); g.addColorStop(0,'#ffffff'); g.addColorStop(.35,'#dadee3'); g.addColorStop(.8,'#8d949d'); g.addColorStop(1,'#5d636b');
  c.fillStyle=g; circle(c,x,y,60); c.fill(); c.strokeStyle='rgba(60,64,70,.8)'; c.lineWidth=2; c.stroke();
  c.restore();
}
function drawPourTool(c,x,y,pouring,time){
  const bx=x-70, by=y-120;
  c.save(); c.lineCap='round';
  if(pouring){
    c.strokeStyle='#F8E7B6'; c.lineWidth=10;
    c.beginPath(); c.moveTo(bx+46,by+22); c.quadraticCurveTo(bx+60+Math.sin(time*18)*3,by+70,x,y); c.stroke();
    c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=3;
    c.beginPath(); c.moveTo(bx+44,by+22); c.quadraticCurveTo(bx+57+Math.sin(time*18)*3,by+70,x-2,y); c.stroke();
  }
  c.strokeStyle='rgba(0,0,0,.2)'; c.lineWidth=14; line(c,bx-40,by-20+8,bx-230,by-190+8);
  c.strokeStyle='#9aa1aa'; c.lineWidth=12; line(c,bx-40,by-24,bx-230,by-196);
  c.strokeStyle='rgba(255,255,255,.5)'; c.lineWidth=3; line(c,bx-42,by-28,bx-228,by-198);
  c.translate(bx,by); c.rotate(pouring?0.5:0.15);
  const g=c.createRadialGradient(-20,-20,4,0,0,62); g.addColorStop(0,'#fff'); g.addColorStop(.4,'#d4d8de'); g.addColorStop(1,'#646a72');
  c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(10,14,60,48,0,0,TAU); c.fill();
  c.fillStyle=g; c.beginPath(); c.ellipse(0,0,60,48,0,0,TAU); c.fill();
  c.fillStyle='#F8E7B6'; c.beginPath(); c.ellipse(pouring?10:0,0,pouring?36:46,pouring?28:36,0,0,TAU); c.fill();
  c.fillStyle='rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(-10,-10,14,8,-0.5,0,TAU); c.fill();
  c.restore();
}
function drawTarget(c,x,y,label){
  const X0=x, Y0=y;
  const b=(Math.sin(clock*6)+1)*6, ux=0.7071, uy=-0.7071, Z=1.5;
  c.save(); c.translate(x,y); c.scale(Z,Z); x=0; y=0;
  const tx=x+ux*(30+b), ty=y+uy*(30+b);
  c.lineWidth=3; c.setLineDash([8,7]); c.strokeStyle='rgba(30,15,5,.45)'; circle(c,x+1.5,y+2,24); c.stroke();
  c.strokeStyle='rgba(255,246,222,.95)'; circle(c,x,y,24); c.stroke(); c.setLineDash([]);
  c.fillStyle='rgba(255,246,222,.95)'; circle(c,x,y,4); c.fill();
  c.lineCap='round';
  const ex=tx+ux*78, ey=ty+uy*78;
  c.strokeStyle='rgba(30,15,5,.55)'; c.lineWidth=14; line(c,tx+ux*14,ty+uy*14,ex,ey);
  c.strokeStyle='#ff8a3d'; c.lineWidth=8; line(c,tx+ux*14,ty+uy*14,ex,ey);
  const hx=-uy, hy=ux;
  c.beginPath(); c.moveTo(tx,ty); c.lineTo(tx+ux*26+hx*16,ty+uy*26+hy*16); c.lineTo(tx+ux*26-hx*16,ty+uy*26-hy*16); c.closePath();
  c.lineWidth=4; c.lineJoin='round'; c.strokeStyle='rgba(30,15,5,.55)'; c.stroke(); c.fillStyle='#ff8a3d'; c.fill();
  c.restore();
  if(label){ const lx=X0+(ex+10)*Z, ly=Y0+(ey-22)*Z; hintText(c,label,clamp(lx,170,830),clamp(ly,40,960),30); }
}
function drawBag(c,x,y,f){
  c.save(); c.translate(x,y); c.rotate(0.55);
  c.fillStyle='rgba(0,0,0,.18)'; c.beginPath(); c.moveTo(8,6); c.lineTo(-26,-124); c.lineTo(44,-124); c.closePath(); c.fill();
  c.fillStyle=f.color; c.globalAlpha=.9; c.beginPath(); c.moveTo(0,-6); c.lineTo(-30,-130); c.lineTo(30,-130); c.closePath(); c.fill();
  c.globalAlpha=1; c.fillStyle='rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(-2,-14); c.lineTo(-24,-128); c.lineTo(-10,-128); c.closePath(); c.fill();
  c.strokeStyle='rgba(255,255,255,.7)'; c.lineWidth=2; c.beginPath(); c.moveTo(0,-6); c.lineTo(-30,-130); c.lineTo(30,-130); c.closePath(); c.stroke();
  c.fillStyle='#b8bec6'; c.beginPath(); c.moveTo(-5,-2); c.lineTo(5,-2); c.lineTo(9,-20); c.lineTo(-9,-20); c.closePath(); c.fill();
  c.restore();
}
function drawSpatula(c,x,y0,y1,dir){
  const ym=(y0+y1)/2; dir=dir||1;
  c.save(); c.lineCap='round';
  c.fillStyle='rgba(0,0,0,.25)'; rr(c,x-4+8,y0+10,16,y1-y0,4); c.fill();
  c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=24; line(c,x+dir*20+6,ym+10,x+dir*150+6,ym+110);
  const g=c.createLinearGradient(x-8,0,x+10,0); g.addColorStop(0,'#6f757d'); g.addColorStop(.45,'#eef0f2'); g.addColorStop(1,'#949aa2');
  c.fillStyle=g; rr(c,x-6,y0,16,y1-y0,4); c.fill(); c.strokeStyle='rgba(60,64,70,.6)'; c.lineWidth=1.5; c.stroke();
  c.strokeStyle='#8b5a2b'; c.lineWidth=22; line(c,x+dir*12,ym,x+dir*140,ym+96);
  c.strokeStyle='rgba(255,220,170,.35)'; c.lineWidth=6; line(c,x+dir*12,ym-6,x+dir*136,ym+88);
  c.fillStyle='#c9ced4'; circle(c,x+dir*22,ym+8,4); c.fill();
  c.restore();
}

/* ---------------- rolling ---------------- */
function drawEggs(c){for(const a of S.actions) if(a.type==='egg') for(const p of a.items) drawPiece(c,p); if(S.cur&&S.cur.type==='egg') for(const p of S.cur.items) drawPiece(c,p);}
function redrawFillLayer(){
  flctx.setTransform(1,0,0,1,0,0); flctx.clearRect(0,0,fillLayer.width,fillLayer.height); flctx.setTransform(FLS,0,0,FLS,0,0);
  for(const a of S.actions){
    if(a.kind==='cream') drawCream(flctx,a.type,a.items[0].pts);
    else if(scatterKind(a.kind)) for(const f of a.items) drawScatter(flctx,f);
    else if(a.type!=='egg') for(const p of a.items) drawPiece(flctx,p);
  }
}
