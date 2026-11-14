// Served piece in 3D (three.js), built from the sheet the player actually made.
'use strict';
/* ---------------- served piece: 3D ---------------- */
let V3=null;
function load3D(){
  return new Promise((res,rej)=>{
    if(window.THREE&&THREE.OrbitControls) return res();
    const add=(src,next)=>{const sc=document.createElement('script');sc.src=src;sc.onload=next;sc.onerror=rej;document.head.append(sc)};
    const ctrl=()=>add('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',res);
    if(window.THREE) ctrl(); else add('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',ctrl);
  });
}
const smooth01=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
// skin textures sampled from the player's own sheet (rolling frame): u runs across the poured sheet of each row
// along the wrap, v runs along the roll over the same rows the geometry uses.
function scoopTextures(rows){
  const R=S.roll, W=512, H=Math.max(64,Math.min(512,rows.length*4));
  const solid=(row,col)=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const r=row+dy,c=col+dx;if(r>=0&&r<N&&c>=0&&c<N&&R.bB[r*N+c]>0.012)return true}return false};
  const out=mk(W,H), inn=mk(W,H), ox=out.getContext('2d'), ix=inn.getContext('2d');
  const oi=ox.createImageData(W,H), ii=ix.createImageData(W,H), od=oi.data, id=ii.data;
  for(let py=0;py<H;py++){
    const v=1-(py+0.5)/H, row=rows[Math.min(rows.length-1,Math.floor(v*rows.length))], st=R.rowStartB[row], en=R.rowEndB[row];
    for(let px=0;px<W;px++){
      const u=(px+0.5)/W, xl=st+u*(en-st), col=clamp(Math.floor((xl-G0)/CELL),0,N-1), i=row*N+col, o=(py*W+px)*4;
      if(!solid(row,col)){od[o+3]=0;id[o+3]=0;continue}
      let k=(Math.min(3,R.cR[i]*(0.92+0.16*spot[i])+0.7)*100|0)*3, r=LUT[k], g=LUT[k+1], b=LUT[k+2];
      const pv=clamp((R.pR[i]-0.1)/0.2,0,1); r+=(252-r)*pv; g+=(226-g)*pv; b+=(140-b)*pv;
      const fr=pore[i]>0.985?0.55:pore[i]>0.94?0.8:1;
      od[o]=r*fr; od[o+1]=g*fr; od[o+2]=b*fr; od[o+3]=255;
      k=(Math.max(0.75,R.cR[i]*0.9)*100|0)*3; const fi=pore[i]>0.97?0.93:1;
      id[o]=LUT[k]*fi; id[o+1]=LUT[k+1]*fi; id[o+2]=LUT[k+2]*fi; id[o+3]=255;
    }
  }
  ox.putImageData(oi,0,0); ix.putImageData(ii,0,0);
  const tex=c=>{const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t};
  return {outer:tex(out),inner:tex(inn)};
}
// The served piece is built from what the player actually made:
//  - length = the sheet's real extent along the rolling axis
//  - each slice wraps as far as that slice of the sheet is wide (so the sheet's outline decides where it overlaps,
//    where it only half-wraps and how the ends open)
//  - wall thickness from how thick the batter was spread, looseness from how the flicks went
//  - fillings sit where they were placed along the sheet, in the amounts used
const SC3=0.0042;
function buildScoop3D(){
  const R=S.roll, st=S.stats||{}, m=fillMass(), hasS=(m.sausage||0)>0;
  const rows=[]; for(let y=0;y<N;y++) if(R.rowStartB[y]>=0&&R.rowEndB[y]-R.rowStartB[y]>CELL*3) rows.push(y);
  if(rows.length<2) return null;
  const yMid=(rows[0]+rows[rows.length-1]+1)/2, zOf=row=>(row+0.5-yMid)*CELL*SC3, L=(rows[rows.length-1]-rows[0]+1)*CELL*SC3;
  const looseK=1+0.35*(R.loose||0), R0=(hasS?0.34:0.29)*looseK, R0l=R0/SC3, bG=R0l*0.09/TAU;
  const TH=clamp((st.m||0.3)*0.05,0.012,0.055);
  // the soft crepe sags until it rests on what is inside
  const core0=R0*0.9, nS=hasS?Math.min(2,Math.round(m.sausage)):0, srS=core0*(nS>1?0.47:0.74)/looseK;
  const anyFill=Object.keys(m).some(k=>m[k]>0&&k!=='chili');
  const fillTop=hasS?(-core0+(nS>1?srS*2.05:srS*2)+core0*0.04):anyFill?-core0*0.2:null;
  const SQ=fillTop==null?0.82:clamp((fillTop+TH*1.15+0.012)/R0,0.38,1), WIDEN=1+0.14*(1-SQ);
  const NU=96, NV=rows.length-1, NP=(NU+1)*(NV+1);
  const pos=new Float32Array(NP*3), posI=new Float32Array(NP*3), uv=new Float32Array(NP*2); let minY=1e9;
  for(let j=0;j<=NV;j++){
    const row=rows[j], z=zOf(row), w=R.rowEndB[row]-R.rowStartB[row];
    const Tw=(-R0l+Math.sqrt(R0l*R0l+2*bG*w))/bG, PHSr=Math.PI+(TAU-Tw)/2;   // this slice's own wrap, centred under the filling
    const endF=Math.max(smooth01((j/NV-0.9)/0.1),smooth01((0.1-j/NV)/0.1));
    for(let i=0;i<=NU;i++){
      const u=i/NU, th=(-R0l+Math.sqrt(R0l*R0l+2*bG*u*w))/bG, ph=PHSr+th;
      const lip=R0*0.16*smooth01((u-0.86)/0.14), rad=R0*(1+0.09*th/TAU)+lip+R0*0.06*endF, k=j*(NU+1)+i;
      const sx=Math.sin(ph), cyv=Math.cos(ph), up=-cyv>0, a=rad*(up?WIDEN:1), b=rad*(up?SQ:1), x=a*sx, y=R0-b*cyv;
      let nx=sx/a, ny=-cyv/b; const nl=Math.hypot(nx,ny)||1; nx/=nl; ny/=nl;
      pos[k*3]=x; pos[k*3+1]=y; pos[k*3+2]=z; if(y<minY) minY=y; uv[k*2]=u; uv[k*2+1]=j/NV;
      posI[k*3]=x-TH*nx; posI[k*3+1]=y-TH*ny; posI[k*3+2]=z;
    }
  }
  for(let k=0;k<NP;k++){pos[k*3+1]-=minY; posI[k*3+1]-=minY}
  const idx=[]; for(let j=0;j<NV;j++)for(let i=0;i<NU;i++){const a=j*(NU+1)+i,b=a+1,c=a+NU+1,d=c+1;idx.push(a,b,c,b,d,c)}
  const mkGeo=P=>{const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setAttribute('uv',new THREE.BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals(); return g};
  const geoO=mkGeo(pos), geoI=mkGeo(posI);
  const rim=[], vtx=(P,k)=>[P[k*3],P[k*3+1],P[k*3+2]], quad=(a,b)=>{const o1=vtx(pos,a),o2=vtx(pos,b),i1=vtx(posI,a),i2=vtx(posI,b);rim.push(...o1,...o2,...i2,...o1,...i2,...i1)};
  for(const j of [0,NV]) for(let i=0;i<NU;i++) quad(j*(NU+1)+i,j*(NU+1)+i+1);
  for(let j=0;j<NV;j++) quad(j*(NU+1),(j+1)*(NU+1));
  const geoR=new THREE.BufferGeometry(); geoR.setAttribute('position',new THREE.Float32BufferAttribute(rim,3)); geoR.computeVertexNormals();
  const tx=scoopTextures(rows), grp=new THREE.Group();
  const mOut=new THREE.MeshStandardMaterial({map:tx.outer,alphaTest:0.5,side:THREE.FrontSide,roughness:0.65});
  const mIn=new THREE.MeshStandardMaterial({map:tx.inner,alphaTest:0.5,side:THREE.BackSide,roughness:0.8});
  const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:tx.outer,alphaTest:0.5});
  for(const [g,mt] of [[geoO,mOut],[geoI,mIn]]){const mesh=new THREE.Mesh(g,mt);mesh.castShadow=true;mesh.receiveShadow=true;mesh.customDepthMaterial=depth;grp.add(mesh)}
  const ckE=R.avgCook!=null?R.avgCook:1;
  const edge=new THREE.Mesh(geoR,new THREE.MeshStandardMaterial({color:new THREE.Color(rgbs(cookRGB(ckE+0.35))).convertSRGBToLinear(),roughness:0.7,side:THREE.DoubleSide}));
  edge.castShadow=true; grp.add(edge);
  // ---- fillings, at the places along the sheet where they were put
  const cy=R0-minY, core=core0, zA=zOf(rows[0])+0.05, zB=zOf(rows[rows.length-1])-0.05, rg=rng(31), lin=h=>new THREE.Color(h).convertSRGBToLinear();
  const wRows=rows.map(y=>{let s2=0;for(let x=0;x<N;x++)s2+=R.fR[y*N+x];return s2}), wSum=wRows.reduce((a,b)=>a+b,0);
  const zFill=()=>{if(wSum<=0)return zA+(zB-zA)*rg();let t=rg()*wSum;for(let k=0;k<rows.length;k++){t-=wRows[k];if(t<=0)return clamp(zOf(rows[k])+(rg()-0.5)*CELL*SC3*2,zA,zB)}return (zA+zB)/2};
  const sph=new THREE.SphereGeometry(1,16,12), ico=new THREE.IcosahedronGeometry(1,0);
  const put=(g,mt,x,y,z,sx,sy,sz)=>{const o=new THREE.Mesh(g,mt);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;grp.add(o);return o};
  const spot=(spread,d0,d1)=>{const a=(rg()-0.5)*spread, d=core*(d0+rg()*(d1-d0));return{x:Math.sin(a)*d,y:cy-Math.cos(a)*d}};
  const floorY=cy-core;
  if(hasS){
    const ca=Math.cos(R.alpha), sa=Math.sin(R.alpha), mt=new THREE.MeshStandardMaterial({color:lin('#d8673f'),roughness:0.36});
    const ss=[]; for(const a of S.actions) if(a.type==='sausage') for(const p of a.items) ss.push(p);
    ss.slice(0,nS).forEach((p,i)=>{
      const ly=-sa*(p.x-GC)+ca*(p.y-GC)+GC, row=(ly-G0)/CELL, sl=clamp(L*0.8,0.3,Math.max(0.3,zB-zA));
      const zc=clamp(zOf(row),zA+sl/2,Math.max(zA+sl/2,zB-sl/2)), x=nS>1?(i?1:-1)*srS*0.98:0, y=floorY+srS+core*0.04;
      const cyl=put(new THREE.CylinderGeometry(1,1,1,28),mt,x,y,zc,srS,sl,srS); cyl.rotation.x=Math.PI/2;
      put(sph,mt,x,y,zc+sl/2,srS,srS,srS*0.3); put(sph,mt,x,y,zc-sl/2,srS,srS,srS*0.3);
    });
  }
  const creams=['custard','pandan','taro','choco'].filter(t=>(m[t]||0)>0);
  creams.forEach(t=>{const mt=new THREE.MeshStandardMaterial({color:lin(FD[t].color),roughness:0.5}),n=Math.round(clamp((m[t]||0)/3,8,22));
    for(let i=0;i<n;i++){const p=spot(hasS?2.4:1.6,hasS?0.55:0.3,0.8);put(sph,mt,p.x,p.y,zFill(),core*0.34,core*0.26,core*0.4)}});
  if((m.hen||0)>0){const w=new THREE.MeshStandardMaterial({color:lin('#fff7e6'),roughness:0.6}),yk=new THREE.MeshStandardMaterial({color:lin('#f5a623'),roughness:0.45});
    for(let i=0;i<18;i++){const p=spot(2.8,0.82,0.92);put(sph,i%3?w:yk,p.x,p.y,zFill(),core*0.28,core*0.08,core*0.34)}}
  const crumbs=(pal,count,size,spread,d0,d1)=>{if(count<=0)return;const im=new THREE.InstancedMesh(ico,new THREE.MeshStandardMaterial({roughness:0.85}),count),o=new THREE.Object3D(),col=new THREE.Color();
    for(let i=0;i<count;i++){const p=spot(spread,d0,d1),s2=core*size*(0.7+rg()*0.6);o.position.set(p.x,p.y,zFill());o.rotation.set(rg()*3,rg()*3,rg()*3);o.scale.set(s2,s2*0.8,s2);o.updateMatrix();im.setMatrixAt(i,o.matrix);
      col.set(pal[(rg()*pal.length)|0]).convertSRGBToLinear(); im.setColorAt(i,col)}
    im.castShadow=true; im.receiveShadow=true; grp.add(im)};
  if((m.pork||0)>0) crumbs(PAL.pork,Math.round(clamp(m.pork*1.2,60,260)),0.12,hasS?2.9:2.2,hasS?0.8:0.35,0.95);
  if((m.floss||0)>0) crumbs(PAL.floss,Math.round(clamp(m.floss*0.5,40,160)),0.08,2.6,0.55,0.9);
  if((m.foithong||0)>0) crumbs(PAL.foithong,Math.round(clamp(m.foithong*0.5,40,160)),0.06,2.6,0.55,0.9);
  if((m.egg||0)>0){const w=new THREE.MeshStandardMaterial({color:lin('#fffdf6'),roughness:0.5}),yk=new THREE.MeshStandardMaterial({color:lin('#f6be52'),roughness:0.4}),n=Math.min(4,m.egg);
    for(let i=0;i<n;i++){const p=spot(1.4,0.55,0.65),z=zFill();put(sph,w,p.x,p.y,z,core*0.27,core*0.2,core*0.3);put(sph,yk,p.x,p.y+core*0.12,z,core*0.12,core*0.1,core*0.12)}}
  if((m.chili||0)>0){const mt=new THREE.MeshStandardMaterial({color:lin('#c92a16'),roughness:0.3});for(let i=0;i<14;i++){const p=spot(2.2,0.4,0.85);put(sph,mt,p.x,p.y,zFill(),core*0.07,core*0.05,core*0.11)}}
  grp.userData.size=Math.max(L,R0*2);
  return grp;
}
async function show3D(){
  const box=$('#v3d'); box.classList.remove('hidden'); $('#v3dLoad').classList.remove('hidden');
  try{ await load3D(); }catch(e){ box.classList.add('hidden'); toast('เปิดมุมมอง 3D ไม่ได้ ต้องต่ออินเทอร์เน็ตก่อน'); return; }
  if(S.step!==SERVE||V3) return;
  const size=cv.clientWidth;
  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1)); renderer.setSize(size,size,false);
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputEncoding=THREE.sRGBEncoding;
  box.insertBefore(renderer.domElement,box.firstChild);
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0xb98152);
  const cam=new THREE.PerspectiveCamera(35,1,0.1,100); cam.position.set(1.6,2.6,5.4);
  const tcv=mk(1024,1024), tx=tcv.getContext('2d'); tx.setTransform(1.024,0,0,1.024,0,0); drawTable(tx);
  const tt=new THREE.CanvasTexture(tcv); tt.encoding=THREE.sRGBEncoding; tt.wrapS=tt.wrapT=THREE.RepeatWrapping; tt.repeat.set(2,2);
  const table=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshStandardMaterial({map:tt,roughness:0.9})); table.rotation.x=-Math.PI/2; table.receiveShadow=true; scene.add(table);
  const plateM=new THREE.MeshStandardMaterial({color:new THREE.Color('#f7f4ee').convertSRGBToLinear(),roughness:0.35});
  const plate=new THREE.Mesh(new THREE.CylinderGeometry(3.2,2.9,0.14,72),plateM); plate.position.y=0.07; plate.receiveShadow=true; scene.add(plate);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(3.12,0.07,12,96),plateM); rim.rotation.x=Math.PI/2; rim.position.y=0.16; scene.add(rim);
  const ring=new THREE.Mesh(new THREE.RingGeometry(2.86,2.92,96),new THREE.MeshBasicMaterial({color:0x4f86c2})); ring.rotation.x=-Math.PI/2; ring.position.y=0.145; scene.add(ring);
  const piece=buildScoop3D(), F=piece?clamp(piece.userData.size/2.0,0.6,1.4):1;
  if(piece){piece.position.y=0.145; piece.rotation.y=-0.4; scene.add(piece);}
  cam.position.set(1.6*F,2.6*F,5.4*F);
  scene.add(new THREE.HemisphereLight(0xfff4e0,0x7a5a3a,0.8));
  const sun=new THREE.DirectionalLight(0xffffff,0.95); sun.position.set(3,8,6); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:1,far:25}); sun.shadow.bias=-0.0008; sun.shadow.radius=4; scene.add(sun);
  const ctl=new THREE.OrbitControls(cam,renderer.domElement); ctl.target.set(0,0.4,0); ctl.enableDamping=true; ctl.dampingFactor=0.08;
  ctl.autoRotate=true; ctl.autoRotateSpeed=1.4; ctl.minDistance=2.2; ctl.maxDistance=12; ctl.maxPolarAngle=1.45; ctl.enablePan=false;
  ctl.addEventListener('start',()=>{ctl.autoRotate=false}); ctl.update();
  $('#v3dLoad').classList.add('hidden');
  // picture for the result card and gallery: looking into the open front
  const keep=cam.position.clone(); cam.position.set(2.1*F,1.45*F,3.0*F); cam.lookAt(ctl.target); renderer.render(scene,cam);
  try{set3DThumb(renderer.domElement.toDataURL('image/jpeg',0.86))}catch(e){}
  cam.position.copy(keep); cam.lookAt(ctl.target); ctl.update();
  let raf=0; const loop=()=>{raf=requestAnimationFrame(loop);ctl.update();renderer.render(scene,cam)}; loop();
  V3={resize:sz=>{renderer.setSize(sz,sz,false)},dispose:()=>{cancelAnimationFrame(raf);ctl.dispose();scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){[].concat(o.material).forEach(mt=>{if(mt.map)mt.map.dispose();mt.dispose()})}});renderer.dispose();renderer.domElement.remove()}};
}
function set3DThumb(url){
  const im=new Image();
  im.onload=()=>{ S.thumb3dImg=im; const c=mk(400,400); c.getContext('2d').drawImage(im,0,0,400,400); let u; try{u=c.toDataURL('image/jpeg',0.84)}catch(e){return}
    S.thumb3d=u;
    if(S.resultShown){ $('#resImg').src=u; const gal=store.get('tokyo.gallery',[]); const g=gal.find(x=>x.date===S.galDate); if(g){g.img=u;store.set('tokyo.gallery',gal)} } };
  im.src=url;
}
function hide3D(){ if(V3){V3.dispose();V3=null} $('#v3d').classList.add('hidden'); }
// offline fallback picture: same scoop shape drawn flat
function drawScoop2D(c){
  const R=S.roll, ck=R&&R.avgCook!=null?R.avgCook:1, outer=cookRGB(ck+0.7), inner=cookRGB(Math.max(0.75,ck*0.9)), m=fillMass();
  c.save(); c.translate(500,520); c.rotate(-0.35);
  c.fillStyle='rgba(70,35,8,.25)'; c.beginPath(); c.ellipse(20,95,230,40,0,0,TAU); c.fill();
  const g=c.createLinearGradient(0,-95,0,95); g.addColorStop(0,rgbs(outer,1.08,20)); g.addColorStop(0.5,rgbs(outer)); g.addColorStop(1,rgbs(outer,0.7));
  c.fillStyle=g; rr(c,-230,-90,400,180,60); c.fill();
  c.fillStyle=rgbs(inner); c.beginPath(); c.ellipse(170,0,70,92,0,0,TAU); c.fill();
  c.fillStyle='#3e2410'; c.beginPath(); c.ellipse(178,6,52,74,0,0,TAU); c.fill();
  if((m.sausage||0)>0){c.fillStyle='#d8673f';c.beginPath();c.ellipse(182,22,34,40,0,0,TAU);c.fill();c.fillStyle='rgba(255,220,190,.4)';c.beginPath();c.ellipse(172,10,10,14,0,0,TAU);c.fill()}
  if((m.pork||0)>0){const rg=rng(3);for(let i=0;i<30;i++){c.fillStyle=PAL.pork[(rg()*5)|0];c.beginPath();c.arc(150+rg()*60,40+rg()*30,4+rg()*4,0,TAU);c.fill()}}
  c.strokeStyle=rgbs(outer,0.85); c.lineWidth=6; c.beginPath(); c.ellipse(170,0,70,92,0,-1.2,2.2); c.stroke();
  c.restore();
}

