const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

const PROGRESS_KEY='landiddle-progress-v2';
const emptyProgress=()=>({opened:[],clues:[],unlocked:[],visited:[],actions:[]});
const progress={
  read(){try{return {...emptyProgress(),...JSON.parse(localStorage.getItem(PROGRESS_KEY)||'{}')}}catch{return emptyProgress()}},
  write(data){localStorage.setItem(PROGRESS_KEY,JSON.stringify(data));window.dispatchEvent(new CustomEvent('landiddle-progress',{detail:data}));return data},
  add(bucket,id){const d=this.read();if(!d[bucket].includes(id))d[bucket].push(id);return this.write(d)},
  file(id){return this.add('opened',id)}, clue(id){return this.add('clues',id)}, unlock(id){return this.add('unlocked',id)}, visit(id){return this.add('visited',id)}, action(id){return this.add('actions',id)},
  has(bucket,id){return this.read()[bucket].includes(id)},
  score(){const d=this.read();const requiredFiles=['LF-001','LF-002','LF-003','LF-004','LF-005','LF-006','LF-007','LF-008','LF-009','LF-010'];const clues=['frag-lan','frag-doo','frag-dle','subject-000'];let points=requiredFiles.filter(x=>d.opened.includes(x)).length+clues.filter(x=>d.clues.includes(x)).length+(d.unlocked.includes('lf009')?1:0)+(d.unlocked.includes('lf011')?1:0);return Math.min(100,Math.round(points/16*100))}
};
window.LandiddleProgress=progress;

function bootText(el,lines,speed=18){if(!el)return;el.textContent='';let i=0,j=0;const next=()=>{if(i>=lines.length)return;const line=lines[i];if(j<line.length){el.textContent+=line[j++];setTimeout(next,speed)}else{el.textContent+='\n';i++;j=0;setTimeout(next,70)}};next()}
window.bootText=bootText;

function updateProgressUI(){const pct=progress.score();$$('[data-progress-value]').forEach(el=>el.textContent=pct+'%');$$('[data-progress-fill]').forEach(el=>el.style.width=pct+'%');const d=progress.read();$$('[data-discovery-count]').forEach(el=>el.textContent=d.clues.length)}
function initCommon(){const y=$('[data-year]');if(y)y.textContent=new Date().getFullYear();progress.visit(location.pathname);$$('[data-secret]').forEach(a=>a.addEventListener('click',()=>progress.action('route:'+a.dataset.secret)));$$('[data-clue]').forEach(el=>el.addEventListener('click',()=>{progress.clue(el.dataset.clue);updateProgressUI()}));updateProgressUI()}
document.addEventListener('DOMContentLoaded',initCommon);window.addEventListener('landiddle-progress',updateProgressUI);
