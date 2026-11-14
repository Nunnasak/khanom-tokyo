// Shared helpers, storage, step ids, simulation grid, colour table and canvases.
'use strict';
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const TAU=Math.PI*2;
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function circle(c,x,y,r){c.beginPath();c.arc(x,y,r,0,TAU)}
function rr(c,x,y,w,h,r){r=Math.max(0,Math.min(r,w/2,h/2));c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
const mem={};
const store={get(k,d){if(k in mem)return mem[k];try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));delete mem[k];return true}catch(e){mem[k]=v;return false}}};

/* steps */
const BUT=0, LACE=1, POUR=2, SPREAD=3, FILL=4, ROLL=5, SERVE=6;

/* ---------------- simulation grid ---------------- */
const N=220, CELL=4, G0=60, GC=500, GR=440, GRC=GR/CELL, NN=N*N;
const batter=new Float32Array(NN), cook=new Float32Array(NN), butter=new Float32Array(NN);
const pat=new Float32Array(NN), patCk=new Float32Array(NN);
const eggW=new Float32Array(NN), eggY=new Float32Array(NN), eggCk=new Float32Array(NN), eggTmp=new Float32Array(NN);
const tmp=new Float32Array(NN), fillAmt=new Float32Array(NN);
const heatMap=new Float32Array(NN), inG=new Uint8Array(NN), pore=new Float32Array(NN);
function valueNoise(scale,seed){
  const r=rng(seed), gw=Math.ceil(N/scale)+2, g=new Float32Array(gw*gw);
  for(let i=0;i<g.length;i++) g[i]=r();
  const out=new Float32Array(NN);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const fx=x/scale, fy=y/scale, ix=fx|0, iy=fy|0;
    let tx=fx-ix, ty=fy-iy; tx=tx*tx*(3-2*tx); ty=ty*ty*(3-2*ty);
    const a=g[iy*gw+ix], b=g[iy*gw+ix+1], c=g[(iy+1)*gw+ix], d=g[(iy+1)*gw+ix+1];
    out[y*N+x]=(a+(b-a)*tx)*(1-ty)+(c+(d-c)*tx)*ty;
  }
  return out;
}
const lace=new Float32Array(NN), spot=new Float32Array(NN);
{
  const a=valueNoise(6,1), b=valueNoise(2.5,2), c=valueNoise(10,3), d=valueNoise(3,4), r=rng(5);
  for(let i=0;i<NN;i++){ lace[i]=a[i]*0.6+b[i]*0.4; spot[i]=c[i]*0.65+d[i]*0.35; pore[i]=r(); }
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const i=y*N+x, dx=x+0.5-N/2, dy=y+0.5-N/2, d2=Math.hypot(dx,dy);
    inG[i]=d2<GRC-3?1:0; heatMap[i]=1.12-0.3*Math.pow(d2/GRC,2);
  }
}
const innerIdx=[]; for(let y=0;y<N;y++)for(let x=0;x<N;x++){ if(Math.hypot(x+0.5-N/2,y+0.5-N/2)<GRC*0.78) innerIdx.push(y*N+x); }

// egg-yellow Thai batter: raw cream -> set yellow -> golden -> orange-brown -> burnt
const CST=[[0,250,240,206],[0.5,251,229,150],[1.0,248,203,92],[1.5,238,162,52],[2.0,192,106,30],[2.5,102,56,20],[3.0,36,24,14]];
const LUT=new Uint8Array(301*3);
for(let k=0;k<=300;k++){const c=k/100;let j=0;while(j<CST.length-2&&c>CST[j+1][0])j++;const a=CST[j],b=CST[j+1],t=clamp((c-a[0])/(b[0]-a[0]),0,1);for(let q=0;q<3;q++)LUT[k*3+q]=a[q+1]+(b[q+1]-a[q+1])*t;}
function cookRGB(c){const k=(clamp(c,0,3)*100|0)*3;return[LUT[k],LUT[k+1],LUT[k+2]]}
function rgbs(a,m,add){m=m==null?1:m;add=add||0;return`rgb(${clamp(a[0]*m+add,0,255)|0},${clamp(a[1]*m+add,0,255)|0},${clamp(a[2]*m+add,0,255)|0})`}

/* ---------------- canvases ---------------- */
const cv=$('#c'), ctx=cv.getContext('2d');
let SC=1, bgC=mk(10,10), serveBg=mk(10,10);
const baC=mk(N,N), bactx=baC.getContext('2d'), baImg=bactx.createImageData(N,N);
const buC=mk(N,N), buctx=buC.getContext('2d'), buImg=buctx.createImageData(N,N);
const paC=mk(N,N), pactx=paC.getContext('2d'), paImg=pactx.createImageData(N,N);
const egC=mk(N,N), egctx=egC.getContext('2d'), egImg=egctx.createImageData(N,N);
const FLS=1.4, fillLayer=mk(1400,1400), flctx=fillLayer.getContext('2d');
flctx.setTransform(FLS,0,0,FLS,0,0);
const shadeStrip=mk(64,1);
{const c=shadeStrip.getContext('2d'),g=c.createLinearGradient(0,0,64,0);
 g.addColorStop(0,'rgba(60,25,0,.5)');g.addColorStop(.14,'rgba(60,25,0,.12)');g.addColorStop(.3,'rgba(255,248,220,.38)');g.addColorStop(.42,'rgba(255,248,220,.06)');g.addColorStop(.75,'rgba(60,25,0,.12)');g.addColorStop(1,'rgba(60,25,0,.48)');
 c.fillStyle=g;c.fillRect(0,0,64,1);}
const flatStrip=mk(64,1);
{const c=flatStrip.getContext('2d'),g=c.createLinearGradient(0,0,64,0);
 g.addColorStop(0,'rgba(60,25,0,.42)');g.addColorStop(.08,'rgba(60,25,0,.08)');g.addColorStop(.16,'rgba(255,248,220,.18)');g.addColorStop(.5,'rgba(255,248,220,.04)');g.addColorStop(.88,'rgba(60,25,0,.06)');g.addColorStop(1,'rgba(60,25,0,.42)');
 c.fillStyle=g;c.fillRect(0,0,64,1);}
const steamSprite=mk(64,64);
{const c=steamSprite.getContext('2d'),g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,64,64);}

