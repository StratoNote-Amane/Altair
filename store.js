// store.js
// 依存: config.js
// 責務: アプリ状態の定義・localStorage読み書き・データ管理
// このファイルだけで対応できる修正: データ保存系のバグ全般
// ============================================================

// ============================================================
// STATE — アプリ状態
// ============================================================

let S = {};

const STATE_DEFAULTS = {
  // 教科（ユーザー追加分）
  subjects: [],

  // カレンダー予定
  // { id, title, subj, date, load }
  events: [],

  // 学習セッション記録
  // { id, subj, dur, ts }  dur=ミリ秒, ts=タイムスタンプ
  sessions: [],

  // 暗記カード デッキ
  // { id, name, subj, cards: [{ id, q, a, correct, incorrect, lastReviewed }] }
  decks: [],

  // テスト記録
  // { id, name, date, type, subj, score, deviation }
  rounds: [],

  // スキルツリー
  // { '数学': [{ id, name, done, parentId }], ... }
  skills: {},

  // 実績
  earnedBadges: [],
  earnedDates: {},

  // 目標設定
  // { school, examDate, weeklyGoalHours }
  goal: null,

  // 学習計画
  // { date: 'YYYY-MM-DD', items: [{ subj, plannedMinutes, actualMinutes }] }
  plans: [],

  // 統計
  streak: 0,
  lastDate: '',
  todayMs: 0,
  todayMs_base: 0,
  weekMs: [0,0,0,0,0,0,0],

  // 設定
  settings: { bg: '' },
};

// ============================================================
// LOAD / SAVE — localStorage読み書き
// ============================================================

function loadState() {
  try {
    const raw = localStorage.getItem(CFG.STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      S = Object.assign({}, STATE_DEFAULTS, parsed);
    } else {
      S = Object.assign({}, STATE_DEFAULTS);
    }
  } catch(e) {
    S = Object.assign({}, STATE_DEFAULTS);
  }

  // デフォルト教科のスキルツリーを初期化
  CFG.DEFAULT_SUBJECTS.forEach(function(subj) {
    if (!S.skills[subj]) S.skills[subj] = [];
  });
  (S.subjects || []).forEach(function(subj) {
    if (!S.skills[subj]) S.skills[subj] = [];
  });

  // 配列の型保証
  ['events','sessions','decks','rounds','subjects','earnedBadges','plans'].forEach(function(key) {
    if (!Array.isArray(S[key])) S[key] = [];
  });

  S.earnedDates = S.earnedDates || {};
  S.goal = S.goal || null;
  S.settings = S.settings || { bg: '' };

  // カスタム教科の色を復元
  const customSubjs = S.settings?.customSubjects || {};
  Object.entries(customSubjs).forEach(function(entry) {
    const name = entry[0], info = entry[1];
    if (info && info.color) CFG.SUBJECT_COLORS[name] = info.color;
  });
}

function saveState() {
  try {
    localStorage.setItem(CFG.STORAGE_KEY, JSON.stringify(S));
  } catch(e) {
    showToast('保存に失敗しました（容量不足の可能性があります）');
  }
}

// ============================================================
// TIMER STATE — タイマー状態（別キーで保存）
// ============================================================

let timerIsRunning = false;
let timerStartTs   = 0;
let timerSubject   = '';

function saveTimerState() {
  try {
    localStorage.setItem(CFG.TIMER_KEY, JSON.stringify({
      isRunning: timerIsRunning,
      startTs:   timerStartTs,
      subject:   timerSubject,
    }));
  } catch(e) {}
}

function loadTimerState() {
  try {
    const raw = localStorage.getItem(CFG.TIMER_KEY);
    if (!raw) return;
    const t = JSON.parse(raw);
    timerIsRunning = t.isRunning || false;
    timerStartTs   = t.startTs   || 0;
    timerSubject   = t.subject   || '';
  } catch(e) {}
}

function clearTimerState() {
  timerIsRunning = false;
  timerStartTs   = 0;
  timerSubject   = '';
  try { localStorage.removeItem(CFG.TIMER_KEY); } catch(e) {}
}

// ============================================================
// HELPERS — データ操作ユーティリティ
// ============================================================

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function today() {
  const d = new Date();
  return d.getFullYear() + '-'
    + String(d.getMonth()+1).padStart(2,'0') + '-'
    + String(d.getDate()).padStart(2,'0');
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatMs(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return h + ':' + pad(m) + ':' + pad(s);
}

function formatMsShort(ms) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return m + '分';
  if (m === 0) return h + 'h';
  return h + 'h ' + m + 'm';
}

function localDateStr(d) {
  return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
}

function localMonthStr(d) {
  return d.getFullYear() + '-' + pad(d.getMonth()+1);
}

function weekKeyOf(d) {
  const tmp = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = tmp.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  tmp.setDate(tmp.getDate() + diff);
  return localDateStr(tmp);
}

function sanitize(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getSubjectColor(subj) {
  return CFG.SUBJECT_COLORS[subj] || CFG.SUBJECT_COLORS['_default'];
}

function getAllSubjects() {
  const defaults = CFG.DEFAULT_SUBJECTS;
  const custom   = S.subjects || [];
  return defaults.concat(custom.filter(function(s) { return !defaults.includes(s); }));
}

// ============================================================
// STREAK — 連続学習日数の更新
// ============================================================

function updateStreak() {
  const todayStr = today();
  if (S.lastDate === todayStr) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = localDateStr(yesterday);

  if (S.lastDate === yesterdayStr) {
    S.streak = (S.streak || 0) + 1;
  } else if (S.lastDate !== todayStr) {
    S.streak = 1;
  }
  S.lastDate = todayStr;
  saveState();
}

// ============================================================
// SESSIONS — 学習時間の集計
// ============================================================

function getTodayMs() {
  const todayStr = today();
  return (S.sessions || []).reduce(function(sum, session) {
    const d = new Date(session.ts);
    if (localDateStr(d) === todayStr) return sum + (session.dur || 0);
    return sum;
  }, 0);
}

function getWeekMs() {
  const now = new Date();
  const weekStart = new Date(now);
  const dow = now.getDay();
  weekStart.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  weekStart.setHours(0,0,0,0);

  const result = [0,0,0,0,0,0,0];
  (S.sessions || []).forEach(function(session) {
    const d = new Date(session.ts);
    if (d >= weekStart) {
      const dayIndex = (d.getDay() + 6) % 7; // 月=0〜日=6
      result[dayIndex] += session.dur || 0;
    }
  });
  return result;
}

function getWeekTotalMs() {
  return getWeekMs().reduce(function(a,b) { return a+b; }, 0);
}

function getSessionsBySubject(sessions) {
  const map = {};
  (sessions || []).forEach(function(session) {
    const s = session.subj || '不明';
    map[s] = (map[s] || 0) + (session.dur || 0);
  });
  return map;
}

// ============================================================
// PLAN ENGINE — 今日の学習計画を自動生成
// ============================================================

function generateTodayPlan(availableMinutes) {
  const goal = S.goal;
  const weeklyGoalHours = goal ? (goal.weeklyGoalHours || CFG.DEFAULT_WEEKLY_GOAL_HOURS) : CFG.DEFAULT_WEEKLY_GOAL_HOURS;
  const weekGoalMs = weeklyGoalHours * 3600000;
  const weekDoneMs = getWeekTotalMs();

  // 週目標を既に達成している場合は自由学習モード（スコアのみで配分、時間は維持）
  const goalAchieved = weekDoneMs >= weekGoalMs;

  if (!availableMinutes) {
    if (goalAchieved) {
      // 目標達成済み → 苦手補強として1.5h推奨
      availableMinutes = 90;
    } else {
      const dow = (new Date().getDay() + 6) % 7; // 月=0
      const daysLeft = Math.max(1, 7 - dow);
      const remainMs = weekGoalMs - weekDoneMs;
      availableMinutes = Math.round(remainMs / daysLeft / 60000);
      availableMinutes = Math.max(30, Math.min(availableMinutes, 480));
    }
  }

  const subjects = getAllSubjects();
  if (subjects.length === 0) return [];

  const scores = {};
  subjects.forEach(function(subj) { scores[subj] = 0; });

  // 1. 直近学習スコア（recencyWeight=0.40）
  const now = Date.now();
  subjects.forEach(function(subj) {
    const subs = (S.sessions || []).filter(function(se) { return se.subj === subj; });
    if (!subs.length) {
      scores[subj] += CFG.PLAN.recencyWeight;
    } else {
      const lastTs = Math.max.apply(null, subs.map(function(se) { return se.ts; }));
      const daysSince = (now - lastTs) / 86400000;
      scores[subj] += CFG.PLAN.recencyWeight * Math.min(daysSince / 7, 1);
    }
  });

  // 2. 最新テスト結果 × 平均点との差（testWeight=0.35）
  // 全受験者平均が不明なため、全教科平均を「平均」として扱う
  subjects.forEach(function(subj) {
    const subjRounds = (S.rounds || []).filter(function(r) { return r.scores && r.scores[subj]; });
    if (!subjRounds.length) {
      scores[subj] += CFG.PLAN.testWeight * 0.6; // データなし→やや優先
    } else {
      // 最新1回の得点率
      const latest = subjRounds[subjRounds.length - 1];
      const sc = latest.scores[subj];
      const latestPct = sc.max > 0 ? sc.score / sc.max : 0.5;
      // 全教科の平均得点率
      let allTotal = 0, allCount = 0;
      (S.rounds || []).forEach(function(r) {
        Object.values(r.scores || {}).forEach(function(sc2) {
          if (sc2.max > 0) { allTotal += sc2.score / sc2.max; allCount++; }
        });
      });
      const overallAvg = allCount > 0 ? allTotal / allCount : 0.6;
      // 平均より低いほどスコア高（苦手優先）
      const gap = Math.max(0, overallAvg - latestPct);
      scores[subj] += CFG.PLAN.testWeight * (0.3 + gap * 1.4);
    }
  });

  // 3. スキル習熟度スコア（skillWeight=0.25）
  subjects.forEach(function(subj) {
    const skills = S.skills[subj] || [];
    if (!skills.length) {
      scores[subj] += CFG.PLAN.skillWeight * 0.5;
    } else {
      const done = skills.filter(function(sk) { return sk.done; }).length;
      scores[subj] += CFG.PLAN.skillWeight * (1 - done / skills.length);
    }
  });

  // スコア順ソート → 上位5教科
  const sorted = subjects.slice().sort(function(a, b) { return scores[b] - scores[a]; });
  const topN = Math.min(5, subjects.length);
  const topSubjects = sorted.slice(0, topN);

  const totalScore = topSubjects.reduce(function(sum, s) { return sum + scores[s]; }, 0);
  const plan = topSubjects.map(function(subj) {
    const ratio = totalScore > 0 ? scores[subj] / totalScore : 1 / topN;
    let minutes = Math.round(availableMinutes * ratio);
    minutes = Math.max(minutes, CFG.PLAN.minDailyMinutes);
    minutes = Math.min(minutes, CFG.PLAN.maxSubjectMinutes);
    return { subj: subj, plannedMinutes: minutes, actualMinutes: 0 };
  });

  return plan;
}

function getTodayPlan() {
  const todayStr = today();
  const existing = (S.plans || []).find(function(p) { return p.date === todayStr; });
  return existing || null;
}

function saveTodayPlan(plan) {
  const todayStr = today();
  S.plans = (S.plans || []).filter(function(p) { return p.date !== todayStr; });
  S.plans.push({ date: todayStr, items: plan });
  saveState();
}

// ============================================================
// EXPORT / IMPORT
// ============================================================

function exportData() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'altair_' + today() + '.json';
  a.click();
  showToast('エクスポート完了');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        showToast('エラー：データ形式が不正です');
        return;
      }
      // 配列フィールドの型保証
      ['events','sessions','decks','rounds','subjects','earnedBadges','plans'].forEach(function(key) {
        if (parsed[key] !== undefined && !Array.isArray(parsed[key])) delete parsed[key];
      });
      // サニタイズ
      if (Array.isArray(parsed.events)) {
        parsed.events = parsed.events.map(function(ev) {
          return Object.assign({}, ev, { title: sanitize(ev.title || ''), subj: sanitize(ev.subj || '') });
        });
      }
      if (Array.isArray(parsed.decks)) {
        parsed.decks = parsed.decks.map(function(dk) {
          return Object.assign({}, dk, {
            name: sanitize(dk.name || ''),
            cards: Array.isArray(dk.cards) ? dk.cards.map(function(c) {
              return Object.assign({}, c, { q: sanitize(c.q || ''), a: sanitize(c.a || '') });
            }) : [],
          });
        });
      }
      S = Object.assign({}, S, parsed);
      CFG.DEFAULT_SUBJECTS.forEach(function(subj) {
        if (!S.skills[subj]) S.skills[subj] = [];
      });
      S.earnedBadges = S.earnedBadges || [];
      S.earnedDates  = S.earnedDates  || {};
      saveState();
      showToast('インポート完了');
      navigateTo('home');
    } catch(e) {
      showToast('エラー：ファイルが無効です');
    }
  };
  reader.readAsText(file);
}

// ============================================================
// RESET
// ============================================================

function resetAllData() {
  if (!confirm('全データを削除しますか？この操作は取り消せません。')) return;
  try { localStorage.removeItem(CFG.STORAGE_KEY); } catch(e) {}
  try { localStorage.removeItem(CFG.TIMER_KEY); } catch(e) {}
  loadState();
  clearTimerState();
  showToast('全データをリセットしました');
  navigateTo('home');
}

