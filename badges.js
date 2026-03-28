// ============================================================
// badges.js
// 萓晏ｭ・ config.js, store.js
// 雋ｬ蜍・ 螳溽ｸｾ繝舌ャ繧ｸ縺ｮ螳夂ｾｩ繝ｻ蛻､螳壹Ο繧ｸ繝・け
// 縺薙・繝輔ぃ繧､繝ｫ縺縺代〒蟇ｾ蠢懊〒縺阪ｋ菫ｮ豁｣: 螳溽ｸｾ縺ｮ霑ｽ蜉繝ｻ譚｡莉ｶ螟画峩
// ============================================================

// 繝溘Μ遘貞ｮ壽焚・・tratoNote縺九ｉ遘ｻ讀搾ｼ・const MS = {
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
// BADGE_DEFS 窶・螳溽ｸｾ螳夂ｾｩ
// tier: 1=隨ｬ荳豁ｩ 2=螟ｩ逡悟ｭｦ蝨・3=繧ｱ繝・う繧貞鴨縺ｫ 4=繧ｴ繝ｪ繝ｩ
//       5=THE ABSOLUTE IDOL 6=譛鬮倬屮譏灘ｺｦ 0=繝阪ち螳溽ｸｾ
// ============================================================

const BADGE_DEFS = [

  // ----------------------------------------
  // Tier 1 窶・隨ｬ荳豁ｩ
  // ----------------------------------------
  {
    id: 't1_hey', icon: '児・・, name: '縺ｸ縺・,
    hint: '繧ｿ繧､繝槭・繧剃ｽｿ縺・, tier: 1,
    check: function() { return (S.sessions || []).length >= 1; },
  },
  {
    id: 't1_star', icon: '牒', name: '牒',
    hint: '證苓ｨ倥き繝ｼ繝峨ｒ菴ｿ縺・, tier: 1,
    check: function() {
      return (S.decks || []).some(function(d) {
        return (d.cards || []).some(function(c) { return (c.reps || 0) >= 1; });
      });
    },
  },
  {
    id: 't1_ghost', icon: '遜', name: '繧ｴ繝ｼ繧ｹ繝医Ν繝ｼ繝ｫ',
    hint: '繧ｹ繧ｭ繝ｫ繧定ｿｽ蜉縺吶ｋ', tier: 1,
    check: function() {
      return Object.values(S.skills).some(function(arr) { return arr.length >= 1; });
    },
  },
  {
    id: 't1_josiki', icon: 'ｧ', name: '蟶ｸ隴伜ｿ・,
    hint: '繝・せ繝育ｵ先棡繧定ｨ倬鹸縺吶ｋ', tier: 1,
    check: function() { return (S.rounds || []).length >= 1; },
  },
  {
    id: 't1_ikadai', icon: '峺', name: '縺・°縺縺・〒・・,
    hint: '邏ｯ險・譎る俣繧堤ｪ∫ｴ縺吶ｋ', tier: 1,
    check: function() {
      return (S.sessions || []).reduce(function(a, s) { return a + s.dur; }, 0) >= (window._BD?.total_t1 || MS._1H);
    },
  },
  {
    id: 't1_3day', icon: '櫨', name: '3譌･蝮贋ｸｻ縺倥ｃ縺ｪ縺九▲縺・,
    hint: '3譌･騾｣邯壹〒蜍牙ｼｷ縺吶ｋ', tier: 1,
    check: function() { return (S.streak || 0) >= (window._BD?.streak_t1 || 3); },
  },
  {
    id: 't1_10cards', icon: 'ワ', name: '縺昴ｓ縺ｪ閨槭°繧後↑縺・％縺ｨ縺ゅｋ・・ｼ・,
    hint: '10譫壹・證苓ｨ倥き繝ｼ繝峨↓遲斐∴繧・, tier: 1,
    check: function() {
      return (S.decks || []).reduce(function(a, d) {
        return a + (d.cards || []).filter(function(c) { return (c.reps || 0) >= 1; }).length;
      }, 0) >= 10;
    },
  },
  {
    id: 't1_5tasks', icon: '笨・, name: '縺ｵ縺悶￠繧薙↑繧医・繧ｸ縺ｧ',
    hint: '5莉ｶ縺ｮ繧ｿ繧ｹ繧ｯ繧偵け繝ｪ繧｢縺吶ｋ', tier: 1,
    check: function() {
      return (S.events || []).filter(function(e) { return e.done; }).length >= 5;
    },
  },
  {
    id: 't1_5decks', icon: '逃', name: '螟夐㍾繧ｹ繝代う',
    hint: '5蛟倶ｻ･荳翫ョ繝・く繧偵▽縺上ｋ', tier: 1,
    check: function() { return (S.decks || []).length >= 5; },
  },
  {
    id: 't1_1hcont', icon: '竢ｱ・・, name: '鬲皮阜譚第ｯ取律縺ｯ繧・ａ縺ｾ縺励ｇ縺・,
    hint: '1譎る俣騾｣邯壹〒蜍牙ｼｷ縺吶ｋ', tier: 1,
    check: function() { return getTodayMs() >= MS._1H; },
  },
  {
    id: 't1_5day', icon: '笞｡', name: 'abyaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    hint: '5譌･髢馴｣邯壹〒蜍牙ｼｷ縺吶ｋ', tier: 1,
    check: function() { return (S.streak || 0) >= (window._BD?.streak_t1p || 5); },
  },
  {
    id: 't1_3daycard', icon: '統', name: '縺ゅｊ縺後■繧・,
    hint: '3譌･髢馴｣邯壹〒證苓ｨ倥き繝ｼ繝峨↓蜿悶ｊ邨・・', tier: 1,
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
    id: 't1_bg', icon: '名・・, name: '邊ｾ逾樒羅譽溘ｈ繧翫・繧ｷ',
    hint: '閭梧勹逕ｻ蜒上ｒ險ｭ螳壹☆繧・, tier: 1,
    check: function() { return !!(S.settings && S.settings.bg); },
  },
  {
    id: 't1_10tasks', icon: '搭', name: '縺九↑縺溘◎縺ｪ縺ｫ縺吶ｋ',
    hint: '10莉ｶ繧ｿ繧ｹ繧ｯ繧定ｨｭ螳壹☆繧・, tier: 1,
    check: function() { return (S.events || []).length >= 10; },
  },
  {
    id: 't1_5sk', icon: '箝・, name: 'PP縺倥ｃ縺ｪ縺・ｓ縺繧・,
    hint: '5莉ｶ縺ｮ繧ｹ繧ｭ繝ｫ繧帝＃謌舌☆繧・, tier: 1,
    check: function() {
      return Object.values(S.skills).reduce(function(a, arr) {
        return a + arr.filter(function(s) { return s.done; }).length;
      }, 0) >= 5;
    },
  },
  {
    id: 't1_10sk', icon: '笨ｨ', name: '轤ｹ縺娯ｦ轤ｹ縺ｮ縺ｾ縺ｾ窶ｦ轤ｹ縺ｧ縺吶・窶ｦ',
    hint: '10莉ｶ縺ｮ繧ｹ繧ｭ繝ｫ繧帝＃謌舌☆繧・, tier: 1,
    check: function() {
      return Object.values(S.skills).reduce(function(a, arr) {
        return a + arr.filter(function(s) { return s.done; }).length;
      }, 0) >= 10;
    },
  },
  {
    id: 't1_3test', icon: '投', name: '繝代Ρ繝ｼ繝昴う繝ｳ繝医・陬丞・繧峨↑縺・,
    hint: '繝・せ繝育ｵ先棡繧・莉ｶ霑ｽ蜉縺吶ｋ', tier: 1,
    check: function() { return (S.rounds || []).length >= 3; },
  },

  // ----------------------------------------
  // Tier 2 窶・螟ｩ逡悟ｭｦ蝨・  // ----------------------------------------
  {
    id: 't2_7day', icon: '検', name: '繧ｽ繝ｼ繝ｩ繝ｳ遽莨壼ｴ',
    hint: '7譌･髢馴｣邯壼ｭｦ鄙・, tier: 2,
    check: function() { return (S.streak || 0) >= (window._BD?.streak_t2 || 7); },
  },
  {
    id: 't2_10h', icon: '当', name: '蜿倶ｺｺC蟄舌ｂ鬩壹￥',
    hint: '邏ｯ險・0譎る俣遯∫ｴ', tier: 2,
    check: function() {
      return (S.sessions || []).reduce(function(a, s) { return a + s.dur; }, 0) >= (window._BD?.total_t2 || MS._10H);
    },
  },
  {
    id: 't2_70', icon: '識', name: '縺ゅ∪縺ｭ縺九↑縺溘■',
    hint: '繝・せ繝医〒70轤ｹ雜・∴繧・, tier: 2,
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
    id: 't2_80', icon: '昌', name: '縺上ｋ縺｡繧・ｌ',
    hint: '繝・せ繝医〒80轤ｹ雜・∴繧・, tier: 2,
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
    id: 't2_10sk2', icon: '験', name: '縺ｮ縲∵ｮｵ・・,
    hint: '10莉ｶ縺ｮ繧ｹ繧ｭ繝ｫ繧帝＃謌舌☆繧・, tier: 2,
    check: function() {
      return Object.values(S.skills).reduce(function(a, arr) {
        return a + arr.filter(function(s) { return s.done; }).length;
      }, 0) >= 10;
    },
  },
  {
    id: 't2_10test', icon: '事・・, name: '繧縺ｾ',
    hint: '10莉ｶ繝・せ繝育ｵ先棡繧定ｨ伜・縺吶ｋ', tier: 2,
    check: function() { return (S.rounds || []).length >= 10; },
  },
  {
    id: 't2_14day', icon: '嫌', name: '繧ｪ繧ｦ繝縺ｫ縺ｪ縺｣縺溘ｉ蜊ｳ邨ゆｺ・,
    hint: '14譌･髢馴｣邯壹〒蟄ｦ鄙偵☆繧・, tier: 2,
    check: function() { return (S.streak || 0) >= (window._BD?.streak_t2p || 14); },
  },
  {
    id: 't2_low5', icon: '亞', name: '縺ゅｏ繧後↑縺九↑縺溘◎',
    hint: '豁｣遲皮紫縺・%繧剃ｸ句屓繧・, tier: 2,
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
    id: 't2_50cards', icon: '潮', name: '謠｡蜉・0kg',
    hint: '50譫壽囓險倥き繝ｼ繝峨↓豁｣隗｣縺吶ｋ', tier: 2,
    check: function() {
      return (S.decks || []).reduce(function(a, d) {
        return a + (d.cards || []).filter(function(c) { return c.status === 'ok'; }).length;
      }, 0) >= (window._BD?.card_t2 || 50);
    },
  },
  {
    id: 't2_30day', icon: '虫', name: '笘・％繧後′・代Ψ譛医・謌先棡笘・,
    hint: '30譌･蜍牙ｼｷ縺吶ｋ', tier: 2,
    check: function() {
      return new Set((S.sessions || []).map(function(s) {
        return localDateStr(new Date(s.ts));
      })).size >= 30;
    },
  },

  // ----------------------------------------
  // Tier 3 窶・繧ｱ繝・う繧貞鴨縺ｫ
  // ----------------------------------------
  {
    id: 't3_104h', icon: '罰', name: '繧ｱ繝・う繧貞鴨縺ｫ螟峨∴繧九ｓ縺',
    hint: '邏ｯ險・04譎る俣蜍牙ｼｷ縺吶ｋ', tier: 3,
    check: function() {
      return (S.sessions || []).reduce(function(a, s) { return a + s.dur; }, 0) >= MS._104H;
    },
  },
  {
    id: 't3_90', icon: '七', name: '縺昴≧縺・≧譖ｲ縺ｪ縺ｮ縺具ｼ・ｼ・,
    hint: '繝・せ繝医〒90轤ｹ雜・∴繧・, tier: 3,
    check: function() {
      return (S.rounds || []).some(function(r) {
        return Object.values(r.scores || {}).some(function(s) {
          return s.max > 0 && s.score / s.max >= 0.9;
        });
      });
    },
  },
  {
    id: 't3_27h', icon: 'ｦ・, name: 'ARK',
    hint: '邏ｯ險・7譎る俣蜍牙ｼｷ', tier: 3,
    check: function() {
      return (S.sessions || []).reduce(function(a, s) { return a + s.dur; }, 0) >= (window._BD?.total_t3 || MS._27H);
    },
  },
  {
    id: 't3_1227dk', icon: '貯', name: '蠢隱譚台ｸ・,
    hint: '1227譫壽囓險倥き繝ｼ繝峨ｒ縺､縺上ｋ', tier: 3,
    check: function() {
      return (S.decks || []).reduce(function(a, d) {
        return a + (d.cards || []).length;
      }, 0) >= 1227;
    },
  },
  {
    id: 't3_50sk', icon: '血', name: '縺翫＞豐呵干蜿・,
    hint: '50莉ｶ縺ｮ繧ｹ繧ｭ繝ｫ繧帝＃謌舌☆繧・, tier: 3,
    check: function() {
      return Object.values(S.skills).reduce(function(a, arr) {
        return a + arr.filter(function(s) { return s.done; }).length;
      }, 0) >= 50;
    },
  },
  {
    id: 't3_5h1day', icon: '穴', name: '驥手除繧ゅｉ縺｣縺ｦ縺・ｌ縺励◎縺・↓縺励※繧九°繧峨い繧､繝・ｼ・,
    hint: '荳譌･5譎る俣蜍牙ｼｷ縺吶ｋ', tier: 3,
    check: function() { return getTodayMs() >= MS._5H; },
  },
  {
    id: 't3_allsubj', icon: '亮・・, name: '蜈ｨ謨咏ｧ大宛隕・∈縺ｮ隨ｬ荳豁ｩ',
    hint: '蜈ｨ謨咏ｧ代〒荳縺､莉･荳翫・繧ｹ繧ｭ繝ｫ繧定ｨｭ螳壹☆繧・, tier: 3,
    check: function() {
      return CFG.DEFAULT_SUBJECTS.every(function(s) {
        return (S.skills[s] || []).length >= 1;
      });
    },
  },
  {
    id: 't3_conan80', icon: '剥', name: '繧ｳ繝翫Φ隧蜚ｱ',
    hint: '證苓ｨ倥き繝ｼ繝我ｸ蝗槭・豁｣遲皮紫縺・0%繧定ｶ・∴繧・, tier: 3,
    check: function() {
      return (S.decks || []).some(function(d) {
        var ans = (d.cards || []).filter(function(c) { return (c.reps || 0) > 0; });
        if (ans.length < 10) return false;
        return ans.filter(function(c) { return c.status === 'ok'; }).length / ans.length > 0.8;
      });
    },
  },
  {
    id: 't3_422ok', icon: '兆', name: '422譫壹・邨・,
    hint: '422譫壽囓險倥き繝ｼ繝峨↓豁｣隗｣縺吶ｋ', tier: 3,
    check: function() {
      return (S.decks || []).reduce(function(a, d) {
        return a + (d.cards || []).filter(function(c) { return c.status === 'ok'; }).length;
      }, 0) >= 422;
    },
  },

  // ----------------------------------------
  // Tier 4 窶・繧ｴ繝ｪ繝ｩ
  // ----------------------------------------
  {
    id: 't4_422h', icon: 'ｦ・, name: '縺薙・荳悶・繧ゅ・縺ｯ蠑ｱ縺吶℃繧・,
    hint: '邏ｯ險・22譎る俣蜍牙ｼｷ縺吶ｋ', tier: 4,
    check: function() {
      return (S.sessions || []).reduce(function(a, s) { return a + s.dur; }, 0) >= MS._422H;
    },
  },
  {
    id: 't4_1227sk', icon: '凋', name: '縺九↑繝ｫ繝ｼ繝願ｨ伜ｿｵ譌･',
    hint: '1227莉ｶ繧ｹ繧ｭ繝ｫ繧堤ｿ貞ｾ励☆繧・, tier: 4,
    check: function() {
      return Object.values(S.skills).reduce(function(a, arr) {
        return a + arr.filter(function(s) { return s.done; }).length;
      }, 0) >= 1227;
    },
  },
  {
    id: 't4_6hcont', icon: '徴', name: '螢翫☆謇縺縺｣縺溘∝些縺ｭ縺・些縺ｭ縺・,
    hint: '荳譌･縺ｮ蜍牙ｼｷ譎る俣縺碁｣邯・譎る俣繧定ｶ・∴繧・, tier: 4,
    check: function() { return getTodayMs() >= MS._6H; },
  },
  {
    id: 't4_alltmr', icon: '笶､・・, name: '縺・▽繧りｦｳ縺ｦ縺上ｌ縺ｦ繧九∈縺・ｰ代・縺ｿ繧薙↑繝ｼ・≫ｦ窶ｦ螟ｧ螂ｽ縺阪・,
    hint: '蜈ｨ謨咏ｧ代〒繧ｿ繧､繝槭・繧剃ｽｿ逕ｨ縺吶ｋ', tier: 4,
    check: function() {
      var used = new Set((S.sessions || []).map(function(s) { return s.subj; }));
      return CFG.DEFAULT_SUBJECTS.every(function(s) { return used.has(s); });
    },
  },
  {
    id: 't4_allok', icon: '醗', name: '菫ｺ縺ｮ蜷榊燕縺ｯ蟾･阯､譁ｰ荳縲・,
    hint: '證苓ｨ倥ョ繝・く縺ｧ蜈ｨ蝠乗ｭ｣隗｣縺吶ｋ', tier: 4,
    check: function() {
      return (S.decks || []).some(function(d) {
        var c = d.cards || [];
        return c.length >= 5 && c.every(function(x) { return x.status === 'ok'; });
      });
    },
  },
  {
    id: 't4_21day', icon: '減', name: '驕馴｣繧後↓縺励※繧・▲縺・,
    hint: '21譌･騾｣邯壹〒蟄ｦ鄙偵☆繧・, tier: 4,
    check: function() { return (S.streak || 0) >= (window._BD?.streak_t4 || 21); },
  },
  {
    id: 't4_allskdone', icon: '雌', name: '螟ｩ謇阪°・・,
    hint: '蜈ｨ謨咏ｧ代〒荳縺､莉･荳翫せ繧ｭ繝ｫ繧帝＃謌舌☆繧・, tier: 4,
    check: function() {
      return CFG.DEFAULT_SUBJECTS.every(function(s) {
        return (S.skills[s] || []).some(function(sk) { return sk.done; });
      });
    },
  },
  {
    id: 't4_90plus', icon: 'ｦ・, name: '襍､蟄舌・謇九ｒ縺ｲ縺ｭ繧翫▽縺ｶ縺・,
    hint: '證苓ｨ倥き繝ｼ繝我ｸ蝗槭・豁｣遲皮紫縺・0%繧定ｶ・∴繧・, tier: 4,
    check: function() {
      return (S.decks || []).some(function(d) {
        var ans = (d.cards || []).filter(function(c) { return (c.reps || 0) > 0; });
        if (ans.length < 10) return false;
        return ans.filter(function(c) { return c.status === 'ok'; }).length / ans.length > 0.9;
      });
    },
  },

  // ----------------------------------------
  // Tier 5 窶・THE ABSOLUTE IDOL
  // ----------------------------------------
  {
    id: 't5_1227ok', icon: '権', name: '荳也阜縺ｧ荳逡ｪ縺ｮ繧｢繧､繝峨Ν',
    hint: '邏ｯ險・227譫壽囓險倥き繝ｼ繝峨↓豁｣隗｣縺吶ｋ', tier: 5,
    check: function() {
      return (S.decks || []).reduce(function(a, d) {
        return a + (d.cards || []).filter(function(c) { return c.status === 'ok'; }).length;
      }, 0) >= 1227;
    },
  },
  {
    id: 't5_15test', icon: '醇', name: '繧ｴ繝・ラ繝｢繝九Φ繧ｰ',
    hint: '繝・せ繝医ｒ15蝗櫁ｨ倬鹸縺吶ｋ', tier: 5,
    check: function() { return (S.rounds || []).length >= 15; },
  },
  {
    id: 't5_422day', icon: '決', name: '譏取律縺ｯ縺ｪ縺句艮鬟溘∋繧・,
    hint: '422譌･騾｣邯壹〒蟄ｦ鄙偵☆繧・, tier: 5,
    check: function() { return (S.streak || 0) >= 422; },
  },
  {
    id: 't5_2day8h', icon: '匠', name: '蜷悟ｱ・・縺・,
    hint: '2譌･髢馴｣邯壹＠縺ｦ邏ｯ險・譎る俣莉･荳雁級蠑ｷ縺吶ｋ', tier: 5,
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
  // Tier 6 窶・譛鬮倬屮譏灘ｺｦ
  // ----------------------------------------
  {
    id: 't6_1227h', icon: '荘', name: '隱ｰ繧りｦ九※縺ｪ縺・､｢繧定ｦ九ｍ',
    hint: '邏ｯ險亥級蠑ｷ譎る俣1227譎る俣', tier: 6,
    check: function() {
      return (S.sessions || []).reduce(function(a, s) { return a + s.dur; }, 0) >= MS._1227H;
    },
  },

  // ----------------------------------------
  // Tier 0 窶・繝阪ち螳溽ｸｾ
  // ----------------------------------------
  {
    id: 'g_king', icon: '荘', name: '繧ｭ繝ｳ繧ｰ繧ｪ繝悶≠繧薙⊃繧薙◆繧・,
    hint: '荳譌･縺ｮ蜀・↓20蝗樔ｻ･荳翫そ繝・す繝ｧ繝ｳ繧定ｨ倬鹸縺吶ｋ', tier: 0,
    check: function() {
      var td = localDateStr(new Date());
      return (S.sessions || []).filter(function(s) {
        return localDateStr(new Date(s.ts)) === td;
      }).length >= 20;
    },
  },
  {
    id: 'g_omya', icon: '丶', name: '縺翫∩繧・・繧・,
    hint: '荳譌･縺ｮ蜍牙ｼｷ譎る俣縺・譎る俣繧定ｶ・∴繧・, tier: 0,
    check: function() { return getTodayMs() >= MS._6H; },
  },
  {
    id: 'g_unaju', icon: '些', name: '縺・↑驥・,
    hint: '謨ｰ蟄ｦ縺ｮ證苓ｨ倥き繝ｼ繝峨〒荳肴ｭ｣隗｣縺ｫ縺ｪ繧・, tier: 0,
    check: function() {
      return (S.decks || []).some(function(d) {
        return d.subj === '謨ｰ蟄ｦ' && (d.cards || []).some(function(c) { return c.status === 'ng'; });
      });
    },
  },
  {
    id: 'g_matcho', icon: '竢ｹ・・, name: '縺ｾ縺｣縺｡繧・,
    hint: '10遘剃ｻ･蜀・↓繧ｿ繧､繝槭・繧貞・繧・, tier: 0,
    check: function() {
      return (S.sessions || []).some(function(s) { return s.dur > 0 && s.dur < MS._10S; });
    },
  },
  {
    id: 'g_totsu', icon: '働', name: '蜃ｸ蠕・■0莠ｺ',
    hint: '荳譌･縺ｮ繧ｿ繧ｹ繧ｯ縺・0莉ｶ繧定ｶ・∴繧・, tier: 0,
    check: function() {
      var td = localDateStr(new Date());
      return (S.events || []).filter(function(e) { return e.date === td; }).length >= 20;
    },
  },
  {
    id: 'g_kimochi', icon: '竊包ｸ・, name: '逶ｸ蜿阪☆繧区ｰ玲戟縺｡繧呈戟縺､縺ｮ繧ょｿ・□繧搾ｼ・,
    hint: '蜑肴律縺ｮ4蛟堺ｻ･荳雁級蠑ｷ縺吶ｋ', tier: 0,
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
    id: 'g_biden', icon: '竜・・, name: '繝舌う繝・Φ縺｣縺ｦ隱ｰ・・,
    hint: '闍ｱ隱槭き繝ｼ繝峨〒騾｣邯・04蝠丈ｸ肴ｭ｣隗｣縺ｫ縺ｪ繧・, tier: 0,
    check: function() {
      var streak = 0, max = 0;
      (S.decks || []).forEach(function(d) {
        if (d.subj !== '闍ｱ隱・) return;
        (d.cards || []).forEach(function(c) {
          if (c.status === 'ng') { streak++; if (streak > max) max = streak; }
          else { streak = 0; }
        });
      });
      return max >= 104;
    },
  },
  {
    id: 'g_conanota', icon: '雰・・, name: '驥榊ｺｦ縺ｮ繧ｳ繝翫Φ繧ｪ繧ｿ繧ｯ',
    hint: '10譌･髢馴｣邯壹＠縺ｦ蜷後§謨咏ｧ代□縺代ｒ蟄ｦ鄙偵☆繧・, tier: 0,
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
    id: 'g_1dalada', icon: '叱', name: '1繝繝ｩ繝繝ｼ',
    hint: '繧ｿ繧､繝槭・縺ｧ5譎る俣2蛻・″縺｣縺九ｊ蜍牙ｼｷ縺吶ｋ', tier: 0,
    check: function() {
      return (S.sessions || []).some(function(s) {
        return Math.abs(s.dur - MS._5H2M) <= MS._30S;
      });
    },
  },
  {
    id: 'g_shunenn', icon: '獅', name: '蜻ｨ蟷ｴ縺縺ｭ',
    hint: '4譛・2譌･縺ｫ蜍牙ｼｷ縺吶ｋ', tier: 0,
    check: function() {
      var td = localDateStr(new Date());
      return td.slice(5) === '04-22'
        && (S.sessions || []).some(function(s) { return localDateStr(new Date(s.ts)) === td; });
    },
  },

];

// ============================================================
// CHECK BADGES 窶・螳溽ｸｾ蛻､螳壹・隗｣髯､蜃ｦ逅・// ============================================================

function checkBadges() {
  var newBadge = false;
  S.earnedDates = S.earnedDates || {};
  BADGE_DEFS.forEach(function(b) {
    if (!S.earnedBadges.includes(b.id) && b.check()) {
      S.earnedBadges.push(b.id);
      S.earnedDates[b.id] = localDateStr(new Date());
      newBadge = true;
      setTimeout(function() { showToast('螳溽ｸｾ隗｣髯､縲・ + b.name + '縲・); }, 500);
    }
  });
  if (newBadge) saveState();
}