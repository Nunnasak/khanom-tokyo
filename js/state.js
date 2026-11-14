// Game state and sound.
'use strict';
/* ---------------- state ---------------- */
const STEPS=[
  {name:'เช็ดเนย',hint:'ลากก้อนเนยถูให้ทั่วกระทะ เนยช่วยให้แป้งไม่ติด สุกสม่ำเสมอ และหอม',next:'ต่อไป: โรยลาย'},
  {name:'โรยลาย',hint:'บีบเส้นแป้งจากขวดเป็นลายตาข่ายหรือลายวน ลายนี้จะเกรียมเป็นเส้นสวยอยู่รอบตัวขนมเมื่อม้วนเสร็จ (ข้ามได้)',next:'ต่อไป: หยอดแป้ง'},
  {name:'หยอดแป้ง',hint:'กดค้างบนกระทะ แป้งจะไหลลงตรงหัวลูกศร ปล่อยเมื่อปริมาณถึงแถบสีเขียว',next:'ต่อไป: ละเลง'},
  {name:'ละเลงแป้ง',hint:'ลากก้นกระบวยดันแป้งออกไปให้บางทั่วแผ่น ทรงไหนก็ได้ จะกลม รี หรือทรงอิสระก็ได้ ขอแค่บางเสมอกันและไม่เป็นรู รีบละเลงก่อนแป้งเซ็ตตัว!',next:'ต่อไป: ใส่ไส้'},
  {name:'ใส่ไส้',hint:'เลือกไส้หวานหรือไส้เค็ม ไข่ไก่: แตะเพื่อตอก แล้วลากบนไข่เพื่อคนให้ทั่วแผ่น ไส้กรอกวางเป็นแท่งตามแนวตั้ง แล้วโรยหมูสับรอบๆ',next:'ต่อไป: ม้วน'},
  {name:'ม้วน',hint:'ปัดนิ้วจากขอบแผ่นเข้าหาไส้ ทิศไหนก็ได้ ขอบจะยกขึ้นม้วนรอบไส้ จากนั้นปัดตามลูกศรทีละครั้ง แต่ละครั้งแผ่นจะม้วนไปอีก 1 รอบ ได้เป็นหลอดแป้งบางๆ กลวงข้างใน ปัดเบี้ยวหรือแรงเกินจะม้วนหลวม',next:'เสิร์ฟ!'},
  {name:'เสิร์ฟ',hint:'จัดใส่จาน พร้อมเสิร์ฟ!',next:''},
];
const HEATS=[0,0.5,1,1.8];
const S={step:-1,heat:2,pouring:false,rubbing:false,carry:0,poured:0,hasBatter:false,hasPat:false,actions:[],cur:null,curLast:null,
  tool:'custard',roll:null,art:null,stats:null,serveT:0,resultShown:false,rawMass:0,sumT:0,sumTC:0,steamAcc:0,
  muted:store.get('tokyo.muted',false),buDirty:true,paDirty:true,meterT:0,hasHen:false,egDirty:true,cracks:[],ecW:0,ecY:0};
const P={x:500,y:500,down:false,inside:false};

/* ---------------- audio ---------------- */
let AC=null, sizzleG=null, master=null;
function initAudio(){
  if(AC){ if(AC.state==='suspended') AC.resume(); return; }
  try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    master=AC.createGain(); master.gain.value=S.muted?0:1; master.connect(AC.destination);
    const len=AC.sampleRate*2, buf=AC.createBuffer(1,len,AC.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*(Math.random()<0.015?1:0.3);
    const src=AC.createBufferSource(); src.buffer=buf; src.loop=true;
    const bp=AC.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=4200; bp.Q.value=0.6;
    const hp=AC.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=1200;
    sizzleG=AC.createGain(); sizzleG.gain.value=0;
    src.connect(bp); bp.connect(hp); hp.connect(sizzleG); sizzleG.connect(master); src.start();
  }catch(e){AC=null}
}
function setSizzle(v){ if(AC&&sizzleG) sizzleG.gain.setTargetAtTime(v,AC.currentTime,0.12); }
function blip(freq,dur,vol,type){
  if(!AC||S.muted) return;
  try{const o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(freq,AC.currentTime);o.frequency.exponentialRampToValueAtTime(freq*0.6,AC.currentTime+dur);
  g.gain.setValueAtTime(vol,AC.currentTime);g.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+dur);o.connect(g);g.connect(master);o.start();o.stop(AC.currentTime+dur+0.02);}catch(e){}
}
function chime(){[660,880,1320].forEach((f,i)=>setTimeout(()=>blip(f,0.35,0.12,'triangle'),i*110))}
function renderMute(){
  $('#muteBtn').innerHTML=S.muted
    ?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m22 9-6 6M16 9l6 6"/></svg>'
    :'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';
  if(master) master.gain.value=S.muted?0:1;
}

