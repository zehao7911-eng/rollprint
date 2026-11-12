import {levels,marks,directions,saveKey,profile,merge,startRun,preview,roll,undo,bank} from './core.mjs';
import {makeView} from './view.mjs';
import {makeAudio} from './audio.mjs';
import {bridge} from './sdk.mjs';

const $=id=>document.getElementById(id);
const shell=$('game');
const view=makeView($('scene'));
const audio=makeAudio();
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const introLength=3.65,outroLength=3.8;
let data=load();
let run=restoreRun(data);
let mode=data.last&&!data.run?'result':'ready';
let elapsed=0,stampAge=-1,animation=null,lastTick=0,lastFrame=0,gesture=null,interacted=false;
let sdk,support={like:false,comment:false};

function load(){
  try{return profile(JSON.parse(localStorage.getItem(saveKey)));}
  catch{return profile();}
}
function restoreRun(saved){
  if(saved.run)return saved.run;
  if(!saved.last)return startRun(saved.at);
  const {level,pose,moves}=saved.last;
  return {...startRun(level),...pose,ink:levels[level].full,moves};
}
function save(cloud=true){
  try{localStorage.setItem(saveKey,JSON.stringify(data));}
  catch{ /* Play continues in memory. */ }
  if(cloud)sdk?.save();
}
function viewport(){
  const width=sdk?.viewport()?.width;
  if(width>=280)shell.style.setProperty('--host-width',Math.min(width,innerWidth)+'px');
  else shell.style.removeProperty('--host-width');
  view.resize();
}
function connect(){
  sdk=bridge({
    read:()=>profile(data),
    write(raw,remote){
      const fresh=!interacted&&!data.run&&['ready','result'].includes(mode);
      data=remote?merge(data,raw,fresh):profile(raw);
      if(fresh&&remote){
        run=restoreRun(data);
        mode=data.last&&!data.run?'result':'ready';
      }
      save(false);
      renderUI();
    },
    changed(event){
      if(event.type==='connected'){
        support={like:false,comment:false};
        requestAnimationFrame(viewport);
      }
      if(event.type==='support')support={like:event.like,comment:event.comment};
      renderRewards();
    }
  });
}

const undoIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6 3 11l5 5M3 11h10a5 5 0 1 1 0 10"/></svg>';
function renderSound(){
  const waves=data.mute?'<path d="m16 9 5 6m0-6-5 6"/>':'<path d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>';
  $('sound').innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9z"/>${waves}</svg>`;
  $('sound').setAttribute('aria-label',data.mute?'Unmute sound':'Mute sound');
  $('sound').setAttribute('aria-pressed',String(data.mute));
}
function renderRewards(){
  const rows=[];
  if(data.rewards.like)rows.push('Gold ink sparks unlocked');
  else if(support.like)rows.push('Like in GameWave for gold sparks');
  if(data.rewards.comment)rows.push('Extra confetti unlocked');
  else if(support.comment)rows.push('Comment in GameWave for extra confetti');
  $('rewards').hidden=mode!=='result'||rows.length===0;
  $('rewards').textContent=rows.join(' · ');
}
function renderUI(){
  const level=levels[run.level];
  const progress=animation?.previous||run;
  const isCinema=mode==='intro'||mode==='outro';
  shell.classList.toggle('is-cinematic',isCinema);
  const result=mode==='result'?data.last:null;
  $('job').textContent=`${run.level+1} / ${levels.length} · ${level.name}`;
  const moves=result?.moves??progress.moves;
  $('moves').textContent=`${moves} ${moves===1?'MOVE':'MOVES'}`;
  $('marks').innerHTML=level.targets.map((target,i)=>{
    const mark=marks[target.mark],done=!!result||!!(progress.ink&(1<<i));
    return `<i class="${done?'done':''}" style="--paint:${mark.color}" aria-label="${mark.name}${done?' printed':''}">${mark.sign}</i>`;
  }).join('');
  $('undo').disabled=mode!=='play'||!run.history.length||!!animation;
  $('panel').hidden=!['ready','pause','result'].includes(mode);
  $('cinema').hidden=!isCinema;
  $('scene-caption').textContent=mode==='intro'?'Your first proof is ready.':'Proof approved.';
  $('hint').hidden=isCinema;
  $('hint').textContent=mode==='play'?'Swipe or tap a neighboring tile.':'Match the marks to print.';
  if(mode==='play'&&run.level===0&&!animation){
    const guide=Object.keys(directions).find(name=>preview(run,name)?.stamped);
    if(guide)$('hint').textContent='Swipe '+{N:'up',E:'right',S:'down',W:'left'}[guide]+' to print.';
  }
  if(mode==='ready'){
    $('panel-title').textContent=data.run?'Back to the press':'Ready to roll?';
    $('panel-copy').textContent=data.run?'Your tiles and moves are saved.':'Roll the robot onto matching print tiles.';
    $('primary').textContent=data.run?'Resume':'Play';
  }else if(mode==='pause'){
    $('panel-title').textContent='Paused';
    $('panel-copy').textContent='Pick up where you stopped.';
    $('primary').textContent='Continue';
  }else if(mode==='result'){
    const final=result.level===levels.length-1;
    $('panel-title').textContent=final?'Edition complete!':'Proof approved!';
    $('panel-copy').textContent=`${'★'.repeat(result.stars)}  ·  ${result.moves} ${result.moves===1?'move':'moves'}`;
    $('primary').textContent=final?'Play again':'Next job';
  }
  renderSound();
  renderRewards();
}
function transition(next){
  mode=next;
  elapsed=0;
  renderUI();
}
function showToast(copy){
  $('toast').textContent=copy;
  $('toast').hidden=false;
  stampAge=0;
}
function clearToast(){
  $('toast').hidden=true;
  stampAge=-1;
}
function begin(){
  interacted=true;
  audio.start();
  if(data.run){
    transition('play');
    return;
  }
  if(run.level===0&&!reduced){
    audio.cue('boot');
    transition('intro');
  }else transition('play');
}
function nextJob(){
  sdk?.prepare();
  const next=(data.last.level+1)%levels.length;
  data={...data,at:next,last:null};
  run=startRun(next);
  clearToast();
  save();
  begin();
}
function finishScene(){
  if(mode==='intro')transition('play');
  else if(mode==='outro'){
    audio.pause();
    transition('result');
  }
}
function menuAction(){
  if(mode==='ready')begin();
  else if(mode==='result')nextJob();
  else if(mode==='pause'){
    audio.start();
    transition('play');
  }
}
function move(name){
  if(mode!=='play'||animation)return;
  const result=roll(run,name);
  if(!result){
    audio.cue('no');
    return;
  }
  sdk?.start();
  const previous=run;
  run=result.run;
  animation={previous,name,fraction:0,stamped:result.stamped,complete:result.complete};
  if(result.complete){
    data=bank(data,run);
    sdk?.end();
  }else data={...data,run,last:null};
  save();
  audio.cue('roll');
  renderUI();
}
function settleRoll(){
  const event=animation;
  animation=null;
  if(event.stamped){
    audio.cue(event.complete?'proof':'stamp');
    showToast(event.complete?'PROOF APPROVED':'PRINTED!');
  }
  if(event.complete){
    clearToast();
    if(reduced){
      audio.pause();
      transition('result');
    }else transition('outro');
  }else renderUI();
}
function undoMove(){
  if(mode!=='play'||animation||!run.history.length)return;
  run=undo(run);
  data={...data,run,last:null};
  clearToast();
  save();
  renderUI();
}
function pause(){
  gesture=null;
  audio.pause();
  if(mode==='play')transition('pause');
}
function frame(now){
  const dt=lastTick?Math.min(.06,(now-lastTick)/1000):0;
  lastTick=now;
  if(!document.hidden&&mode!=='pause'){
    elapsed+=dt;
    if(stampAge>=0){
      stampAge+=dt;
      if(stampAge>.82)clearToast();
    }
    if(animation){
      animation.fraction=Math.min(1,animation.fraction+dt/(reduced?.08:.26));
      if(animation.fraction===1)settleRoll();
    }
    if(mode==='intro'&&elapsed>=introLength||mode==='outro'&&elapsed>=outroLength)finishScene();
  }
  const interval=['play','intro','outro'].includes(mode)?26:48;
  if(!document.hidden&&(!lastFrame||now-lastFrame>=interval)){
    lastFrame=now;
    view.render({run,mode,elapsed,animation,stampAge,rewards:data.rewards});
  }
  requestAnimationFrame(frame);
}

$('undo').innerHTML=undoIcon;
$('undo').addEventListener('click',undoMove);
$('primary').addEventListener('click',menuAction);
$('skip').addEventListener('click',finishScene);
$('sound').addEventListener('click',()=>{
  data={...data,mute:!data.mute};
  audio.mute(data.mute);
  if(!data.mute&&['play','intro','outro'].includes(mode))audio.start();
  save();
  renderSound();
});
shell.addEventListener('pointerdown',e=>{
  if(e.target!==view.canvas()||e.button!==0||mode!=='play'||animation||gesture)return;
  gesture={id:e.pointerId,x:e.clientX,y:e.clientY};
  try{shell.setPointerCapture(e.pointerId);}catch{ /* Release over the canvas still works. */ }
  e.preventDefault();
});
shell.addEventListener('pointerup',e=>{
  if(gesture?.id!==e.pointerId)return;
  const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
  gesture=null;
  if(Math.hypot(dx,dy)>=17){
    move(Math.abs(dx)>Math.abs(dy)?dx>0?'E':'W':dy>0?'S':'N');
    return;
  }
  const cell=view.hitTile(e.clientX,e.clientY);
  if(!cell)return;
  const direction=Object.entries(directions).find(([,d])=>run.x+d.x===cell.x&&run.z+d.z===cell.z)?.[0];
  if(direction)move(direction);
});
for(const type of ['pointercancel','lostpointercapture']){
  shell.addEventListener(type,e=>{if(gesture?.id===e.pointerId)gesture=null;});
}
document.addEventListener('keydown',e=>{
  if(e.altKey||e.metaKey||e.ctrlKey)return;
  if(e.key==='Escape'){
    if(mode==='intro'||mode==='outro')finishScene();
    else if(mode==='play')pause();
    else if(mode==='pause')menuAction();
    return;
  }
  const name={ArrowUp:'N',ArrowRight:'E',ArrowDown:'S',ArrowLeft:'W',w:'N',d:'E',s:'S',a:'W'}[e.key];
  if(!name||mode!=='play')return;
  e.preventDefault();
  move(name);
});
window.addEventListener('blur',()=>{
  if(mode==='play')pause();
});
document.addEventListener('visibilitychange',()=>{
  lastTick=0;
  if(document.hidden){
    pause();
  }else{
    sdk?.connect();
    if(mode==='intro'||mode==='outro')audio.start();
  }
});
window.addEventListener('resize',viewport);
window.addEventListener('pagehide',()=>{
  audio.pause();
  sdk?.stop();
  sdk=null;
});
window.addEventListener('pageshow',e=>{
  if(!e.persisted)return;
  data=load();
  run=restoreRun(data);
  mode=data.last&&!data.run?'result':'ready';
  elapsed=0;
  animation=null;
  gesture=null;
  clearToast();
  connect();
  viewport();
  renderUI();
});

audio.mute(data.mute);
connect();
viewport();
renderUI();
requestAnimationFrame(frame);
