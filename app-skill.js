// app-skill.js
// 依存: config.js, store.js, app-core.js
// ============================================================

let currentSkillSubject = '';
let skMapPanCleanup     = null;
let skMapScale          = 1.0;

// ============================================================
// SKILL HUB
// ============================================================

function renderSkillHub() {
  const subjects = CFG.DEFAULT_SUBJECTS;
  const cardsHtml = subjects.map(subj => {
    const skills = S.skills[subj] || [];
    const total  = skills.length;
    const done   = skills.filter(s => s.done).length;
    const pct    = total > 0 ? Math.round(done / total * 100) : 0;
    const color  = getSubjectColor(subj);
    return `<div class="skill-subj-card ${total>0?'has-skills':''}" onclick="openSkillMap('${sanitize(subj)}')">
      <div class="skill-subj-name">${sanitize(subj)}</div>
      <div class="skill-subj-count">解除 ${done}/${total}</div>
      <div class="skill-subj-bar" style="width:${pct}%;background:${color}"></div>
    </div>`;
  }).join('');

  return `<div class="page-header"><div class="page-title">スキル</div></div>
    <div class="skill-subj-grid">${cardsHtml}</div>`;
}

// ============================================================
// SKILL MAP
// ============================================================

function openSkillMap(subj) {
  currentSkillSubject = subj;
  skMapScale = 1.0;
  let overlay = document.getElementById('skill-map-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'skill-map-overlay';
    overlay.style.cssText = `
      display:none;position:fixed;inset:0;z-index:500;
      background:var(--bg-base);flex-direction:column;
      padding-top:var(--safe-top);
      bottom:calc(56px + var(--safe-bottom));`;
    overlay.innerHTML = `
      <div id="sk-map-hd" style="background:var(--bg-card);border-bottom:1px solid var(--bg-border);padding:10px 14px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
        <div style="display:flex;align-items:center;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="closeSkillMap()">← 戻る</button>
          <div id="sk-map-title" style="font-size:15px;font-weight:800"></div>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span id="sk-map-count" style="font-size:11px;color:var(--text-muted)"></span>
          <button class="btn btn-ghost btn-sm" onclick="skZoom(1.25)" style="font-size:14px;padding:4px 8px">＋</button>
          <button class="btn btn-ghost btn-sm" onclick="skZoom(0.8)" style="font-size:14px;padding:4px 8px">－</button>
          <button class="btn btn-ghost btn-sm" onclick="resetSkillLayout()" style="font-size:11px">↺</button>
        </div>
      </div>
      <div id="sk-map-add-bar" style="background:var(--bg-card);border-bottom:1px solid var(--bg-border);padding:8px 14px;flex-shrink:0;display:flex;gap:8px;align-items:center">
        <input id="sk-map-inp" placeholder="スキル名を入力（Enterで追加）" style="flex:1;padding:7px 10px;font-size:13px;background:var(--bg-base);color:var(--text-primary);border:1px solid var(--bg-border);border-radius:8px;font-family:inherit"
          onkeydown="if(event.key==='Enter')addSkillNodeInline()">
        <button class="btn btn-primary btn-sm" onclick="addSkillNodeInline()">＋ 追加</button>
      </div>
      <div style="font-size:10px;color:var(--text-muted);padding:4px 14px;background:var(--bg-card);border-bottom:1px solid var(--bg-border);flex-shrink:0">
        タップ: 完了/未完了 ｜ ✕: 削除 ｜ ＋: 子スキル追加 ｜ ドラッグ: 移動 ｜ 🔒: ロック状態
      </div>
      <div id="sk-map-body" style="flex:1;overflow:hidden;padding:0;position:relative;cursor:grab;user-select:none;touch-action:none">
        <div id="sk-map-svg-wrap" style="display:inline-block;min-width:100%;position:absolute;top:0;left:0"></div>
      </div>`;
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
  renderSkillTree(subj);
}

function skZoom(factor) {
  skMapScale = Math.max(0.3, Math.min(3.0, skMapScale * factor));
  const wrap = document.getElementById('sk-map-svg-wrap');
  if(wrap) {
    const m=(wrap.style.transform||'').match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
    const px=m?parseFloat(m[1]):0, py=m?parseFloat(m[2]):0;
    wrap.style.transform=`translate(${px}px,${py}px) scale(${skMapScale})`;
    wrap.style.transformOrigin='top left';
  }
}

function closeSkillMap() {
  const overlay = document.getElementById('skill-map-overlay');
  if (overlay) overlay.style.display = 'none';
  if (skMapPanCleanup) { skMapPanCleanup(); skMapPanCleanup = null; }
  navigateTo('skill');
}

function renderSkillTree(subj) {
  subj = subj || currentSkillSubject;
  const titleEl = document.getElementById('sk-map-title');
  const countEl = document.getElementById('sk-map-count');
  if (titleEl) titleEl.textContent = subj;
  const skills = S.skills[subj] || [];
  const done   = skills.filter(s => s.done).length;
  if (countEl) countEl.textContent = `解除 ${done}/${skills.length}`;

  const wrap = document.getElementById('sk-map-svg-wrap');
  if (!wrap) return;

  if (!skills.length) {
    wrap.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted);font-size:13px">スキルを追加してください</div>';
    return;
  }

  const NW = 130, NH = 38, hGap = 36, vGap = 64;
  const MARGIN = 14;
  const color  = getSubjectColor(subj);
  // 追加ボタンの色：教科色と被らない白系固定
  const addBtnColor = '#c9d1d9';

  const im = {};
  skills.forEach(sk => im[sk.id] = sk);

  // 祖先チェーンの完了確認（ロック判定）
  function isLocked(id) {
    let cur = im[id];
    if (!cur || !cur.parentId) return false;
    const parent = im[cur.parentId];
    if (!parent) return false;
    if (!parent.done) return true;
    return isLocked(cur.parentId);
  }

  const roots = skills.filter(sk => !sk.parentId);
  const pos   = {};

  let colIdx = 0;
  function calcPos(sk, depth) {
    const children = skills.filter(s => s.parentId === sk.id);
    if (!children.length) {
      pos[sk.id] = { x: MARGIN + colIdx * (NW + hGap), y: 20 + depth * (NH + vGap) };
      colIdx++;
    } else {
      children.forEach(c => calcPos(c, depth + 1));
      const xs = children.map(c => pos[c.id].x);
      pos[sk.id] = { x: (Math.min(...xs) + Math.max(...xs) + NW) / 2 - NW/2, y: 20 + depth * (NH + vGap) };
    }
  }
  roots.forEach(r => calcPos(r, 0));

  // 重なり防止
  function resolveOverlaps() {
    const keys = Object.keys(pos);
    let changed = true, iter = 0;
    while (changed && iter < 20) {
      changed = false; iter++;
      for (let i = 0; i < keys.length; i++) {
        for (let j = i+1; j < keys.length; j++) {
          const a = pos[keys[i]], b = pos[keys[j]];
          if (!a || !b) continue;
          const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
          if (dx < NW + hGap/2 && dy < NH + vGap/2) {
            const pushX = (NW + hGap/2 - dx) / 2 + 2;
            if (a.x <= b.x) { a.x -= pushX; b.x += pushX; }
            else             { a.x += pushX; b.x -= pushX; }
            a.x = Math.max(MARGIN, a.x); b.x = Math.max(MARGIN, b.x);
            changed = true;
          }
        }
      }
    }
  }
  resolveOverlaps();

  // 手動位置を適用
  skills.forEach(sk => {
    if (sk.manualX !== undefined) pos[sk.id] = { x: sk.manualX, y: sk.manualY };
  });

  const maxX = Math.max(...Object.values(pos).map(p => p.x)) + NW + 30;
  const maxY = Math.max(...Object.values(pos).map(p => p.y)) + NH + 30;

  let linesSvg = '', nodesSvg = '';

  skills.forEach(sk => {
    if (!sk.parentId || !pos[sk.id] || !pos[sk.parentId]) return;
    const pp = pos[sk.parentId];
    const cp = pos[sk.id];
    const x1 = pp.x + NW/2, y1 = pp.y + NH, x2 = cp.x + NW/2, y2 = cp.y;
    const midy = (y1 + y2) / 2;
    const locked = isLocked(sk.id);
    const isDoneConn = sk.done && im[sk.parentId]?.done;
    linesSvg += `<path d="M${x1},${y1} C${x1},${midy} ${x2},${midy} ${x2},${y2}"
      fill="none" stroke="${isDoneConn ? color : locked ? '#444' : '#2d333b'}" stroke-width="${isDoneConn?2:1.5}"
      ${locked ? 'stroke-dasharray="3,4"' : !isDoneConn ? 'stroke-dasharray="5,4"' : ''} opacity="${locked?0.4:1}"/>`;
  });

  skills.forEach(sk => {
    const p = pos[sk.id]; if (!p) return;
    const x = p.x, y = p.y;
    const locked = isLocked(sk.id);
    const fillC  = locked ? '#1a1f26' : sk.done ? color : '#21262d';
    const textC  = locked ? '#555' : sk.done ? '#0d1117' : '#8b949e';
    const strokeC= locked ? '#333' : sk.done ? color : '#2d333b';
    const label  = sanitize(sk.name).slice(0, 14);
    const lockIcon = locked ? `<text x="${x+NW/2-32}" y="${y+NH/2+1}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#555" pointer-events="none">🔒</text>` : '';

    nodesSvg += `<g data-drag="1" data-id="${sk.id}" style="cursor:${locked?'not-allowed':'pointer'}" ${locked?'data-locked="1"':''}>
      <rect x="${x}" y="${y}" width="${NW}" height="${NH}" rx="8" fill="${fillC}" stroke="${strokeC}" stroke-width="1.5"/>
      ${lockIcon}
      <text x="${x+NW/2+(locked?8:0)}" y="${y+NH/2+1}" text-anchor="middle" dominant-baseline="middle"
        font-size="11" font-weight="700" fill="${textC}" font-family="sans-serif" pointer-events="none">${label}</text>
      <text x="${x+NW-6}" y="${y+8}" text-anchor="end" dominant-baseline="hanging" font-size="14" fill="#8b949e" style="cursor:pointer"
        onclick="deleteSkillNode('${sk.id}')">✕</text>
      <text x="${x+NW-6}" y="${y+NH-6}" text-anchor="end" dominant-baseline="auto" font-size="14" fill="${addBtnColor}" style="cursor:pointer;font-weight:900"
        onclick="addSkillNode('${sk.id}')">＋</text>
    </g>`;
  });

  const svgW = Math.max(maxX, 300);
  const svgH = Math.max(maxY, 200);

  wrap.innerHTML = `<svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}"
    style="display:block;min-width:${svgW}px;min-height:${svgH}px">
    ${linesSvg}${nodesSvg}
  </svg>`;

  // ズームスタイルを再適用
  const m=(wrap.style.transform||'').match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
  const px=m?parseFloat(m[1]):0, py=m?parseFloat(m[2]):0;
  wrap.style.transform=`translate(${px}px,${py}px) scale(${skMapScale})`;
  wrap.style.transformOrigin='top left';

  const svg = wrap.querySelector('svg');
  const THRESHOLD = 6;
  wrap.querySelectorAll('g[data-drag="1"]').forEach(g => {
    const id = g.getAttribute('data-id');
    const locked = g.getAttribute('data-locked')==='1';
    let dragging = false, moved = false, startX = 0, startY = 0, origX = 0, origY = 0;
    function getXY(e) {
      const t = e.touches ? e.touches[0] : e;
      const rect = svg.getBoundingClientRect();
      return { x: (t.clientX - rect.left)/skMapScale, y: (t.clientY - rect.top)/skMapScale };
    }
    function onStart(e) {
      if (e.target.tagName === 'text') return;
      const xy = getXY(e);
      startX = xy.x; startY = xy.y;
      origX = pos[id]?.x || 0; origY = pos[id]?.y || 0;
      dragging = true; moved = false; g._dragged = false;
    }
    function onMove(e) {
      if (!dragging) return;
      const xy = getXY(e);
      const dx = xy.x - startX, dy = xy.y - startY;
      if (!moved && Math.sqrt(dx*dx+dy*dy) < THRESHOLD) return;
      moved = true; g._dragged = true;
      const nx = Math.max(MARGIN, origX + dx), ny = Math.max(10, origY + dy);
      const rect = g.querySelector('rect');
      if (rect) { rect.setAttribute('x', nx); rect.setAttribute('y', ny); }
      g.querySelectorAll('text').forEach(t => {
        const ox = parseFloat(t.getAttribute('data-ox') || t.getAttribute('x'));
        const oy = parseFloat(t.getAttribute('data-oy') || t.getAttribute('y'));
        if (!t.getAttribute('data-ox')) { t.setAttribute('data-ox', ox); t.setAttribute('data-oy', oy); }
        t.setAttribute('x', parseFloat(t.getAttribute('data-ox')) + (nx - origX));
        t.setAttribute('y', parseFloat(t.getAttribute('data-oy')) + (ny - origY));
      });
    }
    function onEnd() {
      if (!dragging) return;
      dragging = false;
      if (moved) {
        const rect = g.querySelector('rect');
        if (rect) {
          const sk = im[id];
          if (sk) { sk.manualX = Math.round(parseFloat(rect.getAttribute('x'))); sk.manualY = Math.round(parseFloat(rect.getAttribute('y'))); }
        }
        saveState();
        renderSkillTree(currentSkillSubject);
      }
      setTimeout(() => { g._dragged = false; }, 50);
    }
    g.addEventListener('pointerdown', onStart);
    g.addEventListener('pointermove', onMove);
    g.addEventListener('pointerup',   onEnd);
    g.addEventListener('pointercancel', onEnd);
    g.addEventListener('click', e => {
      if (g._dragged || e.target.tagName === 'text') return;
      if (locked) { showToast('親スキルを先に達成してください'); return; }
      const sk = im[id]; if (!sk) return;
      sk.done = !sk.done; saveState(); checkBadges(); renderSkillTree(currentSkillSubject);
    });
  });

  initSkillMapPan(wrap);
}

function initSkillMapPan(wrap) {
  const body = document.getElementById('sk-map-body'); if (!body) return;
  if (skMapPanCleanup) { skMapPanCleanup(); skMapPanCleanup = null; }
  let panX = 0, panY = 0, startX = 0, startY = 0, startPanX = 0, startPanY = 0, isPanning = false;
  const m = (wrap.style.transform || '').match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
  if (m) { panX = parseFloat(m[1]); panY = parseFloat(m[2]); }
  function applyTransform() {
    wrap.style.transform = `translate(${panX}px,${panY}px) scale(${skMapScale})`;
    wrap.style.transformOrigin = 'top left';
  }
  applyTransform();
  // ホイールズーム
  function onWheel(e) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.91;
    skMapScale = Math.max(0.3, Math.min(3.0, skMapScale * factor));
    applyTransform();
  }
  body.addEventListener('wheel', onWheel, { passive: false });
  function isOnNode(t) { return !!(t && t.closest && t.closest('g[data-drag="1"]')); }
  function onStart(e) {
    if (isOnNode(e.target)) return;
    isPanning = true; startX = e.clientX; startY = e.clientY; startPanX = panX; startPanY = panY;
    body.style.cursor = 'grabbing';
  }
  function onMove(e) {
    if (!isPanning) return;
    panX = startPanX + (e.clientX - startX); panY = startPanY + (e.clientY - startY); applyTransform();
  }
  function onEnd() { isPanning = false; body.style.cursor = 'grab'; }
  let touchId = null;
  function onTouchStart(e) {
    if (isOnNode(e.target) || e.touches.length !== 1) return;
    touchId = e.touches[0].identifier; startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    startPanX = panX; startPanY = panY; isPanning = true;
  }
  function onTouchMove(e) {
    if (!isPanning || touchId === null) return;
    const t = Array.from(e.changedTouches).find(x => x.identifier === touchId); if (!t) return;
    e.preventDefault(); panX = startPanX + (t.clientX - startX); panY = startPanY + (t.clientY - startY); applyTransform();
  }
  function onTouchEnd() { isPanning = false; touchId = null; }
  body.addEventListener('pointerdown', onStart);
  body.addEventListener('pointermove', onMove);
  body.addEventListener('pointerup',   onEnd);
  body.addEventListener('pointercancel', onEnd);
  body.addEventListener('touchstart', onTouchStart, { passive: true });
  body.addEventListener('touchmove',  onTouchMove,  { passive: false });
  body.addEventListener('touchend',   onTouchEnd);
  skMapPanCleanup = () => {
    body.removeEventListener('pointerdown', onStart);
    body.removeEventListener('pointermove', onMove);
    body.removeEventListener('pointerup',   onEnd);
    body.removeEventListener('pointercancel', onEnd);
    body.removeEventListener('touchstart', onTouchStart);
    body.removeEventListener('touchmove',  onTouchMove);
    body.removeEventListener('touchend',   onTouchEnd);
    body.removeEventListener('wheel', onWheel);
  };
}

function addSkillNode(parentId) {
  const name = prompt('スキル名を入力してください');
  if (!name?.trim()) return;
  const subj = currentSkillSubject;
  S.skills[subj] = S.skills[subj] || [];
  S.skills[subj].push({ id: generateId(), name: sanitize(name.trim()), done: false, parentId: parentId || null });
  saveState(); renderSkillTree(subj);
}

function deleteSkillNode(id) {
  if (!confirm('このスキルを削除しますか？')) return;
  const subj = currentSkillSubject;
  S.skills[subj] = (S.skills[subj]||[]).filter(s => s.id !== id && s.parentId !== id);
  saveState(); renderSkillTree(subj);
}

function resetSkillLayout() {
  const subj = currentSkillSubject;
  (S.skills[subj]||[]).forEach(sk => { delete sk.manualX; delete sk.manualY; });
  const wrap = document.getElementById('sk-map-svg-wrap');
  if (wrap) wrap.style.transform = `translate(0px,0px) scale(1)`;
  skMapScale = 1.0;
  if (skMapPanCleanup) { skMapPanCleanup(); skMapPanCleanup = null; }
  saveState(); renderSkillTree(subj); showToast('配置をリセットしました');
}

function addSkillNodeInline() {
  const inp = document.getElementById('sk-map-inp');
  const name = inp?.value.trim();
  if (!name) { showToast('スキル名を入力してください'); return; }
  const subj = currentSkillSubject;
  S.skills[subj] = S.skills[subj] || [];
  S.skills[subj].push({ id: generateId(), name: sanitize(name), done: false, parentId: null });
  saveState();
  if (inp) inp.value = '';
  renderSkillTree(subj);
  showToast('スキルを追加しました');
}

function resetSKLayout() { resetSkillLayout(); }
function openSkFormMap(parentId) { addSkillNode(parentId); }
function addSkillFromMap() { addSkillNodeInline(); }
function closeSkFormMap() {}
