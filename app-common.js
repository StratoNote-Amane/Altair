// ============================================================
// app-common.js
// 依存: config.js, store.js
// 責務: UI操作・状態表示の共通関数
// ============================================================

let toastTimer;
function showToast(msg) {
  const el=document.getElementById('toast');
  clearTimeout(toastTimer);
  el.textContent=msg; el.classList.add('show');
  toastTimer=setTimeout(()=>el.classList.remove('show'),2600);
}

function openModal(id) {
  fillSubjectSelects();
  if (id==='modal-event') document.getElementById('input-event-date').value=selectedCalDate||today();
  document.getElementById(id)?.classList.add('open');
}

function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

function fillSubjectSelects() {
  const subjects=getAllSubjects();
  ['input-event-subject','input-deck-subject','input-test-subject'].forEach(id=>{
    const el=document.getElementById(id); if(!el)return;
    const prev=el.value;
    el.innerHTML=subjects.map(s=>`<option value="${sanitize(s)}">${sanitize(s)}</option>`).join('');
    if(prev)el.value=prev;
  });
}

// ============================================================
// BACKGROUND
// ============================================================

function applyBackground(url) {
  let el=document.getElementById('bg-image');
  if(!el){
    el=document.createElement('div');el.id='bg-image';
    el.style.cssText='position:fixed;inset:0;z-index:0;background-size:cover;background-position:center;';
    const ov=document.createElement('div');ov.id='bg-overlay';
    ov.style.cssText='position:absolute;inset:0;background:rgba(13,17,23,0.65);';
    el.appendChild(ov);
    document.body.insertBefore(el,document.body.firstChild);
  }
  el.style.backgroundImage=url?`url('${url}')`:'';
  el.style.display=url?'block':'none';
}


