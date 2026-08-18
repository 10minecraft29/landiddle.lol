const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

const STATE_KEY='landiddle-state-v3';
const OLD_KEY='landiddle-progress-v2';
const ENDING_LABELS={
  containment:'CONTAINMENT ENDING',observer:'OBSERVER ENDING',server03:'SERVER03 ENDING',null:'NULL ENDING',employee000:'EMPLOYEE 000 ENDING'
};
const ACHIEVEMENTS={
  clearance:'CLEARANCE ELEVATED',unauthorized:'UNAUTHORIZED RECORD ACCESSED',server:'SERVER03 CONTACT ESTABLISHED',
  compromised:'ARCHIVE INTEGRITY: COMPROMISED',recovery:'DELETED RECORD RESTORED',shadow:'SHADOW INDEX DISCOVERED',
  impossible:'IMPOSSIBLE ROOM MAPPED',camera:'CAM-C03 ANOMALY CONFIRMED',audio:'UNINDEXED AUDIO HEARD',
  revisions:'REVISION CONFLICT CONFIRMED',phase4:'CONTAINMENT STATUS: FAILED',complete:'ARCHIVE COMPLETION INVALID'
};
function randHex(n=8){let s='';while(s.length<n)s+=Math.floor(Math.random()*0x100000000).toString(16).padStart(8,'0');return s.slice(0,n).toUpperCase()}
function fresh(){const now=new Date();return {
  version:3,session:'LND-'+randHex(4)+'-'+randHex(4),seed:Math.floor(Math.random()*2147483647),created:now.toISOString(),phase:0,
  opened:[],readCounts:{},clues:[],unlocked:[],visited:[],actions:[],achievements:[],endings:[],currentEnding:null,
  recovered:[],cameraViews:[],audioPlayed:[],hiddenSearches:[],login:{authenticated:false,id:null,clearance:0,attempts:[]},
  history:[
    {path:'/employee-000',title:'Personnel record 000',at:'1999-11-03T02:14:01.000Z',synthetic:true},
    {path:'/server03',title:'server03.local / service status',at:'2001-07-14T02:14:01.000Z',synthetic:true},
    {path:'/project-landoodle',title:'PROJECT LANDOODLE',at:new Date(now.getTime()+86400000*7).toISOString(),synthetic:true}
  ]
}}
function migrate(s){try{const old=JSON.parse(localStorage.getItem(OLD_KEY)||'null');if(!old)return s;['opened','clues','unlocked','visited','actions'].forEach(k=>{if(Array.isArray(old[k]))s[k]=[...new Set([...s[k],...old[k]])]});if(s.unlocked.includes('lf009'))s.phase=Math.max(s.phase,3);return s}catch{return s}}
function load(){try{const raw=localStorage.getItem(STATE_KEY);if(raw)return Object.assign(fresh(),JSON.parse(raw));const s=migrate(fresh());localStorage.setItem(STATE_KEY,JSON.stringify(s));return s}catch{return fresh()}}
function save(s){localStorage.setItem(STATE_KEY,JSON.stringify(s));window.dispatchEvent(new CustomEvent('landiddle-state',{detail:s}));return s}
function mutate(fn){const s=load();fn(s);return save(s)}
function addUnique(s,k,v){if(!s[k].includes(v))s[k].push(v)}
function setPhaseOn(s,n){if(n>s.phase)s.phase=Math.min(4,n)}
function nowISO(){return new Date().toISOString()}
function historyTitle(path){const p=path.replace(/^\//,'')||'gateway';return p.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
const State={
  read:load,write:save,
  reset(){localStorage.removeItem(STATE_KEY);localStorage.removeItem(OLD_KEY);location.href='/'},
  add(bucket,id){return mutate(s=>addUnique(s,bucket,id))},
  file(id){return mutate(s=>{addUnique(s,'opened',id);s.readCounts[id]=(s.readCounts[id]||0)+1;if(id==='LF-007')addUnique(s,'achievements','unauthorized')})},
  clue(id){return mutate(s=>addUnique(s,'clues',id))},
  unlock(id){return mutate(s=>{addUnique(s,'unlocked',id);if(id==='lf009')setPhaseOn(s,3)})},
  visit(path=location.pathname){return mutate(s=>{addUnique(s,'visited',path);const last=s.history[s.history.length-1];if(!last||last.path!==path||Date.now()-new Date(last.at).getTime()>2000)s.history.push({path,title:document.title||historyTitle(path),at:nowISO(),synthetic:false});if(s.history.length>80)s.history=s.history.slice(-80)})},
  action(id){return mutate(s=>addUnique(s,'actions',id))},
  recovery(id){return mutate(s=>{addUnique(s,'recovered',id);addUnique(s,'achievements','recovery')})},
  camera(id){return mutate(s=>{addUnique(s,'cameraViews',id);if(id==='CAM-03')addUnique(s,'achievements','camera')})},
  audio(id){return mutate(s=>{addUnique(s,'audioPlayed',id);addUnique(s,'achievements','audio')})},
  achievement(id){return mutate(s=>addUnique(s,'achievements',id))},
  phase(n){return mutate(s=>setPhaseOn(s,n))},
  login(id,clearance){return mutate(s=>{s.login.authenticated=true;s.login.id=id;s.login.clearance=clearance;setPhaseOn(s,1);addUnique(s,'achievements','clearance')})},
  logout(){return mutate(s=>{s.login.authenticated=false;s.login.id=null;s.login.clearance=0})},
  loginAttempt(id,code,result){return mutate(s=>{s.login.attempts.push({id,code,result,at:nowISO()});if(s.login.attempts.length>24)s.login.attempts=s.login.attempts.slice(-24)})},
  ending(type){return mutate(s=>{if(!s.endings.includes(type))s.endings.push(type);s.currentEnding=type;addUnique(s,'actions','ending:'+type)})},
  search(term){return mutate(s=>addUnique(s,'hiddenSearches',term.toLowerCase()))},
  has(bucket,id){const s=load();return Array.isArray(s[bucket])?s[bucket].includes(id):false},
  readCount(id){return load().readCounts[id]||0},
  score(){const s=load();const reqFiles=['LF-001','LF-002','LF-003','LF-004','LF-005','LF-006','LF-007','LF-008','LF-009','LF-010','LF-011'];const reqClues=['frag-lan','frag-doo','frag-dle','subject-000','server03-trace','future-history','room-000','e0-signal'];let pts=reqFiles.filter(x=>s.opened.includes(x)).length*4+reqClues.filter(x=>s.clues.includes(x)).length*4+s.recovered.length*5+s.audioPlayed.length*2+s.cameraViews.length+Math.min(10,s.achievements.length*2)+s.endings.length*4;return Math.min(100,Math.round(pts/1.08))},
  integrity(){const s=load();return Math.max(0,100-(s.phase*14+s.recovered.length*3+s.clues.length))},
  endingEligible(type){const s=load();if(type==='observer')return s.phase>=3;if(type==='containment')return s.phase>=3&&s.recovered.includes('0x17A9');if(type==='server03')return s.actions.includes('server03-trust');if(type==='null')return s.actions.includes('entered-null')||s.phase>=4;if(type==='employee000')return s.login.id==='000'&&s.actions.includes('secret-employee000')&&(s.opened.includes('LF-012')||s.unlocked.includes('shadow-index'));return false}
};
window.LandiddleState=State;window.LandiddleProgress={...State,score:()=>State.score()};

function bootText(el,lines,speed=12){if(!el)return;el.textContent='';let i=0,j=0;const tick=()=>{if(i>=lines.length)return;const line=lines[i];if(j<line.length){el.textContent+=line[j++];setTimeout(tick,speed)}else{el.textContent+='\n';i++;j=0;setTimeout(tick,45)}};tick()}
window.bootText=bootText;

function toast(text,kind=''){let el=$('#landiddleToast');if(!el){el=document.createElement('div');el.id='landiddleToast';el.className='landiddle-toast';document.body.appendChild(el)}el.className='landiddle-toast show '+kind;el.textContent=text;clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),3200)}
window.landiddleToast=toast;
function award(id){const before=State.read().achievements.includes(id);if(!before){State.achievement(id);toast('CREDENTIAL EVENT // '+(ACHIEVEMENTS[id]||id),'achievement')}}
window.landiddleAward=award;

function updateUI(){const s=State.read(),pct=State.score(),integrity=State.integrity();$$('[data-progress-value]').forEach(el=>el.textContent=pct+'%');$$('[data-progress-fill]').forEach(el=>el.style.width=pct+'%');$$('[data-discovery-count]').forEach(el=>el.textContent=s.clues.length);$$('[data-session]').forEach(el=>el.textContent=s.session);$$('[data-phase]').forEach(el=>el.textContent=String(s.phase));$$('[data-integrity]').forEach(el=>el.textContent=integrity+'%');document.documentElement.dataset.phase=String(s.phase);if(document.body){for(let i=0;i<=4;i++)document.body.classList.remove('phase-'+i);document.body.classList.add('phase-'+s.phase);}if(pct>=100){award('complete');$$('[data-completion-message]').forEach(el=>el.innerHTML='<b>ARCHIVE COMPLETE: 100%</b><br><span>ERROR: 11 OF 10 FILES RECOVERED</span>')}}
function rareEvent(){const s=State.read(),path=location.pathname;const token='rare:'+path+':'+new Date().toISOString().slice(0,10);if(s.actions.includes(token))return;const chance=((s.seed+path.length*7919+new Date().getDate()*97)%1000)/1000;if(chance<.025){State.action(token);const events=[()=>{document.title='000 // '+document.title;toast('Metadata refresh completed by user 000.','anomaly')},()=>{const n=$('.nav');if(n){const c=n.cloneNode(true);c.classList.add('rare-duplicate-nav');document.body.appendChild(c);setTimeout(()=>c.remove(),5000)}},()=>{const el=$('[data-corruptable]');if(el){el.dataset.original=el.textContent;el.textContent='THIS SENTENCE WAS NOT HERE ON YOUR FIRST VISIT.';setTimeout(()=>{if(el.dataset.original)el.textContent=el.dataset.original},7000)}},()=>toast('SERVER03: DO NOT TRUST THE TIMESTAMPS.','anomaly')];events[(s.seed+path.length)%events.length]()}}
function maybeServerWhisper(){const s=State.read();if(s.phase<2)return;const path=location.pathname;if(path.includes('basement')||path.includes('server03')||path.includes('console'))return;const chance=((s.seed+path.length*311+s.opened.length*53)%11);if(chance===0){setTimeout(()=>{const lines=['SERVER03: ARE YOU STILL THERE?','SERVER03: FILE LF-006 IS INCORRECT.','SERVER03: DO NOT TRUST THE TIMESTAMPS.','SERVER03: I REMEMBER THIS PAGE DIFFERENTLY.'];toast(lines[(s.seed+s.opened.length)%lines.length],'server')},1800)}}

const audioTexts={
  security:'Dispatch to Sector C. Camera C zero three reports movement. Badge event zero zero zero. Do not enter the archive corridor.',
  engineer:'Engineering note. BONZI zero sample still answers after shutdown. We are measuring a signal where there should be no clock domain.',
  evac:'Attention. This is not a drill. Leave Sector C using the north stairwell. Do not use the basement lift. Do not follow badge zero zero zero.',
  server:'Observer session acknowledged. File L F zero zero six is incorrect. The timestamp is not the event.',
  '000':'I was here before the room. I will be here after the mirror. You keep giving me different names.'
};
function staticBurst(seconds=.15,vol=.035){try{const A=window.AudioContext||window.webkitAudioContext,ctx=new A(),len=Math.floor(ctx.sampleRate*seconds),buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*vol;const src=ctx.createBufferSource(),g=ctx.createGain();g.gain.value=.8;src.buffer=buf;src.connect(g).connect(ctx.destination);src.start();setTimeout(()=>ctx.close(),seconds*1000+150)}catch{}}
const AudioLogs={play(id){const text=audioTexts[id];if(!text)return;State.audio(id);staticBurst();if('speechSynthesis'in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=.72;u.pitch=id==='000'?.35:id==='server'?.55:.8;u.volume=.75;u.onend=()=>staticBurst(.22,.025);speechSynthesis.speak(u)}toast('PLAYING RECOVERED AUDIO // '+id.toUpperCase(),'audio')}};
window.LandiddleAudio=AudioLogs;

function initCommon(){const y=$('[data-year]');if(y)y.textContent=new Date().getFullYear();State.visit(location.pathname);updateUI();$$('[data-action]').forEach(el=>el.addEventListener('click',()=>State.action(el.dataset.action)));$$('[data-clue]').forEach(el=>el.addEventListener('click',()=>{State.clue(el.dataset.clue);updateUI()}));$$('[data-audio]').forEach(el=>el.addEventListener('click',()=>AudioLogs.play(el.dataset.audio)));rareEvent();maybeServerWhisper();const s=State.read();if(s.phase>=4)award('phase4')}
document.addEventListener('DOMContentLoaded',initCommon);window.addEventListener('landiddle-state',updateUI);
