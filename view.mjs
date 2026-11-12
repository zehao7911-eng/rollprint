import {levels,marks,preview,directions} from './core.mjs';

const T=globalThis.THREE;
const pitch=1.22;
const palettes=[
  {sky:'#a9f7e8',bottom:'#54c3d6',floor:'#b5e0d7',metal:'#173857',rail:'#1379ad',accent:'#ffb932',detail:'#f5f3d7',under:'#2b87a5'},
  {sky:'#ffe5a4',bottom:'#f799b6',floor:'#f5b789',metal:'#64234c',rail:'#c84675',accent:'#ffe05a',detail:'#fff1ce',under:'#b95f91'},
  {sky:'#ddc9ff',bottom:'#8ca2f1',floor:'#bb9ae3',metal:'#3d2a66',rail:'#6549d9',accent:'#35ddc9',detail:'#eed9f0',under:'#7959d0'}
];
const box=new T.BoxGeometry(1,1,1);
const cylinder=new T.CylinderGeometry(1,1,1,16);
const ball=new T.SphereGeometry(1,12,9);
const plane=new T.PlaneGeometry(1,1);
const confettiGeometry=new T.OctahedronGeometry(1);
const cardGeometry=new T.PlaneGeometry(1,1);
const metal=(color,roughness=.53)=>new T.MeshStandardMaterial({color,roughness,metalness:.04});
const plain=(color,opacity=1)=>new T.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1});
const ivory=metal('#fff7dd',.47);
const ink=metal('#17344f',.66);
const steel=metal('#91bac1',.36);
const floorY=.045;

function add(parent,geometry,material,x,y,z,sx=1,sy=sx,sz=sx) {
  const mesh=new T.Mesh(geometry,material);
  mesh.position.set(x,y,z);
  mesh.scale.set(sx,sy,sz);
  parent.add(mesh);
  return mesh;
}

function tex(paint,size=256) {
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  paint(canvas.getContext('2d'),size);
  const texture=new T.CanvasTexture(canvas);
  texture.encoding=T.sRGBEncoding;
  texture.anisotropy=4;
  return texture;
}

function rounded(ctx,x,y,w,h,r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

function symbol(ctx,id,x,y,size,color) {
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(size,size);
  ctx.fillStyle=ctx.strokeStyle=color;
  ctx.lineWidth=.12;
  ctx.lineCap='round';
  ctx.lineJoin='round';
  ctx.beginPath();
  if(id===0){
    ctx.arc(0,0,.21,0,2*Math.PI);
    ctx.fill();
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;
      ctx.beginPath();ctx.moveTo(.31*Math.cos(a),.31*Math.sin(a));ctx.lineTo(.43*Math.cos(a),.43*Math.sin(a));ctx.stroke();
    }
  }else if(id===1){
    for(const yOffset of [-.13,.13]){
      ctx.beginPath();ctx.moveTo(-.42,yOffset);ctx.bezierCurveTo(-.13,yOffset-.25,.13,yOffset+.25,.42,yOffset);ctx.stroke();
    }
  }else if(id===2){
    for(let i=0;i<10;i++){
      const a=i*Math.PI/5-Math.PI/2,r=i%2?.20:.44;
      const xx=r*Math.cos(a),yy=r*Math.sin(a);
      if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
    }
    ctx.closePath();ctx.fill();
  }else if(id===3){
    [[.05,-.43],[-.34,.05],[-.04,.05],[-.12,.44],[.34,-.07],[.06,-.07]].forEach(([xx,yy],i)=>i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy));
    ctx.closePath();ctx.fill();
  }else if(id===4){
    ctx.moveTo(0,-.43);ctx.lineTo(.35,0);ctx.lineTo(0,.43);ctx.lineTo(-.35,0);ctx.closePath();ctx.fill();
  }else{
    ctx.arc(0,0,.31,0,2*Math.PI);ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,.09,0,2*Math.PI);ctx.fill();
  }
  ctx.restore();
}

function bolt(ctx,x,y) {
  ctx.fillStyle='#203850';ctx.beginPath();ctx.arc(x,y,9,0,2*Math.PI);ctx.fill();
  ctx.fillStyle='#c8d9d5';ctx.beginPath();ctx.arc(x,y,6,0,2*Math.PI);ctx.fill();
  ctx.strokeStyle='#425b68';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-3,y+2);ctx.lineTo(x+3,y-2);ctx.stroke();
}

const faceTextures=marks.map((mark,i)=>tex((ctx,s)=>{
  ctx.fillStyle='#f1f2df';ctx.fillRect(0,0,s,s);
  const gradient=ctx.createLinearGradient(17,13,245,241);
  gradient.addColorStop(0,'#fbfff0');gradient.addColorStop(.22,mark.color);gradient.addColorStop(1,mark.color);
  rounded(ctx,12,12,232,232,22);ctx.fillStyle='#12344e';ctx.fill();
  rounded(ctx,18,18,220,220,16);ctx.fillStyle=gradient;ctx.fill();
  rounded(ctx,30,30,196,196,12);ctx.strokeStyle='#ffffff9c';ctx.lineWidth=3;ctx.stroke();
  rounded(ctx,62,54,132,122,19);ctx.fillStyle='#153249';ctx.fill();
  rounded(ctx,68,59,120,110,15);ctx.fillStyle='#214c63';ctx.fill();
  symbol(ctx,i,128,114,83,'#fff5d1');
  ctx.fillStyle='#183e58';
  for(let x=91;x<165;x+=17){rounded(ctx,x,190,9,20,4);ctx.fill();}
  for(const x of [37,219])for(const y of [37,219])bolt(ctx,x,y);
  ctx.fillStyle='#e8fffa';
  rounded(ctx,36,110,10,36,4);ctx.fill();
  rounded(ctx,211,109,9,36,4);ctx.fill();
}));
const signs=marks.map((mark,i)=>tex((ctx,s)=>{
  rounded(ctx,8,8,s-16,s-16,31);ctx.fillStyle='#14334d';ctx.fill();
  rounded(ctx,17,17,s-34,s-34,24);ctx.strokeStyle=mark.color;ctx.lineWidth=5;ctx.stroke();
  symbol(ctx,i,s/2,s/2,s*.74,mark.color);
},128));
const signMaterials=signs.map(map=>new T.MeshBasicMaterial({map,transparent:true,depthWrite:false}));
const stampedMaterials=marks.map((mark,i)=>new T.MeshBasicMaterial({map:tex((ctx,s)=>{
  rounded(ctx,5,5,s-10,s-10,23);ctx.fillStyle=mark.color;ctx.fill();
  rounded(ctx,12,12,s-24,s-24,17);ctx.strokeStyle='#fff7d9';ctx.lineWidth=2;ctx.stroke();
  symbol(ctx,i,s/2,s/2,s*.75,'#16334d');
},128),transparent:true,depthWrite:false}));
const proofLabel=new T.MeshBasicMaterial({map:tex((ctx,s)=>{
  ctx.fillStyle='#fff5d5';
  ctx.fillRect(0,0,s,s);
  ctx.fillStyle='#14334d';
  ctx.font='900 41px system-ui';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText('APPROVED',s/2,s*.52);
  ctx.strokeStyle='#1c7d8d';
  ctx.lineWidth=3;
  ctx.strokeRect(11,s*.33,s-22,s*.33);
}),transparent:false});
const shadowTexture=tex((ctx,s)=>{
  const gradient=ctx.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
  gradient.addColorStop(0,'#10243f9c');gradient.addColorStop(.48,'#10243f57');gradient.addColorStop(1,'#10243f00');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,s,s);
},64);
const backgrounds=palettes.map(p=>tex((ctx,s)=>{
  const gradient=ctx.createLinearGradient(0,0,s*.33,s);
  gradient.addColorStop(0,p.sky);
  gradient.addColorStop(.62,p.sky);
  gradient.addColorStop(1,p.bottom);
  ctx.fillStyle=gradient;
  ctx.fillRect(0,0,s,s);
  ctx.strokeStyle='#ffffff30';
  ctx.lineWidth=1;
  for(let i=-s;i<s*2;i+=s/13){
    ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+s*.3,s);ctx.stroke();
  }
},512));

function deckCard(parent,mat,x,y,z,size) {
  const card=add(parent,cardGeometry,mat,x,y,z,size);
  card.rotation.x=-Math.PI/2;
  return card;
}

function roundedCube(size,radius) {
  const geometry=new T.BoxGeometry(size,size,size,8,8,8);
  const a=geometry.getAttribute('position');
  const vertex=new T.Vector3(),corner=new T.Vector3();
  const inset=size/2-radius;
  for(let i=0;i<a.count;i++){
    vertex.fromBufferAttribute(a,i);
    corner.copy(vertex).clampScalar(-inset,inset);
    vertex.sub(corner).normalize().multiplyScalar(radius).add(corner);
    a.setXYZ(i,vertex.x,vertex.y,vertex.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function buildRobot(scene) {
  const robot=new T.Group();
  scene.add(robot);
  add(robot,roundedCube(1.08,.097),ivory,0,0,0);
  const faceNormals=[[0,1,0],[0,-1,0],[0,0,-1],[1,0,0],[0,0,1],[-1,0,0]];
  const zNormal=new T.Vector3(0,0,1);
  const lamp=plain('#c0fff3');
  for(let i=0;i<faceNormals.length;i++){
    const n=new T.Vector3(...faceNormals[i]);
    const face=new T.Group();
    robot.add(face);
    face.position.copy(n).multiplyScalar(.538);
    face.quaternion.setFromUnitVectors(zNormal,n);
    add(face,box,ink,0,0,.002,.91,.91,.02);
    add(face,plane,new T.MeshStandardMaterial({map:faceTextures[i],roughness:.54}),0,0,.014,.895,.895,1);
    for(const side of [-1,1])add(face,box,steel,side*.464,0,-.017,.06,.38,.056);
    for(const side of [-1,1])add(face,ball,lamp,side*.061,.339,.020,.019,.013,.010);
  }
  return robot;
}

function stageFor(scene) {
  const stage=new T.Group();
  scene.add(stage);
  const materials={floor:metal('#b5e0d7'),metal:metal('#173857'),rail:metal('#1379ad'),accent:metal('#ffb932'),detail:metal('#f5f3d7'),under:metal('#2b87a5')};
  const {floor,metal:base,rail,accent,detail,under}=materials;
  add(stage,roundedCube(1,.058),base,0,-.43,.05,7.38,.62,6.55);
  add(stage,roundedCube(1,.058),rail,0,-.17,.05,7.48,.31,6.60);
  add(stage,box,floor,0,-.058,.05,7.10,.11,6.33);
  add(stage,box,base,0,-1.22,.05,6.54,.19,5.76);
  for(const x of [-2.86,2.86])for(const z of [-2.54,2.54]){
    add(stage,cylinder,base,x,-.81,z,.30,.79,.30);
    add(stage,cylinder,steel,x,-.85,z,.37,.13,.37);
    add(stage,cylinder,accent,x,-1.10,z,.42,.14,.42);
  }
  for(const x of [-3.46,3.46]){
    add(stage,box,base,x,.14,-.09,.16,.29,5.69);
    add(stage,box,accent,x,.30,-.09,.15,.032,5.62);
    for(let i=0;i<5;i++){
      add(stage,box,detail,x,.322,-2.30+i*1.12,.15,.043,.13);
      add(stage,cylinder,steel,x*.98,-.10,-2.29+i*1.12,.075,.071,.075);
    }
  }
  for(const x of [-2.52,2.52]){
    add(stage,box,base,x,-.23,3.34,1.03,.235,.074);
    for(let i=0;i<6;i++)add(stage,box,rail,x-.38+i*.15,-.23,3.385,.09,.105,.031);
    add(stage,box,accent,x,-.10,3.34,.97,.046,.064);
  }
  for(let i=0;i<12;i++){
    const stripe=add(stage,box,i%2?base:accent,-2.64+i*.48,.032,2.90,.29,.026,.20);
    stripe.rotation.y=-.33;
  }
  const gantry=new T.Group();
  stage.add(gantry);
  for(const x of [-2.84,2.84]){
    add(gantry,box,base,x,.84,-2.85,.35,1.66,.41);
    add(gantry,box,rail,x,1.12,-2.85,.25,.73,.53);
    add(gantry,box,steel,x,1.62,-2.85,.53,.21,.48);
    add(gantry,box,accent,x*.87,.28,-2.85,.31,.48,.43);
  }
  add(gantry,box,base,0,1.73,-2.85,6.1,.31,.48);
  add(gantry,box,rail,0,1.93,-2.85,5.94,.18,.46);
  for(let i=0;i<11;i++)add(gantry,box,i%2?detail:accent,-2.51+i*.50,1.87,-2.586,.34,.062,.018);
  const carriage=new T.Group();
  gantry.add(carriage);
  carriage.position.set(-1.35,1.57,-2.58);
  add(carriage,box,ivory,0,0,0,.64,.32,.39);
  add(carriage,box,base,0,-.02,.213,.45,.16,.035);
  add(carriage,box,accent,0,-.21,0,.39,.14,.23);
  add(carriage,box,detail,0,-.016,.237,.22,.065,.02);
  const beacon=add(stage,ball,plain('#fbf885'),3.19,1.09,-2.58,.17);
  add(stage,cylinder,base,3.19,.52,-2.58,.15,.98,.15);
  add(stage,cylinder,rail,3.19,1.00,-2.58,.25,.12,.25);
  const panel=add(stage,box,base,-3.15,.29,2.62,.49,.53,.45);
  panel.rotation.y=.24;
  add(stage,box,plain('#76ffc2'),-3.13,.38,2.854,.19,.077,.04);
  add(stage,box,accent,-3.13,.21,2.864,.29,.06,.041);
  const silo=new T.Group();
  scene.add(silo);
  for(const [x,z,h] of [[-5.2,-4.2,1.42],[4.3,-4.3,1.92],[5.4,-2.0,1.25],[-5.1,.2,1.08]]){
    add(silo,cylinder,detail,x,-.84+h/2,z,.57,h,.57);
    add(silo,cylinder,rail,x,-.89+h,z,.63,.16,.63);
    add(silo,cylinder,accent,x,-.59+h*.5,z,.61,.13,.61);
    add(silo,cylinder,base,x,-.75,z,.66,.17,.66);
  }
  add(scene,cylinder,under,0,-1.64,0,5.82,.31,5.62);
  add(scene,cylinder,base,0,-1.86,0,5.69,.16,5.50);
  const lift=new T.Group();
  scene.add(lift);
  add(lift,cylinder,steel,0,.48,0,.055,.94,.055);
  add(lift,box,base,0,0,0,.91,.21,.54);
  add(lift,box,accent,0,.12,0,.82,.10,.51);
  for(const side of [-1,1]){
    add(lift,box,rail,side*.43,-.18,0,.16,.34,.49);
    add(lift,box,steel,side*.38,-.33,0,.22,.11,.42);
  }
  return {stage,materials,carriage,beacon,lift};
}

const world=(x,z)=>[(x-2)*pitch,(z-1.5)*pitch];
const mix=(a,b,t)=>a+(b-a)*t;
const ease=t=>t*t*(3-2*t);
const faceNormals=[[0,1,0],[0,-1,0],[0,0,-1],[1,0,0],[0,0,1],[-1,0,0]].map(p=>new T.Vector3(...p));
const matrix=new T.Matrix4();
function orientation(faces) {
  matrix.makeBasis(faceNormals[faces.indexOf(3)],faceNormals[faces.indexOf(0)],faceNormals[faces.indexOf(4)]);
  return new T.Quaternion().setFromRotationMatrix(matrix);
}

export function makeView(initial) {
  let canvas=initial,renderer=null,context=null;
  let width=1,height=1,ratio=1;
  const scene=new T.Scene();
  scene.background=backgrounds[0];
  const camera=new T.OrthographicCamera(-5,5,5,-5,.08,90);
  const hemi=new T.HemisphereLight('#efffff','#8990bc',.68);
  scene.add(hemi);
  const sun=new T.DirectionalLight('#fff1d6',.84);
  sun.position.set(-5,8,6);scene.add(sun);
  const rim=new T.DirectionalLight('#85ebff',.31);
  rim.position.set(5,5,-7);scene.add(rim);
  const scenery=stageFor(scene);
  const robot=buildRobot(scene);
  const tileBase=metal('#618c9b',.7),tileTop=metal('#f5f3d7',.72),groove=metal('#a0a7a0');
  const cells=[];
  for(let z=0;z<4;z++)for(let x=0;x<5;x++){
    const [px,pz]=world(x,z);
    const cell=new T.Group();
    scene.add(cell);cell.position.set(px,0,pz);
    add(cell,box,tileBase,0,-.026,0,1.17,.128,1.17);
    add(cell,box,tileTop,0,.030,0,1.10,.029,1.10);
    for(const side of [-1,1])add(cell,box,groove,side*.43,.047,-.41,.22,.015,.024);
    const target=deckCard(cell,signMaterials[0],0,.050,0,.88);
    const guide=deckCard(cell,signMaterials[0],0,.064,.30,.35);
    cells.push({x,z,cell,target,guide});
  }
  const shadow=deckCard(scene,new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}),0,.067,0,1.85);
  const proof=new T.Group();
  scene.add(proof);
  add(proof,box,ivory,0,0,0,2.14,.055,1.32);
  add(proof,box,steel,0,-.065,0,2.22,.09,1.38);
  for(let i=0;i<4;i++)deckCard(proof,stampedMaterials[i],-.63+i*.42,.032,.19,.35);
  const label=deckCard(proof,proofLabel,0,.035,-.26,1);
  label.scale.set(1.75,.47,1);
  const confettiColors=['#fd4c82','#fff28d','#14e5d1','#b79dff','#ffffff'].map(c=>plain(c));
  const confetti=Array.from({length:22},(_,i)=>add(scene,confettiGeometry,confettiColors[i%5],0,-12,0,.065));
  let district=-1,lastBoard='',lastGuides='';
  const v=new T.Vector3(),axis=new T.Vector3(),q=new T.Quaternion(),from=new T.Quaternion();
  const ray=new T.Raycaster(),mouse=new T.Vector2(),hit=new T.Vector3(),ground=new T.Plane(new T.Vector3(0,1,0),-floorY);

  function resize() {
    width=canvas.clientWidth||320;height=canvas.clientHeight||568;
    ratio=Math.min(devicePixelRatio||1,1.4);
    const wide=width>height,aspect=width/height;
    const span=wide?8.9:Math.max(8.5,8.3/aspect);
    camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;
    camera.setViewOffset(width,height,wide?width*.16:0,wide?0:height*.015,width,height);
    if(renderer){renderer.setPixelRatio(ratio);renderer.setSize(width,height,false);}
    else {canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);}
  }

  function fallback() {
    if(context)return;
    const replacement=canvas.cloneNode(false);
    renderer?.dispose();
    canvas.replaceWith(replacement);
    canvas=replacement;
    renderer=null;
    context=canvas.getContext('2d');
    canvas.dataset.renderer='canvas';
    resize();
  }

  try{
    renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});
    renderer.outputEncoding=T.sRGBEncoding;
    renderer.toneMapping=T.NoToneMapping;
    canvas.dataset.renderer='webgl';
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fallback();},{once:true});
  }catch{fallback();}
  resize();

  function cameraPose(mode,t,run) {
    const intro=mode==='intro';
    const outro=mode==='outro';
    const [rx,rz]=world(run.x,run.z);
    const blend=intro?ease(Math.min(1,t/3.0)):outro?ease(Math.min(1,t/1.65)):0;
    const base=[3.8,12.8,11.3];
    if(intro){
      camera.position.set(mix(1.6,base[0],blend),mix(3.75,base[1],blend),mix(7.2,base[2],blend));
      camera.zoom=mix(1.30,1,blend);
      camera.lookAt(mix(rx,0,blend),mix(.48,.18,blend),mix(rz,0,blend));
    }else if(outro){
      camera.position.set(mix(base[0],1.4,blend),mix(base[1],4.0,blend),mix(base[2],8.5,blend));
      camera.zoom=mix(1,1.22,blend);
      camera.lookAt(0,mix(.18,.72,blend),mix(0,1.35,blend));
    }else{
      camera.position.set(...base);camera.zoom=1;camera.lookAt(0,.18,0);
    }
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  function worldToScreen(x,y,z) {
    v.set(x,y,z).project(camera);
    return [(v.x*.5+.5)*width,(.5-v.y*.5)*height];
  }

  function hitTile(clientX,clientY) {
    const rect=canvas.getBoundingClientRect();
    mouse.set((clientX-rect.left)/rect.width*2-1,1-(clientY-rect.top)/rect.height*2);
    ray.setFromCamera(mouse,camera);
    if(!ray.ray.intersectPlane(ground,hit))return null;
    const x=Math.round(hit.x/pitch+2),z=Math.round(hit.z/pitch+1.5);
    return x>=0&&x<5&&z>=0&&z<4?{x,z}:null;
  }

  function paintBoard(run,guides) {
    const level=levels[run.level];
    const boardTag=run.level+'/'+run.ink;
    const guideTag=boardTag+'/'+run.x+'/'+run.z+'/'+run.faces.join('')+'/'+guides;
    if(district!==level.district){
      district=level.district;
      const palette=palettes[district];
      scene.background=backgrounds[district];
      for(const [key,mat] of Object.entries(scenery.materials))mat.color.set(palette[key]);
      tileTop.color.set(palette.detail);
    }
    if(boardTag!==lastBoard){
      lastBoard=boardTag;
      for(const tile of cells){
        tile.cell.visible=level.map[tile.z][tile.x]==='#';
        const index=level.targets.findIndex(p=>p.x===tile.x&&p.z===tile.z);
        tile.target.visible=index>=0;
        if(index>=0){
          const mark=level.targets[index].mark;
          tile.target.material=run.ink&(1<<index)?stampedMaterials[mark]:signMaterials[mark];
        }
      }
      for(let i=0;i<4;i++){
        const card=proof.children[i+2];
        card.visible=i<level.targets.length;
        if(card.visible){
          card.material=stampedMaterials[level.targets[i].mark];
          card.position.x=(i-(level.targets.length-1)*.5)*.43;
        }
      }
    }
    if(guideTag===lastGuides)return;
    lastGuides=guideTag;
    for(const tile of cells)tile.guide.visible=false;
    if(!guides)return;
    for(const name of Object.keys(directions)){
      const next=preview(run,name);
      if(!next)continue;
      const tile=cells[next.z*5+next.x];
      tile.guide.visible=true;
      tile.guide.material=next.stamped?stampedMaterials[next.faces[1]]:signMaterials[next.faces[1]];
      tile.guide.scale.setScalar(next.stamped?.42:.29);
    }
  }

  function render(state) {
    const {run,mode,elapsed,animation,stampAge,rewards}=state;
    paintBoard(animation?.previous||run,mode==='play'&&!animation||mode==='ready');
    cameraPose(mode,elapsed,run);
    const [x,z]=world(run.x,run.z);
    let y=.61;
    robot.position.set(x,y,z);
    robot.quaternion.copy(orientation(run.faces));
    if(animation){
      const {previous,name,fraction}=animation;
      const dir=directions[name];
      const [sx,sz]=world(previous.x,previous.z);
      const angle=ease(fraction)*Math.PI/2;
      const travel=pitch*.5*(1-Math.cos(angle)+Math.sin(angle));
      y=floorY+.56*Math.cos(angle)+pitch*.5*Math.sin(angle);
      robot.position.set(sx+dir.x*travel,y,sz+dir.z*travel);
      axis.set(dir.z,0,-dir.x);
      q.setFromAxisAngle(axis,angle);
      from.copy(orientation(previous.faces));
      robot.quaternion.copy(q.multiply(from));
    }else if(mode==='intro'){
      robot.position.y=.61+2.45*(1-ease(Math.min(1,elapsed/1.55)));
    }else if(mode==='outro'){
      robot.position.y=.61+Math.max(0,Math.sin(elapsed*4.8))*.16*Math.max(0,1-elapsed/3.5);
    }
    shadow.position.set(robot.position.x,.069,robot.position.z);
    shadow.material.opacity=Math.max(.19,1-robot.position.y*.26);
    scenery.carriage.position.x=mode==='intro'?mix(-1.75,1.53,ease(Math.min(1,elapsed/2.7))):1.53;
    scenery.beacon.scale.setScalar(.17+(mode==='intro'?Math.sin(elapsed*15)*.026:0));
    const lift=scenery.lift;
    lift.visible=mode==='intro'&&elapsed<2.65;
    lift.position.set(x,robot.position.y+.87+ease(Math.max(0,Math.min(1,(elapsed-1.55)/1.1)))*2.6,z);
    const reveal=mode==='outro'?ease(Math.max(0,Math.min(1,(elapsed-.33)/1.1))):0;
    proof.visible=mode==='outro';
    proof.position.set(.06,.96+reveal*.96,1.42+reveal*1.02);
    proof.rotation.x=reveal*.77;
    proof.rotation.z=-reveal*.09;
    const age=mode==='outro'?elapsed%1.4:stampAge;
    for(let i=0;i<confetti.length;i++){
      const particle=confetti[i];
      particle.visible=age>=0&&age<.67&&i<(rewards.comment?22:15);
      if(!particle.visible)continue;
      const a=i*2.39996,speed=1.4+i%5*.39;
      const cx=mode==='outro'?0:x,cz=mode==='outro'?2.0:z;
      particle.position.set(cx+Math.cos(a)*age*speed,.24+age*(3.6+i%5*.33)-age*age*5,cz+Math.sin(a)*age*speed);
      particle.rotation.set(age*9+i,age*7,age*6+i);
      particle.scale.setScalar((1-age/.73)*(.058+i%3*.026));
      particle.material=confettiColors[rewards.like?i%2?1:4:i%5];
    }
    if(renderer)renderer.render(scene,camera);
    else if(context)draw2D(state);
  }

  function draw2D({run,mode,elapsed}) {
    const c=context,level=levels[run.level],palette=palettes[level.district];
    c.setTransform(ratio,0,0,ratio,0,0);
    c.fillStyle=palette.sky;c.fillRect(0,0,width,height);
    const polygon=(points,color)=>{
      c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
      c.fillStyle=color;c.fill();c.strokeStyle='#31506b';c.lineWidth=1.2;c.stroke();
    };
    const square=(x,y,z,r)=>[[-r,-r],[r,-r],[r,r],[-r,r]].map(([dx,dz])=>worldToScreen(x+dx,y,z+dz));
    polygon(square(0,-.31,0,3.02),palette.rail);
    for(const tile of cells){
      if(!tile.cell.visible)continue;
      const [x,z]=world(tile.x,tile.z);
      polygon(square(x,.03,z,.55),palette.floor);
      const id=level.targets.findIndex(t=>t.x===tile.x&&t.z===tile.z);
      if(id>=0){
        const target=level.targets[id],mark=marks[target.mark];
        polygon(square(x,.053,z,.41),run.ink&(1<<id)?mark.color:'#254259');
        const [sx,sy]=worldToScreen(x,.062,z);
        symbol(c,target.mark,sx,sy,Math.min(width,height)*.07,run.ink&(1<<id)?'#193950':mark.color);
      }
      if(tile.guide.visible){
        const next=Object.keys(directions).map(name=>preview(run,name)).find(p=>p&&p.x===tile.x&&p.z===tile.z);
        const [sx,sy]=worldToScreen(x,.065,z+.32);
        c.beginPath();c.arc(sx,sy,7,0,2*Math.PI);c.fillStyle='#17344d';c.fill();
        if(next)symbol(c,next.faces[1],sx,sy,12,marks[next.faces[1]].color);
      }
    }
    const r=robot.position,project=(x,y,z)=>worldToScreen(r.x+x,r.y+y,r.z+z);
    polygon([project(-.5,-.5,.5),project(.5,-.5,.5),project(.5,.5,.5),project(-.5,.5,.5)],marks[run.faces[4]].color);
    polygon([project(.5,-.5,.5),project(.5,-.5,-.5),project(.5,.5,-.5),project(.5,.5,.5)],marks[run.faces[3]].color);
    polygon([project(-.5,.5,.5),project(.5,.5,.5),project(.5,.5,-.5),project(-.5,.5,-.5)],marks[run.faces[0]].color);
    const [sx,sy]=project(0,0,.51);
    symbol(c,run.faces[4],sx,sy,Math.min(width,height)*.085,'#132f4a');
    if(mode==='outro'){
      const [px,py]=worldToScreen(0,1.4,1.9);
      c.fillStyle='#fff9df';c.fillRect(px-63,py-17,126,37);
      level.targets.forEach((p,i)=>symbol(c,p.mark,px-44+i*29,py+2,25,marks[p.mark].color));
    }
  }
  return {render,resize,hitTile,canvas:()=>canvas};
}
