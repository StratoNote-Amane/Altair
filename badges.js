// badges.js
// 依存: config.js, store.js
// 責務: 実績バッジの定義・判定ロジック
// このファイルだけで対応できる修正: 実績の追加・条件変更
// ============================================================

// ミリ秒定数（StratoNoteから移植）
const MS = {
  _10S:      10000,
  _30S:      30000,
  _1H:    3600000,
  _4H:   14400000,
  _5H:   18000000,
  _5H2M: 18120000,
  _6H:   21600000,
  _10H:  36000000,
  _27H:  97200000,
  _104H: 374400000,
  _422H: 1519200000,
  _1227H:4417200000,
  _1DAY: 86400000,
};

// ============================================================
// BADGE_DEFS — 実績定義
// tier: 1=第一歩 2=天界学園 3=ケツイを力に 4=ゴリラ
//       5=THE ABSOLUTE IDOL 6=最高難易度 0=ネタ実績
// ============================================================

const BADGE_DEFS = [

  // ----------------------------------------
  // Tier 1 — 第一歩
  // ----------------------------------------
  {
    id: 't1_hey', icon: '🎙️', name: 'へい',
    hint: 'タイマーを使う', tier: 1,
    check: function() { return (S.sessions || []).length >= 1; },
  },
  {
    id: 't1_star', icon: '💫', name: '💫',
    hint: '暗記カードを使う', tier: 1,
    check: function() {
      return (S.decks || []).some(function(d) {
        return (d.cards || []).some(function(c) { return (c.reps || 0) >= 1; });
      });
    },
  },
  {
    id: 't1_ghost', icon: '👻', name: 'ゴーストルール',
    hint: 'スキルを追加する', tier: 1,
    check: function() {
      return Object.values(S.skills).some(function(arr) { return arr.length >= 1; });
    },
  },
  {
    id: 't1_josiki', icon: '🧠', name: '常識忍',
    hint: 'テスト結果を記録する', tier: 1,
    check: function() { return (S.rounds || []).length >= 1; },
  },
  {
    id: 't1_ikadai', icon: '🛶', name: 'いかだいで！',
    hint: '累計1時間を突破する', tier: 1,
    check: function() {
      return (S.sessions || []).reduce(function(a, s) { return a + s.dur; }, 0) >= (window._BD?.total_t1 || MS._1H);
    },
  },
  {
    id: 't1_3day', icon: '🔥', name: '3日坊主じゃなかった',
    hint: '3日連続で勉強する', tier: 1,
    check: function() { return (S.streak || 0) >= (window._BD?.streak_t1 || 3); },
  },
  {
    id: 't1_10cards', icon: '🃏', name: 'そんな聞かれないことある！？',
    hint: '10枚の暗記カードに答える', tier: 1,
    check: function() {
      return (S.decks || []).reduce(function(a, d) {
        return a + (d.cards || []).filter(function(c) { return (c.reps || 0) >= 1; }).length;
      }, 0) >= 10;
    },
  },
  {
    id: 't1_5tasks', icon: '✅', name: 'ふざけんなよマジで',
    hint: '5件のタスクをクリアする', tier: 1,
    check: function() {
      return (S.events || []).filter(function(e) { return e.done; }).length >= 5;
    },
  },
  {
    id: 't1_5decks', icon: '📦', name: '多重スパイ',
    hint: '5個以上デッキをつくる', tier: 1,
    check: function() { return (S.decks || []).length >= 5; },
  },
  {
    id: 't1_1hcont', icon: '⏱️', name: '魔界村毎日はやめましょう',
    hint: '1時間連続で勉強する', tier: 1,
    check: function() { return getTodayMs() >= MS._1H; },
  },
  {
    id: 't1_5day', icon: '⚡', name: 'abyaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    hint: '5日間連続で勉強する', tier: 1,
    check: function() { return (S.streak || 0) >= (window._BD?.streak_t1p || 5); },
  },
  {
    id: 't1_3daycard', icon: '📝', name: 'ありがちょ',
    hint: '3日間連続で暗記カードに取り組む', tier: 1,
    check: function() {
      var days = [];
      (S.sessions || []).forEach(function(s) {
        var ds = localDateStr(new Date(s.ts));
        if (!days.includes(ds)) days.push(ds);
      });
      if (days.length < 3) return false;
      days.sort();
      for (var i = 0; i <= days.length - 3; i++) {
        var d0 = new Date(days[i]   + 'T00:00:00');
        var d1 = new Date(days[i+1] + 'T00:00:00');
        var d2 = new Date(days[i+2] + 'T00:00:00');
        if ((d1 - d0) === MS._1DAY && (d2 - d1) === MS._1DAY) return true;
      }
      return false;
    },
  },
  {
    id: 't1_bg', icon: '🖼️', name: '精神病棟よりマシ',
    hint: '背景画像を設定する', tier: 1,
    check: function() { return !!(S.settings && S.settings.bg); },
  },
  {
    id: 't1_10tasks', icon: '📋', name: 'かなたそなにする',
    hint: '10件タスクを設定する', tier: 1,
    check: function() { return (S.events || []).length >= 10; },
  },
  {
    id: 't1_5sk', icon: '⭐', name: 'PPじゃないんだよ',
    hint: '5件のスキルを達成する', tier: 1,
    check: function() {
      return Object.values(S.skills).reduce(function(a, arr) {
        return a + arr.filter(function(s) { return s.done; }).length;
      }, 0) >= 5;
    },
  },
  {
    id: 't1_10sk', icon: '✨', name: '点が…点のまま…点ですね…',
    hint: '10件のスキルを達成する', tier: 1,
    check: function() {
      return Object.values(S.skills).reduce(function(a, arr) {
        return a + arr.filter(function(s) { return s.done; }).length;
      }, 0) >= 10;
    },
  },
  {
    id: 't1_3test', icon: '📊', name: 'パワーポイントは裏切らない',
    hint: 'テスト結果を3件追加する', tier: 1,
    check: function() { return (S.rounds || []).length >= 3; },
  },

  // ----------------------------------------
  // Tier 2 — 天界学園
  // ----------------------------------------
  {
    id: 't2_7day', icon: '🌟', name: 'ソーラン節会場',
    hint: '7日間連続学習', tier: 2,
    check: function() { return (S.streak || 0) >= (window._BD?.streak_t2 || 7); },
  },
  {
    id: 't2_10h', icon: '📖', name: '友人C子も驚く',
    hint: '累計10時間突破', tier: 2,
    check: function() {
      return (S.sessions || []).reduce(function(a, s) { return a + s.dur; }, 0) >= (window._BD?.total_t2 || MS._10H);
    },
  },
  {
    id: 't2_70', icon: '🎯', name: 'あまねかなたち',
    hint: 'テストで70点超える', tier: 2,
    check: function() {
      const th = window._BD?.score_t2 || 0.7;
      return (S.rounds || []).some(function(r) {
        return Object.values(r.scores || {}).some(function(s) {
          return s.max > 0 && s.score / s.max >= th;
        });
      });
    },
  },
  {
    id: 't2_80', icon: '🏹', name: 'くるちゅれ',
    hint: 'テストで80点超える', tier: 2,
    check: function() {
      const th = window._BD?.score_t2p || 0.8;
      return (S.rounds || []).some(function(r) {
        return Object.values(r.scores || {}).some(function(s) {
          return s.max > 0 && s.score / s.max >= th;
        });
      });
    },
  },
  {
    id: 't2_10sk2', icon: '🌱', name: 'の、段！',
    hint: '10件のスキルを達成する', tier: 2,
    check: function() {
      return Object.values(S.skills).reduce(function(a, arr) {
        return a + arr.filter(function(s) { return s.done; }).length;
      }, 0) >= 10;
    },
  },
  {
    id: 't2_10test', icon: '🎖️', name: 'むま',
    hint: '10件テスト結果を記入する', tier: 2,
    check: function() { return (S.rounds || []).length >= 10; },
  },
  {
    id: 't2_14day', icon: '🌙', name: 'オウムになったら即終了',
    hint: '14日間連続で学習する', tier: 2,
    check: function() { return (S.streak || 0) >= (window._BD?.streak_t2p || 14); },
  },
  {
    id: 't2_low5', icon: '😱', name: 'あわれなかなたそ',
    hint: '正答率が5%を下回る', tier: 2,
    check: function() {
      var total = 0, ok = 0;
      (S.decks || []).forEach(function(d) {
        (d.cards || []).forEach(function(c) {
          if ((c.reps || 0) > 0) {
            total++;
            if (c.status === 'ok') ok++;
          }
        });
      });
      return total >= 20 && ok / total < 0.05;
    },
  },
  {
    id: 't2_50cards', icon: '💪', name: '握力50kg',
    hint: '50枚暗記カードに正解する', tier: 2,
    check: function() {
      return (S.decks || []).reduce(function(a, d) {
        return a + (d.cards || []).filter(function(c) { return c.status === 'ok'; }).length;
      }, 0) >= (window._BD?.card_t2 || 50);
    },
  },
  {
    id: 't2_30day', icon: '💎', name: '★これが１ヵ月の成果★',
    hint: '30日勉強する', tier: 2,
    check: function() {
      return new Set((S.sessions || []).map(function(s) {
        return localDateStr(new Date(s.ts));
      })).size >= 30;
    },
  },

  // ----------------------------------------
  // Tier 3 — ケツイを力に
  // ----------------------------------------
  {
    id: 't3_104h', icon: '🔱', name: 'ケツイを力に変えるんだ',
    hint: '累計104時間勉強する', tier: 3,
    check: function() {
      return (S.sessions || []).reduce(function(a, s) { return a + s.dur; }, 0) >= MS._104H;
    },
  },
  {
    id: 't3_90', icon: '🎵', name: 'そういう曲なのか！？',
    hint: 'テストで90点超える', tier: 3,
    check: function() {
      return (S.rounds || []).some(function(r) {
        return Object.values(r.scores || {}).some(function(s) {
          return s.max > 0 && s.score / s.max >= 0.9;
        });
      });
    },
  },
  {
    id: 't3_27h', icon: '🦕', name: 'ARK',
    hint: '累計27時間勉強', tier: 3,
    check: function() {
      return (S.sessions || []).reduce(function(a, s) { return a + s.dur; }, 0) >= (window._BD?.total_t3 || MS._27H);
    },
  },
  {
    id: 't3_1227dk', icon: '💙', name: '忠誠村上',
    hint: '1227枚暗記カードをつくる', tier: 3,
    check: function() {
      return (S.decks || []).reduce(function(a, d) {
        return a + (d.cards || []).length;
      }, 0) >= 1227;
    },
  },
  {
    id: 't3_50sk', icon: '🌌', name: 'おい沙花叉',
    hint: '50件のスキルを達成する', tier: 3,
    check: function() {
      return Object.values(S.skills).reduce(function(a, arr) {
        return a + arr.filter(function(s) { return s.done; }).length;
      }, 0) >= 50;
    },
  },
  {
    id: 't3_5h1day', icon: '🌊', name: '野菜もらってうれしそうにしてるからアイツ！',
    hint: '一日5時間勉強する', tier: 3,
    check: function() { return getTodayMs() >= MS._5H; },
  },
  {
    id: 't3_allsubj', icon: '🗺️', name: '全教科制覇への第一歩',
    hint: '全教科で一つ以上のスキルを設定する', tier: 3,
    check: function() {
      return CFG.DEFAULT_SUBJECTS.every(function(s) {
        return (S.skills[s] || []).length >= 1;
      });
    },
  },
  {
    id: 't3_conan80', icon: '🔍', name: 'コナン詠唱',
    hint: '暗記カード一回の正答率が80%を超える', tier: 3,
    check: function() {
      return (S.decks || []).some(function(d) {
        var ans = (d.cards || []).filter(function(c) { return (c.reps || 0) > 0; });
        if (ans.length < 10) return false;
        return ans.filter(function(c) { return c.status === 'ok'; }).length / ans.length > 0.8;
      });
    },
  },
  {
    id: 't3_422ok', icon: '💛', name: '422枚の絆',
    hint: '422枚暗記カードに正解する', tier: 3,
    check: function() {
      return (S.decks || []).reduce(function(a, d) {
        return a + (d.cards || []).filter(function(c) { return c.status === 'ok'; }).length;
      }, 0) >= 422;
    },
  },

  // ----------------------------------------
  // Tier 4 — ゴリラ
  // ----------------------------------------
  {
    id: 't4_422h', icon: '🦍', name: 'この世のものは弱すぎる',
    hint: '累計422時間勉強する', tier: 4,
    check: function() {
      return (S.sessions || []).reduce(function(a, s) { return a + s.dur; }, 0) >= MS._422H;
    },
  },
  {
    id: 't4_1227sk', icon: '💜', name: 'かなルーナ記念日',
    hint: '1227件スキルを習得する', tier: 4,
    check: function() {
      return Object.values(S.skills).reduce(function(a, arr) {
        return a + arr.filter(function(s) { return s.done; }).length;
      }, 0) >= 1227;
    },
  },
  {
    id: 't4_6hcont', icon: '💥', name: '壊す所だった、危ねぇ危ねぇ',
    hint: '一日の勉強時間が連続6時間を超える', tier: 4,
    check: function() { return getTodayMs() >= MS._6H; },
  },
  {
    id: 't4_alltmr', icon: '❤️', name: 'いつも観てくれてるへい民のみんなー！……大好き。',
    hint: '全教科でタイマーを使用する', tier: 4,
    check: function() {
      var used = new Set((S.sessions || []).map(function(s) { return s.subj; }));
      return CFG.DEFAULT_SUBJECTS.every(function(s) { return used.has(s); });
    },
  },
  {
    id: 't4_allok', icon: '🔮', name: '俺の名前は工藤新一。',
    hint: '暗記デッキで全問正解する', tier: 4,
    check: function() {
      return (S.decks || []).some(function(d) {
        var c = d.cards || [];
        return c.length >= 5 && c.every(function(x) { return x.status === 'ok'; });
      });
    },
  },
  {
    id: 't4_21day', icon: '🌸', name: '道連れにしてやった',
    hint: '21日連続で学習する', tier: 4,
    check: function() { return (S.streak || 0) >= (window._BD?.streak_t4 || 21); },
  },
  {
    id: 't4_allskdone', icon: '🎓', name: '天才か？',
    hint: '全教科で一つ以上スキルを達成する', tier: 4,
    check: function() {
      return CFG.DEFAULT_SUBJECTS.every(function(s) {
        return (S.skills[s] || []).some(function(sk) { return sk.done; });
      });
    },
  },
  {
    id: 't4_90plus', icon: '🦅', name: '赤子の手をひねりつぶす',
    hint: '暗記カード一回の正答率が90%を超える', tier: 4,
    check: function() {
      return (S.decks || []).some(function(d) {
        var ans = (d.cards || []).filter(function(c) { return (c.reps || 0) > 0; });
        if (ans.length < 10) return false;
        return ans.filter(function(c) { return c.status === 'ok'; }).length / ans.length > 0.9;
      });
    },
  },

  // ----------------------------------------
  // Tier 5 — THE ABSOLUTE IDOL
  // ----------------------------------------
  {
    id: 't5_1227ok', icon: '🌠', name: '世界で一番のアイドル',
    hint: '累計1227枚暗記カードに正解する', tier: 5,
    check: function() {
      return (S.decks || []).reduce(function(a, d) {
        return a + (d.cards || []).filter(function(c) { return c.status === 'ok'; }).length;
      }, 0) >= 1227;
    },
  },
  {
    id: 't5_15test', icon: '🏆', name: 'ゴッドモニング',
    hint: 'テストを15回記録する', tier: 5,
    check: function() { return (S.rounds || []).length >= 15; },
  },
  {
    id: 't5_422day', icon: '🌈', name: '明日はなか卯食べる',
    hint: '422日連続で学習する', tier: 5,
    check: function() { return (S.streak || 0) >= 422; },
  },
  {
    id: 't5_2day8h', icon: '🏠', name: '同居ーず',
    hint: '2日間連続して累計8時間以上勉強する', tier: 5,
    check: function() {
      var byDay = {};
      (S.sessions || []).forEach(function(s) {
        var ds = localDateStr(new Date(s.ts));
        byDay[ds] = (byDay[ds] || 0) + s.dur;
      });
      var days = Object.keys(byDay).sort();
      for (var i = 0; i < days.length - 1; i++) {
        var d0 = new Date(days[i]   + 'T00:00:00');
        var d1 = new Date(days[i+1] + 'T00:00:00');
        if ((d1 - d0) === MS._1DAY
          && byDay[days[i]]   >= MS._4H
          && byDay[days[i+1]] >= MS._4H) return true;
      }
      return false;
    },
  },

  // ----------------------------------------
  // Tier 6 — 最高難易度
  // ----------------------------------------
  {
    id: 't6_1227h', icon: '👑', name: '誰も見てない夢を見ろ',
    hint: '累計勉強時間1227時間', tier: 6,
    check: function() {
      return (S.sessions || []).reduce(function(a, s) { return a + s.dur; }, 0) >= MS._1227H;
    },
  },

  // ----------------------------------------
  // Tier 0 — ネタ実績
  // ----------------------------------------
  {
    id: 'g_king', icon: '👑', name: 'キングオブあんぽんたん',
    hint: '一日の内に20回以上セッションを記録する', tier: 0,
    check: function() {
      var td = localDateStr(new Date());
      return (S.sessions || []).filter(function(s) {
        return localDateStr(new Date(s.ts)) === td;
      }).length >= 20;
    },
  },
  {
    id: 'g_omya', icon: '😤', name: 'おみゃーら',
    hint: '一日の勉強時間が6時間を超える', tier: 0,
    check: function() { return getTodayMs() >= MS._6H; },
  },
  {
    id: 'g_unaju', icon: '🍱', name: 'うな重',
    hint: '数学の暗記カードで不正解になる', tier: 0,
    check: function() {
      return (S.decks || []).some(function(d) {
        return d.subj === '数学' && (d.cards || []).some(function(c) { return c.status === 'ng'; });
      });
    },
  },
  {
    id: 'g_matcho', icon: '⏹️', name: 'まっちょ',
    hint: '10秒以内にタイマーを切る', tier: 0,
    check: function() {
      return (S.sessions || []).some(function(s) { return s.dur > 0 && s.dur < MS._10S; });
    },
  },
  {
    id: 'g_totsu', icon: '📭', name: '凸待ち0人',
    hint: '一日のタスクが20件を超える', tier: 0,
    check: function() {
      var td = localDateStr(new Date());
      return (S.events || []).filter(function(e) { return e.date === td; }).length >= 20;
    },
  },
  {
    id: 'g_kimochi', icon: '↕️', name: '相反する気持ちを持つのも心だろ！',
    hint: '前日の4倍以上勉強する', tier: 0,
    check: function() {
      var byDay = {};
      (S.sessions || []).forEach(function(s) {
        var ds = localDateStr(new Date(s.ts));
        byDay[ds] = (byDay[ds] || 0) + s.dur;
      });
      var td = localDateStr(new Date());
      var yd = localDateStr(new Date(Date.now() - MS._1DAY));
      return !!(byDay[yd] && byDay[td] && byDay[td] >= byDay[yd] * 4);
    },
  },
  {
    id: 'g_biden', icon: '🗳️', name: 'バイデンって誰？',
    hint: '英語カードで連続104問不正解になる', tier: 0,
    check: function() {
      var streak = 0, max = 0;
      (S.decks || []).forEach(function(d) {
        if (d.subj !== '英語') return;
        (d.cards || []).forEach(function(c) {
          if (c.status === 'ng') { streak++; if (streak > max) max = streak; }
          else { streak = 0; }
        });
      });
      return max >= 104;
    },
  },
  {
    id: 'g_conanota', icon: '🕵️', name: '重度のコナンオタク',
    hint: '10日間連続して同じ教科だけを学習する', tier: 0,
    check: function() {
      var byDay = {};
      (S.sessions || []).forEach(function(s) {
        var ds = localDateStr(new Date(s.ts));
        if (!byDay[ds]) byDay[ds] = new Set();
        byDay[ds].add(s.subj);
      });
      var keys = Object.keys(byDay).sort();
      for (var i = 0; i <= keys.length - 10; i++) {
        var subj0 = null, ok = true;
        for (var j = i; j < i + 10; j++) {
          var d0 = new Date(keys[i] + 'T00:00:00');
          var dj = new Date(keys[j] + 'T00:00:00');
          if ((dj - d0) !== (j - i) * MS._1DAY) { ok = false; break; }
          var st = [...byDay[keys[j]]];
          if (st.length > 1) { ok = false; break; }
          if (j === i) subj0 = st[0];
          else if (st[0] !== subj0) { ok = false; break; }
        }
        if (ok) return true;
      }
      return false;
    },
  },
  {
    id: 'g_1dalada', icon: '🎶', name: '1ダラダー',
    hint: 'タイマーで5時間2分きっかり勉強する', tier: 0,
    check: function() {
      return (S.sessions || []).some(function(s) {
        return Math.abs(s.dur - MS._5H2M) <= MS._30S;
      });
    },
  },
  {
    id: 'g_shunenn', icon: '🎂', name: '周年だね',
    hint: '4月22日に勉強する', tier: 0,
    check: function() {
      var td = localDateStr(new Date());
      return td.slice(5) === '04-22'
        && (S.sessions || []).some(function(s) { return localDateStr(new Date(s.ts)) === td; });
    },
  },

];

// ============================================================
// CHECK BADGES — 実績判定・解除処理
// ============================================================

function checkBadges() {
  var newBadge = false;
  S.earnedDates = S.earnedDates || {};
  BADGE_DEFS.forEach(function(b) {
    if (!S.earnedBadges.includes(b.id) && b.check()) {
      S.earnedBadges.push(b.id);
      S.earnedDates[b.id] = localDateStr(new Date());
      newBadge = true;
      setTimeout(function() { showToast('実績解除「' + b.name + '」'); }, 500);
    }
  });
  if (newBadge) saveState();
}

