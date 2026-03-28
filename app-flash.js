// ============================================================
// app-skill.js
// 萓晏ｭ・ config.js, store.js, app-core.js
// 雋ｬ蜍・ 繧ｹ繧ｭ繝ｫ繝・Μ繝ｼ繝ｻ險育判繧ｨ繝ｳ繧ｸ繝ｳ繝ｻ騾ｱ髢楢ｨ育判
// ============================================================

let currentSkillSubject = '';
let skMapPanCleanup     = null;

// ============================================================
// SKILL HUB
// ============================================================

function renderSkillHub() {
  const subjects = getAllSubjects();
  const cardsHtml = subjects.map(subj => {
    const skills = S.skills[subj] || [];
    const total  = skills.length;
    const done   = skills.filter(s => s.done).length;
    const pct    = total > 0 ? Math.round(done / total * 100) : 0;
    const color  = getSubjectColor(subj);
    return `<div class="skill-subj-card ${total>0?'has-skills':''}" onclick="openSkillMap('${sanitize(subj)}')">
      <div class="skill-subj-name">${sanitize(subj)}</div>
      <div class="skill-subj-count">${done}/${total} 驕疲・</div>
      <div class="skill-subj-bar" style="width:${pct}%;background:${color}"></div>
    </div>`;
  }).join('');

  return `<div class="page-header"><div class="page-title">繧ｹ繧ｭ繝ｫ</div></div>
    <div class="skill-subj-grid">${cardsHtml}</div>`;
}

// ============================================================
// SKILL MAP 窶・繝輔Ν繧ｹ繧ｯ繝ｪ繝ｼ繝ｳ繧ｪ繝ｼ繝舌・繝ｬ繧､
// ============================================================

function openSkillMap(subj) {
  currentSkillSubject = subj;
  let overlay = document.getElementById('skill-map-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'skill-map-overlay';
    overlay.style.cssText = `
      display:none;position:fixed;inset:0;z-index:500;
      background:var(--bg-base);flex-direction:column;
      padding-top:var(--safe-top);`;
    overlay.innerHTML = `
      <div id="sk-map-hd" style="background:var(--bg-card);border-bottom:1px solid var(--bg-border);padding:10px 14px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
        <div style="display:flex;align-items:center;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="closeSkillMap()">竊・謌ｻ繧・/button>
          <div id="sk-map-title" style="font-size:15px;font-weight:800"></div>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span id="sk-map-count" style="font-size:11px;color:var(--text-muted)"></span>
          <button class="btn btn-ghost btn-sm" onclick="resetSkillLayout()" style="font-size:11px">竊ｺ</button>
        </div>
      </div>
      <div id="sk-map-add-bar" style="background:var(--bg-card);border-bottom:1px solid var(--bg-border);padding:8px 14px;flex-shrink:0;display:flex;gap:8px;align-items:center">
        <input id="sk-map-inp" placeholder="繧ｹ繧ｭ繝ｫ蜷阪ｒ蜈･蜉幢ｼ・nter縺ｧ霑ｽ蜉・・ style="flex:1;padding:7px 10px;font-size:13px;background:var(--bg-base);color:var(--text-primary);border:1px solid var(--bg-border);border-radius:8px;font-family:inherit"
          onkeydown="if(event.key==='Enter')addSkillNodeInline()">
        <button class="btn btn-primary btn-sm" onclick="addSkillNodeInline()">・・霑ｽ蜉</button>
      </div>
      <div style="font-size:10px;color:var(--text-muted);padding:4px 14px;background:var(--bg-card);border-bottom:1px solid var(--bg-border);flex-shrink:0">
        繧ｿ繝・・: 螳御ｺ・譛ｪ螳御ｺ・・・笨・ 蜑企勁 ・・・・ 蟄舌せ繧ｭ繝ｫ霑ｽ蜉 ・・繝峨Λ繝・げ: 遘ｻ蜍・      </div>
      <div id="sk-map-body" style="flex:1;overflow:hidden;padding:0;position:relative;cursor:grab;user-select:none;touch-action:none">
        <div id="sk-map-svg-wrap" style="display:inline-block;min-width:100%;position:absolute;top:0;left:0"></div>
      </div>`;
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
  renderSkillTree(subj);
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
  if (countEl) countEl.textContent = `${done}/${skills.length} 驕疲・`;

  const wrap = document.getElementById('sk-map-svg-wrap');
  if (!wrap) return;

  if (!skills.length) {
    wrap.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted);font-size:13px">繧ｹ繧ｭ繝ｫ繧定ｿｽ蜉縺励※縺上□縺輔＞</div>';
    return;
  }

  const NW = 130, NH = 38, hGap = 36, vGap = 64;
  const MARGIN = 14;
  const color  = getSubjectColor(subj);

  // skillmap逕ｨindex繧呈ｧ狗ｯ・  const im = {};
  skills.forEach(sk => im[sk.id] = sk);

  // 閾ｪ蜍輔Ξ繧､繧｢繧ｦ繝茨ｼ医ヤ繝ｪ繝ｼ讒矩・・  const roots = skills.filter(sk => !sk.parentId);
  const pos   = {};

  function allAncestorsDone(id, map) {
    let cur = map[id];
    while (cur && cur.parentId) {
      cur = map[cur.parentId];
      if (!cur || !cur.done) return false;
    }
    return true;
  }

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

  // 謇句虚菴咲ｽｮ繧帝←逕ｨ
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
    const isDoneConn = sk.done && im[sk.parentId]?.done;
    linesSvg += `<path d="M${x1},${y1} C${x1},${midy} ${x2},${midy} ${x2},${y2}"
      fill="none" stroke="${isDoneConn ? color : '#2d333b'}" stroke-width="${isDoneConn?2:1.5}"
      ${!isDoneConn ? 'stroke-dasharray="5,4"' : ''}/>`;
  });

  skills.forEach(sk => {
    const p = pos[sk.id]; if (!p) return;
    const x = p.x, y = p.y;
    const fillC  = sk.done ? color : '#21262d';
    const textC  = sk.done ? '#0d1117' : '#8b949e';
    const strokeC= sk.done ? color : '#2d333b';
    const label  = sanitize(sk.name).slice(0, 14);

    nodesSvg += `<g data-drag="1" data-id="${sk.id}" style="cursor:pointer">
      <rect x="${x}" y="${y}" width="${NW}" height="${NH}" rx="8" fill="${fillC}" stroke="${strokeC}" stroke-width="1.5"/>
      <text x="${x+NW/2}" y="${y+NH/2+1}" text-anchor="middle" dominant-baseline="middle"
        font-size="11" font-weight="700" fill="${textC}" font-family="sans-serif" pointer-events="none">${label}</text>
      <text x="${x+NW-6}" y="${y+8}" text-anchor="end" dominant-baseline="hanging" font-size="14" fill="#8b949e" style="cursor:pointer"
        onclick="deleteSkillNode('${sk.id}')">笨・/text>
      <text x="${x+NW-6}" y="${y+NH-6}" text-anchor="end" dominant-baseline="auto" font-size="14" fill="${color}" style="cursor:pointer"
        onclick="addSkillNode('${sk.id}')">・・/text>
    </g>`;
  });

  const svgW = Math.max(maxX, 300);
  const svgH = Math.max(maxY, 200);

  wrap.innerHTML = `<svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}"
    style="display:block;min-width:${svgW}px;min-height:${svgH}px">
    ${linesSvg}${nodesSvg}
  </svg>`;

  // 繝峨Λ繝・げ・医ヮ繝ｼ繝臥ｧｻ蜍包ｼ・  const svg = wrap.querySelector('svg');
  const THRESHOLD = 6;
  wrap.querySelectorAll('g[data-drag="1"]').forEach(g => {
    const id = g.getAttribute('data-id');
    let dragging = false, moved = false, startX = 0, startY = 0, origX = 0, origY = 0;
    function getXY(e) {
      const t = e.touches ? e.touches[0] : e;
      const rect = svg.getBoundingClientRect();
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
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
    // 繧ｿ繝・・縺ｧ螳御ｺ・譛ｪ螳御ｺ・    g.addEventListener('click', e => {
      if (g._dragged || e.target.tagName === 'text') return;
      const sk = im[id]; if (!sk) return;
      sk.done = !sk.done; saveState(); checkBadges(); renderSkillTree(currentSkillSubject);
    });
  });

  // 繝代Φ・育判髱｢遘ｻ蜍包ｼ・  initSkillMapPan(wrap);
}

function initSkillMapPan(wrap) {
  const body = document.getElementById('sk-map-body'); if (!body) return;
  if (skMapPanCleanup) { skMapPanCleanup(); skMapPanCleanup = null; }
  let panX = 0, panY = 0, startX = 0, startY = 0, startPanX = 0, startPanY = 0, isPanning = false;
  const m = (wrap.style.transform || '').match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
  if (m) { panX = parseFloat(m[1]); panY = parseFloat(m[2]); }
  function applyTransform() { wrap.style.transform = `translate(${panX}px,${panY}px)`; }
  applyTransform();
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
  };
}

function addSkillNode(parentId) {
  const name = prompt('繧ｹ繧ｭ繝ｫ蜷阪ｒ蜈･蜉帙＠縺ｦ縺上□縺輔＞');
  if (!name?.trim()) return;
  const subj = currentSkillSubject;
  S.skills[subj] = S.skills[subj] || [];
  S.skills[subj].push({ id: generateId(), name: sanitize(name.trim()), done: false, parentId: parentId || null });
  saveState(); renderSkillTree(subj);
}

function deleteSkillNode(id) {
  if (!confirm('縺薙・繧ｹ繧ｭ繝ｫ繧貞炎髯､縺励∪縺吶°・・)) return;
  const subj = currentSkillSubject;
  S.skills[subj] = (S.skills[subj]||[]).filter(s => s.id !== id && s.parentId !== id);
  saveState(); renderSkillTree(subj);
}

function resetSkillLayout() {
  const subj = currentSkillSubject;
  (S.skills[subj]||[]).forEach(sk => { delete sk.manualX; delete sk.manualY; });
  const wrap = document.getElementById('sk-map-svg-wrap');
  if (wrap) wrap.style.transform = 'translate(0px,0px)';
  if (skMapPanCleanup) { skMapPanCleanup(); skMapPanCleanup = null; }
  saveState(); renderSkillTree(subj); showToast('驟咲ｽｮ繧偵Μ繧ｻ繝・ヨ縺励∪縺励◆');
}

// ============================================================
// SKILL PLAN 窶・險育判繧ｨ繝ｳ繧ｸ繝ｳ
// ============================================================

function renderSkillPlan() {
  const goal = S.goal;
  const weeklyGoalHours = goal?.weeklyGoalHours || CFG.DEFAULT_WEEKLY_GOAL_HOURS;
  const dailyMinutes    = Math.round(weeklyGoalHours * 60 / 7);
  const plan            = generateTodayPlan(dailyMinutes);

  const itemsHtml = plan.map(item => {
    const color = getSubjectColor(item.subj);
    return `<div class="list-row">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:8px;height:8px;border-radius:50%;background:${color}"></div>
        <div>${sanitize(item.subj)}</div>
      </div>
      <div style="font-weight:700;color:${color}">${item.plannedMinutes}蛻・/div>
    </div>`;
  }).join('');

  return `<div class="page-header">
    <div style="display:flex;align-items:center;gap:8px">
      <button class="btn btn-ghost btn-sm" onclick="navigateTo('skill')">竊・謌ｻ繧・/button>
      <div class="page-title" style="font-size:18px">險育判繧ｨ繝ｳ繧ｸ繝ｳ</div>
    </div>
  </div>
  <div class="card">
    <div class="section-label">莉頑律縺ｮ縺翫☆縺吶ａ驟榊・・・{dailyMinutes}蛻・ｼ・/div>
    ${itemsHtml || '<div style="font-size:13px;color:var(--text-muted)">謨咏ｧ代ョ繝ｼ繧ｿ縺後≠繧翫∪縺帙ｓ</div>'}
  </div>
  <div class="card">
    <div class="section-label">險育ｮ励・譬ｹ諡</div>
    <div style="font-size:12px;color:var(--text-muted);line-height:1.8">
      繧ｹ繧ｭ繝ｫ鄙堤・蠎ｦ・磯㍾縺ｿ ${Math.round(CFG.PLAN.skillWeight*100)}%・峨・      繝・せ繝育ｵ先棡・磯㍾縺ｿ ${Math.round(CFG.PLAN.testWeight*100)}%・峨・      逶ｴ霑大ｭｦ鄙偵°繧峨・邨碁℃・磯㍾縺ｿ ${Math.round(CFG.PLAN.recencyWeight*100)}%・峨・3霆ｸ縺ｧ繧ｹ繧ｳ繧｢繧定ｨ育ｮ励＠縲√せ繧ｳ繧｢縺ｫ豈比ｾ九＠縺ｦ譎る俣繧帝・蛻・＠縺ｦ縺・∪縺吶・    </div>
  </div>
  <button class="btn btn-primary btn-full" onclick="generateAndSavePlan()">莉頑律縺ｮ險育判縺ｨ縺励※繧ｻ繝・ヨ</button>`;
}

// ============================================================
// WEEKLY PLAN 窶・騾ｱ髢楢ｨ育判
// ============================================================

function renderWeeklyPlan() {
  const weekMs    = getWeekMs();
  const weekTotal = getWeekTotalMs();
  const goal      = S.goal;
  const goalHours = goal?.weeklyGoalHours || CFG.DEFAULT_WEEKLY_GOAL_HOURS;
  const goalMs    = goalHours * 3600000;
  const pct       = Math.min(Math.round(weekTotal / goalMs * 100), 100);

  const days      = ['譛・,'轣ｫ','豌ｴ','譛ｨ','驥・,'蝨・,'譌･'];
  const todayDow  = (new Date().getDay() + 6) % 7;
  const maxMs     = Math.max(...weekMs, 1);

  const barsHtml = `<div class="week-bars">
    ${days.map((d, i) => {
      const isToday = i === todayDow;
      const barPct  = Math.round(weekMs[i] / maxMs * 100);
      return `<div class="week-bar-wrap">
        <div class="week-bar-bg"><div class="week-bar-fill ${isToday?'today':''}" style="height:${barPct}%"></div></div>
        <div class="week-bar-day ${isToday?'today':''}">${d}</div>
      </div>`;
    }).join('')}
  </div>`;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - todayDow);
  weekStart.setHours(0, 0, 0, 0);
  const subjMap = getSessionsBySubject((S.sessions||[]).filter(s => new Date(s.ts) >= weekStart));

  const subjRows = Object.entries(subjMap).sort((a,b) => b[1]-a[1]).map(([subj, ms]) => {
    const color = getSubjectColor(subj);
    const p     = weekTotal > 0 ? Math.round(ms / weekTotal * 100) : 0;
    return `<div style="margin-bottom:8px">
      <div class="flex justify-between mb-4">
        <div style="font-size:12px;font-weight:700;color:${color}">${sanitize(subj)}</div>
        <div style="font-size:11px;color:var(--text-muted)">${formatMsShort(ms)} (${p}%)</div>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${p}%;background:${color}"></div></div>
    </div>`;
  }).join('');

  return `<div class="page-header">
    <div style="display:flex;align-items:center;gap:8px">
      <button class="btn btn-ghost btn-sm" onclick="navigateTo('skill')">竊・謌ｻ繧・/button>
      <div class="page-title" style="font-size:18px">騾ｱ髢楢ｨ育判</div>
    </div>
  </div>
  <div class="card">
    <div class="flex justify-between items-center mb-8">
      <div class="section-label" style="margin:0">莉企ｱ縺ｮ騾ｲ謐・/div>
      <div style="font-size:13px;font-weight:700;color:var(--accent-strong)">${pct}%</div>
    </div>
    <div class="bar-track mb-12" style="height:8px">
      <div class="bar-fill" style="width:${pct}%;background:var(--accent-soft)"></div>
    </div>
    <div class="flex justify-between" style="font-size:12px;color:var(--text-muted)">
      <span>螳溽ｸｾ: ${formatMsShort(weekTotal)}</span>
      <span>逶ｮ讓・ ${goalHours}h</span>
    </div>
  </div>
  <div class="card">
    <div class="section-label">莉企ｱ縺ｮ譌･蛻･蟄ｦ鄙・/div>
    ${barsHtml}
  </div>
  ${subjRows ? `<div class="card"><div class="section-label">謨咏ｧ大挨蜀・ｨｳ</div>${subjRows}</div>` : ''}`;
}

// ============================================================
// 繧､繝ｳ繝ｩ繧､繝ｳ繧ｹ繧ｭ繝ｫ霑ｽ蜉
// ============================================================

function addSkillNodeInline() {
  const inp = document.getElementById('sk-map-inp');
  const name = inp?.value.trim();
  if (!name) { showToast('繧ｹ繧ｭ繝ｫ蜷阪ｒ蜈･蜉帙＠縺ｦ縺上□縺輔＞'); return; }
  const subj = currentSkillSubject;
  S.skills[subj] = S.skills[subj] || [];
  S.skills[subj].push({ id: generateId(), name: sanitize(name), done: false, parentId: null });
  saveState();
  if (inp) inp.value = '';
  renderSkillTree(subj);
  showToast('繧ｹ繧ｭ繝ｫ繧定ｿｽ蜉縺励∪縺励◆');
}

// StratoNote莠呈鋤繧ｨ繧､繝ｪ繧｢繧ｹ
function resetSKLayout() { resetSkillLayout(); }
function openSkFormMap(parentId) { addSkillNode(parentId); }
function addSkillFromMap() { addSkillNodeInline(); }
function closeSkFormMap() {}