// ============================================================
// app-flash.js
// 萓晏ｭ・ config.js, store.js, app-core.js
// 雋ｬ蜍・ 證苓ｨ倥き繝ｼ繝牙・讖溯・・亥ｿ伜唆譖ｲ邱壹・險俶・蠎ｦ繝ｻ繧ｫ繝ｼ繝臥ｷｨ髮・ｼ・// ============================================================

let currentDeckIndex    = -1;
let fcQueue             = [];
let fcQueueIndex        = 0;
let fcFlipped           = false;
let fcStudyMode         = 'all';
let fcDirection         = 'normal';
let fcTimerStart        = 0;
let fcTimerSubject      = '';

// ============================================================
// 蠢伜唆譖ｲ邱壹・繝ｫ繝代・
// ============================================================

function isDue(c) {
  if (!c.lastReview) return true;
  const t  = (Date.now() - c.lastReview) / 86400000;
  const st = c.stability || 1;
  return Math.exp(-t / st) < 0.7;
}

function isNew(c) { return !c.reps || c.reps === 0; }

function buildFCQueue(cards) {
  let arr;
  if      (fcStudyMode === 'rec') arr = cards.filter(isDue);
  else if (fcStudyMode === 'new') arr = cards.filter(isNew);
  else                            arr = [...cards];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ============================================================
// FLASHCARD HUB 窶・繝・ャ繧ｭ荳隕ｧ
// ============================================================

function renderFlashcardHub() {
  const decks = S.decks || [];

  const addBarHtml = `<div class="card">
    <div class="section-label">譁ｰ縺励＞繝・ャ繧ｭ繧剃ｽ懈・</div>
    <div class="flex gap-8" style="flex-wrap:wrap;align-items:flex-end">
      <div style="flex:1;min-width:120px">
        <label>繝・ャ繧ｭ蜷・/label>
        <input id="fc-deck-name" placeholder="萓具ｼ夊恭蜊倩ｪ・Level 1">
      </div>
      <div style="width:110px;flex-shrink:0">
        <label>謨咏ｧ・/label>
        <select id="fc-deck-subj">${getAllSubjects().map(s=>`<option value="${sanitize(s)}">${sanitize(s)}</option>`).join('')}</select>
      </div>
      <button class="btn btn-primary btn-sm" onclick="saveDeckInline()" style="margin-bottom:0;align-self:flex-end">菴懈・</button>
    </div>
  </div>`;

  const deckListHtml = decks.length
    ? decks.map((dk, i) => {
        const all  = dk.cards || [];
        const due  = all.filter(isDue).length;
        const newC = all.filter(isNew).length;
        const mast = all.filter(c => (c.stability||0) >= 21).length;
        const pct  = all.length ? Math.round(mast / all.length * 100) : 0;
        const color= getSubjectColor(dk.subj);
        return `<div class="card" style="cursor:pointer" onclick="startDeck(${i})">
          <div class="flex justify-between items-center">
            <div style="flex:1;min-width:0">
              <div style="font-size:14px;font-weight:800;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${sanitize(dk.name)}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${sanitize(dk.subj)} ﾂｷ ${all.length}譫・ﾂｷ 蠕ｩ鄙呈耳螂ｨ: <b style="color:${due>0?'var(--bad)':'var(--ok)'}">${due}</b> ﾂｷ 譛ｪ蟄ｦ鄙・ ${newC}</div>
            </div>
            <div style="text-align:right;flex-shrink:0;margin-left:10px">
              <div style="font-size:15px;font-weight:800;color:${color}">${pct}%</div>
              <div style="font-size:9px;color:var(--text-muted)">鄙貞ｾ・/div>
            </div>
          </div>
          <div class="bar-track mt-8"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
          <div style="text-align:right;margin-top:6px">
            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteDeck(${i})" style="font-size:11px">笨・蜑企勁</button>
          </div>
        </div>`;
      }).join('')
    : '<div class="card"><div style="font-size:13px;color:var(--text-muted);text-align:center;padding:16px">繝・ャ繧ｭ縺後≠繧翫∪縺帙ｓ</div></div>';

  return `<div class="page-header">
    <div style="display:flex;align-items:center;gap:8px">
      <button class="btn btn-ghost btn-sm" onclick="navigateTo('study')">竊・蟄ｦ鄙・/button>
      <div class="page-title" style="font-size:18px">證苓ｨ倥き繝ｼ繝・/div>
    </div>
  </div>
  ${addBarHtml}
  ${deckListHtml}`;
}

function saveDeckInline() {
  const name = document.getElementById('fc-deck-name')?.value.trim();
  if (!name) { showToast('繝・ャ繧ｭ蜷阪ｒ蜈･蜉帙＠縺ｦ縺上□縺輔＞'); return; }
  const subj = document.getElementById('fc-deck-subj')?.value || getAllSubjects()[0] || '';
  S.decks = S.decks || [];
  S.decks.push({ id: generateId(), name: sanitize(name), subj, cards: [] });
  saveState();
  showToast('繝・ャ繧ｭ繧剃ｽ懈・縺励∪縺励◆');
  navigateTo('flashcard');
}

function startDeck(i) {
  currentDeckIndex = i;
  fcStudyMode  = 'all';
  fcDirection  = 'normal';
  fcQueue      = [];
  fcQueueIndex = 0;
  navigateTo('flashcard-study');
}

function deleteDeck(i) {
  if (!confirm('縺薙・繝・ャ繧ｭ繧貞炎髯､縺励∪縺吶°・・)) return;
  S.decks.splice(i, 1);
  if (currentDeckIndex === i) currentDeckIndex = -1;
  saveState();
  showToast('蜑企勁縺励∪縺励◆');
  navigateTo('flashcard');
}

// ============================================================
// FLASHCARD SETUP 竊・STUDY
// ============================================================

function renderFlashcardStudy() {
  if (currentDeckIndex < 0 || currentDeckIndex >= (S.decks||[]).length) {
    navigateTo('flashcard'); return '';
  }
  const deck = S.decks[currentDeckIndex];
  const all  = deck.cards || [];

  // 繧ｭ繝･繝ｼ縺檎ｩｺ縺ｪ繧峨そ繝・ヨ繧｢繝・・逕ｻ髱｢繧定｡ｨ遉ｺ
  if (!fcQueue.length) return renderFlashcardSetup(deck, all);

  const card = fcQueue[fcQueueIndex] || null;
  const pct  = fcQueue.length ? Math.round(fcQueueIndex / fcQueue.length * 100) : 0;

  if (!card) {
    // 螳御ｺ・判髱｢
    stopFlashcardTimer();
    saveState(); checkBadges();
    return `<div class="page-header">
      <div style="display:flex;align-items:center;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="backToFlashcardSetup()">竊・險ｭ螳・/button>
        <div style="font-size:15px;font-weight:800">${sanitize(deck.name)}</div>
      </div>
    </div>
    <div class="card" style="text-align:center;padding:32px 16px">
      <div style="font-size:32px;margin-bottom:12px">脂</div>
      <div style="font-size:15px;font-weight:800;margin-bottom:8px">繧ｻ繝・す繝ｧ繝ｳ螳御ｺ・ｼ・/div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:20px">${fcQueue.length}譫壹・繧ｫ繝ｼ繝峨ｒ遒ｺ隱阪＠縺ｾ縺励◆</div>
      <button class="btn btn-primary btn-full" onclick="restartFlashcardSession()">繧ゅ≧荳蠎ｦ</button>
    </div>`;
  }

  const qText = sanitize(fcDirection === 'reverse' ? card.a : card.q);
  const aText = sanitize(fcDirection === 'reverse' ? card.q : card.a);
  const qlbl  = fcDirection === 'reverse' ? 'ANSWER' : 'QUESTION';
  const albl  = fcDirection === 'reverse' ? 'QUESTION' : 'ANSWER';

  let memInfo = '';
  if (card.lastReview) {
    const R = Math.round(Math.exp(-(Date.now()-card.lastReview)/86400000/(card.stability||1))*100);
    memInfo = `<span style="background:var(--accent-bg);color:var(--accent-strong);border-radius:12px;padding:3px 8px;font-size:11px;font-weight:700">險俶・蠎ｦ: ${R}%</span>`;
  }

  return `<div class="flex justify-between items-center mb-10">
    <button class="btn btn-ghost btn-sm" onclick="backToFlashcardSetup()">竊・險ｭ螳・/button>
    <b style="font-size:14px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:180px">${sanitize(deck.name)}</b>
    <button class="btn btn-secondary btn-sm" onclick="openModal('modal-card')">+ 繧ｫ繝ｼ繝・/button>
  </div>
  <div class="flashcard-progress-bar">
    <span style="font-size:12px">${fcQueueIndex}/${fcQueue.length}</span>
    <div class="flashcard-progress-track"><div class="flashcard-progress-fill" style="width:${pct}%"></div></div>
    <span style="font-size:12px">${pct}%</span>
  </div>
  <div class="flashcard-wrap">
    <div class="flashcard ${fcFlipped?'flipped':''}" id="fc-card" onclick="flipCard()">
      <div class="flashcard-face flashcard-front">
        <div class="flashcard-label">${qlbl}</div>
        <div class="flashcard-text">${qText}</div>
      </div>
      <div class="flashcard-face flashcard-back">
        <div class="flashcard-label">${albl}</div>
        <div class="flashcard-text">${aText}</div>
      </div>
    </div>
  </div>
  <div style="text-align:center;font-size:11px;color:var(--text-muted);margin-bottom:10px">繧ｿ繝・・縺ｧ遲斐∴繧堤｢ｺ隱・/div>
  <div id="fc-answer-btns" style="display:${fcFlipped?'flex':'none'};gap:10px;justify-content:center;margin-bottom:12px">
    <button class="btn" style="background:var(--ok-bg);color:var(--ok);border:1.5px solid rgba(58,170,114,.25);flex:1;justify-content:center" onclick="rateCard('ok')">笳・豁｣隗｣</button>
    <button class="btn" style="background:var(--bad-bg);color:var(--bad);border:1.5px solid rgba(226,75,74,.25);flex:1;justify-content:center" onclick="rateCard('ng')">笨・荳肴ｭ｣隗｣</button>
    <button class="btn btn-ghost btn-sm" onclick="rateCard('skip')">繧ｹ繧ｭ繝・・</button>
  </div>
  <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:4px;font-size:11px">${memInfo}</div>
  <div style="text-align:center;margin-top:10px">
    <button class="btn btn-ghost btn-sm" onclick="openCardEdit()">縺薙・繧ｫ繝ｼ繝峨ｒ邱ｨ髮・/button>
  </div>`;
}

function renderFlashcardSetup(deck, all) {
  const due  = all.filter(isDue).length;
  const newC = all.filter(isNew).length;
  const modes = [
    { k:'all',  l:'蜈ｨ縺ｦ',     cnt:all.length, desc:'縺吶∋縺ｦ縺ｮ繧ｫ繝ｼ繝峨ｒ繧ｷ繝｣繝・ヵ繝ｫ' },
    { k:'rec',  l:'縺翫☆縺吶ａ', cnt:due,        desc:'蠢伜唆譖ｲ邱壹↓蝓ｺ縺･縺丞ｾｩ鄙呈耳螂ｨ繧ｫ繝ｼ繝・ },
    { k:'new',  l:'譛ｪ蟄ｦ鄙・,   cnt:newC,       desc:'縺ｾ縺荳蠎ｦ繧ょｭｦ鄙偵＠縺ｦ縺・↑縺・き繝ｼ繝・ },
  ];
  const modesHtml = modes.map(m => `<button class="btn ${fcStudyMode===m.k?'btn-primary':'btn-secondary'}"
    onclick="fcStudyMode='${m.k}';navigateTo('flashcard-study')"
    style="display:flex;justify-content:space-between;align-items:center;width:100%;margin-bottom:8px;padding:12px 14px">
    <span style="text-align:left"><b>${m.l}</b><br><span style="font-size:11px;opacity:.75">${m.desc}</span></span>
    <span style="font-size:16px;font-weight:800">${m.cnt}譫・/span>
  </button>`).join('');

  const dirHtml = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
    <button class="btn ${fcDirection==='normal'?'btn-primary':'btn-secondary'}" onclick="fcDirection='normal';navigateTo('flashcard-study')"
      style="flex-direction:column;gap:4px;padding:12px 8px;justify-content:center;align-items:center">
      <span style="font-size:18px">笆ｶ</span><span style="font-size:12px">蝠城｡・竊・遲斐∴</span>
    </button>
    <button class="btn ${fcDirection==='reverse'?'btn-primary':'btn-secondary'}" onclick="fcDirection='reverse';navigateTo('flashcard-study')"
      style="flex-direction:column;gap:4px;padding:12px 8px;justify-content:center;align-items:center">
      <span style="font-size:18px">笳</span><span style="font-size:12px">遲斐∴ 竊・蝠城｡・/span>
    </button>
  </div>`;

  const stats = `<div class="stats-row">
    <div class="stat-card"><div class="stat-val">${all.length}</div><div class="stat-lbl">蜷郁ｨ・/div></div>
    <div class="stat-card"><div class="stat-val" style="color:var(--ok)">${all.filter(c=>c.status==='ok').length}</div><div class="stat-lbl">豁｣隗｣貂・/div></div>
    <div class="stat-card"><div class="stat-val" style="color:var(--bad)">${all.filter(c=>c.status==='ng').length}</div><div class="stat-lbl">荳肴ｭ｣隗｣</div></div>
  </div>`;

  return `<div class="flex justify-between items-center mb-12">
    <button class="btn btn-ghost btn-sm" onclick="currentDeckIndex=-1;navigateTo('flashcard')">竊・謌ｻ繧・/button>
    <b style="font-size:14px">${sanitize(deck.name)}</b>
    <button class="btn btn-secondary btn-sm" onclick="openModal('modal-card')">+ 繧ｫ繝ｼ繝・/button>
  </div>
  ${stats}
  <div class="card">
    <div class="section-label">蜃ｺ鬘梧婿蜷・/div>
    ${dirHtml}
  </div>
  <div class="card">
    <div class="section-label">蜃ｺ鬘檎ｯ・峇</div>
    ${modesHtml}
  </div>
  <button class="btn btn-primary btn-full" style="padding:14px;font-size:15px;justify-content:center" onclick="startStudySession()">笆ｶ 蟄ｦ鄙帝幕蟋・/button>`;
}

function startStudySession() {
  const deck = (S.decks||[])[currentDeckIndex];
  if (!deck) return;
  fcQueue = buildFCQueue(deck.cards || []);
  fcQueueIndex = 0;
  fcFlipped = false;
  if (!fcQueue.length) { showToast('縺薙・繝｢繝ｼ繝峨↓繧ｫ繝ｼ繝峨′縺ゅｊ縺ｾ縺帙ｓ'); return; }
  fcTimerStart   = Date.now();
  fcTimerSubject = deck.subj || timerSubject || getAllSubjects()[0] || '';
  navigateTo('flashcard-study');
}

function backToFlashcardSetup() {
  stopFlashcardTimer();
  fcQueue = []; fcQueueIndex = 0; fcFlipped = false;
  navigateTo('flashcard-study');
}

function restartFlashcardSession() {
  fcQueueIndex = 0; fcFlipped = false;
  const deck = (S.decks||[])[currentDeckIndex];
  if (deck) {
    fcQueue = buildFCQueue(deck.cards || []);
    fcTimerStart   = Date.now();
    fcTimerSubject = deck.subj || '';
  }
  navigateTo('flashcard-study');
}

function flipCard() {
  if (fcFlipped) return;
  const el = document.getElementById('fc-card');
  if (el) el.classList.add('flipped');
  const ans = document.getElementById('fc-answer-btns');
  if (ans) ans.style.display = 'flex';
  fcFlipped = true;
}

function rateCard(result) {
  if (fcQueueIndex >= fcQueue.length) return;
  const card = fcQueue[fcQueueIndex];
  const deck = (S.decks||[])[currentDeckIndex];
  if (!deck) return;
  const real = (deck.cards||[]).find(c => c.id === card.id);

  if (real && result !== 'skip') {
    real.reps       = (real.reps || 0) + 1;
    real.lastReview = Date.now();
    let st = real.stability || 1;
    if (result === 'ok') st = st * (1.8 + 0.1 * (real.reps||1));
    else                 st = Math.max(1, st * 0.3);
    real.stability = Math.min(st, 365);
    real.status    = result;
    const nd = new Date(); nd.setDate(nd.getDate() + Math.round(real.stability));
    real.dueDate = localDateStr(nd);
  }

  fcQueueIndex++;
  fcFlipped = false;
  saveState(); checkBadges();
  navigateTo('flashcard-study');
}

function stopFlashcardTimer() {
  if (fcTimerStart <= 0) return;
  const dur  = Date.now() - fcTimerStart;
  const subj = fcTimerSubject;
  fcTimerStart = 0; fcTimerSubject = '';
  if (dur >= 4000 && subj && currentDeckIndex >= 0) {
    S.sessions = S.sessions || [];
    S.sessions.push({ id: generateId(), subj, dur, ts: Date.now() - dur });
    updateStreak(); saveState();
    showToast(`${formatMsShort(dur)} 證苓ｨ倥き繝ｼ繝芽ｨ倬鹸`);
  }
}

// ============================================================
// 繧ｫ繝ｼ繝臥ｷｨ髮・が繝ｼ繝舌・繝ｬ繧､
// ============================================================

function openCardEdit() {
  const deck = (S.decks||[])[currentDeckIndex]; if (!deck) return;
  const card = fcQueue[fcQueueIndex]; if (!card) return;
  const real = (deck.cards||[]).find(c => c.id === card.id); if (!real) return;

  const prev = document.getElementById('fc-edit-overlay'); if (prev) prev.remove();
  const overlay = document.createElement('div');
  overlay.id = 'fc-edit-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1100;display:flex;align-items:flex-end;justify-content:center';
  const inner = document.createElement('div');
  inner.style.cssText = 'background:var(--bg-card);border-radius:14px 14px 0 0;padding:20px 18px;width:100%;max-width:520px;padding-bottom:calc(20px + var(--safe-bottom));border-top:2px solid var(--accent-soft)';
  inner.innerHTML = `<div style="font-size:15px;font-weight:800;margin-bottom:14px">繧ｫ繝ｼ繝峨ｒ邱ｨ髮・/div>
    <div class="form-group"><label>蝠城｡・/label><textarea id="fc-edit-q" rows="3" style="background:var(--bg-base);color:var(--text-primary);border:1px solid var(--bg-border);border-radius:9px;padding:9px 12px;width:100%;font-family:inherit;font-size:14px;resize:vertical">${sanitize(real.q)}</textarea></div>
    <div class="form-group"><label>遲斐∴</label><textarea id="fc-edit-a" rows="3" style="background:var(--bg-base);color:var(--text-primary);border:1px solid var(--bg-border);border-radius:9px;padding:9px 12px;width:100%;font-family:inherit;font-size:14px;resize:vertical">${sanitize(real.a)}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="document.getElementById('fc-edit-overlay').remove()">繧ｭ繝｣繝ｳ繧ｻ繝ｫ</button>
      <button class="btn btn-primary" onclick="saveCardEdit('${real.id}')">菫晏ｭ・/button>
    </div>`;
  overlay.appendChild(inner);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  overlay._origId = real.id;
  document.body.appendChild(overlay);
}

function saveCardEdit(cardId) {
  const deck = (S.decks||[])[currentDeckIndex]; if (!deck) return;
  const newQ = document.getElementById('fc-edit-q')?.value.trim();
  const newA = document.getElementById('fc-edit-a')?.value.trim();
  if (!newQ || !newA) { showToast('蝠城｡後→遲斐∴繧貞・蜉帙＠縺ｦ縺上□縺輔＞'); return; }
  const real = (deck.cards||[]).find(c => c.id === cardId);
  if (real) { real.q = sanitize(newQ); real.a = sanitize(newA); }
  const qcard = fcQueue[fcQueueIndex];
  if (qcard && qcard.id === cardId) { qcard.q = sanitize(newQ); qcard.a = sanitize(newA); }
  saveState();
  document.getElementById('fc-edit-overlay')?.remove();
  showToast('繧ｫ繝ｼ繝峨ｒ譖ｴ譁ｰ縺励∪縺励◆');
  navigateTo('flashcard-study');
}

// ============================================================
// 繧ｫ繝ｼ繝芽ｿｽ蜉・医Δ繝ｼ繝繝ｫ邨檎罰・・// ============================================================

function saveCard() {
  const deck = (S.decks||[])[currentDeckIndex];
  if (!deck) { showToast('繝・ャ繧ｭ繧帝∈謚槭＠縺ｦ縺上□縺輔＞'); return; }
  const q = document.getElementById('input-card-front')?.value.trim();
  const a = document.getElementById('input-card-back')?.value.trim();
  if (!q || !a) { showToast('陦ｨ髱｢縺ｨ陬城擇繧貞・蜉帙＠縺ｦ縺上□縺輔＞'); return; }
  deck.cards = deck.cards || [];
  deck.cards.push({ id: generateId(), q: sanitize(q), a: sanitize(a), reps: 0, status: null });
  saveState();
  closeModal('modal-card');
  document.getElementById('input-card-front').value = '';
  document.getElementById('input-card-back').value  = '';
  showToast('繧ｫ繝ｼ繝峨ｒ霑ｽ蜉縺励∪縺励◆');
  navigateTo('flashcard-study');
}

// StratoNote莠呈鋤繧ｨ繧､繝ｪ繧｢繧ｹ
function saveCards() { saveCard(); }
function saveDk() { saveDeckInline(); }
function delDk(i) { deleteDeck(i); }