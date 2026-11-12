export function makeAudio(){
  let context,master,music,noise,timer=0,enabled=true,running=false,next=0,step=0;
  const voices=new Set();
  const tempo=156;
  function create(){
    if(context)return true;
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)return false;
      context=new Audio();
      master=context.createGain();
      music=context.createGain();
      const compressor=context.createDynamicsCompressor();
      compressor.threshold.value=-14;
      compressor.ratio.value=4;
      master.gain.value=.69;
      music.gain.value=.56;
      music.connect(master);
      master.connect(compressor).connect(context.destination);
      noise=context.createBuffer(1,context.sampleRate*.22,context.sampleRate);
      const samples=noise.getChannelData(0);
      for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
      return true;
    }catch{return false;}
  }
  function note(t,seconds,volume,output,type,hz,end=hz,highpass=0){
    if(!context||voices.size>=36)return;
    const gain=context.createGain();
    const source=type==='noise'?context.createBufferSource():context.createOscillator();
    if(type==='noise')source.buffer=noise;
    else{
      source.type=type;
      source.frequency.setValueAtTime(hz,t);
      source.frequency.exponentialRampToValueAtTime(end,t+seconds);
    }
    let filter;
    if(highpass){
      filter=context.createBiquadFilter();
      filter.type='highpass';
      filter.frequency.value=highpass;
      source.connect(filter).connect(gain);
    }else source.connect(gain);
    gain.gain.setValueAtTime(.0001,t);
    gain.gain.exponentialRampToValueAtTime(volume,t+.009);
    gain.gain.exponentialRampToValueAtTime(.0001,t+seconds);
    gain.connect(output);
    voices.add(source);
    source.onended=()=>{voices.delete(source);source.disconnect();filter?.disconnect();gain.disconnect();};
    source.start(t);
    source.stop(t+seconds+.009);
  }
  function beat(t,n){
    const pulse=n%16,bar=Math.floor(n/16)%8;
    const bass=[55,65.406,49,73.416,55,65.406,49,48.999][bar];
    if([0,7,8,14].includes(pulse))note(t,.19,.40,music,'sine',130,46);
    if(pulse===4||pulse===12){
      note(t,.13,.16,music,'noise',0,0,1400);
      note(t,.085,.10,music,'triangle',188,82);
    }
    if(pulse%2===0||pulse===15)note(t,.042,pulse%4===2?.097:.063,music,'noise',0,0,6300);
    if([0,3,6,8,11,13].includes(pulse)){
      const f=bass*(pulse===6||pulse===13?2:1);
      note(t,.145,.19,music,'triangle',f);
      note(t,.096,.075,music,'square',f*2,f*1.98);
    }
    if([1,5,9,10,15].includes(pulse)){
      const intervals=[0,7,12,15,10,7,19,12];
      const f=bass*8*2**(intervals[(pulse+bar)%8]/12);
      note(t,.108,.046,music,'square',f);
    }
  }
  function schedule(){
    if(!enabled||!running||context.state!=='running')return;
    if(next<context.currentTime-.09)next=context.currentTime+.028;
    while(next<context.currentTime+.105){
      beat(next,step++);
      next+=60/tempo/4;
    }
  }
  function start(){
    if(!enabled||!create()||running)return;
    running=true;
    next=context.currentTime+.032;
    context.resume().then(schedule).catch(()=>{});
    timer=setInterval(schedule,38);
  }
  function pause(){
    running=false;
    clearInterval(timer);
    timer=0;
    for(const source of voices)try{source.stop();}catch{ /* Already settled. */ }
    voices.clear();
  }
  function cue(kind){
    if(!enabled||context?.state!=='running')return;
    const t=context.currentTime+.012;
    if(kind==='roll')note(t,.13,.19,master,'triangle',192,80);
    if(kind==='no')note(t,.13,.10,master,'square',116,79);
    if(kind==='stamp'){
      note(t,.16,.29,master,'sine',151,57);
      [523,659,880].forEach((f,i)=>note(t+.045*i,.22,.14,master,'triangle',f));
    }
    if(kind==='proof')[523,659,784,1047,1319].forEach((f,i)=>note(t+.085*i,.31,.17,master,'triangle',f));
    if(kind==='boot')note(t,.33,.11,master,'triangle',175,560);
  }
  return {start,pause,cue,mute(value){enabled=!value;if(value)pause();}};
}
