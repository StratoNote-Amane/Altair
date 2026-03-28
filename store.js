// ============================================================
// store.js
// 萓晏ｭ・ config.js
// 雋ｬ蜍・ 繧｢繝励Μ迥ｶ諷九・螳夂ｾｩ繝ｻlocalStorage隱ｭ縺ｿ譖ｸ縺阪・繝・・繧ｿ邂｡逅・// 縺薙・繝輔ぃ繧､繝ｫ縺縺代〒蟇ｾ蠢懊〒縺阪ｋ菫ｮ豁｣: 繝・・繧ｿ菫晏ｭ倡ｳｻ縺ｮ繝舌げ蜈ｨ闊ｬ
// ============================================================

// ============================================================
// STATE 窶・繧｢繝励Μ迥ｶ諷・// ============================================================

let S = {};

const STATE_DEFAULTS = {
  // 謨咏ｧ托ｼ医Θ繝ｼ繧ｶ繝ｼ霑ｽ蜉蛻・ｼ・  subjects: [],

  // 繧ｫ繝ｬ繝ｳ繝繝ｼ莠亥ｮ・  // { id, title, subj, date, load }
  events: [],

  // 蟄ｦ鄙偵そ繝・す繝ｧ繝ｳ險倬鹸
  // { id, subj, dur, ts }  dur=繝溘Μ遘・ ts=繧ｿ繧､繝繧ｹ繧ｿ繝ｳ繝・  sessions: [],

  // 證苓ｨ倥き繝ｼ繝・繝・ャ繧ｭ
  // { id, name, subj, cards: [{ id, q, a, correct, incorrect, lastReviewed }] }
  decks: [],

  // 繝・せ繝郁ｨ倬鹸
  // { id, name, date, type, subj, score, deviation }
  rounds: [],

  // 繧ｹ繧ｭ繝ｫ繝・Μ繝ｼ
  // { '謨ｰ蟄ｦ': [{ id, name, done, parentId }], ... }
  skills: {},

  // 螳溽ｸｾ
  earnedBadges: [],
  earnedDates: {},

  // 逶ｮ讓呵ｨｭ螳・  // { school, examDate, weeklyGoalHours }
  goal: null,

  // 蟄ｦ鄙定ｨ育判
  // { date: 'YYYY-MM-DD', items: [{ subj, plannedMinutes, actualMinutes }] }
  plans: [],

  // 邨ｱ險・  streak: 0,
  lastDate: '',
  todayMs: 0,
  todayMs_base: 0,
  weekMs: [0,0,0,0,0,0,0],

  // 險ｭ螳・  settings: { bg: '' },
};

// ============================================================
// LOAD / SAVE 窶・localStorage隱ｭ縺ｿ譖ｸ縺・// ============================================================

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

  // 繝・ヵ繧ｩ繝ｫ繝域蕗遘代・繧ｹ繧ｭ繝ｫ繝・Μ繝ｼ繧貞・譛溷喧
  CFG.DEFAULT_SUBJECTS.forEach(function(subj) {
    if (!S.skills[subj]) S.skills[subj] = [];
  });
  (S.subjects || []).forEach(function(subj) {
    if (!S.skills[subj]) S.skills[subj] = [];
  });

  // 驟榊・縺ｮ蝙倶ｿ晁ｨｼ
  ['events','sessions','decks','rounds','subjects','earnedBadges','plans'].forEach(function(key) {
    if (!Array.isArray(S[key])) S[key] = [];
  });

  S.earnedDates = S.earnedDates || {};
  S.goal = S.goal || null;
  S.settings = S.settings || { bg: '' };
}

function saveState() {
  try {
    localStorage.setItem(CFG.STORAGE_KEY, JSON.stringify(S));
  } catch(e) {
    showToast('菫晏ｭ倥↓螟ｱ謨励＠縺ｾ縺励◆・亥ｮｹ驥丈ｸ崎ｶｳ縺ｮ蜿ｯ閭ｽ諤ｧ縺後≠繧翫∪縺呻ｼ・);
  }
}

// ============================================================
// TIMER STATE 窶・繧ｿ繧､繝槭・迥ｶ諷具ｼ亥挨繧ｭ繝ｼ縺ｧ菫晏ｭ假ｼ・// ============================================================

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
// HELPERS 窶・繝・・繧ｿ謫堺ｽ懊Θ繝ｼ繝・ぅ繝ｪ繝・ぅ
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
  if (h === 0) return m + '蛻・;
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
// STREAK 窶・騾｣邯壼ｭｦ鄙呈律謨ｰ縺ｮ譖ｴ譁ｰ
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
// SESSIONS 窶・蟄ｦ鄙呈凾髢薙・髮・ｨ・// ============================================================

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
      const dayIndex = (d.getDay() + 6) % 7; // 譛・0縲懈律=6
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
    const s = session.subj || '荳肴・';
    map[s] = (map[s] || 0) + (session.dur || 0);
  });
  return map;
}

// ============================================================
// PLAN ENGINE 窶・莉頑律縺ｮ蟄ｦ鄙定ｨ育判繧定・蜍慕函謌・// ============================================================

function generateTodayPlan(availableMinutes) {
  const subjects = getAllSubjects();
  if (subjects.length === 0) return [];

  const scores = {};
  subjects.forEach(function(subj) {
    scores[subj] = 0;
  });

  // 繧ｹ繧ｭ繝ｫ鄙堤・蠎ｦ繧ｹ繧ｳ繧｢・井ｽ弱＞縺ｻ縺ｩ蜆ｪ蜈亥ｺｦ鬮假ｼ・  subjects.forEach(function(subj) {
    const skills = S.skills[subj] || [];
    if (skills.length === 0) {
      scores[subj] += CFG.PLAN.skillWeight;
    } else {
      const doneCount = skills.filter(function(sk) { return sk.done; }).length;
      const ratio = doneCount / skills.length;
      scores[subj] += CFG.PLAN.skillWeight * (1 - ratio);
    }
  });

  // 繝・せ繝育ｵ先棡繧ｹ繧ｳ繧｢・育せ謨ｰ縺御ｽ弱＞縺ｻ縺ｩ蜆ｪ蜈亥ｺｦ鬮假ｼ・  subjects.forEach(function(subj) {
    const subjRounds = (S.rounds || []).filter(function(r) { return r.subj === subj; });
    if (subjRounds.length === 0) {
      scores[subj] += CFG.PLAN.testWeight * 0.5;
    } else {
      const latest = subjRounds[subjRounds.length - 1];
      const ratio = (latest.score || 0) / 100;
      scores[subj] += CFG.PLAN.testWeight * (1 - ratio);
    }
  });

  // 逶ｴ霑大ｭｦ鄙偵せ繧ｳ繧｢・域怙霑代ｄ縺｣縺ｦ縺・↑縺・⊇縺ｩ蜆ｪ蜈亥ｺｦ鬮假ｼ・  const now = Date.now();
  subjects.forEach(function(subj) {
    const subjSessions = (S.sessions || []).filter(function(se) { return se.subj === subj; });
    if (subjSessions.length === 0) {
      scores[subj] += CFG.PLAN.recencyWeight;
    } else {
      const lastTs = Math.max.apply(null, subjSessions.map(function(se) { return se.ts; }));
      const daysSince = (now - lastTs) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.min(daysSince / 7, 1);
      scores[subj] += CFG.PLAN.recencyWeight * recencyScore;
    }
  });

  // 繧ｹ繧ｳ繧｢鬆・↓繧ｽ繝ｼ繝医＠縺ｦ荳贋ｽ・縲・謨咏ｧ代ｒ驕ｸ蜃ｺ
  const sorted = subjects.slice().sort(function(a, b) {
    return scores[b] - scores[a];
  });
  const topSubjects = sorted.slice(0, Math.min(5, subjects.length));

  // 繧ｹ繧ｳ繧｢縺ｫ豈比ｾ九＠縺ｦ譎る俣繧帝・蛻・  const totalScore = topSubjects.reduce(function(sum, subj) { return sum + scores[subj]; }, 0);
  const plan = topSubjects.map(function(subj) {
    const ratio = totalScore > 0 ? scores[subj] / totalScore : 1 / topSubjects.length;
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
  showToast('繧ｨ繧ｯ繧ｹ繝昴・繝亥ｮ御ｺ・);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        showToast('繧ｨ繝ｩ繝ｼ・壹ョ繝ｼ繧ｿ蠖｢蠑上′荳肴ｭ｣縺ｧ縺・);
        return;
      }
      // 驟榊・繝輔ぅ繝ｼ繝ｫ繝峨・蝙倶ｿ晁ｨｼ
      ['events','sessions','decks','rounds','subjects','earnedBadges','plans'].forEach(function(key) {
        if (parsed[key] !== undefined && !Array.isArray(parsed[key])) delete parsed[key];
      });
      // 繧ｵ繝九ち繧､繧ｺ
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
      showToast('繧､繝ｳ繝昴・繝亥ｮ御ｺ・);
      navigateTo('home');
    } catch(e) {
      showToast('繧ｨ繝ｩ繝ｼ・壹ヵ繧｡繧､繝ｫ縺檎┌蜉ｹ縺ｧ縺・);
    }
  };
  reader.readAsText(file);
}

// ============================================================
// RESET
// ============================================================

function resetAllData() {
  if (!confirm('蜈ｨ繝・・繧ｿ繧貞炎髯､縺励∪縺吶°・溘％縺ｮ謫堺ｽ懊・蜿悶ｊ豸医○縺ｾ縺帙ｓ縲・)) return;
  try { localStorage.removeItem(CFG.STORAGE_KEY); } catch(e) {}
  try { localStorage.removeItem(CFG.TIMER_KEY); } catch(e) {}
  loadState();
  clearTimerState();
  showToast('蜈ｨ繝・・繧ｿ繧偵Μ繧ｻ繝・ヨ縺励∪縺励◆');
  navigateTo('home');
}