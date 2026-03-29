// app-settings.js
// 依存: config.js, store.js, app-core.js
// 責務: 設定・目標・データ管理・カスタマイズ
// ============================================================

let settingsTab = 'settings';

function renderSettings() {
  const tabs = [{k:'settings',l:'設定'},{k:'customize',l:'カスタマイズ'},{k:'info',l:'情報'}];
  const tabsHtml = tabs.map(t =>
    `<button class="page-tab ${t.k===settingsTab?'active':''}" onclick="settingsTab='${t.k}';navigateTo('settings')">${t.l}</button>`
  ).join('');

  if (settingsTab === 'info') return `<div class="page-header"><div class="page-title">設定</div></div><div class="page-tabs">${tabsHtml}</div>${renderSettingsInfo()}`;
  if (settingsTab === 'customize') return `<div class="page-header"><div class="page-title">設定</div></div><div class="page-tabs">${tabsHtml}</div>${renderCustomize()}`;

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
      ${isCustom?`<button class="btn btn-danger btn-sm" onclick="deleteSubject('${sanitize(s)}')">✕</button>`:''}
    </div>`;
  }).join('');

  const storageKB = Math.round(JSON.stringify(S).length / 1024);
  const goal = S.goal;

  return `<div class="page-header"><div class="page-title">設定</div><div class="page-subtitle">v${CFG.APP_VERSION}</div></div>
  <div class="page-tabs">${tabsHtml}</div>

  <div class="card">
    <div class="section-label">教科管理</div>
    ${subjHtml}
    <button class="btn btn-secondary btn-sm mt-12" onclick="openModal('modal-subject')">＋ 教科を追加</button>
  </div>

  <div class="card">
    <div class="section-label">データ管理 (${storageKB} KB使用中)</div>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:10px;line-height:1.7">
      定期的にエクスポートしてiCloud・LINE等に保存することでデータを保護できます
    </p>
    <div class="flex gap-8" style="flex-wrap:wrap">
      <button class="btn btn-primary btn-sm" onclick="exportData()">エクスポート</button>
      <button class="btn btn-secondary btn-sm" onclick="document.getElementById('import-file-input').click()">インポート</button>
      <input type="file" id="import-file-input" accept=".json" style="display:none" onchange="importData(event)">
    </div>
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--bg-border)">
      <div style="font-size:11px;font-weight:700;color:var(--bad);margin-bottom:8px">⚠ 危険ゾーン</div>
      <button class="btn btn-danger btn-full" onclick="resetAllData()">全データをリセット（取り消し不可）</button>
    </div>
  </div>

  <div class="card">
    <div class="section-label">アップデート</div>
    <div class="flex justify-between items-center">
      <div><div style="font-size:12px;font-weight:700">現在のバージョン</div><div style="font-size:11px;color:var(--text-muted);margin-top:2px">v${CFG.APP_VERSION}</div></div>
      <button class="btn btn-secondary btn-sm" onclick="location.reload(true)">↺ 更新</button>
    </div>
  </div>`;
}

// ============================================================
// カスタマイズ
// ============================================================

function renderCustomize() {
  const accentStrong = S.settings?.accentStrong || '#99d8ff';
  const accentSoft   = S.settings?.accentSoft   || '#76c0ea';
  const bgOpacity    = S.settings?.bgOpacity != null ? S.settings.bgOpacity : 85;

  const presets = [
    { label:'デフォルト (青)', s:'#99d8ff', f:'#76c0ea' },
    { label:'グリーン',         s:'#6ee7b7', f:'#34d399' },
    { label:'パープル',         s:'#c084fc', f:'#a855f7' },
    { label:'コーラル',         s:'#fca5a5', f:'#f87171' },
    { label:'アンバー',         s:'#fcd34d', f:'#f59e0b' },
  ];

  const presetsHtml = presets.map(p =>
    `<button class="btn btn-ghost btn-sm" style="border-color:${p.s};color:${p.s}"
      onclick="applyColorPreset('${p.s}','${p.f}')">${p.label}</button>`
  ).join('');

  return `<div class="card">
    <div class="section-label">背景画像</div>
    <div class="flex gap-8" style="flex-wrap:wrap;align-items:center;margin-bottom:10px">
      <button class="btn btn-secondary btn-sm" onclick="document.getElementById('bg-file-input').click()">写真を選ぶ</button>
      <button class="btn btn-ghost btn-sm" onclick="clearBackground()">✕ 消す</button>
      <input type="file" id="bg-file-input" accept="image/*" style="display:none" onchange="loadBackground(event)">
    </div>
    ${S.settings?.bg ? `
    <div class="form-group">
      <label>背景の透明度 (0〜95%、数値が大きいほど暗い)</label>
      <div class="flex gap-8 items-center">
        <input type="number" id="bg-opacity-input" min="0" max="95" step="5" value="${100-bgOpacity}"
          inputmode="decimal"
          style="width:80px;flex-shrink:0;text-align:center;background:var(--bg-base);color:var(--text-primary);border:1px solid var(--bg-border);border-radius:7px;padding:7px;font-size:14px"
          oninput="previewBgOpacity(this.value)">
        <span style="font-size:12px;color:var(--text-muted)">% 見える</span>
        <button class="btn btn-primary btn-sm" onclick="saveBgOpacity()">適用</button>
      </div>
    </div>` : ''}
  </div>

  <div class="card">
    <div class="section-label">アクセントカラー</div>
    <div class="form-group">
      <label>メインカラー（テキスト・強調）</label>
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
      <label>サブカラー（グラフ・バー）</label>
      <div class="flex gap-8 items-center">
        <input type="color" id="color-accent-soft" value="${accentSoft}"
          style="width:44px;height:36px;padding:2px;cursor:pointer;flex-shrink:0"
          onchange="previewAccentColor()">
        <input type="text" id="color-accent-soft-hex" value="${accentSoft}"
          placeholder="#76c0ea" style="flex:1;font-family:monospace"
          oninput="syncColorInput('soft')">
      </div>
    </div>
    <button class="btn btn-primary btn-sm" onclick="saveAccentColor()">適用</button>
    <button class="btn btn-ghost btn-sm" onclick="resetAccentColor()" style="margin-left:8px">リセット</button>
  </div>

  <div class="card">
    <div class="section-label">目標の変更</div>
    <button class="btn btn-secondary btn-full" onclick="openGoalModal()">${S.goal?'目標を編集':'目標を設定する'}</button>
  </div>

`;
}

function previewBgOpacity(val) {
  const overlay = document.querySelector('#bg-image div');
  if (overlay) overlay.style.background = `rgba(13,17,23,${(100-parseInt(val))/100})`;
}

function saveBgOpacity() {
  const val = parseInt(document.getElementById('bg-opacity-input')?.value) || 0;
  S.settings = S.settings || {};
  S.settings.bgOpacity = 100 - val;
  saveState();
  showToast('透明度を保存しました');
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
  showToast('カラーを保存しました');
}

function resetAccentColor() {
  S.settings = S.settings || {};
  delete S.settings.accentStrong;
  delete S.settings.accentSoft;
  saveState();
  applyAccentColors('#99d8ff', '#76c0ea');
  navigateTo('settings');
  showToast('カラーをリセットしました');
}

// 実績難易度カスタマイズ
function renderBadgeDifficultySettings() {
  // 調整可能な実績のしきい値定義
  const adjustable = [
    { id:'t1_3day',  label:'連続学習（Tier1）', key:'streak_t1', default:3,  min:1,  max:30,  unit:'日' },
    { id:'t1_5day',  label:'連続学習（Tier1+）',key:'streak_t1p',default:5,  min:1,  max:60,  unit:'日' },
    { id:'t2_7day',  label:'連続学習（Tier2）', key:'streak_t2', default:7,  min:3,  max:90,  unit:'日' },
    { id:'t2_14day', label:'連続学習（Tier2+）',key:'streak_t2p',default:14, min:5,  max:180, unit:'日' },
    { id:'t4_21day', label:'連続学習（Tier4）', key:'streak_t4', default:21, min:7,  max:365, unit:'日' },
    { id:'t1_ikadai',label:'累計学習（Tier1）', key:'total_t1',  default:1,  min:1,  max:10,  unit:'時間' },
    { id:'t2_10h',   label:'累計学習（Tier2）', key:'total_t2',  default:10, min:2,  max:50,  unit:'時間' },
    { id:'t3_27h',   label:'累計学習（Tier3）', key:'total_t3',  default:27, min:10, max:100, unit:'時間' },
    { id:'t2_70',    label:'テスト正答率（Tier2）',key:'score_t2',default:70,min:50, max:95,  unit:'%' },
    { id:'t2_80',    label:'テスト正答率（Tier2+）',key:'score_t2p',default:80,min:60,max:99, unit:'%' },
    { id:'t1_10cards',label:'暗記カード枚数',   key:'card_t1',  default:10, min:5,  max:100, unit:'枚' },
    { id:'t2_50cards',label:'暗記正解枚数',     key:'card_t2',  default:50, min:10, max:200, unit:'枚' },
  ];
  const diff = S.settings?.badgeDifficulty || {};
  return adjustable.map(a => {
    const cur = diff[a.key] !== undefined ? diff[a.key] : a.default;
    const level = cur < a.default ? '😊 簡単' : cur > a.default ? '💪 難しい' : '⚖️ 標準';
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
        <span>簡単 ${a.min}${a.unit}</span><span>標準 ${a.default}${a.unit}</span><span>難しい ${a.max}${a.unit}</span>
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
  // badges.jsのしきい値を動的に反映
  applyBadgeDifficulty();
  saveState();
  showToast('難易度を保存しました');
}

function resetBadgeDifficulty() {
  if (!confirm('難易度設定をリセットしますか？')) return;
  S.settings = S.settings || {};
  S.settings.badgeDifficulty = {};
  applyBadgeDifficulty();
  saveState();
  showToast('難易度をリセットしました');
  navigateTo('settings');
}

function applyBadgeDifficulty() {
  // badges.jsのMS定数を動的しきい値で上書き
  const diff = S.settings?.badgeDifficulty || {};
  const get = (key, def) => (diff[key] !== undefined ? diff[key] : def);
  // BADGE_DEFSのcheck関数は参照するグローバル変数を通じてしきい値を取得
  window._BD = {
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
// 目標設定
// ============================================================

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
  saveState();closeModal('modal-goal');showToast('目標を保存しました');
  if(!getTodayPlan())generateAndSavePlan();
  navigateTo('home');
}

// ============================================================
// 教科管理
// ============================================================

function syncSubjectColor() {
  const hex = document.getElementById('input-subject-color-hex')?.value.trim();
  const picker = document.getElementById('input-subject-color');
  if (picker && /^#[0-9a-fA-F]{6}$/.test(hex)) picker.value = hex;
}

function saveSubject() {
  const name=document.getElementById('input-subject-name').value.trim();
  if(!name){showToast('教科名を入力してください');return;}
  if(getAllSubjects().includes(name)){showToast('すでに存在します');return;}
  const color=document.getElementById('input-subject-color')?.value||'#a0c4ff';
  const isScience=document.getElementById('input-subject-type')?.value==='science';
  // 色の重複チェック
  const usedColors=Object.values(CFG.SUBJECT_COLORS);
  if(usedColors.includes(color)){showToast('この色はすでに使用されています。別の色を選んでください');return;}
  S.subjects=S.subjects||[];
  S.subjects.push(name);
  S.skills[name]=S.skills[name]||[];
  // カスタム教科の色と文理分類を保存
  CFG.SUBJECT_COLORS[name]=color;
  S.settings=S.settings||{};
  S.settings.customSubjects=S.settings.customSubjects||{};
  S.settings.customSubjects[name]={color,isScience};
  saveState();closeModal('modal-subject');
  document.getElementById('input-subject-name').value='';
  showToast('教科を追加しました');navigateTo('settings');
}

function deleteSubject(name) {
  if(!confirm(`${name} を削除しますか？`))return;
  S.subjects=(S.subjects||[]).filter(s=>s!==name);
  saveState();showToast('削除しました');navigateTo('settings');
}

// ============================================================
// 背景画像
// ============================================================

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
      showToast(`背景を設定 (${kb}KB)`);navigateTo('settings');
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}

function clearBackground() {
  S.settings=S.settings||{};S.settings.bg='';
  applyBackground('');saveState();showToast('背景を解除');navigateTo('settings');
}

// ============================================================
// カスタム背景オーバーレイの適用
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
    <div style="font-size:11px;color:var(--text-muted);margin-top:2px">受験学習管理システム</div>
    <div style="font-size:22px;font-weight:800;color:var(--accent-strong);float:right;margin-top:-28px">v${CFG.APP_VERSION}</div>
  </div>
  ${renderChangelogAccordion()}
  <div class="card">
    <div class="section-label">iPhoneでの使い方</div>
    <div style="font-size:12px;color:var(--text-secondary);line-height:1.8">
      <b>初回インストール</b><br>
      1. GitHub PagesにこのHTMLをアップロード<br>
      2. iPhoneのSafariでURLを開く<br>
      3. 共有ボタン（□↑）→「ホーム画面に追加」<br><br>
      <b>データはどうなる？</b><br>
      アップデートしてもデータはSafariのlocalStorageに残り続けます。
      ただし<b>Safariのサイトデータを消去</b>すると消えるため、定期的なエクスポートを推奨します。
    </div>
  </div>`;
}

const CHANGELOGS = [
  {
    ver: '1.5',
    items: [
      'テスト詳細ホバーのバグ修正（bySubj配列のインデックス参照ミス）',
      'ホバーに得点/満点・平均点・偏差値の詳細を表示',
      'タッチデバイスでもホバー詳細を表示（touchmove対応）',
      '勉強時間トレンドグラフのはみ出しバグ修正（padding/canvas高さ調整）',
      'トレンドグラフのラベルをgraph内に収まるよう制御',
      '苦手/得意の判定を入力された平均点・偏差値を優先して算出',
      '差分表示にavg差/偏差値差の種別ラベルを追加',
      'CLAUDE_UPDATE_GUIDE.md を生成（開発ガイド）',
    ]
  },
  {
    ver: '1.3',
    items: [
      '負荷値（タスク負荷×時間）を評価指標として算出',
      '今週の学習負荷グラフを負荷値ベースに変更',
      '計画エンジンをおすすめ表示のみに変更（セット機能廃止）',
      '計画エンジン: 今日の残り目標分のみ推奨（超過防止）',
      '計画エンジン: 週目標達成済み時は苦手強化モードに切替',
      'トレンドグラフを折れ線に変更・画面内に収まるよう修正',
      '教科別累計時間を放射状円グラフに変更',
      'テスト入力を「得点+平均点」または「得点+偏差値」に変更',
      'テスト結果の各教科に平均点・偏差値との差分を表示',
      '苦手・得意教科の自動判定（平均との差±10%以上）',
      'テスト詳細のホバー表示を復活',
      '更新情報を折りたたみ式に変更',
      '設定タブの目標設定を削除（カスタマイズタブのみ）',
    ]
  },
  {
    ver: '1.2',
    items: [
      'ホームのタスクが5件超えで折りたたみに対応',
      'タスク完了がタブ切替なしで即時反映されるように修正',
      '入試までの%表示を削除',
      'タイマーの今日の記録セクションを削除',
      'カレンダーの土日・祝日に色をつけた',
      'カレンダーの月切り替えにスライドアニメーションを追加',
      '教科別バランス・円グラフを放射状ラベル付きに変更',
      '勉強時間にトレンド分析タブを追加',
      'スキルツリーにズームイン/アウト・ホイールズームを追加',
      'スキルのロック機能を追加（親未達成は子ロック）',
      '成績グラフのY軸レンジを自動調整',
      '背景透明度を数値入力に変更',
      'アップデート時に自動リロードするように変更',
      'CSSバグ修正（白背景問題）',
    ]
  },
  {
    ver: '1.1',
    items: [
      'タイマー累積値の計算バグを修正',
      'タイマー：教科未選択でのスタートを禁止',
      'ホームに入試カウントダウン＋進捗バーを追加',
      '教科カラーをアプリ全体に統一',
      '実績バッジのUIを改善（ヒント常時表示）',
      'スキル自動配置（重なり防止）を追加',
      '成績グラフをタップで拡大・点にホバーで数値表示',
      'カスタム教科に色指定＋文理選択を追加',
      'テスト分析を文系・理系に分けて表示',
      'アクセントカラーをユーザー指定のみに簡素化',
    ]
  },
];

function renderChangelogAccordion() {
  return CHANGELOGS.map((log, idx) => {
    const isLatest = idx === 0;
    const bid = `cl-${log.ver.replace('.','_')}`;
    const items = log.items.map(i => `・${i}`).join('<br>');
    const accent = isLatest ? 'var(--accent-soft)' : 'var(--bg-border)';
    const textColor = isLatest ? 'var(--accent-strong)' : 'var(--text-muted)';
    return `<div class="card" style="border-left:3px solid ${accent}">
      <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer"
           onclick="toggleAccordionInfo('${bid}')">
        <div style="font-size:11px;font-weight:700;color:${textColor}">v${log.ver} 更新情報</div>
        <span id="${bid}-arrow" style="color:var(--text-muted);font-size:14px;transition:transform .2s">▶</span>
      </div>
      <div id="${bid}" style="display:none;font-size:11px;color:var(--text-secondary);line-height:1.9;margin-top:8px">
        ${items}
      </div>
    </div>`;
  }).join('');
}

function toggleAccordionInfo(id) {
  const el = document.getElementById(id);
  const arrow = document.getElementById(id+'-arrow');
  if (!el) return;
  const isOpen = el.style.display !== 'none';
  el.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.style.transform = isOpen ? '' : 'rotate(90deg)';
}

// 全ファイル読み込み後に初期化
applyBadgeDifficulty();
init();

