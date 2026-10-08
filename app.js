import { SensorView } from './orientation.js';
import { Tour } from './tour.js';
import { config } from './config.js';
import { types, questions, resultIndex, shareUrl } from './experience.js';
import { fairySvg } from './fairy.js';
import { giftSvg } from './gift.js';
import { Music } from './audio.js';
import { renderCard, downloadBlob } from './card.js';

const $=selector=>document.querySelector(selector);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const music=new Music(config.bgmUrl);
const state={phase:'intro',answers:[],type:types[0],view:0,found:false,traveling:false,drag:null,gyro:false,gyroBase:null,gyroView:0,strokeTime:0,strokeLast:null,strokeX:null,strokeDown:false,exportBlob:null};
const timers=new Set();let exportPromise=null,toastTimer=null,previewUrl=null,exportGeneration=0;
function later(fn,ms,{readable=false}={}){const id=setTimeout(()=>{timers.delete(id);fn()},reduced.matches&&!readable?Math.min(ms,180):ms);timers.add(id);return id;}
function cancelTimers(){for(const id of timers)clearTimeout(id);timers.clear();}
function announce(message){$('#status').textContent=message;}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),4000);announce(message);}
function focus(el){el?.focus({preventScroll:true});}
function show(screen,phase){
  state.phase=phase;document.body.dataset.phase=phase;
  for(const el of document.querySelectorAll('.screen')){const active=el.id===screen;el.classList.toggle('active',active);el.inert=!active;el.setAttribute('aria-hidden',String(!active));}
  $('#transformScreen').scrollTop=0;
}
function mountFairy(id,type){const el=$(id);el.innerHTML=fairySvg(type,id.slice(1));el.setAttribute('aria-label',type?`${type.label}の妖精 ${type.name}`:'光の妖精');}
for(const id of ['#strokeFairy','.mini-fairy','#outdoorFairyVisual'])mountFairy(id,null);
$('#gift').innerHTML=giftSvg([]);
for(const p of document.querySelectorAll('[data-company-message]'))p.textContent=config.companyMessage;
if(config.companyName)$('#companyName').textContent=config.companyName;
else $('#companyName').hidden=true;

function syncSound(){for(const id of ['#soundBtn','#soundBtn2','#soundBtn3']){const el=$(id);el.textContent=music.enabled?'♪':'♫';el.setAttribute('aria-pressed',String(music.enabled));el.setAttribute('aria-label',music.enabled?'音をオフにする':'音をオンにする');}}
async function toggleSound(){try{const playback=music.setEnabled(!music.enabled);syncSound();await playback;}catch{toast('音を再生できませんでした。音なしで体験を続けられます。');}syncSound();}
for(const id of ['#soundBtn','#soundBtn2','#soundBtn3'])$(id).onclick=toggleSound;
document.addEventListener('visibilitychange',()=>{if(document.hidden)music.stop();else if(music.enabled)void music.setEnabled(true).catch(()=>{music.enabled=false;syncSound()});});

const viewport=$('#viewport'),orb=$('#fairyOrb');
const tour=new Tour(viewport,orb,()=>checkFairy());
function viewScale(){return 2*Math.atan(viewport.clientWidth/viewport.clientHeight*.7);}
function setView(x){state.view=x;tour.set(x/viewport.clientWidth*viewScale());}
function initialPan(){$('.world-controls').inert=false;tour.resetJourney?.();state.view=0;tour.set(0,0);state.gyroBase=null;}
function checkFairy(){
  if(state.phase!=='world'||state.found)return;
  const r=orb.getBoundingClientRect(),width=viewport.clientWidth;
  if(orb.style.visibility==='visible'&&r.right>width*.15&&r.left<width*.85&&r.top>80&&r.bottom<viewport.clientHeight-120){state.found=true;orb.tabIndex=0;$('#fairySpeech').textContent='あ、見つけてくれた！ 待ってたよ！';for(const id of ['#fairySpeech','#tapLabel','#tapRing'])$(id).style.display='block';$('.hint').textContent='妖精をタップしてみて';announce('妖精を見つけました。妖精をタップして工房へ進みましょう。');}
}
viewport.addEventListener('pointerdown',e=>{if(state.traveling||state.phase!=='world'||e.target.closest('#fairyOrb'))return;state.drag={x:e.clientX,y:e.clientY,view:state.view,pitch:tour.pitch};viewport.setPointerCapture(e.pointerId);});
viewport.addEventListener('pointermove',e=>{if(state.drag){state.view=state.drag.view+(state.drag.x-e.clientX)*1.15;tour.set(state.view/viewport.clientWidth*viewScale(),state.drag.pitch+(e.clientY-state.drag.y)/viewport.clientHeight*1.4,{smooth:true});}});
for(const event of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(event,()=>{state.drag=null;state.gyroBase=null;});
function pan(amount){if(state.phase==='world'&&!state.traveling){setView(state.view+amount);state.gyroBase=null;}}
$('#lookLeft').onclick=()=>pan(-viewport.clientWidth*.55);$('#lookRight').onclick=()=>pan(viewport.clientWidth*.55);
viewport.addEventListener('keydown',e=>{if(state.phase==='world'&&!state.traveling&&['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='ArrowRight'||e.key==='ArrowLeft')pan((e.key==='ArrowRight'?1:-1)*viewport.clientWidth*.3);else{tour.set(tour.yaw,tour.pitch+(e.key==='ArrowUp'?1:-1)*.22);state.gyroBase=null;}}});
const sensorView=new SensorView();
function onOrientation(e){
  if(!state.gyro||state.phase!=='world'||state.traveling||state.drag)return;
  if(![e.alpha,e.beta,e.gamma].some(v=>typeof v==='number'&&Number.isFinite(v)))return;
  const sample={alpha:Number.isFinite(e.alpha)?e.alpha:0,beta:Number.isFinite(e.beta)?e.beta:0,gamma:Number.isFinite(e.gamma)?e.gamma:0},screenAngle=screen.orientation?.angle??window.orientation??0;
  if(state.gyroBase===null){sensorView.calibrate(sample,screenAngle,tour.yaw,tour.pitch);state.gyroBase=true;return;}
  const view=sensorView.update(sample,screenAngle);state.view=view.yaw/viewScale()*viewport.clientWidth;tour.set(view.yaw,view.pitch,{smooth:true});
}
window.addEventListener('deviceorientation',onOrientation);
function syncGyro(){const button=$('#gyroBtn');button.setAttribute('aria-pressed',String(state.gyro));button.textContent=state.gyro?'傾き操作ON':'傾き操作OFF';}
async function enableGyro(){
  try{
    if(!window.isSecureContext||typeof DeviceOrientationEvent==='undefined')throw new Error();
    if(typeof DeviceOrientationEvent.requestPermission==='function'&&await DeviceOrientationEvent.requestPermission()!=='granted')throw new Error();
    state.gyro=true;state.gyroBase=null;syncGyro();announce('スマホを傾けて見回せます。');
  }catch{state.gyro=false;syncGyro();toast('センサーを使えません。指のドラッグか左右ボタンで見回せます。');}
}
$('#gyroBtn').onclick=()=>{if(state.gyro){state.gyro=false;syncGyro();}else void enableGyro();};
$('#startBtn').onclick=()=>{show('worldScreen','world');initialPan();focus(viewport);announce('上下左右に見渡して妖精を探してください。');void enableGyro();const playback=music.setEnabled(true);syncSound();void playback.then(syncSound).catch(()=>{music.enabled=false;syncSound();toast('音を再生できませんでした。音なしで体験を続けられます。');});};
function goToWorkshop(){
  if(!state.found||state.traveling||state.phase!=='world')return;state.traveling=true;$('#fairySpeech').textContent='じゃあ、ついてきて！';$('#tapLabel').style.display='none';$('#tapRing').style.display='none';
  state.drag=null;$('.world-controls').inert=true;tour.beginJourney?.();$('.hint').textContent='妖精と一緒に、工房へ';announce('妖精が工房へ案内します。');
  const start=state.view,t0=performance.now(),duration=reduced.matches?0:6500;
  let lastTravelFrame=-Infinity;function frame(t){if(state.phase!=='world'||!state.traveling)return;const p=duration?Math.min(1,(t-t0)/duration):1;if(t-lastTravelFrame>=16||p===1){if(tour.follow)tour.follow(p);else setView(start+(viewport.clientWidth*1.15/viewScale()-start)*p);lastTravelFrame=t;}
    if(p<1)requestAnimationFrame(frame);else{$('#fairySpeech').innerHTML='ありがとう工房に<br>着いたよ！';announce('ありがとう工房に到着しました。');later(()=>{state.traveling=false;state.gyroBase=null;show('workshopScreen','quiz');renderQuestion();},700);}
  }
  requestAnimationFrame(frame);
}
orb.onclick=goToWorkshop;orb.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();goToWorkshop();}});
function renderQuestion(){
  const i=state.answers.length,q=questions[i];$('#questionNum').textContent=`QUESTION ${i+1} / ${questions.length}`;$('#questionText').textContent=q.title;$('#quizProgress').style.width=`${i/questions.length*100}%`;$('#options').replaceChildren();
  q.choices.forEach((text,type)=>{const button=document.createElement('button');button.type='button';button.className='option';button.textContent=text;button.onclick=()=>answer(type,button);$('#options').append(button);});
  focus($('#questionText'));announce(`${i+1}問目。${q.title}`);
}
function sparkFrom(el){
  if(reduced.matches)return 0;
  const r=el.getBoundingClientRect(),g=$('#gift').getBoundingClientRect(),tx=g.left+g.width/2,ty=g.top+g.height*.58;
  for(let i=0;i<56;i++){
    const dot=document.createElement('i');dot.className='particle answer-spark';dot.textContent=i%3===0?'✦':'';
    const x=r.left+r.width*(.2+.6*(i%13)/12),y=r.top+r.height/2+Math.sin(i*2.4)*12,dx=tx-x+Math.sin(i)*18,dy=ty-y+Math.cos(i)*16,delay=i%8*30;
    dot.style.left=`${x}px`;dot.style.top=`${y}px`;dot.style.setProperty('--dx',`${dx}px`);dot.style.setProperty('--dy',`${dy}px`);dot.style.setProperty('--mx',`${dx*.5+Math.sin(i*1.9)*65}px`);dot.style.setProperty('--my',`${dy*.5-40-Math.cos(i)*30}px`);dot.style.setProperty('--spark-delay',`${delay}ms`);dot.style.setProperty('--spark-duration',`${1000-delay}ms`);dot.style.setProperty('--spark-size',`${i%3===0?14+i%5:3+i%5}px`);
    $('#particles').append(dot);later(()=>dot.remove(),1050);
  }
  return 1000;
}
function giftArrival(){
  if(reduced.matches)return;
  const gift=$('#gift');gift.classList.remove('receiving');void gift.offsetWidth;gift.classList.add('receiving');later(()=>gift.classList.remove('receiving'),650);
  const r=gift.getBoundingClientRect();for(let i=0;i<24;i++){const dot=document.createElement('i');dot.className='particle arrival-spark';dot.textContent='✦';dot.style.left=`${r.left+r.width/2}px`;dot.style.top=`${r.top+r.height*.58}px`;dot.style.setProperty('--dx',`${Math.cos(i*2.4)*(65+i*3)}px`);dot.style.setProperty('--dy',`${Math.sin(i*2.4)*(65+i*3)}px`);$('#particles').append(dot);later(()=>dot.remove(),800);}
}
function answer(index,el){
  if(state.phase!=='quiz'||el.disabled)return;for(const button of $('#options').children)button.disabled=true;el.classList.add('selected');
  const arrival=sparkFrom(el),previous=[...state.answers];state.answers.push(index);const firstAnswer=state.answers.length===1;
  if(firstAnswer)$('#gift').innerHTML=giftSvg(previous,{open:true,opening:true});
  later(()=>{
    $('#gift').innerHTML=giftSvg(state.answers,firstAnswer?{open:true,sparkles:true}:{});giftArrival();
    if(firstAnswer)later(()=>{$('#gift').innerHTML=giftSvg(state.answers,{closing:true});},750);
  },arrival);
  $('#quizProgress').style.width=`${state.answers.length/questions.length*100}%`;
  later(()=>{if(state.answers.length<questions.length)renderQuestion();else finishQuiz();},firstAnswer?2400:1700);
}
function finishQuiz(){
  state.type=types[resultIndex(state.answers)];show('workshopScreen','gift');$('#quizWrap').hidden=true;
  $('.workshop-bubble').innerHTML='できた！<br>あなたへのプレゼント。';
  later(()=>{
    show('workshopScreen','gift-shake');$('#gift').classList.add('shake');
    $('.workshop-bubble').textContent='何か変…？';announce('プレゼントが揺れています。何か変…？');
    later(inflateGift,5000,{readable:true});
  },1200);
}
function inflateGift(){
  show('workshopScreen','gift-inflate');$('#gift').classList.remove('shake');$('#gift').classList.add('inflate');
  later(releaseThankYouPower,1200);
}
function releaseThankYouPower(){
  show('workshopScreen','power');const gift=$('#gift'),r=gift.getBoundingClientRect();
  const burst=$('#powerBurst');burst.style.setProperty('--power-x',`${r.left+r.width/2}px`);burst.style.setProperty('--power-y',`${r.top+r.height/2}px`);
  gift.classList.remove('inflate');gift.classList.add('explode');burst.classList.add('active');
  announce('プレゼントが弾け、ありがとうパワーがあふれました。');
  later(()=>{burst.classList.remove('active');startStrokeStage();},3000,{readable:true});
}
function startStrokeStage(){show('workshopScreen','stroke');$('#strokeWrap').style.display='flex';$('.workshop-room').inert=true;$('#strokeFairy').setAttribute('aria-valuenow','0');focus($('#strokeFairy'));announce('妖精を左右になでてください。キーボードでは左右の矢印キーを交互に押してください。');}
function addStroke(ms){if(state.phase!=='stroke')return;state.strokeTime=Math.min(3500,state.strokeTime+ms);$('#strokeWrap').style.setProperty('--power-progress',state.strokeTime/3500);const pct=Math.round(state.strokeTime/3500*100);$('#strokeBar').style.width=`${pct}%`;$('#strokeFairy').setAttribute('aria-valuenow',String(pct));if(pct===100)transformFairy();}
const stroke=$('#strokeFairy');
stroke.addEventListener('pointerdown',e=>{state.strokeDown=true;state.strokeX=e.clientX;state.strokeLast=performance.now();stroke.setPointerCapture(e.pointerId);});
stroke.addEventListener('pointermove',e=>{if(!state.strokeDown||state.phase!=='stroke')return;const now=performance.now();if(Math.abs(e.clientX-state.strokeX)>1)addStroke(Math.min(100,now-state.strokeLast));state.strokeX=e.clientX;state.strokeLast=now;});
for(const event of ['pointerup','pointercancel','lostpointercapture'])stroke.addEventListener(event,()=>{state.strokeDown=false;state.strokeLast=null;});
let lastStrokeKey=null;stroke.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();if(!e.repeat&&e.key!==lastStrokeKey){lastStrokeKey=e.key;addStroke(250);}}});
function transformFairy(){
  show('workshopScreen','transform');announce('ありがとうパワーが満ちて、妖精が進化します。');
  $('#flash').classList.add('go');later(()=>$('#flash').classList.remove('go'),1500);
  later(()=>{
    show('transformScreen','evolved');mountFairy('#evolvedFairy',state.type);mountFairy('#combinedFairyVisual',state.type);
    $('#evolvedFairy').className='evolved-fairy center-still';
    for(const prefix of ['fairyInfo','combined']){
      const title=$(`#${prefix}Title`);title.replaceChildren();
      for(const text of [`${state.type.label}タイプ`, `「${state.type.name}」`]){const span=document.createElement('span');span.textContent=text;title.append(span);}
      $(`#${prefix}Desc`).textContent=state.type.desc;$(`#${prefix}Wish`).textContent=state.type.wish;
      const strengths=$(`#${prefix}Strengths`);strengths.replaceChildren();
      state.type.strengths.split('・').forEach((text,i)=>{if(i)strengths.append(document.createTextNode('・'));const span=document.createElement('span');span.textContent=text;strengths.append(span);});
    }
    announce('妖精が進化しました。');prepareExport();
    later(()=>{
      show('transformScreen','profile');$('#evolvedFairy').className='evolved-fairy move-to-top';
      $('#fairyInfoCard').classList.add('show');focus($('#fairyInfoTitle'));
      announce(`あなたは${state.type.label}タイプ、${state.type.name}です。`);
    },reduced.matches?2000:2950,{readable:true});
  },550);
}
function magicParticles(container,count){container.replaceChildren();for(let i=0;i<count;i++){const star=document.createElement('i');star.className='magic-star fly';star.style.left='50%';star.style.top='40%';star.style.setProperty('--sx',`${(Math.random()-.5)*700}px`);star.style.setProperty('--sy',`${(Math.random()-.5)*600}px`);star.style.animationDelay=`${Math.random()*1.5}s`;container.append(star);}}
$('#fairyInfoNext').onclick=()=>{
  if(state.phase!=='profile')return;
  show('transformScreen','magic');mountFairy('#magicFairyClone',state.type);
  $('.magic-copy').textContent='妖精が、感謝の魔法をかけています…';
  $('#magicFullscreen').classList.add('active');$('#magicFairyClone').className='evolved-fairy reveal spin-cast cast';
  $('#magicFairyFloat').classList.remove('offering');$('#offeredCard').className='offered-card';
  $('#magicRing').className='magic-ring go';magicParticles($('#magicStarfield'),reduced.matches?0:64);
  announce('妖精が舞いながら、感謝の魔法をかけています。');
  later(beginCardHandoff,6500);
};
function beginCardHandoff(){
  show('transformScreen','handoff');$('#magicFairyClone').className='evolved-fairy reveal';
  $('#magicFairyFloat').classList.add('offering');$('#offeredCard').classList.add('appear');
  $('.magic-copy').textContent='妖精から、あなたへ。';announce('妖精が感謝のカードを差し出しています。');
  later(()=>{$('#offeredCard').classList.add('deliver');},1000);
  later(()=>{
    $('#magicFullscreen').classList.remove('active');show('transformScreen','gratitude');
    $('#evolvedFairy').className='evolved-fairy handoff-visible handing';
    $('#gratitudeCard').className='gratitude-card handoff materialize';focus($('#gratitudeTitle'));
    announce('妖精から感謝のカードが届きました。');
  },2400);
}
$('#gratitudeNext').onclick=()=>{if(state.phase!=='gratitude')return;show('transformScreen','combined');$('#combinedCard').classList.add('show');$('#combinedActions').classList.add('show');focus($('#combinedTitle'));announce('カードが完成しました。保存、シェア、再診断ができます。');};
function reset(){
  cancelTimers();exportGeneration++;if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}$('#finalCardPreview').hidden=true;$('#finalCardPreview').removeAttribute('src');$('#cardPreviewLoading').hidden=false;$('#cardPreviewLoading').textContent='カードを仕上げています…';$('#cardTextFallback').classList.add('sr-only');state.answers=[];state.found=false;state.traveling=false;state.drag=null;state.strokeTime=0;state.strokeDown=false;state.strokeLast=null;state.gyroBase=null;state.exportBlob=null;exportPromise=null;lastStrokeKey=null;
  for(const id of ['#fairyInfoCard','#gratitudeCard','#combinedCard']){const e=$(id);e.classList.remove('show','handoff','materialize');e.removeAttribute('style');}
  $('#offeredCard').className='offered-card';$('#magicFairyFloat').classList.remove('offering');$('.magic-copy').textContent='妖精が、感謝の魔法をかけています…';$('#combinedActions').classList.remove('show');$('#magicFullscreen').classList.remove('active');$('#flash').classList.remove('go');$('#strokeWrap').style.display='none';$('#strokeBar').style.width='0';$('#strokeWrap').style.removeProperty('--power-progress');$('#powerBurst').classList.remove('active');$('.workshop-room').inert=false;$('#quizWrap').hidden=false;$('#gift').className='gift';$('#gift').removeAttribute('style');$('#gift').innerHTML=giftSvg([]);$('.workshop-bubble').innerHTML='あなたのこと、<br>少しだけ教えて！';for(const id of ['#fairySpeech','#tapLabel','#tapRing'])$(id).style.display='none';$('#particles').replaceChildren();$('#magicStarfield').replaceChildren();orb.tabIndex=-1;$('.hint').textContent='周りを見渡してみて';show('worldScreen','world');initialPan();focus(viewport);announce('もう一度、妖精を探しましょう。');
}
$('#retryBtn').onclick=reset;
function prepareExport(){
  const type=state.type,run=++exportGeneration,url=shareUrl(config.publicUrl,location.href);
  exportPromise=renderCard(type,config,url).then(blob=>{if(run===exportGeneration)state.exportBlob=blob;return blob;}).catch(error=>{console.warn('Card export unavailable:',error.message);return null;});
  void renderCard(type,config,url,{includeShareDetails:false}).then(blob=>{
    if(run!==exportGeneration)return;
    if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(blob);
    $('#finalCardPreview').src=previewUrl;$('#finalCardPreview').alt=`${type.label}の妖精「${type.name}」のクリスマスカード。${type.wish}`;
    $('#finalCardPreview').hidden=false;$('#cardPreviewLoading').hidden=true;
  }).catch(()=>{if(run===exportGeneration){$('#cardPreviewLoading').hidden=true;$('#cardTextFallback').classList.remove('sr-only');}});
}
async function getExport(){if(state.exportBlob)return state.exportBlob;if(exportPromise){const blob=await exportPromise;if(blob)return blob;}const blob=await renderCard(state.type,config,shareUrl(config.publicUrl,location.href));state.exportBlob=blob;return blob;}
async function busy(button,task){if(button.disabled)return;button.disabled=true;button.setAttribute('aria-busy','true');try{await task();}catch(error){if(error.name!=='AbortError')toast('処理できませんでした。もう一度お試しください。');}finally{button.disabled=false;button.removeAttribute('aria-busy');}}
$('#saveBtn').onclick=()=>busy($('#saveBtn'),async()=>{downloadBlob(await getExport(),`christmas-fairy-${state.type.id}.png`);toast('カードを保存しました。ダウンロードを確認してください。');});
$('#shareBtn').onclick=()=>busy($('#shareBtn'),async()=>{
  const url=shareUrl(config.publicUrl,location.href),text=`私は「${state.type.label}タイプ」の${state.type.name}でした。あなたはどの妖精？`,blob=state.exportBlob;
  if(navigator.share){const file=blob?new File([blob],`christmas-fairy-${state.type.id}.png`,{type:'image/png'}):null;await navigator.share(file&&navigator.canShare?.({files:[file]})?{title:'あなたはどの妖精？',text,url,files:[file]}:{title:'あなたはどの妖精？',text,url});}
  else{try{await navigator.clipboard.writeText(url);downloadBlob(await getExport(),`christmas-fairy-${state.type.id}.png`);toast('カードを保存し、URLをコピーしました。');}catch{$('#shareUrl').value=url;$('#shareDialog').showModal();focus($('#shareUrl'));$('#shareUrl').select();}}
});
$('#closeShare').onclick=()=>$('#shareDialog').close();$('#downloadFallback').onclick=()=>$('#saveBtn').click();
window.addEventListener('resize',()=>{state.view=tour.yaw/viewScale()*viewport.clientWidth;state.gyroBase=null;tour.render();});
window.addEventListener('orientationchange',()=>{state.gyroBase=null;});
for(let i=0;i<16;i++){const mote=document.createElement('i');mote.textContent=i%3?'✦':'✧';mote.style.setProperty('--mote-angle',`${i*360/16}deg`);mote.style.setProperty('--mote-delay',`${i*.19}s`);$('#thankYouMotes').append(mote);}
for(let i=0;i<34;i++){const dot=document.createElement('i');dot.style.left=`${Math.random()*100}%`;dot.style.top=`${Math.random()*100}%`;$('.ornaments').append(dot);}
show('intro','intro');syncSound();

function updateTourVisibleArea(){
  const visible=window.visualViewport;
  document.documentElement.style.setProperty('--world-visible-bottom',`${visible?visible.height+visible.offsetTop:window.innerHeight}px`);
}
window.visualViewport?.addEventListener('resize',updateTourVisibleArea);
window.visualViewport?.addEventListener('scroll',updateTourVisibleArea);
window.addEventListener('resize',updateTourVisibleArea);
updateTourVisibleArea();
