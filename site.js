const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const state={get unlocked(){try{return JSON.parse(localStorage.getItem('landiddle-unlocked')||'[]')}catch{return[]}},unlock(id){const s=new Set(this.unlocked);s.add(id);localStorage.setItem('landiddle-unlocked',JSON.stringify([...s]))}};
function bootText(el,lines,speed=18){if(!el)return;el.textContent='';let i=0,j=0;const next=()=>{if(i>=lines.length)return;const line=lines[i];if(j<line.length){el.textContent+=line[j++];setTimeout(next,speed)}else{el.textContent+='\n';i++;j=0;setTimeout(next,90)}};next()}
function initCommon(){const y=$('[data-year]');if(y)y.textContent=new Date().getFullYear();$$('[data-secret]').forEach(a=>a.addEventListener('click',()=>state.unlock(a.dataset.secret)))}
document.addEventListener('DOMContentLoaded',initCommon);
