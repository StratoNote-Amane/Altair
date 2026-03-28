// ============================================================
// app-settings.js
// 萓晏ｭ・ config.js, store.js, app-core.js
// 雋ｬ蜍・ 險ｭ螳壹・逶ｮ讓吶・繝・・繧ｿ邂｡逅・・繧ｫ繧ｹ繧ｿ繝槭う繧ｺ
// ============================================================

let settingsTab = 'settings';

function renderSettings() {
  const tabs = [{k:'settings',l:'險ｭ螳・},{k:'customize',l:'繧ｫ繧ｹ繧ｿ繝槭う繧ｺ'},{k:'info',l:'諠・ｱ'}];
  const tabsHtml = tabs.map(t =>
    `<button class="page-tab ${t.k===settingsTab?'active':''}" onclick="settingsTab='${t.k}';navigateTo('settings')">${t.l}</button>`
  ).join('');

  if (settingsTab === 'info') return `<div class="page-header"><div class="page-title">險ｭ螳・/div></div><div class="page-tabs">${tabsHtml}</div>${renderSettingsInfo()}`;
  if (settingsTab === 'customize') return `<div class="page-header"><div class="page-title">險ｭ螳・/div></div><div class="page-tabs">${tabsHtml}</div>${renderCustomize()}`;

  const subjects = getAllSubjects();
  const defaults  = CFG.DEFAULT_SUBJECTS;
  const subjHtml  = subjects.map(s => {
    const color    = getSubjectColor(s);
    const isCustom = !defaults.includes(s);
    return `<div class="list-row">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:10px;height:10px;border-radius:50%;background:${color}"></div>
        ${sanitize(s)}
      </div>
      ${isCustom?`<button class="btn btn-danger btn-sm" onclick="deleteSubject('${sanitize(s)}')">笨・/button>`:''}
    </div>`;
  }).join('');

  const storageKB = Math.round(JSON.stringify(S).length / 1024);
  const goal = S.goal;

  return `<div class="page-header"><div class="page-title">險ｭ螳・/div><div class="page-subtitle">v${CFG.APP_VERSION}</div></div>
  <div class="page-tabs">${tabsHtml}</div>

  <div class="card">
    <div class="section-label">逶ｮ讓呵ｨｭ螳・/div>
    <button class="btn btn-secondary btn-full" onclick="openGoalModal()">${goal?'逶ｮ讓吶ｒ邱ｨ髮・:'逶ｮ讓吶ｒ險ｭ螳壹☆繧・}</button>
    ${goal?`<div style="font-size:12px;color:var(--text-muted);margin-top:8px;line-height:1.7">
      ${sanitize(goal.school||'')} ﾂｷ ${goal.examDate||''} ﾂｷ 騾ｱ${goal.weeklyGoalHours||CFG.DEFAULT_WEEKLY_GOAL_HOURS}h
    </div>`:''}
  </div>

  <div class="card">
    <div class="section-label">謨咏ｧ醍ｮ｡逅・/div>
    ${subjHtml}
    <button class="btn btn-secondary btn-sm mt-12" onclick="openModal('modal-subject')">・・謨咏ｧ代ｒ霑ｽ蜉</button>
  </div>

  <div class="card">
    <div class="section-label">繝・・繧ｿ邂｡逅・(${storageKB} KB菴ｿ逕ｨ荳ｭ)</div>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:10px;line-height:1.7">
      螳壽悄逧・↓繧ｨ繧ｯ繧ｹ繝昴・繝医＠縺ｦiCloud繝ｻLINE遲峨↓菫晏ｭ倥☆繧九％縺ｨ縺ｧ繝・・繧ｿ繧剃ｿ晁ｭｷ縺ｧ縺阪∪縺・    </p>
    <div class="flex gap-8" style="flex-wrap:wrap">
      <button class="btn btn-primary btn-sm" onclick="exportData()">繧ｨ繧ｯ繧ｹ繝昴・繝・/button>
      <button class="btn btn-secondary btn-sm" onclick="document.getElementById('import-file-input').click()">繧､繝ｳ繝昴・繝・/button>
      <input type="file" id="import-file-input" accept=".json" style="display:none" onchange="importData(event)">
    </div>
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--bg-border)">
      <div style="font-size:11px;font-weight:700;color:var(--bad);margin-bottom:8px">笞 蜊ｱ髯ｺ繧ｾ繝ｼ繝ｳ</div>
      <button class="btn btn-danger btn-full" onclick="resetAllData()">蜈ｨ繝・・繧ｿ繧偵Μ繧ｻ繝・ヨ・亥叙繧頑ｶ医＠荳榊庄・・/button>
    </div>
  </div>

  <div class="card">
    <div class="section-label">繧｢繝・・繝・・繝・/div>
    <div class="flex justify-between items-center">
      <div><div style="font-size:12px;font-weight:700">迴ｾ蝨ｨ縺ｮ繝舌・繧ｸ繝ｧ繝ｳ</div><div style="font-size:11px;color:var(--text-muted);margin-top:2px">v${CFG.APP_VERSION}</div></div>
      <button class="btn btn-secondary btn-sm" onclick="location.reload(true)">竊ｺ 譖ｴ譁ｰ</button>
    </div>
  </div>`;
}

// ============================================================
// 繧ｫ繧ｹ繧ｿ繝槭う繧ｺ
// ============================================================

function renderCustomize() {
  const accentStrong = S.settings?.accentStrong || '#99d8ff';
  const accentSoft   = S.settings?.accentSoft   || '#76c0ea';
  const bgOpacity    = S.settings?.bgOpacity != null ? S.settings.bgOpacity : 85;

  const presets = [
    { label:'繝・ヵ繧ｩ繝ｫ繝・(髱・', s:'#99d8ff', f:'#76c0ea' },
    { label:'繧ｰ繝ｪ繝ｼ繝ｳ',         s:'#6ee7b7', f:'#34d399' },
    { label:'繝代・繝励Ν',         s:'#c084fc', f:'#a855f7' },
    { label:'繧ｳ繝ｼ繝ｩ繝ｫ',         s:'#fca5a5', f:'#f87171' },
    { label:'繧｢繝ｳ繝舌・',         s:'#fcd34d', f:'#f59e0b' },
  ];

  const presetsHtml = presets.map(p =>
    `<button class="btn btn-ghost btn-sm" style="border-color:${p.s};color:${p.s}"
      onclick="applyColorPreset('${p.s}','${p.f}')">${p.label}</button>`
  ).join('');

  return `<div class="card">
    <div class="section-label">閭梧勹逕ｻ蜒・/div>
    <div class="flex gap-8" style="flex-wrap:wrap;align-items:center;margin-bottom:10px">
      <button class="btn btn-secondary btn-sm" onclick="document.getElementById('bg-file-input').click()">蜀咏悄繧帝∈縺ｶ</button>
      <button class="btn btn-ghost btn-sm" onclick="clearBackground()">笨・豸医☆</button>
      <input type="file" id="bg-file-input" accept="image/*" style="display:none" onchange="loadBackground(event)">
    </div>
    ${S.settings?.bg ? `
    <div class="form-group">
      <label>閭梧勹縺ｮ騾乗・蠎ｦ: <b id="bg-opacity-display">${100-bgOpacity}%</b> 隕九∴繧・/label>
      <input type="range" id="bg-opacity-slider" min="0" max="95" value="${100-bgOpacity}" step="5"
        style="padding:4px 0;border:none;background:none;width:100%"
        oninput="previewBgOpacity(this.value)">
    </div>
    <button class="btn btn-primary btn-sm" onclick="saveBgOpacity()">驕ｩ逕ｨ</button>` : ''}
  </div>

  <div class="card">
    <div class="section-label">繧｢繧ｯ繧ｻ繝ｳ繝医き繝ｩ繝ｼ</div>
    <div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap">${presetsHtml}</div>
    <div class="form-group">
      <label>繝｡繧､繝ｳ繧ｫ繝ｩ繝ｼ・医ユ繧ｭ繧ｹ繝医・蠑ｷ隱ｿ・・/label>
      <div class="flex gap-8 items-center">
        <input type="color" id="color-accent-strong" value="${accentStrong}"
          style="width:44px;height:36px;padding:2px;cursor:pointer;flex-shrink:0"
          onchange="previewAccentColor()">
        <input type="text" id="color-accent-strong-hex" value="${accentStrong}"
          placeholder="#99d8ff" style="flex:1;font-family:monospace"
          oninput="syncColorInput('strong')">
      </div>
    </div>
    <div class="form-group">
      <label>繧ｵ繝悶き繝ｩ繝ｼ・医げ繝ｩ繝輔・繝舌・・・/label>
      <div class="flex gap-8 items-center">
        <input type="color" id="color-accent-soft" value="${accentSoft}"
          style="width:44px;height:36px;padding:2px;cursor:pointer;flex-shrink:0"
          onchange="previewAccentColor()">
        <input type="text" id="color-accent-soft-hex" value="${accentSoft}"
          placeholder="#76c0ea" style="flex:1;font-family:monospace"
          oninput="syncColorInput('soft')">
      </div>
    </div>
    <button class="btn btn-primary btn-sm" onclick="saveAccentColor()">驕ｩ逕ｨ</button>
    <button class="btn btn-ghost btn-sm" onclick="resetAccentColor()" style="margin-left:8px">繝ｪ繧ｻ繝・ヨ</button>
  </div>

  <div class="card">
    <div class="section-label">逶ｮ讓吶・螟画峩</div>
    <button class="btn btn-secondary btn-full" onclick="openGoalModal()">${S.goal?'逶ｮ讓吶ｒ邱ｨ髮・:'逶ｮ讓吶ｒ險ｭ螳壹☆繧・}</button>
  </div>

  <div class="card">
    <div class="section-label">螳溽ｸｾ縺ｮ髮｣譏灘ｺｦ隱ｿ謨ｴ</div>
    <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;line-height:1.7">
      蜷・ｮ溽ｸｾ縺ｮ驕疲・縺励″縺・､繧定ｪｿ謨ｴ縺ｧ縺阪∪縺吶らｰ｡蜊倥↓縺吶ｋ縺ｨ譌ｩ譛滄＃謌舌・屮縺励￥縺吶ｋ縺ｨ繧・ｊ縺斐◆縺医′蠅励＠縺ｾ縺吶・    </div>
    ${renderBadgeDifficultySettings()}
    <button class="btn btn-primary btn-sm mt-12" onclick="saveBadgeDifficulty()">菫晏ｭ・/button>
    <button class="btn btn-ghost btn-sm" onclick="resetBadgeDifficulty()" style="margin-left:8px">繝ｪ繧ｻ繝・ヨ</button>
  </div>`;
}

function previewBgOpacity(val) {
  document.getElementById('bg-opacity-display').textContent = val + '%';
  const overlay = document.querySelector('#bg-image div');
  if (overlay) overlay.style.background = `rgba(13,17,23,${(100-parseInt(val))/100})`;
}

function saveBgOpacity() {
  const val = parseInt(document.getElementById('bg-opacity-slider')?.value) || 0;
  S.settings = S.settings || {};
  S.settings.bgOpacity = 100 - val;
  saveState();
  showToast('騾乗・蠎ｦ繧剃ｿ晏ｭ倥＠縺ｾ縺励◆');
}

function applyColorPreset(strong, soft) {
  document.getElementById('color-accent-strong').value = strong;
  document.getElementById('color-accent-strong-hex').value = strong;
  document.getElementById('color-accent-soft').value = soft;
  document.getElementById('color-accent-soft-hex').value = soft;
  applyAccentColors(strong, soft);
}

function syncColorInput(type) {
  const hexEl = document.getElementById(`color-accent-${type}-hex`);
  const pickerEl = document.getElementById(`color-accent-${type}`);
  if (!hexEl || !pickerEl) return;
  const hex = hexEl.value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    pickerEl.value = hex;
    previewAccentColor();
  }
}

function previewAccentColor() {
  const strong = document.getElementById('color-accent-strong')?.value || '#99d8ff';
  const soft   = document.getElementById('color-accent-soft')?.value   || '#76c0ea';
  document.getElementById('color-accent-strong-hex').value = strong;
  document.getElementById('color-accent-soft-hex').value   = soft;
  applyAccentColors(strong, soft);
}

function applyAccentColors(strong, soft) {
  document.documentElement.style.setProperty('--accent-strong', strong);
  document.documentElement.style.setProperty('--accent-soft', soft);
  document.documentElement.style.setProperty('--accent-border', hexToRgba(strong, 0.25));
  document.documentElement.style.setProperty('--accent-bg',    hexToRgba(strong, 0.08));
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function saveAccentColor() {
  const strong = document.getElementById('color-accent-strong')?.value || '#99d8ff';
  const soft   = document.getElementById('color-accent-soft')?.value   || '#76c0ea';
  S.settings = S.settings || {};
  S.settings.accentStrong = strong;
  S.settings.accentSoft   = soft;
  saveState();
  applyAccentColors(strong, soft);
  showToast('繧ｫ繝ｩ繝ｼ繧剃ｿ晏ｭ倥＠縺ｾ縺励◆');
}

function resetAccentColor() {
  S.settings = S.settings || {};
  delete S.settings.accentStrong;
  delete S.settings.accentSoft;
  saveState();
  applyAccentColors('#99d8ff', '#76c0ea');
  navigateTo('settings');
  showToast('繧ｫ繝ｩ繝ｼ繧偵Μ繧ｻ繝・ヨ縺励∪縺励◆');
}

// 螳溽ｸｾ髮｣譏灘ｺｦ繧ｫ繧ｹ繧ｿ繝槭う繧ｺ
function renderBadgeDifficultySettings() {
  // 隱ｿ謨ｴ蜿ｯ閭ｽ縺ｪ螳溽ｸｾ縺ｮ縺励″縺・､螳夂ｾｩ
  const adjustable = [
    { id:'t1_3day',  label:'騾｣邯壼ｭｦ鄙抵ｼ・ier1・・, key:'streak_t1', default:3,  min:1,  max:30,  unit:'譌･' },
    { id:'t1_5day',  label:'騾｣邯壼ｭｦ鄙抵ｼ・ier1+・・,key:'streak_t1p',default:5,  min:1,  max:60,  unit:'譌･' },
    { id:'t2_7day',  label:'騾｣邯壼ｭｦ鄙抵ｼ・ier2・・, key:'streak_t2', default:7,  min:3,  max:90,  unit:'譌･' },
    { id:'t2_14day', label:'騾｣邯壼ｭｦ鄙抵ｼ・ier2+・・,key:'streak_t2p',default:14, min:5,  max:180, unit:'譌･' },
    { id:'t4_21day', label:'騾｣邯壼ｭｦ鄙抵ｼ・ier4・・, key:'streak_t4', default:21, min:7,  max:365, unit:'譌･' },
    { id:'t1_ikadai',label:'邏ｯ險亥ｭｦ鄙抵ｼ・ier1・・, key:'total_t1',  default:1,  min:1,  max:10,  unit:'譎る俣' },
    { id:'t2_10h',   label:'邏ｯ險亥ｭｦ鄙抵ｼ・ier2・・, key:'total_t2',  default:10, min:2,  max:50,  unit:'譎る俣' },
    { id:'t3_27h',   label:'邏ｯ險亥ｭｦ鄙抵ｼ・ier3・・, key:'total_t3',  default:27, min:10, max:100, unit:'譎る俣' },
    { id:'t2_70',    label:'繝・せ繝域ｭ｣遲皮紫・・ier2・・,key:'score_t2',default:70,min:50, max:95,  unit:'%' },
    { id:'t2_80',    label:'繝・せ繝域ｭ｣遲皮紫・・ier2+・・,key:'score_t2p',default:80,min:60,max:99, unit:'%' },
    { id:'t1_10cards',label:'證苓ｨ倥き繝ｼ繝画椢謨ｰ',   key:'card_t1',  default:10, min:5,  max:100, unit:'譫・ },
    { id:'t2_50cards',label:'證苓ｨ俶ｭ｣隗｣譫壽焚',     key:'card_t2',  default:50, min:10, max:200, unit:'譫・ },
  ];
  const diff = S.settings?.badgeDifficulty || {};
  return adjustable.map(a => {
    const cur = diff[a.key] !== undefined ? diff[a.key] : a.default;
    const level = cur < a.default ? '・ 邁｡蜊・ : cur > a.default ? '潮 髮｣縺励＞' : '笞厄ｸ・讓呎ｺ・;
    return `<div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--bg-border)">
      <div class="flex justify-between items-center mb-4">
        <div style="font-size:12px;font-weight:700">${a.label}</div>
        <span style="font-size:10px;color:var(--text-muted)">${level}</span>
      </div>
      <div class="flex items-center gap-8">
        <input type="range" id="diff-${a.key}" min="${a.min}" max="${a.max}" value="${cur}" step="1"
          style="flex:1;padding:4px 0;border:none;background:none"
          oninput="document.getElementById('diff-val-${a.key}').textContent=this.value+'${a.unit}'">
        <span id="diff-val-${a.key}" style="font-size:12px;font-weight:700;color:var(--accent-strong);width:56px;text-align:right;flex-shrink:0">${cur}${a.unit}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text-muted);margin-top:2px">
        <span>邁｡蜊・${a.min}${a.unit}</span><span>讓呎ｺ・${a.default}${a.unit}</span><span>髮｣縺励＞ ${a.max}${a.unit}</span>
      </div>
    </div>`;
  }).join('');
}

function saveBadgeDifficulty() {
  const adjustable = [
    {key:'streak_t1'},{key:'streak_t1p'},{key:'streak_t2'},{key:'streak_t2p'},{key:'streak_t4'},
    {key:'total_t1'},{key:'total_t2'},{key:'total_t3'},
    {key:'score_t2'},{key:'score_t2p'},
    {key:'card_t1'},{key:'card_t2'},
  ];
  S.settings = S.settings || {};
  S.settings.badgeDifficulty = S.settings.badgeDifficulty || {};
  adjustable.forEach(a => {
    const el = document.getElementById('diff-'+a.key);
    if (el) S.settings.badgeDifficulty[a.key] = parseInt(el.value);
  });
  // badges.js縺ｮ縺励″縺・､繧貞虚逧・↓蜿肴丐
  applyBadgeDifficulty();
  saveState();
  showToast('髮｣譏灘ｺｦ繧剃ｿ晏ｭ倥＠縺ｾ縺励◆');
}

function resetBadgeDifficulty() {
  if (!confirm('髮｣譏灘ｺｦ險ｭ螳壹ｒ繝ｪ繧ｻ繝・ヨ縺励∪縺吶°・・)) return;
  S.settings = S.settings || {};
  S.settings.badgeDifficulty = {};
  applyBadgeDifficulty();
  saveState();
  showToast('髮｣譏灘ｺｦ繧偵Μ繧ｻ繝・ヨ縺励∪縺励◆');
  navigateTo('settings');
}

function applyBadgeDifficulty() {
  // badges.js縺ｮMS螳壽焚繧貞虚逧・＠縺阪＞蛟､縺ｧ荳頑嶌縺・  const diff = S.settings?.badgeDifficulty || {};
  const get = (key, def) => (diff[key] !== undefined ? diff[key] : def);
  // BADGE_DEFS縺ｮcheck髢｢謨ｰ縺ｯ蜿ら・縺吶ｋ繧ｰ繝ｭ繝ｼ繝舌Ν螟画焚繧帝壹§縺ｦ縺励″縺・､繧貞叙蠕・  window._BD = {
    streak_t1:  get('streak_t1',  3),
    streak_t1p: get('streak_t1p', 5),
    streak_t2:  get('streak_t2',  7),
    streak_t2p: get('streak_t2p', 14),
    streak_t4:  get('streak_t4',  21),
    total_t1:   get('total_t1',   1)  * 3600000,
    total_t2:   get('total_t2',   10) * 3600000,
    total_t3:   get('total_t3',   27) * 3600000,
    score_t2:   get('score_t2',   70) / 100,
    score_t2p:  get('score_t2p',  80) / 100,
    card_t1:    get('card_t1',    10),
    card_t2:    get('card_t2',    50),
  };
}

// ============================================================
// 逶ｮ讓呵ｨｭ螳・// ============================================================

function openGoalModal() {
  const goal=S.goal;
  if(goal){
    document.getElementById('input-goal-school').value=goal.school||'';
    document.getElementById('input-goal-date').value=goal.examDate||'';
    document.getElementById('input-goal-hours').value=goal.weeklyGoalHours||CFG.DEFAULT_WEEKLY_GOAL_HOURS;
  }
  openModal('modal-goal');
}

function saveGoal() {
  const school=document.getElementById('input-goal-school').value.trim();
  const date  =document.getElementById('input-goal-date').value;
  const hours =parseInt(document.getElementById('input-goal-hours').value)||CFG.DEFAULT_WEEKLY_GOAL_HOURS;
  S.goal={school:sanitize(school),examDate:date,weeklyGoalHours:hours};
  saveState();closeModal('modal-goal');showToast('逶ｮ讓吶ｒ菫晏ｭ倥＠縺ｾ縺励◆');
  if(!getTodayPlan())generateAndSavePlan();
  navigateTo('home');
}

// ============================================================
// 謨咏ｧ醍ｮ｡逅・// ============================================================

function saveSubject() {
  const name=document.getElementById('input-subject-name').value.trim();
  if(!name){showToast('謨咏ｧ大錐繧貞・蜉帙＠縺ｦ縺上□縺輔＞');return;}
  if(getAllSubjects().includes(name)){showToast('縺吶〒縺ｫ蟄伜惠縺励∪縺・);return;}
  S.subjects=S.subjects||[];S.subjects.push(name);
  S.skills[name]=S.skills[name]||[];
  saveState();closeModal('modal-subject');
  document.getElementById('input-subject-name').value='';
  showToast('謨咏ｧ代ｒ霑ｽ蜉縺励∪縺励◆');navigateTo('settings');
}

function deleteSubject(name) {
  if(!confirm(`${name} 繧貞炎髯､縺励∪縺吶°・歔))return;
  S.subjects=(S.subjects||[]).filter(s=>s!==name);
  saveState();showToast('蜑企勁縺励∪縺励◆');navigateTo('settings');
}

// ============================================================
// 閭梧勹逕ｻ蜒・// ============================================================

function loadBackground(e) {
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    const img=new Image();
    img.onload=function(){
      const MAX=1200;let w=img.width,h=img.height;
      if(w>MAX||h>MAX){const sc=Math.min(MAX/w,MAX/h);w=Math.round(w*sc);h=Math.round(h*sc);}
      const cv=document.createElement('canvas');cv.width=w;cv.height=h;
      cv.getContext('2d').drawImage(img,0,0,w,h);
      const compressed=cv.toDataURL('image/jpeg',0.72);
      S.settings=S.settings||{};S.settings.bg=compressed;
      applyBackground(compressed);saveState();
      const kb=Math.round(compressed.length*0.75/1024);
      showToast(`閭梧勹繧定ｨｭ螳・(${kb}KB)`);navigateTo('settings');
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}

function clearBackground() {
  S.settings=S.settings||{};S.settings.bg='';
  applyBackground('');saveState();showToast('閭梧勹繧定ｧ｣髯､');navigateTo('settings');
}

// ============================================================
// 繧ｫ繧ｹ繧ｿ繝閭梧勹繧ｪ繝ｼ繝舌・繝ｬ繧､縺ｮ驕ｩ逕ｨ
// ============================================================

function applyStoredSettings() {
  const s=S.settings||{};
  if(s.bg)applyBackground(s.bg);
  if(s.accentStrong||s.accentSoft)applyAccentColors(s.accentStrong||'#99d8ff',s.accentSoft||'#76c0ea');
  if(s.bgOpacity!=null){
    const overlay=document.querySelector('#bg-image div');
    if(overlay)overlay.style.background=`rgba(13,17,23,${s.bgOpacity/100})`;
  }
}

function renderSettingsInfo() {
  return `<div class="card" style="border-color:var(--accent-border)">
    <div style="font-size:20px;font-weight:800;color:var(--accent-strong)">Altair</div>
    <div style="font-size:11px;color:var(--text-muted);margin-top:2px">蜿鈴ｨ灘ｭｦ鄙堤ｮ｡逅・す繧ｹ繝・Β</div>
    <div style="font-size:22px;font-weight:800;color:var(--accent-strong);float:right;margin-top:-28px">v${CFG.APP_VERSION}</div>
  </div>
  <div class="card">
    <div class="section-label">iPhone縺ｧ縺ｮ菴ｿ縺・婿</div>
    <div style="font-size:12px;color:var(--text-secondary);line-height:1.8">
      <b>蛻晏屓繧､繝ｳ繧ｹ繝医・繝ｫ</b><br>
      1. GitHub Pages縺ｫ縺薙・HTML繧偵い繝・・繝ｭ繝ｼ繝・br>
      2. iPhone縺ｮSafari縺ｧURL繧帝幕縺・br>
      3. 蜈ｱ譛峨・繧ｿ繝ｳ・遺味竊托ｼ俄・縲後・繝ｼ繝逕ｻ髱｢縺ｫ霑ｽ蜉縲・br><br>
      <b>繝・・繧ｿ縺ｯ縺ｩ縺・↑繧具ｼ・/b><br>
      繧｢繝・・繝・・繝医＠縺ｦ繧ゅョ繝ｼ繧ｿ縺ｯSafari縺ｮlocalStorage縺ｫ谿九ｊ邯壹￠縺ｾ縺吶・      縺溘□縺・b>Safari縺ｮ繧ｵ繧､繝医ョ繝ｼ繧ｿ繧呈ｶ亥悉</b>縺吶ｋ縺ｨ豸医∴繧九◆繧√∝ｮ壽悄逧・↑繧ｨ繧ｯ繧ｹ繝昴・繝医ｒ謗ｨ螂ｨ縺励∪縺吶・    </div>
  </div>`;
}

// 蜈ｨ繝輔ぃ繧､繝ｫ隱ｭ縺ｿ霎ｼ縺ｿ蠕後↓蛻晄悄蛹・applyBadgeDifficulty();
init();