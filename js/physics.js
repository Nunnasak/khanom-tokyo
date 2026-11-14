// Batter, butter, lace and egg simulation on the griddle grid, and their rendering.
'use strict';
/* ---------------- batter physics ---------------- */
function addBatter(i,m){const t=batter[i];cook[i]=t>0?cook[i]*t/(t+m):0;batter[i]=t+m}
function toCell(x,y){return{x:(x-G0)/CELL,y:(y-G0)/CELL}}
function onGriddle(x,y){return Math.hypot(x-GC,y-GC)<GR-12}
function pour(dt){
  if(!onGriddle(P.x,P.y)) return;
  if(S.poured>=8600){ if(!S.toldFull){toast('แป้งหมดกระบวยแล้ว');S.toldFull=true} return; }
  const c=toCell(P.x,P.y), amt=2300*dt, sg=3.2, R=8; let ws=0;
  const xa=Math.max(1,Math.floor(c.x-R)),xb=Math.min(N-2,Math.ceil(c.x+R)),ya=Math.max(1,Math.floor(c.y-R)),yb=Math.min(N-2,Math.ceil(c.y+R));
  for(let pass=0;pass<2;pass++){
    for(let y=ya;y<=yb;y++)for(let x=xa;x<=xb;x++){const i=y*N+x;if(!inG[i])continue;const dx=x+0.5-c.x,dy=y+0.5-c.y,w=Math.exp(-(dx*dx+dy*dy)/(2*sg*sg));
      if(pass===0)ws+=w;else addBatter(i,amt*w/ws)}
    if(ws<=0) return;
  }
  S.poured+=amt; S.hasBatter=true;
}
const NB=[1,-1,N,-N,N+1,N-1,-N+1,-N-1], NBW=[1,1,1,1,0.7071,0.7071,0.7071,0.7071];
function flow(){
  tmp.fill(0);
  for(let y=1;y<N-1;y++){for(let x=1;x<N-1;x++){
    const i=y*N+x,t=batter[i]; if(t<0.5) continue; const ck=cook[i]; if(ck>0.45) continue;
    const mob=0.075*(1-ck/0.45);
    for(let k=0;k<8;k++){
      const j=i+NB[k]; if(!inG[j]) continue;
      const d=(t-batter[j])*NBW[k]-0.012; if(d>0){const m=d*mob*NBW[k];tmp[i]-=m;tmp[j]+=m}
    }
  }}
  for(let i=0;i<NN;i++){const m=tmp[i];if(m>0)addBatter(i,m);else if(m<0)batter[i]+=m}
}
const LR=15, FILM=0.2, dIdx=new Int32Array(600), dW=new Float32Array(600);
function spreadAt(px,py,ux,uy){
  const r2=LR*LR, ro=(LR+3)*(LR+3);
  const xa=Math.max(1,Math.floor(px-LR-4)),xb=Math.min(N-2,Math.ceil(px+LR+4)),ya=Math.max(1,Math.floor(py-LR-4)),yb=Math.min(N-2,Math.ceil(py+LR+4));
  let cnt=0,ws=0;
  for(let y=ya;y<=yb;y++)for(let x=xa;x<=xb;x++){
    const i=y*N+x; if(!inG[i]) continue;
    const ex=x+0.5-px, ey=y+0.5-py, d2=ex*ex+ey*ey;
    if(d2<=r2){
      const t=batter[i];
      if(t>FILM){const mob=1-Math.min(1,cook[i]);if(mob>0){const take=(t-FILM)*0.5*mob;batter[i]=t-take;S.carry+=take}}
    }else if(d2<=ro&&cnt<600){
      const d=Math.sqrt(d2), dot=(ex*ux+ey*uy)/d;
      if(dot>0.25){dIdx[cnt]=i;dW[cnt]=dot-0.25;ws+=dot-0.25;cnt++}
    }
  }
  if(cnt>0&&S.carry>0.001){const amt=S.carry*0.3;for(let k=0;k<cnt;k++)addBatter(dIdx[k],amt*dW[k]/ws);S.carry-=amt}
}
function spreadSeg(x0,y0,x1,y1){
  const a=toCell(x0,y0), b=toCell(x1,y1), dx=b.x-a.x, dy=b.y-a.y, L=Math.hypot(dx,dy);
  if(L<0.05) return;
  const ux=dx/L, uy=dy/L, n=Math.ceil(L);
  for(let k=1;k<=n;k++) spreadAt(a.x+dx*k/n,a.y+dy*k/n,ux,uy);
}
function dropCarry(x,y){
  if(S.carry<0.01){S.carry=0;return}
  const c=toCell(x,y); let cnt=0;
  const xa=Math.max(1,Math.floor(c.x-LR-4)),xb=Math.min(N-2,Math.ceil(c.x+LR+4)),ya=Math.max(1,Math.floor(c.y-LR-4)),yb=Math.min(N-2,Math.ceil(c.y+LR+4));
  for(let pass=0;pass<2;pass++){
    for(let y2=ya;y2<=yb;y2++)for(let x2=xa;x2<=xb;x2++){const i=y2*N+x2;if(!inG[i])continue;const d=Math.hypot(x2+0.5-c.x,y2+0.5-c.y);
      if(d>=LR-1&&d<=LR+3){if(pass===0)cnt++;else addBatter(i,S.carry/cnt)}}
    if(cnt===0) break;
  }
  if(cnt>0) S.carry=0;
}
function rubSeg(x0,y0,x1,y1){
  const a=toCell(x0,y0), b=toCell(x1,y1), L=Math.hypot(b.x-a.x,b.y-a.y), n=Math.max(1,Math.ceil(L/2)), R=14;
  for(let k=0;k<=n;k++){
    const px=a.x+(b.x-a.x)*k/n, py=a.y+(b.y-a.y)*k/n;
    for(let y=Math.max(0,Math.floor(py-R));y<=Math.min(N-1,Math.ceil(py+R));y++)
      for(let x=Math.max(0,Math.floor(px-R));x<=Math.min(N-1,Math.ceil(px+R));x++){
        const i=y*N+x; if(!inG[i]) continue; const d=Math.hypot(x+0.5-px,y+0.5-py); if(d>R) continue;
        butter[i]=Math.min(1.2,butter[i]+0.14*(1-d/R));
      }
  }
  S.buDirty=true;
}
function laceSeg(x0,y0,x1,y1){
  const a=toCell(x0,y0), b=toCell(x1,y1), L=Math.hypot(b.x-a.x,b.y-a.y), n=Math.max(1,Math.ceil(L/0.7)), R=2.1;
  for(let k=0;k<=n;k++){
    const px=a.x+(b.x-a.x)*k/n, py=a.y+(b.y-a.y)*k/n;
    for(let y=Math.max(0,Math.floor(py-R));y<=Math.min(N-1,Math.ceil(py+R));y++)
      for(let x=Math.max(0,Math.floor(px-R));x<=Math.min(N-1,Math.ceil(px+R));x++){
        const i=y*N+x; if(!inG[i]) continue; const d=Math.hypot(x+0.5-px,y+0.5-py); if(d>R) continue;
        const v=0.5*(1-d/R*0.85); if(v>pat[i]){ if(pat[i]<0.02) patCk[i]=0; pat[i]=v; }
      }
  }
  S.hasPat=true; S.paDirty=true;
}
function crackEgg(x,y){
  const c=toCell(x,y), R=28;
  for(let yy=Math.max(1,Math.floor(c.y-R));yy<=Math.min(N-2,Math.ceil(c.y+R));yy++)
    for(let xx=Math.max(1,Math.floor(c.x-R));xx<=Math.min(N-2,Math.ceil(c.x+R));xx++){
      const i=yy*N+xx; if(!inG[i]) continue; const d2=(xx+0.5-c.x)**2+(yy+0.5-c.y)**2;
      const w=1.6*Math.exp(-d2/(2*9*9)), yk=3.0*Math.exp(-d2/(2*4.5*4.5));
      const old=eggW[i]+eggY[i]; if(old<0.02) eggCk[i]=0; else eggCk[i]*=old/(old+w+yk);
      eggW[i]+=w; eggY[i]+=yk;
    }
  S.hasHen=true; S.egDirty=true; S.cracks.push({x,y,t:0}); blip(240,0.08,0.14,'square');
}
function eggAt(x,y){const c=toCell(x,y);if(c.x<0||c.y<0||c.x>=N||c.y>=N)return 0;const i=(c.y|0)*N+(c.x|0);return eggW[i]+eggY[i]}
const mvI=new Int32Array(900), mvJ=new Int32Array(900), mvF=new Float32Array(900);
function stirAt(px,py,ux,uy){
  // the spoon scoops egg from under it and pushes it ahead, like spreading batter
  const R=8, FL=0.05, ro=(R+3)*(R+3); let cnt=0, ws=0;
  for(let y=Math.max(2,Math.floor(py-R-4));y<=Math.min(N-3,Math.ceil(py+R+4));y++)
    for(let x=Math.max(2,Math.floor(px-R-4));x<=Math.min(N-3,Math.ceil(px+R+4));x++){
      const i=y*N+x; if(!inG[i]) continue; const ex=x+0.5-px, ey=y+0.5-py, d2=ex*ex+ey*ey;
      if(d2<=R*R){const t=eggW[i]+eggY[i]; if(t>FL){const mob=clamp(1-eggCk[i]/1.1,0,1); if(mob>0){const f=(t-FL)/t*mob, w=eggW[i]*f*0.45, yk=eggY[i]*f*0.3; eggW[i]-=w; eggY[i]-=yk; S.ecW+=w; S.ecY+=yk}}}
      else if(d2<=ro&&cnt<600){const d=Math.sqrt(d2), dot=(ex*ux+ey*uy)/d; if(dot>0.2){dIdx[cnt]=i;dW[cnt]=dot-0.2;ws+=dot-0.2;cnt++}}
    }
  if(cnt>0&&S.ecW+S.ecY>0.001){const fw=S.ecW*0.32, fy=S.ecY*0.32;
    for(let k=0;k<cnt;k++){const j=dIdx[k],q=dW[k]/ws,w=fw*q,yk=fy*q,old=eggW[j]+eggY[j];eggCk[j]=old>0.01?eggCk[j]*old/(old+w+yk):0;eggW[j]+=w;eggY[j]+=yk}
    S.ecW-=fw; S.ecY-=fy;}
  const ci=Math.round(py)*N+Math.round(px);
  for(const o of [0,1,-1,N,-N]){const i=ci+o;if(i<0||i>=NN)continue;const tot=eggW[i]+eggY[i];if(tot<0.01)continue;const m=(eggY[i]-tot*0.5)*0.02;eggY[i]-=m;eggW[i]+=m}
  S.egDirty=true;
}
function dropEggCarry(x,y){
  if(S.ecW+S.ecY<0.01){S.ecW=S.ecY=0;return}
  const c=toCell(x,y), list=[];
  for(let yy=Math.max(2,Math.floor(c.y-12));yy<=Math.min(N-3,Math.ceil(c.y+12));yy++)for(let xx=Math.max(2,Math.floor(c.x-12));xx<=Math.min(N-3,Math.ceil(c.x+12));xx++){
    const i=yy*N+xx,d=Math.hypot(xx+0.5-c.x,yy+0.5-c.y); if(inG[i]&&d>=7&&d<=11) list.push(i)}
  if(!list.length) return;
  for(const i of list){const w=S.ecW/list.length,yk=S.ecY/list.length,old=eggW[i]+eggY[i];eggCk[i]=old>0.01?eggCk[i]*old/(old+w+yk):0;eggW[i]+=w;eggY[i]+=yk}
  S.ecW=S.ecY=0; S.egDirty=true;
}
function stirSeg(x0,y0,x1,y1){
  const a=toCell(x0,y0), b=toCell(x1,y1), dx=b.x-a.x, dy=b.y-a.y, L=Math.hypot(dx,dy);
  if(L<0.05) return; const ux=dx/L, uy=dy/L, n=Math.ceil(L);
  for(let k=1;k<=n;k++) stirAt(a.x+dx*k/n,a.y+dy*k/n,ux,uy);
}
function eggFlow(){
  tmp.fill(0); eggTmp.fill(0);
  for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){const i=y*N+x,t=eggW[i]+eggY[i];if(t<0.35||eggCk[i]>0.6)continue;
    const mob=0.05*(1-eggCk[i]/0.6), yr=eggY[i]/t, fw=1-yr*0.85, fy=yr*0.15;
    for(let k=0;k<8;k++){const j=i+NB[k];if(!inG[j])continue;const d=(t-eggW[j]-eggY[j])*NBW[k]-0.02;
      if(d>0){const m=d*mob*NBW[k];tmp[i]-=m*fw;tmp[j]+=m*fw;eggTmp[i]-=m*fy;eggTmp[j]+=m*fy}}}
  for(let i=0;i<NN;i++){const a=tmp[i],b=eggTmp[i];if(!a&&!b)continue;const old=eggW[i]+eggY[i],add=Math.max(0,a)+Math.max(0,b);
    if(add>0)eggCk[i]=old>0.01?eggCk[i]*old/(old+add):0;eggW[i]=Math.max(0,eggW[i]+a);eggY[i]=Math.max(0,eggY[i]+b)}
}
function eggCook(dt,H){if(H<=0)return;const k=dt*H*0.05;for(let i=0;i<NN;i++){const t=eggW[i]+eggY[i];if(t>0.02)eggCk[i]+=k*heatMap[i]/(0.25+t*0.5)}}
function renderEgg(){
  const d=egImg.data;
  for(let i=0;i<NN;i++){const o=i<<2,w=eggW[i],y=eggY[i],t=w+y;if(t<0.025){d[o+3]=0;continue}
    const ck=Math.min(1.6,eggCk[i]), yr=Math.pow(y/t,0.6), c1=Math.min(1,ck);
    let r=252,g=250,b=240; if(ck>1.2){const k=(ck-1.2)/0.4;r-=30*k;g-=55*k;b-=90*k}
    r+=(248-r)*yr; g+=(138+50*c1-g)*yr; b+=(8+40*c1-b)*yr;
    const gx=(eggW[i+1]+eggY[i+1])-(eggW[i-1]+eggY[i-1]), gy=(eggW[i+N]+eggY[i+N])-(eggW[i-N]+eggY[i-N]);
    const sp=(1-c1)*clamp((gx+gy)*120,0,60);
    const a=clamp(t/0.06,0,1)*(yr>0.35?1:(0.62+0.36*c1));
    d[o]=r+sp;d[o+1]=g+sp;d[o+2]=b+sp;d[o+3]=a*255}
  egctx.putImageData(egImg,0,0); S.egDirty=false;
}
function cookUpdate(dt,H){
  let raw=0,sT=0,sTC=0;
  const k=dt*H*0.014;
  for(let i=0;i<NN;i++){
    const t=batter[i]; if(t<0.006) continue;
    if(k>0){const bu=Math.min(1,butter[i]);const uneven=1+(spot[i]-0.5)*(0.2+0.8*(1-bu));cook[i]+=k*heatMap[i]*uneven/(0.15+t)}
    if(t>0.03){sT+=t;sTC+=t*cook[i]}
    if(cook[i]<1) raw+=t*(1-cook[i]);
  }
  S.rawMass=raw; S.sumT=sT; S.sumTC=sTC;
}
function patUpdate(dt,H){ if(H<=0) return; const k=dt*H*0.035; for(let i=0;i<NN;i++) if(pat[i]>0.02) patCk[i]+=k*heatMap[i]; S.paDirty=true; }
function renderBatter(){
  const d=baImg.data;
  for(let i=0;i<NN;i++){
    const o=i<<2, t=batter[i];
    if(t<0.004){d[o+3]=0;continue}
    const n=lace[i]; let a=(t*(0.4+1.2*n)-0.03)/0.06; a=a<0?0:a>1?1:a*a*(3-2*a);
    if(a<=0.002){d[o+3]=0;continue}
    const ck=cook[i]; let c=ck*(0.9+0.2*spot[i]);
    if(t<0.1) c+=(0.1-t)*3*Math.min(1,ck);
    const k=(c>=3?300:(c*100)|0)*3;
    const gx=batter[i+1]-batter[i-1], gy=batter[i+N]-batter[i-N];
    let g=(gx+gy)*0.7; g=g<-0.28?-0.28:g>0.28?0.28:g; let sh=1+g;
    if(pore[i]>0.974&&ck>0.32&&t<1) sh*=0.85;
    const wet=ck<0.55?1-ck/0.55:0;
    let sp=wet*((gx+gy)*260); sp=(sp<0?0:sp>70?70:sp)+wet*8;
    d[o]=LUT[k]*sh+sp; d[o+1]=LUT[k+1]*sh+sp; d[o+2]=LUT[k+2]*sh+sp; d[o+3]=a*255;
  }
  bactx.putImageData(baImg,0,0);
}
function renderButter(){
  const d=buImg.data;
  for(let i=0;i<NN;i++){const o=i<<2,b=butter[i];if(b<0.01){d[o+3]=0;continue}
    const l=0.8+0.2*lace[i];
    d[o]=215*l;d[o+1]=165*l;d[o+2]=80*l;d[o+3]=Math.min(1,b)*(0.38+0.14*lace[i])*255}
  buctx.putImageData(buImg,0,0); S.buDirty=false;
}
function renderPattern(){
  const d=paImg.data;
  for(let i=0;i<NN;i++){const o=i<<2,p=pat[i];if(p<0.02){d[o+3]=0;continue}
    const k=(Math.min(3,patCk[i]*1.1+0.15)*100|0)*3, gx=pat[i+1]-pat[i-1], gy=pat[i+N]-pat[i-N], sh=1+clamp((gx+gy)*0.9,-0.25,0.25);
    d[o]=LUT[k]*sh;d[o+1]=LUT[k+1]*sh;d[o+2]=LUT[k+2]*sh;d[o+3]=clamp(p/0.22,0,1)*255}
  pactx.putImageData(paImg,0,0); S.paDirty=false;
}

