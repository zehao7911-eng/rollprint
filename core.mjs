export const saveKey = 'rollprint-v1';
export const marks = [
  {name:'Sun', sign:'☀', color:'#ffbe31'},
  {name:'Wave', sign:'≈', color:'#27d7f4'},
  {name:'Star', sign:'★', color:'#fd5e83'},
  {name:'Bolt', sign:'ϟ', color:'#b295ff'},
  {name:'Leaf', sign:'◆', color:'#76de84'},
  {name:'Ring', sign:'●', color:'#ff8a51'}
];
export const directions = {
  N:{x:0,z:-1, permutation:[4,2,0,3,1,5]},
  E:{x:1,z:0, permutation:[5,3,2,0,4,1]},
  S:{x:0,z:1, permutation:[2,4,1,3,0,5]},
  W:{x:-1,z:0, permutation:[3,5,2,1,4,0]}
};
const designs = [
  {name:'First Proof', map:['.###.','#####','#####','.###.'], start:[1,2], route:'NE', stamps:[1,2], district:0},
  {name:'Side Street', map:['#####','#####','#####','#####'], start:[1,2], route:'NEES', stamps:[2,4], district:0},
  {name:'Corner Cut', map:['.####','#####','###.#','#####'], start:[1,3], route:'NNEEN', stamps:[2,4,5], district:1},
  {name:'Double Back', map:['#####','#.###','#####','#####'], start:[1,2], route:'ESENNW', stamps:[2,4,6], district:1},
  {name:'Cross Grain', map:['#####','#####','.#.##','#####'], start:[1,3], route:'EEENNWW', stamps:[2,5,7], district:2},
  {name:'Final Edition', map:['#####','#####','#.#.#','#####'], start:[2,3], route:'NNWNEESE', stamps:[2,4,6,8], district:2}
];
export const identity=[0,1,2,3,4,5];
export const levels=designs.map(spec=>{
  let [x,z]=spec.start;
  let faces=identity;
  const targets=[];
  for(let i=0;i<spec.route.length;i++){
    const move=directions[spec.route[i]];
    x+=move.x;
    z+=move.z;
    if(spec.map[z]?.[x]!=='#')throw new Error('Invalid author route: '+spec.name);
    faces=move.permutation.map(index=>faces[index]);
    if(spec.stamps.includes(i+1))targets.push({x,z,mark:faces[1]});
  }
  return {...spec,targets,full:(1<<targets.length)-1,par:spec.route.length};
});

export function startRun(level) {
  const [x,z]=levels[level].start;
  return {level,x,z,faces:[...identity],ink:0,moves:0,history:[]};
}

function natural(value,maximum) {
  return Number.isInteger(value)?Math.max(0,Math.min(maximum,value)):0;
}

const orientations=new Set();
const spins=[identity];
for(let i=0;i<spins.length;i++){
  const faces=spins[i];
  const hash=faces.join('');
  if(orientations.has(hash))continue;
  orientations.add(hash);
  for(const move of Object.values(directions))spins.push(move.permutation.map(index=>faces[index]));
}

export function preview(run,name) {
  const direction=directions[name];
  if(!direction)return null;
  const level=levels[run.level];
  const x=run.x+direction.x,z=run.z+direction.z;
  if(level.map[z]?.[x]!=='#')return null;
  const faces=direction.permutation.map(index=>run.faces[index]);
  const id=level.targets.findIndex(t=>t.x===x&&t.z===z&&t.mark===faces[1]);
  const ink=id<0?run.ink:run.ink|(1<<id);
  return {x,z,faces,ink,moves:Math.min(9999,run.moves+1),stamped:ink!==run.ink};
}

export function roll(run,name) {
  const next=preview(run,name);
  if(!next||run.ink===levels[run.level].full)return null;
  const {level,history,x,z,faces,ink,moves}=run;
  const {stamped,...progress}=next;
  return {run:{level,...progress,history:[...history,{x,z,faces,ink,moves}].slice(-48)},stamped,complete:next.ink===levels[level].full};
}

export function undo(run) {
  if(!run.history.length||run.ink===levels[run.level].full)return run;
  return {level:run.level,...run.history.at(-1),history:run.history.slice(0,-1)};
}

function cleanPosition(raw,level) {
  if(!raw||!Number.isInteger(raw.x)||!Number.isInteger(raw.z)||level.map[raw.z]?.[raw.x]!=='#')return null;
  if(!Array.isArray(raw.faces)||raw.faces.length!==6||!orientations.has(raw.faces.join(''))||raw.faces.some(n=>!Number.isInteger(n)))return null;
  return {x:raw.x,z:raw.z,faces:[...raw.faces],ink:natural(raw.ink,level.full),moves:natural(raw.moves,9999)};
}

export function profile(raw) {
  const p=raw&&typeof raw==='object'?raw:{};
  const best=levels.map((_,i)=>natural(p.best?.[i],3));
  const fewest=levels.map((_,i)=>natural(p.fewest?.[i],9999));
  const unlocked=Math.max(0,...best.map((value,i)=>value?Math.min(i+1,levels.length-1):0));
  const at=natural(p.at,unlocked);
  let run=null;
  if(p.run&&Number.isInteger(p.run.level)&&p.run.level>=0&&p.run.level<=unlocked){
    const level=levels[p.run.level];
    const current=cleanPosition(p.run,level);
    if(current&&current.ink!==level.full){
      const history=Array.isArray(p.run.history)?p.run.history.slice(-48).map(s=>cleanPosition(s,level)).filter(s=>s&&s.ink!==level.full):[];
      run={level:p.run.level,...current,history};
    }
  }
  const last=p.last&&Number.isInteger(p.last.level)&&p.last.level>=0&&p.last.level<=unlocked&&best[p.last.level]>0?
    {level:p.last.level,moves:natural(p.last.moves,9999),stars:natural(p.last.stars,3),pose:cleanPosition(p.last.pose,levels[p.last.level])}:null;
  return {best,fewest,unlocked,at,run,last,mute:p.mute===true,rewards:{like:p.rewards?.like===true,comment:p.rewards?.comment===true}};
}

export function merge(local,raw,allowResume) {
  const remote=profile(raw);
  return profile({
    ...local,
    best:local.best.map((value,i)=>Math.max(value,remote.best[i])),
    fewest:local.fewest.map((value,i)=>value&&remote.fewest[i]?Math.min(value,remote.fewest[i]):value||remote.fewest[i]),
    at:allowResume?Math.max(local.at,remote.at):local.at,
    run:local.run||(allowResume?remote.run:null),
    last:local.last||(allowResume?remote.last:null),
    rewards:{like:local.rewards.like||remote.rewards.like,comment:local.rewards.comment||remote.rewards.comment}
  });
}

export function bank(data,run) {
  const level=levels[run.level];
  if(run.ink!==level.full)return data;
  const stars=run.moves<=level.par?3:run.moves<=level.par+4?2:1;
  const best=[...data.best],fewest=[...data.fewest];
  best[run.level]=Math.max(best[run.level],stars);
  fewest[run.level]=fewest[run.level]?Math.min(fewest[run.level],run.moves):run.moves;
  return profile({...data,best,fewest,at:Math.min(run.level+1,levels.length-1),run:null,last:{level:run.level,moves:run.moves,stars,pose:run}});
}
