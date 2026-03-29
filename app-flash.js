// app-flash.js
// 依存: config.js, store.js, app-core.js
// 責務: 暗記カード全機能（忘却曲線・記憶度・カード編集）
// ============================================================

let currentDeckIndex    = -1;
let fcQueue             = [];
let fcQueueIndex        = 0;
let fcFlipped           = false;
let fcStudyMode         = 'all';
let fcDirection         = 'normal';
let fcTimerStart        = 0;
let fcTimerSubject      = '';

// ============================================================
// 忘却曲線ヘルパー
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
// FLASHCARD HUB — デッキ一覧
// ============================================================

function renderFlashcardHub() {
  const decks = S.decks || [];

  const addBarHtml = `<div class="card">
    <div class="section-label">新しいデッキを作成</div>
    <div class="flex gap-8" style="flex-wrap:wrap;align-items:flex-end">
      <div style="flex:1;min-width:120px">
        <label>デッキ名</label>
        <input id="fc-deck-name" placeholder="例：英単語 Level 1">
      </div>
      <div style="width:110px;flex-shrink:0">
        <label>教科</label>
        <select id="fc-deck-subj">${getAllSubjects().map(s=>`<option value="${sanitize(s)}">${sanitize(s)}</option>`).join('')}</select>
      </div>
      <button class="btn btn-primary btn-sm" onclick="saveDeckInline()" style="margin-bottom:0;align-self:flex-end">作成</button>
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
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${sanitize(dk.subj)} · ${all.length}枚 · 復習推奨: <b style="color:${due>0?'var(--bad)':'var(--ok)'}">${due}</b> · 未学習: ${newC}</div>
            </div>
            <div style="text-align:right;flex-shrink:0;margin-left:10px">
              <div style="font-size:15px;font-weight:800;color:${color}">${pct}%</div>
              <div style="font-size:9px;color:var(--text-muted)">習得</div>
            </div>
          </div>
          <div class="bar-track mt-8"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
          <div style="text-align:right;margin-top:6px">
            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteDeck(${i})" style="font-size:11px">✕ 削除</button>
          </div>
        </div>`;
      }).join('')
    : '<div class="card"><div style="font-size:13px;color:var(--text-muted);text-align:center;padding:16px">デッキがありません</div></div>';

  return `<div class="page-header">
    <div style="display:flex;align-items:center;gap:8px">
      <button class="btn btn-ghost btn-sm" onclick="navigateTo('study')">← 学習</button>
      <div class="page-title" style="font-size:18px">暗記カード</div>
    </div>
  </div>
  ${addBarHtml}
  ${deckListHtml}`;
}

function saveDeckInline() {
  const name = document.getElementById('fc-deck-name')?.value.trim();
  if (!name) { showToast('デッキ名を入力してください'); return; }
  const subj = document.getElementById('fc-deck-subj')?.value || getAllSubjects()[0] || '';
  S.decks = S.decks || [];
  S.decks.push({ id: generateId(), name: sanitize(name), subj, cards: [] });
  saveState();
  showToast('デッキを作成しました');
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
  if (!confirm('このデッキを削除しますか？')) return;
  S.decks.splice(i, 1);
  if (currentDeckIndex === i) currentDeckIndex = -1;
  saveState();
  showToast('削除しました');
  navigateTo('flashcard');
}

// ============================================================
// FLASHCARD SETUP → STUDY
// ============================================================

function renderFlashcardStudy() {
  if (currentDeckIndex < 0 || currentDeckIndex >= (S.decks||[]).length) {
    navigateTo('flashcard'); return '';
  }
  const deck = S.decks[currentDeckIndex];
  const all  = deck.cards || [];

  // キューが空ならセットアップ画面を表示
  if (!fcQueue.length) return renderFlashcardSetup(deck, all);

  const card = fcQueue[fcQueueIndex] || null;
  const pct  = fcQueue.length ? Math.round(fcQueueIndex / fcQueue.length * 100) : 0;

  if (!card) {
    // 完了画面
    stopFlashcardTimer();
    saveState(); checkBadges();
    return `<div class="page-header">
      <div style="display:flex;align-items:center;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="backToFlashcardSetup()">← 設定</button>
        <div style="font-size:15px;font-weight:800">${sanitize(deck.name)}</div>
      </div>
    </div>
    <div class="card" style="text-align:center;padding:32px 16px">
      <div style="font-size:32px;margin-bottom:12px">🎉</div>
      <div style="font-size:15px;font-weight:800;margin-bottom:8px">セッション完了！</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:20px">${fcQueue.length}枚のカードを確認しました</div>
      <button class="btn btn-primary btn-full" onclick="restartFlashcardSession()">もう一度</button>
    </div>`;
  }

  const qText = sanitize(fcDirection === 'reverse' ? card.a : card.q);
  const aText = sanitize(fcDirection === 'reverse' ? card.q : card.a);
  const qlbl  = fcDirection === 'reverse' ? 'ANSWER' : 'QUESTION';
  const albl  = fcDirection === 'reverse' ? 'QUESTION' : 'ANSWER';

  let memInfo = '';
  if (card.lastReview) {
    const R = Math.round(Math.exp(-(Date.now()-card.lastReview)/86400000/(card.stability||1))*100);
    memInfo = `<span style="background:var(--accent-bg);color:var(--accent-strong);border-radius:12px;padding:3px 8px;font-size:11px;font-weight:700">記憶度: ${R}%</span>`;
  }

  return `<div class="flex justify-between items-center mb-10">
    <button class="btn btn-ghost btn-sm" onclick="backToFlashcardSetup()">← 設定</button>
    <b style="font-size:14px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:180px">${sanitize(deck.name)}</b>
    <button class="btn btn-secondary btn-sm" onclick="openModal('modal-card')">+ カード</button>
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
  <div style="text-align:center;font-size:11px;color:var(--text-muted);margin-bottom:10px">タップで答えを確認</div>
  <div id="fc-answer-btns" style="display:${fcFlipped?'flex':'none'};gap:10px;justify-content:center;margin-bottom:12px">
    <button class="btn" style="background:var(--ok-bg);color:var(--ok);border:1.5px solid rgba(58,170,114,.25);flex:1;justify-content:center" onclick="rateCard('ok')">○ 正解</button>
    <button class="btn" style="background:var(--bad-bg);color:var(--bad);border:1.5px solid rgba(226,75,74,.25);flex:1;justify-content:center" onclick="rateCard('ng')">✗ 不正解</button>
    <button class="btn btn-ghost btn-sm" onclick="rateCard('skip')">スキップ</button>
  </div>
  <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:4px;font-size:11px">${memInfo}</div>
  <div style="text-align:center;margin-top:10px">
    <button class="btn btn-ghost btn-sm" onclick="openCardEdit()">このカードを編集</button>
  </div>`;
}

function renderFlashcardSetup(deck, all) {
  const due  = all.filter(isDue).length;
  const newC = all.filter(isNew).length;
  const modes = [
    { k:'all',  l:'全て',     cnt:all.length, desc:'すべてのカードをシャッフル' },
    { k:'rec',  l:'おすすめ', cnt:due,        desc:'忘却曲線に基づく復習推奨カード' },
    { k:'new',  l:'未学習',   cnt:newC,       desc:'まだ一度も学習していないカード' },
  ];
  const modesHtml = modes.map(m => `<button class="btn ${fcStudyMode===m.k?'btn-primary':'btn-secondary'}"
    onclick="fcStudyMode='${m.k}';navigateTo('flashcard-study')"
    style="display:flex;justify-content:space-between;align-items:center;width:100%;margin-bottom:8px;padding:12px 14px">
    <span style="text-align:left"><b>${m.l}</b><br><span style="font-size:11px;opacity:.75">${m.desc}</span></span>
    <span style="font-size:16px;font-weight:800">${m.cnt}枚</span>
  </button>`).join('');

  const dirHtml = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
    <button class="btn ${fcDirection==='normal'?'btn-primary':'btn-secondary'}" onclick="fcDirection='normal';navigateTo('flashcard-study')"
      style="flex-direction:column;gap:4px;padding:12px 8px;justify-content:center;align-items:center">
      <span style="font-size:18px">▶</span><span style="font-size:12px">問題 → 答え</span>
    </button>
    <button class="btn ${fcDirection==='reverse'?'btn-primary':'btn-secondary'}" onclick="fcDirection='reverse';navigateTo('flashcard-study')"
      style="flex-direction:column;gap:4px;padding:12px 8px;justify-content:center;align-items:center">
      <span style="font-size:18px">◀</span><span style="font-size:12px">答え → 問題</span>
    </button>
  </div>`;

  const stats = `<div class="stats-row">
    <div class="stat-card"><div class="stat-val">${all.length}</div><div class="stat-lbl">合計</div></div>
    <div class="stat-card"><div class="stat-val" style="color:var(--ok)">${all.filter(c=>c.status==='ok').length}</div><div class="stat-lbl">正解済</div></div>
    <div class="stat-card"><div class="stat-val" style="color:var(--bad)">${all.filter(c=>c.status==='ng').length}</div><div class="stat-lbl">不正解</div></div>
  </div>`;

  return `<div class="flex justify-between items-center mb-12">
    <button class="btn btn-ghost btn-sm" onclick="currentDeckIndex=-1;navigateTo('flashcard')">← 戻る</button>
    <b style="font-size:14px">${sanitize(deck.name)}</b>
    <button class="btn btn-secondary btn-sm" onclick="openModal('modal-card')">+ カード</button>
  </div>
  ${stats}
  <div class="card">
    <div class="section-label">出題方向</div>
    ${dirHtml}
  </div>
  <div class="card">
    <div class="section-label">出題範囲</div>
    ${modesHtml}
  </div>
  <button class="btn btn-primary btn-full" style="padding:14px;font-size:15px;justify-content:center" onclick="startStudySession()">▶ 学習開始</button>`;
}

function startStudySession() {
  const deck = (S.decks||[])[currentDeckIndex];
  if (!deck) return;
  fcQueue = buildFCQueue(deck.cards || []);
  fcQueueIndex = 0;
  fcFlipped = false;
  if (!fcQueue.length) { showToast('このモードにカードがありません'); return; }
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
    showToast(`${formatMsShort(dur)} 暗記カード記録`);
  }
}

// ============================================================
// カード編集オーバーレイ
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
  inner.innerHTML = `<div style="font-size:15px;font-weight:800;margin-bottom:14px">カードを編集</div>
    <div class="form-group"><label>問題</label><textarea id="fc-edit-q" rows="3" style="background:var(--bg-base);color:var(--text-primary);border:1px solid var(--bg-border);border-radius:9px;padding:9px 12px;width:100%;font-family:inherit;font-size:14px;resize:vertical">${sanitize(real.q)}</textarea></div>
    <div class="form-group"><label>答え</label><textarea id="fc-edit-a" rows="3" style="background:var(--bg-base);color:var(--text-primary);border:1px solid var(--bg-border);border-radius:9px;padding:9px 12px;width:100%;font-family:inherit;font-size:14px;resize:vertical">${sanitize(real.a)}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="document.getElementById('fc-edit-overlay').remove()">キャンセル</button>
      <button class="btn btn-primary" onclick="saveCardEdit('${real.id}')">保存</button>
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
  if (!newQ || !newA) { showToast('問題と答えを入力してください'); return; }
  const real = (deck.cards||[]).find(c => c.id === cardId);
  if (real) { real.q = sanitize(newQ); real.a = sanitize(newA); }
  const qcard = fcQueue[fcQueueIndex];
  if (qcard && qcard.id === cardId) { qcard.q = sanitize(newQ); qcard.a = sanitize(newA); }
  saveState();
  document.getElementById('fc-edit-overlay')?.remove();
  showToast('カードを更新しました');
  navigateTo('flashcard-study');
}

// ============================================================
// カード追加（モーダル経由）
// ============================================================

function saveCard() {
  const deck = (S.decks||[])[currentDeckIndex];
  if (!deck) { showToast('デッキを選択してください'); return; }
  const q = document.getElementById('input-card-front')?.value.trim();
  const a = document.getElementById('input-card-back')?.value.trim();
  if (!q || !a) { showToast('表面と裏面を入力してください'); return; }
  deck.cards = deck.cards || [];
  deck.cards.push({ id: generateId(), q: sanitize(q), a: sanitize(a), reps: 0, status: null });
  saveState();
  closeModal('modal-card');
  document.getElementById('input-card-front').value = '';
  document.getElementById('input-card-back').value  = '';
  showToast('カードを追加しました');
  navigateTo('flashcard-study');
}

// StratoNote互換エイリアス
function saveCards() { saveCard(); }
function saveDk() { saveDeckInline(); }
function delDk(i) { deleteDeck(i); }


