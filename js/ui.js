// Panel, buttons, result card, gallery and start-up.
'use strict';
/* ---------------- UI ---------------- */
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('show'),2200)}
function buildSteps(){$('#steps').innerHTML=STEPS.map((s,i)=>`<div class="pill" data-i="${i}"><b>${i+1}</b><span> ${s.name}</span></div>`).join('')}
function buildFillTools(){
  const ta=$('#toolArea');
  for(const [label,list] of [['ไส้หวาน',FILLS.filter(f=>f.sweet)],['ไส้เค็ม',FILLS.filter(f=>f.savory)]]){
    const grp=document.createElement('div'); grp.className='fgroup';
    const lb=document.createElement('div'); lb.className='glbl'; lb.textContent=label;
    const wrap=document.createElement('div'); wrap.className='fills';
    list.forEach(f=>{const b=document.createElement('button');b.className='fillbtn'+(S.tool===f.id?' on':'');b.dataset.id=f.id;
      const ic=mk(88,88);drawIcon(ic,f);const sp=document.createElement('span');sp.textContent=f.name;b.append(ic,sp);
      b.onclick=()=>{S.tool=f.id;S.ghost=null;ta.querySelectorAll('.fillbtn').forEach(x=>x.classList.toggle('on',x.dataset.id===f.id))};wrap.append(b)});
    grp.append(lb,wrap); ta.append(grp);
  }
  const row=document.createElement('div'); row.className='row';
  const u=document.createElement('button'); u.className='ghost'; u.textContent='↶ ย้อนไส้ล่าสุด'; u.onclick=()=>{if(S.actions.length){const a=S.actions.pop();if(a.snapW){eggW.set(a.snapW);eggY.set(a.snapY);eggCk.set(a.snapC);S.egDirty=true;S.hasHen=eggW.some(v=>v>0.02)}redrawFillLayer()}};
  const cl=document.createElement('button'); cl.className='ghost'; cl.textContent='ล้างไส้ทั้งหมด'; cl.onclick=()=>{S.actions=[];eggW.fill(0);eggY.fill(0);eggCk.fill(0);S.hasHen=false;S.egDirty=true;redrawFillLayer()};
  row.append(u,cl); ta.append(row);
}
function renderPanel(){
  const st=S.step, s=STEPS[Math.max(0,st)];
  document.querySelectorAll('.pill').forEach(p=>{const i=+p.dataset.i;p.classList.toggle('on',i===st);p.classList.toggle('done',i<st)});
  $('#stepNo').textContent=`ขั้นที่ ${Math.max(0,st)+1} / ${STEPS.length}`;
  $('#stepName').textContent=s.name; $('#stepHint').textContent=s.hint;
  $('#heatBox').classList.toggle('hidden',!(st>=BUT&&st<=FILL));
  $('#mButter').classList.toggle('hidden',st!==BUT);
  $('#mBatter').classList.toggle('hidden',st!==POUR&&st!==SPREAD);
  $('#mCook').classList.toggle('hidden',!(st>=POUR&&st<=ROLL));
  $('#mRoll').classList.toggle('hidden',st!==ROLL);
  document.querySelectorAll('#heatSeg button').forEach(b=>b.classList.toggle('on',+b.dataset.h===S.heat));
  const ta=$('#toolArea'); ta.replaceChildren();
  if(st===FILL) buildFillTools();
  if(st===LACE){
    const row=document.createElement('div'); row.className='row';
    const cl=document.createElement('button'); cl.className='ghost'; cl.textContent='ล้างลาย'; cl.onclick=()=>{pat.fill(0);patCk.fill(0);S.hasPat=false;S.paDirty=true;renderPanel()};
    row.append(cl); ta.append(row);
  }
  const nb=$('#nextBtn'); nb.classList.toggle('hidden',st===SERVE||st<0);
  nb.textContent=st===LACE&&!S.hasPat?'ข้ามไปหยอดแป้ง →':s.next+(st<ROLL?' →':'');
  nb.disabled=(st===POUR&&S.poured<500)||(st===ROLL&&!(S.roll&&S.roll.done));
  cv.style.cursor=(st>=BUT&&st<=ROLL)?'none':'default';
}
function updateMeters(){
  const st=S.step;
  if(st===BUT){const v=butterCov();$('#vButter').textContent=Math.round(v*100)+'%';$('#fButter').style.width=Math.min(100,v*100)+'%'}
  if(st===POUR||st===SPREAD){const ml=S.poured/80;$('#vBatter').textContent=Math.round(ml)+' ml';$('#fBatter').style.width=Math.min(100,S.poured/7200*100)+'%';
    if(st===POUR){$('#nextBtn').disabled=S.poured<500}}
  if(st>=POUR&&st<=ROLL){
    if(S.sumT>1){const a=S.sumTC/S.sumT;$('#kCook').style.left=clamp(a/3,0,1)*100+'%';
      $('#vCook').textContent=a<0.3?'ยังดิบ':a<0.6?'เริ่มเซ็ตตัว':a<1.0?'เริ่มสุก':a<1.6?'เหลืองทอง กำลังดี!':a<2.2?'เริ่มเกรียม':'ไหม้แล้ว!'}
    else{$('#vCook').textContent='–';$('#kCook').style.left='0%'}
  }
  if(st===ROLL&&S.roll&&S.roll.xminL!=null){const R=S.roll,v=(R.X-R.xminL)/Math.max(1,R.xmaxL-R.xminL);$('#vRoll').textContent=Math.round(v*100)+'%';$('#fRoll').style.width=v*100+'%'}
}
$('#zBatter').style.left=(2600/7200*100)+'%'; $('#zBatter').style.width=((4300-2600)/7200*100)+'%';
document.querySelectorAll('#heatSeg button').forEach(b=>b.onclick=()=>{S.heat=+b.dataset.h;renderPanel();initAudio()});

function goNext(){
  const st=S.step;
  if(st===POUR&&S.poured<500) return;
  if(st===SPREAD) dropCarry(P.x,P.y);
  if(st===FILL){
    if(S.sumT<15){toast('ยังไม่มีแป้งพอจะม้วนเลย ลองเริ่มใหม่นะ');return}
    if(S.cur) fillUp();
    setupRoll(); S.step=ROLL; renderPanel(); return;
  }
  if(st===ROLL){ if(!S.roll||!S.roll.done) return; S.step=SERVE; S.serveT=0; S.resultShown=false; renderPanel(); blip(520,0.15,0.1,'triangle'); show3D(); return; }
  S.step=st+1;
  renderPanel();
}
$('#nextBtn').onclick=goNext;

function reset(){
  batter.fill(0); cook.fill(0); butter.fill(0); fillAmt.fill(0); pat.fill(0); patCk.fill(0); eggW.fill(0); eggY.fill(0); eggCk.fill(0);
  Object.assign(S,{pouring:false,rubbing:false,carry:0,poured:0,hasBatter:false,hasPat:false,actions:[],cur:null,roll:null,art:null,stats:null,serveT:0,resultShown:false,rawMass:0,sumT:0,sumTC:0,spreadStarted:false,toldFull:false,buDirty:true,paDirty:true,hasHen:false,egDirty:true,cracks:[],ecW:0,ecY:0});
  steam.length=0; redrawFillLayer(); renderBatter();
}
function startGame(){ hide3D(); S.thumb3d=null; S.thumb3dImg=null; reset(); S.step=BUT; S.heat=2; hideAll(); renderPanel(); initAudio(); }
function hideAll(){document.querySelectorAll('.overlay').forEach(o=>o.classList.remove('show'))}
$('#startBtn').onclick=startGame;
$('#restartBtn').onclick=()=>{ startGame(); toast('เริ่มแผ่นใหม่'); };
$('#againBtn').onclick=startGame;
$('#view3dBtn').onclick=()=>{$('#resultOv').classList.remove('show'); if(!V3) show3D();};
$('#scoreBtn').onclick=()=>{ if(S.stats) $('#resultOv').classList.add('show'); };
$('#muteBtn').onclick=()=>{S.muted=!S.muted;store.set('tokyo.muted',S.muted);renderMute();initAudio()};

function stars(n){return '★★★★★'.slice(0,n)+'☆☆☆☆☆'.slice(0,5-n)}
function starCount(t){return t>=90?5:t>=75?4:t>=60?3:t>=40?2:1}
function showResult(){
  S.resultShown=true;
  const s=S.stats; const matched=TITLES.filter(t=>{try{return t.t(s)}catch(e){return false}});
  const main=matched[0]||TITLES[TITLES.length-1];
  const unlocked=new Set(store.get('tokyo.titles',[])); const fresh=matched.filter(t=>!unlocked.has(t.id)).map(t=>t.id);
  matched.forEach(t=>unlocked.add(t.id)); store.set('tokyo.titles',[...unlocked]);
  const img=S.thumb3d||makeThumb();
  const gal=store.get('tokyo.gallery',[]);
  S.galDate=Date.now(); gal.unshift({img,total:s.total,title:main.name,date:S.galDate}); while(gal.length>40) gal.pop();
  if(!store.set('tokyo.gallery',gal)){gal.length=Math.min(gal.length,10);store.set('tokyo.gallery',gal)}
  if(s.total>store.get('tokyo.best',0)) store.set('tokyo.best',s.total);
  $('#resImg').src=img; $('#resStars').textContent=stars(starCount(s.total)); $('#resTotal').textContent=s.total;
  $('#resTitle').textContent=main.name; $('#resDesc').textContent=main.desc;
  const L=[['ขนาดแผ่น','round'],['บางสม่ำเสมอ','thin'],['ความสุก','cook'],['ไส้','fill'],['การม้วน','roll']];
  $('#resBars').innerHTML=L.map(([n,k])=>`<div class="sbar"><span>${n}</span><div class="bar"><i style="width:${s.sc[k]/20*100}%"></i></div><span>${Math.round(s.sc[k])}/20</span></div>`).join('');
  $('#resBadges').innerHTML=matched.filter(t=>t!==main).slice(0,8).map(t=>`<span class="badge${fresh.includes(t.id)?' new':''}" title="${t.desc}">${fresh.includes(t.id)?'ใหม่! ':''}${t.name}</span>`).join('')
    +(fresh.includes(main.id)?'<span class="badge new">ปลดล็อกฉายาใหม่!</span>':'');
  $('#resultOv').classList.add('show'); chime();
}
function openGallery(){
  const gal=store.get('tokyo.gallery',[]), un=new Set(store.get('tokyo.titles',[]));
  $('#galSub').textContent=`ทำไปแล้ว ${gal.length} แผ่น · คะแนนสูงสุด ${store.get('tokyo.best',0)} · ฉายาที่ปลดล็อก ${TITLES.filter(t=>un.has(t.id)).length}/${TITLES.length}`;
  $('#galTitles').innerHTML=TITLES.map(t=>un.has(t.id)?`<span class="badge" title="${t.desc}">${t.name}</span>`:`<span class="badge lock" title="ยังไม่ปลดล็อก">???</span>`).join('');
  const grid=$('#galGrid');
  grid.innerHTML=gal.length?'':'<div class="empty">ยังไม่มีขนมในแกลเลอรี ลองทำสักแผ่นสิ!</div>';
  gal.forEach(g=>{const d=document.createElement('div');d.className='gcard';const im=document.createElement('img');im.src=g.img;im.alt=g.title;
    const info=document.createElement('div');info.innerHTML=`<b></b><small></small>`;info.querySelector('b').textContent=g.title;
    info.querySelector('small').textContent=`${g.total} คะแนน · ${new Date(g.date).toLocaleDateString('th-TH',{day:'numeric',month:'short'})}`;d.append(im,info);grid.append(d)});
  $('#galOv').classList.add('show');
}
$('#galBtn').onclick=openGallery; $('#titleGal').onclick=openGallery; $('#resGal').onclick=openGallery;
$('#galClose').onclick=()=>{$('#galOv').classList.remove('show')};
$('#galOv').addEventListener('click',e=>{if(e.target.id==='galOv')$('#galOv').classList.remove('show')});

function titleStat(){const un=store.get('tokyo.titles',[]);$('#titleStat').textContent=`คะแนนสูงสุด ${store.get('tokyo.best',0)} · ฉายา ${un.length}/${TITLES.length}`}

/* demo pancake behind title screen */
function makeDemo(){
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;if(!inG[i])continue;const dx=x+0.5-N/2,dy=y+0.5-N/2,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
    const R=66+2.5*Math.sin(5*a)+3*lace[i]; butter[i]=d<90?0.7:0;
    if(d<R){batter[i]=0.22+0.1*lace[i]+(d>R-3?-0.12:0);cook[i]=0.95+0.4*(spot[i]-0.5)+(d>R-5?0.5:0)}}
  S.hasBatter=true; renderBatter(); S.buDirty=true;
  S.actions=[{type:'sausage',kind:'piece',items:[makePiece('sausage',470,500),makePiece('sausage',535,500)]}];
  S.actions[0].items.forEach(p=>p.rot=0.05);
  const pork={type:'pork',kind:'crumb',items:[]}; for(let i=0;i<90;i++) pork.items.push(makeScatter('pork',500,500,95)); S.actions.push(pork);
  S.actions.push({type:'chili',kind:'cream',items:[{pts:[440,380,470,420,520,400,560,440,520,500,470,560,530,620,560,600]}]});
  redrawFillLayer();
}

buildSteps(); renderMute(); titleStat();
const ro=new ResizeObserver(()=>resize()); ro.observe($('#stage')); resize();
makeDemo(); renderPanel();
requestAnimationFrame(frame);
