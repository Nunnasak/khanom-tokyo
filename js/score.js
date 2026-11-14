// Scoring, titles and the 2D serve picture.
'use strict';
/* ---------------- scoring ---------------- */
const TITLES=[
  {id:'master',name:'โตเกียวแห่งสยาม',desc:'ทุกอย่างเป๊ะ ระดับตำนานหน้าโรงเรียน',t:s=>s.total>=90},
  {id:'charcoal',name:'ถ่านหุงข้าว',desc:'ไหม้ดำไปเกินครึ่งแผ่น',t:s=>s.burnt>0.5},
  {id:'raw',name:'แป้งดิบดิ้นได้',desc:'ยังไม่สุกก็รีบม้วนซะแล้ว',t:s=>s.raw>0.55},
  {id:'tiny',name:'จิ๋วแต่แจ๋ว',desc:'แผ่นเล็กกระจิ๋วหลิว',t:s=>s.meanR<130},
  {id:'giant',name:'โตเกียวยักษ์',desc:'ใหญ่เต็มกระทะ',t:s=>s.meanR>370},
  {id:'overflow',name:'ไส้ทะลักจักรวาล',desc:'ไส้เยอะจนม้วนแทบไม่มิด',t:s=>s.cov>0.6},
  {id:'tear',name:'ม้วนขาดใจ',desc:'แป้งขาดระหว่างม้วน',t:s=>s.tearFrac>0.3},
  {id:'burnt',name:'ไหม้ใจ',desc:'มีรอยไหม้ให้จดจำ',t:s=>s.burnt>0.18},
  {id:'abstract',name:'ศิลปะนามธรรม',desc:'ละเลงทรงอิสระสุดๆ',t:s=>s.roundness<0.72&&s.total>=60},
  {id:'oval',name:'ทรงรีแบบรถเข็น',desc:'แผ่นรีๆ แบบแม่ค้าละเลงจริง',t:s=>s.roundness>=0.72&&s.roundness<0.88&&s.meanR>=190},
  {id:'lace',name:'ผ้าลูกไม้ฉลุ',desc:'รูพรุนทั่วแผ่น',t:s=>s.holeFrac>0.18},
  {id:'pancake',name:'หนานุ่มสไตล์แพนเค้ก',desc:'แป้งหนาเกินโตเกียวไปนิด',t:s=>s.m>0.9},
  {id:'street',name:'สูตรรถเข็นหน้าโรงเรียน',desc:'ไส้กรอก หมูสับ และไข่ ครบสูตรไส้เค็ม',t:s=>(s.counts.sausage||0)>0&&(s.counts.pork||0)>0&&((s.counts.egg||0)>0||(s.counts.hen||0)>0)},
  {id:'henegg',name:'ไข่ไก่คนจนลาย',desc:'ตอกไข่ไก่แล้วคนให้ทั่วแผ่น',t:s=>(s.counts.hen||0)>=1},
  {id:'lattice',name:'ลายตาข่ายมือโปร',desc:'โรยเส้นแป้งเป็นลายสวยรอบตัวขนม',t:s=>s.lattice>0.08},
  {id:'paper',name:'บางเฉียบเหมือนกระดาษ',desc:'บางและเรียบเนียนทั้งแผ่น',t:s=>s.m<0.3&&s.holeFrac<0.06&&s.cv<0.5},
  {id:'golden',name:'เหลืองทองอร่าม',desc:'สุกกำลังดีเกือบทั้งแผ่น',t:s=>s.good>0.8},
  {id:'plain',name:'โตเกียวเปลือย',desc:'ไม่ใส่ไส้ เน้นแป้งล้วนๆ',t:s=>s.cov<0.01},
  {id:'buffet',name:'บุฟเฟ่ต์ไส้',desc:'ใส่ไส้ตั้งแต่ 5 อย่างขึ้นไป',t:s=>s.types.length>=5},
  {id:'egglove',name:'ไข่นกกระทาคลั่งรัก',desc:'ไข่นกกระทาตั้งแต่ 4 ฟอง',t:s=>(s.counts.egg||0)>=4},
  {id:'sausage',name:'ไส้กรอกล้นรถเข็น',desc:'ไส้กรอกตั้งแต่ 3 แท่ง',t:s=>(s.counts.sausage||0)>=3},
  {id:'pork',name:'หมูสับแน่นๆ',desc:'หมูสับผัดจัดเต็ม',t:s=>(s.counts.pork||0)>=120},
  {id:'chili',name:'เผ็ดซี๊ดซ๊าด',desc:'ราดซอสพริกแบบไทยแท้',t:s=>(s.counts.chili||0)>=25},
  {id:'sweetsalty',name:'หวานมันเค็มครบรส',desc:'ใส่ทั้งไส้หวานและไส้เค็ม',t:s=>s.sweet&&s.savory},
  {id:'pandan',name:'สังขยาใบเตยแท้',desc:'สังขยาใบเตยล้วน',t:s=>s.only==='pandan'},
  {id:'custard',name:'ครีมคัสตาร์ดคลาสสิก',desc:'ไส้ครีมล้วนแบบดั้งเดิม',t:s=>s.only==='custard'},
  {id:'taro',name:'คนรักเผือก',desc:'ครีมเผือกล้วน',t:s=>s.only==='taro'},
  {id:'choco',name:'โกโก้ครองใจ',desc:'ช็อกโกแลตล้วน',t:s=>s.only==='choco'},
  {id:'gold',name:'ทองทั้งแผ่น',desc:'ฝอยทองจัดเต็ม',t:s=>(s.counts.foithong||0)>=150},
  {id:'floss',name:'หมูหยองฟูฟ่อง',desc:'หมูหยองจัดเต็ม',t:s=>(s.counts.floss||0)>=200},
  {id:'tight',name:'ม้วนแน่นเปรี๊ยะ',desc:'ม้วนช้าๆ แน่นทุกรอบ',t:s=>s.loose<0.08&&s.tearFrac<0.05},
  {id:'loose',name:'ม้วนหลวมชิลๆ',desc:'ม้วนเร็วไปนิด หลวมโพรก',t:s=>s.loose>0.5},
  {id:'nobutter',name:'ลืมเนย',desc:'ไม่ได้เช็ดเนยกระทะ',t:s=>s.butterCov<0.15},
  {id:'leopard',name:'ลายเสือดาว',desc:'จุดน้ำตาลกระจายสวย',t:s=>s.brown>0.2&&s.brown<0.45&&s.burnt<0.08},
  {id:'pro',name:'แม่ค้าหน้าโรงเรียน',desc:'ฝีมือขายได้จริง',t:s=>s.total>=72},
  {id:'learner',name:'มือใหม่หัดละเลง',desc:'เริ่มจับทางได้แล้ว',t:s=>s.total>=45},
  {id:'kid',name:'หนูน้อยหัดทำขนม',desc:'ลองอีกสักแผ่นนะ',t:()=>true},
];
function computeStats(){
  let A=0,sT=0,sT2=0,sx=0,sy=0,raw=0,good=0,brown=0,burnt=0,bc=0,fin=0,fout=0,pc=0;
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x,t=batter[i],f=fillAmt[i];
    if(t>0.03){A++;sT+=t;sT2+=t*t;sx+=x;sy+=y;const c=cook[i];if(c<0.55)raw++;else if(c<1.6)good++;else if(c<2.2)brown++;else burnt++;if(butter[i]>0.15)bc++;if(pat[i]>0.12)pc++;fin+=f}else fout+=f}
  const R=S.roll, counts=fillMass(), types=Object.keys(counts).filter(k=>counts[k]>0);
  const s={A,counts,types,loose:R?R.loose:0,tearFrac:R?R.tearFrac:0,sweet:types.some(t=>FD[t].sweet),savory:types.some(t=>FD[t].savory),only:types.length===1?types[0]:null};
  if(A<20){Object.assign(s,{m:0,cv:0,roundness:0,meanR:0,holeFrac:0,raw:1,good:0,brown:0,burnt:0,butterCov:0,cov:0,spill:0,lattice:0,sc:{round:0,thin:0,cook:0,fill:0,roll:0},total:0});return s}
  const cx=sx/A+0.5, cy=sy/A+0.5, m=sT/A, cv=Math.sqrt(Math.max(0,sT2/A-m*m))/m;
  const rays=[]; for(let k=0;k<72;k++){const a=k/72*TAU,ca=Math.cos(a),sa=Math.sin(a);let last=0,gap=0;
    for(let d=0;d<GRC+6;d+=0.5){const xi=Math.floor(cx+ca*d),yi=Math.floor(cy+sa*d);if(xi<0||yi<0||xi>=N||yi>=N)break;
      if(batter[yi*N+xi]>0.03){last=d;gap=0}else{gap+=0.5;if(gap>3)break}}
    rays.push(last)}
  const mean=rays.reduce((a,b)=>a+b,0)/72, sd=Math.sqrt(rays.reduce((a,b)=>a+(b-mean)*(b-mean),0)/72);
  const roundness=mean>0?clamp(1-sd/mean,0,1):0;
  let emp=0; const has=(x,y)=>x>=0&&y>=0&&x<N&&y<N&&batter[y*N+x]>0.03;
  const hit=(x,y,dx,dy)=>{for(let k=1;k<=30;k++){if(has(x+dx*k,y+dy*k))return true}return false};
  for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){if(has(x,y)||!inG[y*N+x])continue;if(hit(x,y,1,0)&&hit(x,y,-1,0)&&hit(x,y,0,1)&&hit(x,y,0,-1))emp++}
  const effR=Math.sqrt(A/Math.PI)*CELL;
  Object.assign(s,{m,cv,roundness,meanR:effR,holeFrac:emp/(A+emp),raw:raw/A,good:good/A,brown:brown/A,burnt:burnt/A,butterCov:bc/A,cov:fin/A,spill:fout/(fin+fout+1e-6),lattice:pc/A});
  const sc={};
  const R0=s.meanR; let rp=R0<190?clamp((R0-90)/100,0,1):R0>390?clamp(1-(R0-390)/120,0.6,1):1; sc.round=20*rp;
  const thinP=clamp(1-(m-0.4)/0.7,0,1), evenP=clamp(1-(cv-0.35)/0.9,0,1), holeP=clamp(1-s.holeFrac*2.5,0,1);
  sc.thin=20*(0.5*thinP+0.5*evenP)*holeP;
  let ck=clamp(s.good+0.5*s.brown+0.15*s.raw-0.6*s.burnt,0,1); if(s.butterCov<0.3) ck*=0.85; sc.cook=20*ck;
  const cov=s.cov, ap=cov<0.005?0.25:cov<0.08?0.35+0.65*cov/0.08:cov<=0.42?1:Math.max(0.3,1-(cov-0.42)*1.4);
  sc.fill=20*ap*(1-Math.min(0.6,s.spill*1.5));
  sc.roll=20*(1-0.6*s.loose)*(1-0.55*s.tearFrac)*(R&&R.foldCover===false?0.85:1)*(1-Math.min(0.3,(R?R.slips:0)*0.08));
  s.sc=sc; s.total=Math.round(sc.round+sc.thin+sc.cook+sc.fill+sc.roll);
  return s;
}

/* ---------------- serve scene ---------------- */
const easeOutBack=t=>{const c1=1.4,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)};
function drawPlate(c){
  c.save(); c.shadowColor='rgba(40,20,5,.4)'; c.shadowBlur=36; c.shadowOffsetY=18; c.fillStyle='#f3efe8'; c.beginPath(); c.ellipse(500,560,450,310,0,0,TAU); c.fill(); c.restore();
  let g=c.createLinearGradient(0,250,0,870); g.addColorStop(0,'#ffffff'); g.addColorStop(1,'#e2dcd2');
  c.fillStyle=g; c.beginPath(); c.ellipse(500,560,450,310,0,0,TAU); c.fill();
  g=c.createLinearGradient(0,330,0,790); g.addColorStop(0,'#ebe6de'); g.addColorStop(.4,'#fbfaf7'); g.addColorStop(1,'#f4f1eb');
  c.fillStyle=g; c.beginPath(); c.ellipse(500,570,350,235,0,0,TAU); c.fill();
  c.strokeStyle='rgba(0,0,0,.06)'; c.lineWidth=2; c.stroke();
  c.strokeStyle='#4f86c2'; c.lineWidth=3.5; c.beginPath(); c.ellipse(500,560,422,290,0,0,TAU); c.stroke();
  c.lineWidth=1.5; c.beginPath(); c.ellipse(500,560,408,280,0,0,TAU); c.stroke();
}
function star(c,x,y,r){c.beginPath();for(let i=0;i<8;i++){const a=i/8*TAU,d=i%2?r*0.28:r;c.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d)}c.closePath();c.fill()}
function drawServeContent(c,t){
  if(S.thumb3dImg){c.drawImage(S.thumb3dImg,0,0,1000,1000);return}
  drawScoop2D(c);
  if(t>1.1){c.fillStyle='#fff6c8';const pos=[[230,300],[790,280],[260,800],[770,780],[520,170],[150,560]];
    pos.forEach((p,i)=>{c.globalAlpha=clamp(0.5+0.5*Math.sin(t*4+i*1.7),0,1)*clamp((t-1.1)*3,0,1);star(c,p[0],p[1],10+(i%3)*5)});c.globalAlpha=1}
}
function makeThumb(){const c=mk(400,400),x=c.getContext('2d');x.setTransform(.4,0,0,.4,0,0);drawTable(x);drawPlate(x);drawServeContent(x,1.29);try{return c.toDataURL('image/jpeg',0.84)}catch(e){return ''}}

