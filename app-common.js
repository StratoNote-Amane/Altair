// ============================================================
// app-core.js 窶・init繝ｻ繝翫ン繧ｲ繝ｼ繧ｷ繝ｧ繝ｳ繝ｻ繝医・繧ｹ繝医・繝｢繝ｼ繝繝ｫ繝ｻ繝帙・繝
// ============================================================

let currentPage = null;
let _trendCID   = 0;

function init() {
  loadState();
  loadTimerState();
  const _s = S.settings || {};
  if (_s.bg) applyBackground(_s.bg);
  if (_s.accentStrong || _s.accentSoft) {
    const st = _s.accentStrong||'#99d8ff', sf = _s.accentSoft||'#76c0ea';
    document.documentElement.style.setProperty('--accent-strong', st);
    document.documentElement.style.setProperty('--accent-soft', sf);
    const r=parseInt(st.slice(1,3),16),g=parseInt(st.slice(3,5),16),b=parseInt(st.slice(5,7),16);
    document.documentElement.style.setProperty('--accent-border',`rgba(${r},${g},${b},0.25)`);
    document.documentElement.style.setProperty('--accent-bg',`rgba(${r},${g},${b},0.08)`);
  }
  navigateTo('home');
  setInterval(saveState, CFG.TIMER.saveIntervalMs);
  setInterval(checkBadges, CFG.TIMER.badgeCheckMs);
  setTimeout(restoreTimer, 300);
  setTimeout(checkForUpdate, 5000);
  window.addEventListener('offline',()=>document.getElementById('offline-badge').style.display='block');
  window.addEventListener('online', ()=>document.getElementById('offline-badge').style.display='none');
  if (!navigator.onLine) document.getElementById('offline-badge').style.display='block';
  document.querySelectorAll('.modal-overlay').forEach(o=>{
    o.addEventListener('click',e=>{ if(e.target===o) closeModal(o.id); });
  });
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.navigator.standalone) {
    setTimeout(()=>showToast('Safari縺ｮ縲悟・譛峨坂・縲後・繝ｼ繝逕ｻ髱｢縺ｫ霑ｽ蜉縲阪〒繧｢繝励Μ縺ｨ縺励※菴ｿ縺医∪縺・),6000);
  }
}

// ============================================================
// NAVIGATION
// ============================================================

const PAGE_PARENT = {
  'timer':'study','calendar':'study','study-log':'study','flashcard':'study','flashcard-study':'study',
  'plan-engine':'study',
  'test-analysis':'grades','badges':'grades',
};

function navigateTo(page) {
  const noGuard=['settings','study-log','flashcard','flashcard-study','test-analysis','calendar'];
  if (currentPage===page && !noGuard.includes(page)) return;
  if (currentPage==='flashcard-study'&&page!=='flashcard-study') stopFlashcardTimer();
  currentPage = page;
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.classList.toggle('active', btn.getAttribute('data-page')===(PAGE_PARENT[page]||page));
  });
  const container = document.getElementById('main-content');
  if (!container) return;
  container.innerHTML = renderPage(page);
  container.scrollTop = 0;
  setTimeout(()=>postRender(page), 30);
}

function renderPage(page) {
  switch(page) {
    case 'home':            return renderHome();
    case 'study':           return renderStudyHub();
    case 'timer':           return renderTimer();
    case 'calendar':        return renderCalendar();
    case 'study-log':       return renderStudyLog();
    case 'flashcard':       return renderFlashcardHub();
    case 'flashcard-study': return renderFlashcardStudy();
    case 'skill':           return renderSkillHub();
    case 'plan-engine':     return renderPlanEngine();
    case 'grades':          return renderGradesHub();
    case 'test-analysis':   return renderTestAnalysis();
    case 'badges':          return renderBadges();
    case 'settings':        return renderSettings();
    default: return '';
  }
}

function postRender(page) {
  if (page==='calendar')      renderCalendarGrid();
  if (page==='study-log')     renderStudyLogCharts();
  if (page==='test-analysis') { renderTestChart(); setTimeout(animateTestBars,50); }
  if (page==='timer')         restoreTimer();
  if (page==='home')          { renderHomeWeekBar(); renderHomePieChart(); }
}

// ============================================================
// TOAST / MODAL
// ============================================================

let toastTimer;
function showToast(msg) {
  const el=document.getElementById('toast');
  clearTimeout(toastTimer);
  el.textContent=msg; el.classList.add('show');
  toastTimer=setTimeout(()=>el.classList.remove('show'),2600);
}

function openModal(id) {
  fillSubjectSelects();
  if (id==='modal-event') document.getElementById('input-event-date').value=selectedCalDate||today();
  document.getElementById(id)?.classList.add('open');
}

function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

function fillSubjectSelects() {
  const subjects=getAllSubjects();
  ['input-event-subject','input-deck-subject','input-test-subject'].forEach(id=>{
    const el=document.getElementById(id); if(!el)return;
    const prev=el.value;
    el.innerHTML=subjects.map(s=>`<option value="${sanitize(s)}">${sanitize(s)}</option>`).join('');
    if(prev)el.value=prev;
  });
}

// ============================================================
// BACKGROUND
// ============================================================

function applyBackground(url) {
  let el=document.getElementById('bg-image');
  if(!el){
    el=document.createElement('div');el.id='bg-image';
    el.style.cssText='position:fixed;inset:0;z-index:0;background-size:cover;background-position:center;';
    const ov=document.createElement('div');ov.id='bg-overlay';
    ov.style.cssText='position:absolute;inset:0;background:rgba(13,17,23,0.65);';
    el.appendChild(ov);
    document.body.insertBefore(el,document.body.firstChild);
  }
  el.style.backgroundImage=url?`url('${url}')`:'';
  el.style.display=url?'block':'none';
}

// ============================================================
// HOME 窶・莉頑律縺ｮ險育判・九ち繧ｹ繧ｯ邨ｱ蜷・// ============================================================

function renderHome() {
  const now=new Date();
  const dateStr=now.toLocaleDateString('ja-JP',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
  const todayMs=getTodayMs(), weekTotal=getWeekTotalMs();
  const streak=S.streak||0, goal=S.goal, todayPlan=getTodayPlan();
  const skillDone=Object.values(S.skills).reduce((a,arr)=>a+arr.filter(s=>s.done).length,0);
  const weekGoalMs=(goal?.weeklyGoalHours||CFG.DEFAULT_WEEKLY_GOAL_HOURS)*3600000;

  // 莉頑律縺ｮ險育判・九ち繧ｹ繧ｯ邨ｱ蜷医き繝ｼ繝・  const todayEvs=(S.events||[]).filter(e=>e.date===today());
  const planItems=todayPlan?.items||[];

  let unifiedHtml='';
  {
    // 險育判繝代・繝・    let planPart='';
    if(planItems.length){
      planPart=planItems.map(item=>{
        const pct=item.plannedMinutes>0?Math.min(Math.round(item.actualMinutes/item.plannedMinutes*100),100):0;
        const color=getSubjectColor(item.subj);
        const done=pct>=100;
        return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <div style="width:6px;height:6px;border-radius:50%;background:${color};flex-shrink:0"></div>
          <div style="font-size:13px;flex:1;color:${done?'var(--ok)':'var(--text-primary)'}">${sanitize(item.subj)}</div>
          <div style="font-size:11px;color:var(--text-muted)">${item.plannedMinutes}蛻・/div>
          <div style="width:50px;height:4px;background:var(--bg-border);border-radius:2px;overflow:hidden;flex-shrink:0">
            <div style="height:100%;border-radius:2px;background:${done?'var(--ok)':color};width:${pct}%"></div>
          </div>
        </div>`;
      }).join('');
    } else {
      planPart=`<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">險育判譛ｪ逕滓・</div>`;
    }

    // 繧ｿ繧ｹ繧ｯ繝代・繝・    const evPart=todayEvs.length
      ? todayEvs.map(e=>{
          const ri=S.events.indexOf(e),done=!!e.done,color=getSubjectColor(e.subj);
          return `<div class="event-item" style="opacity:${done?0.55:1};margin-bottom:6px;padding:8px 10px">
            <div class="event-bar" style="background:${done?'#444':color}"></div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:600;${done?'text-decoration:line-through;color:var(--text-muted)':''};overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${sanitize(e.title)}</div>
              <div style="font-size:11px;color:var(--text-muted)">${sanitize(e.subj)} ﾂｷ 雋闕ｷ${e.load||1}</div>
            </div>
            <button class="btn ${done?'btn-ghost':'btn-primary'} btn-sm" style="flex-shrink:0" onclick="toggleEventDone(${ri})">${done?'竊ｩ':'笨・}</button>
          </div>`;
        }).join('')
      : '<div style="font-size:12px;color:var(--text-muted);padding:4px 0">莉頑律縺ｮ莠亥ｮ壹↑縺・/div>';

    unifiedHtml=`<div class="card-deep">
      <div class="flex justify-between items-center mb-8">
        <div class="card-label" style="margin:0">TODAY${goal?` 窶・谿九ｊ${calcRemainingDays(goal.examDate)}譌･`:''}</div>
        <button class="btn btn-primary btn-sm" onclick="navigateTo('timer')">笆ｶ 繧ｿ繧､繝槭・</button>
      </div>
      ${planPart}
      ${planItems.length?'<div style="border-top:1px solid var(--bg-border);margin:8px 0"></div>':''}
      ${evPart}
      <div class="flex gap-8 mt-8">
        ${planItems.length?'':`<button class="btn btn-secondary btn-sm" onclick="generateAndSavePlan()">險育判繧堤函謌・/button>`}
        <button class="btn btn-ghost btn-sm" onclick="navigateTo('calendar')" style="margin-left:auto">繧ｫ繝ｬ繝ｳ繝繝ｼ 竊・/button>
      </div>
    </div>`;
  }

  // 邨ｱ險・  const statsHtml=`<div class="stats-row">
    <div class="stat-card"><div class="stat-val" style="color:var(--accent-strong)">${formatMsShort(todayMs)}</div><div class="stat-lbl">莉頑律縺ｮ蟄ｦ鄙・/div></div>
    <div class="stat-card"><div class="stat-val">${formatMsShort(weekTotal)}</div><div class="stat-lbl">莉企ｱ蜷郁ｨ・/div></div>
    <div class="stat-card"><div class="stat-val" style="color:var(--accent-soft)">${skillDone}</div><div class="stat-lbl">鄙貞ｾ励せ繧ｭ繝ｫ</div></div>
  </div>`;

  // 逶ｮ讓吶き繝ｼ繝会ｼ医き繧ｦ繝ｳ繝茨ｼ矩ｲ謐暦ｼ・  let goalHtml='';
  if(goal){
    const rem=calcRemainingDays(goal.examDate),tot=calcTotalDays(goal.examDate);
    const elapsed=tot-rem,pct=tot>0?Math.min(Math.round(elapsed/tot*100),100):0;
    const weekPct=weekGoalMs>0?Math.min(Math.round(weekTotal/weekGoalMs*100),100):0;
    goalHtml=`<div class="card">
      <div class="flex justify-between items-center mb-8">
        <div style="font-size:14px;font-weight:800">${sanitize(goal.school||'蠢玲悍譬｡譛ｪ險ｭ螳・)}</div>
        <div style="font-size:20px;font-weight:800;color:var(--accent-strong)">${rem}<span style="font-size:11px;color:var(--text-muted)">譌･</span></div>
      </div>
      <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">蜈･隧ｦ縺ｾ縺ｧ ${pct}% 邨碁℃ (${goal.examDate||''})</div>
      <div class="bar-track" style="height:6px;margin-bottom:10px">
        <div class="bar-fill" style="width:${pct}%;background:var(--accent-soft)"></div>
      </div>
      <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">莉企ｱ縺ｮ騾ｲ謐・${weekPct}% (逶ｮ讓・{goal.weeklyGoalHours||CFG.DEFAULT_WEEKLY_GOAL_HOURS}h)</div>
      <div class="bar-track" style="height:6px">
        <div class="bar-fill" style="width:${weekPct}%;background:${weekPct>=100?'var(--ok)':'var(--accent-strong)'}"></div>
      </div>
    </div>`;
  } else {
    goalHtml=`<div class="card" onclick="openModal('modal-goal')" style="cursor:pointer">
      <div style="font-size:13px;color:var(--text-muted);text-align:center;padding:8px">逶ｮ讓吶ｒ險ｭ螳壹☆繧・竊・/div>
    </div>`;
  }

  // 騾ｱ髢薙ヰ繝ｼ・域｣偵げ繝ｩ繝包ｼ・  const weekBarsHtml=`<div class="card">
    <div class="section-label">莉企ｱ縺ｮ蟄ｦ鄙定ｲ闕ｷ</div>
    <div id="home-week-bar"></div>
  </div>`;

  // 謨咏ｧ代ヰ繝ｩ繝ｳ繧ｹ
  const pieHtml=`<div class="card">
    <div class="section-label">謨咏ｧ大挨繝舌Λ繝ｳ繧ｹ・井ｻ企ｱ・・/div>
    <div id="home-pie-container"></div>
  </div>`;

  // 螳溽ｸｾ
  const recent=BADGE_DEFS.filter(b=>S.earnedBadges.includes(b.id)).slice(-3);
  const badgeHtml=recent.length?recent.map(b=>`<span style="font-size:20px">${b.icon}</span>`).join(''):'<span style="font-size:12px;color:var(--text-muted)">縺ｾ縺繝舌ャ繧ｸ縺ｪ縺・/span>';

  return `<div class="flex justify-between items-center mb-8">
    <div><div class="page-title">Altair</div><div class="page-subtitle">${dateStr}</div></div>
    <div class="streak-badge">笨ｦ ${streak}譌･騾｣邯・/div>
  </div>
  ${unifiedHtml}
  ${statsHtml}
  ${goalHtml}
  ${weekBarsHtml}
  ${pieHtml}
  <div class="card" onclick="navigateTo('badges')" style="cursor:pointer">
    <div class="section-label">迯ｲ蠕怜ｮ溽ｸｾ</div>
    <div class="flex items-center gap-8">${badgeHtml}<span style="font-size:11px;color:var(--text-muted);margin-left:auto">${S.earnedBadges.length}/${BADGE_DEFS.length} 竊・/span></div>
  </div>`;
}

// 騾ｱ髢捺｣偵げ繝ｩ繝包ｼ域｣偵げ繝ｩ繝輔・縺ｿ繝ｻ謚倥ｌ邱夂ｦ∵ｭ｢・・function renderHomeWeekBar() {
  const container=document.getElementById('home-week-bar'); if(!container)return;
  const weekMs=getWeekMs();
  const days=['譛・,'轣ｫ','豌ｴ','譛ｨ','驥・,'蝨・,'譌･'];
  const todayDow=(new Date().getDay()+6)%7;
  const maxMs=Math.max(...weekMs,1);
  container.innerHTML=`<div style="display:flex;gap:4px;align-items:flex-end;height:60px;margin-bottom:4px">
    ${days.map((d,i)=>{
      const pct=Math.round(weekMs[i]/maxMs*100);
      const isToday=i===todayDow;
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
        <div style="width:100%;height:48px;background:var(--bg-border);border-radius:3px 3px 0 0;position:relative;overflow:hidden">
          <div style="position:absolute;bottom:0;left:0;right:0;height:${pct}%;background:${isToday?'var(--accent-strong)':'var(--accent-soft)'};border-radius:3px 3px 0 0"></div>
        </div>
        <div style="font-size:9px;color:${isToday?'var(--accent-strong)':'var(--text-muted)'}">${d}</div>
      </div>`;
    }).join('')}
  </div>`;
}

// 謨咏ｧ大挨蜀・げ繝ｩ繝・function renderHomePieChart() {
  const container=document.getElementById('home-pie-container'); if(!container)return;
  const now=new Date(),dow=now.getDay();
  const weekStart=new Date(now);
  weekStart.setDate(now.getDate()-(dow===0?6:dow-1));weekStart.setHours(0,0,0,0);
  const sd={};
  (S.sessions||[]).filter(s=>new Date(s.ts)>=weekStart).forEach(s=>{sd[s.subj]=(sd[s.subj]||0)+s.dur;});
  const tot=Object.values(sd).reduce((a,b)=>a+b,0);
  if(!tot){container.innerHTML='<div style="font-size:12px;color:var(--text-muted)">縺ｾ縺險倬鹸縺ｪ縺・/div>';return;}
  const entries=Object.entries(sd).sort((a,b)=>b[1]-a[1]);
  const cid='pie'+(_trendCID++);
  const legendHtml=entries.map(([subj,ms])=>{
    const pct=Math.round(ms/tot*100),color=getSubjectColor(subj);
    return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
      <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></div>
      <div style="font-size:11px;font-weight:700;flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:${color}">${sanitize(subj)}</div>
      <div style="font-size:11px;color:var(--text-muted);white-space:nowrap">${formatMsShortSec(ms)}</div>
      <div style="font-size:11px;font-weight:800;color:var(--accent-strong);width:32px;text-align:right">${pct}%</div>
    </div>`;
  }).join('');
  container.innerHTML=`<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
    <canvas id="${cid}" width="100" height="100" style="width:100px;height:100px;flex-shrink:0"></canvas>
    <div style="flex:1;min-width:120px">${legendHtml}</div>
  </div>`;
  requestAnimationFrame(()=>setTimeout(()=>{
    const cv=document.getElementById(cid);if(!cv)return;
    const dpr=window.devicePixelRatio||1,S_=100;
    cv.width=S_*dpr;cv.height=S_*dpr;cv.style.width=S_+'px';cv.style.height=S_+'px';
    const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
    const cx=S_/2,cy=S_/2,R=S_/2-4,inner=R*0.55;
    let angle=-Math.PI/2;
    entries.forEach(([subj,ms])=>{
      const sweep=(ms/tot)*Math.PI*2;
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,R,angle,angle+sweep);ctx.closePath();
      ctx.fillStyle=getSubjectColor(subj);ctx.fill();
      ctx.strokeStyle='#0d1117';ctx.lineWidth=1.5;ctx.stroke();
      angle+=sweep;
    });
    ctx.beginPath();ctx.arc(cx,cy,inner,0,Math.PI*2);ctx.fillStyle='#161b22';ctx.fill();
    const th=Math.floor(tot/3600000),tm=Math.floor((tot%3600000)/60000);
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#fff';ctx.font=`bold 11px sans-serif`;ctx.fillText(`${th}h${pad(tm)}m`,cx,cy-5);
    ctx.fillStyle='#8b949e';ctx.font='9px sans-serif';ctx.fillText('莉企ｱ險・,cx,cy+7);
  },20));
}

// 1蛻・悴貅縺ｯ遘定｡ｨ遉ｺ
function formatMsShortSec(ms) {
  const totalSec=Math.floor(ms/1000);
  if(totalSec<60)return totalSec+'遘・;
  const h=Math.floor(totalSec/3600),m=Math.floor((totalSec%3600)/60);
  if(h===0)return m+'蛻・;
  if(m===0)return h+'h';
  return h+'h '+m+'m';
}

function toggleEventDone(idx) {
  const ev=(S.events||[])[idx];if(!ev)return;
  ev.done=!ev.done;saveState();checkBadges();navigateTo('home');
}

function generateAndSavePlan() {
  const goal=S.goal;
  const dailyMinutes=Math.round((goal?.weeklyGoalHours||CFG.DEFAULT_WEEKLY_GOAL_HOURS)*60/7);
  saveTodayPlan(generateTodayPlan(dailyMinutes));
  navigateTo('home');showToast('莉頑律縺ｮ險育判繧堤函謌舌＠縺ｾ縺励◆');
}

function calcRemainingDays(dateStr) {
  if(!dateStr)return 0;
  const now=new Date();now.setHours(0,0,0,0);
  return Math.max(0,Math.round((new Date(dateStr)-now)/86400000));
}

function calcTotalDays(dateStr) {
  if(!dateStr)return 365;
  const exam=new Date(dateStr),start=new Date(exam);
  start.setFullYear(start.getFullYear()-1);
  return Math.max(1,Math.round((exam-start)/86400000));
}

// ============================================================
// STUDY HUB・郁ｨ育判繧ｨ繝ｳ繧ｸ繝ｳ繧定ｿｽ蜉・・// ============================================================

function renderStudyHub() {
  const nc=(page,title,sub)=>`<div onclick="navigateTo('${page}')" class="card"
    style="cursor:pointer;display:flex;align-items:center;gap:14px;padding:16px">
    <div style="flex:1"><div style="font-size:15px;font-weight:800">${title}</div>
    <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${sub}</div></div>
    <span style="color:var(--accent-soft);font-size:20px">窶ｺ</span></div>`;
  return `<div class="page-header"><div class="page-title">蟄ｦ鄙・/div></div>
    ${nc('timer','繧ｿ繧､繝槭・','謨咏ｧ代ｒ驕ｸ繧薙〒蟄ｦ鄙呈凾髢薙ｒ險倬鹸')}
    ${nc('calendar','繧ｫ繝ｬ繝ｳ繝繝ｼ','莠亥ｮ壹・雋闕ｷ邂｡逅・・蟄ｦ鄙貞ｱ･豁ｴ')}
    ${nc('study-log','蜍牙ｼｷ譎る俣','譌･繝ｻ騾ｱ繝ｻ譛医・蟷ｴ縺斐→縺ｮ險倬鹸')}
    ${nc('flashcard','證苓ｨ倥き繝ｼ繝・,'繝輔Λ繝・す繝･繧ｫ繝ｼ繝峨〒證苓ｨ倡ｷｴ鄙・)}
    ${nc('plan-engine','險育判繧ｨ繝ｳ繧ｸ繝ｳ','AI縺御ｻ頑律縺ｮ蟄ｦ鄙定ｨ育判繧定・蜍慕函謌・)}`;
}

// ============================================================
// PLAN ENGINE・亥ｭｦ鄙偵ワ繝悶°繧臥ｧｻ蜍包ｼ・// ============================================================

function renderPlanEngine() {
  const goal=S.goal;
  const dailyMinutes=Math.round((goal?.weeklyGoalHours||CFG.DEFAULT_WEEKLY_GOAL_HOURS)*60/7);
  const plan=generateTodayPlan(dailyMinutes);
  const weekMs=getWeekMs(),weekTotal=getWeekTotalMs();
  const goalMs=(goal?.weeklyGoalHours||CFG.DEFAULT_WEEKLY_GOAL_HOURS)*3600000;
  const weekPct=Math.min(Math.round(weekTotal/goalMs*100),100);
  const days=['譛・,'轣ｫ','豌ｴ','譛ｨ','驥・,'蝨・,'譌･'];
  const todayDow=(new Date().getDay()+6)%7;
  const maxMs=Math.max(...weekMs,1);

  const planHtml=plan.map(item=>{
    const color=getSubjectColor(item.subj);
    return `<div class="list-row">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:8px;height:8px;border-radius:50%;background:${color}"></div>
        <div>${sanitize(item.subj)}</div>
      </div>
      <div style="font-weight:700;color:${color}">${item.plannedMinutes}蛻・/div>
    </div>`;
  }).join('');

  // 騾ｱ髢楢ｨ育判・域｣偵げ繝ｩ繝包ｼ・  const weekBarHtml=`<div style="display:flex;gap:4px;align-items:flex-end;height:60px;margin-bottom:4px">
    ${days.map((d,i)=>{
      const pct=Math.round(weekMs[i]/maxMs*100);const isToday=i===todayDow;
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
        <div style="width:100%;height:48px;background:var(--bg-border);border-radius:3px 3px 0 0;position:relative;overflow:hidden">
          <div style="position:absolute;bottom:0;left:0;right:0;height:${pct}%;background:${isToday?'var(--accent-strong)':'var(--accent-soft)'};border-radius:3px 3px 0 0"></div>
        </div>
        <div style="font-size:9px;color:${isToday?'var(--accent-strong)':'var(--text-muted)'}">${d}</div>
      </div>`;
    }).join('')}
  </div>`;

  return `<div class="page-header">
    <div style="display:flex;align-items:center;gap:8px">
      <button class="btn btn-ghost btn-sm" onclick="navigateTo('study')">竊・謌ｻ繧・/button>
      <div class="page-title" style="font-size:18px">險育判繧ｨ繝ｳ繧ｸ繝ｳ</div>
    </div>
  </div>

  <div class="card">
    <div class="section-label">騾ｱ髢馴ｲ謐・/div>
    ${weekBarHtml}
    <div class="flex justify-between" style="font-size:11px;color:var(--text-muted);margin-top:4px">
      <span>螳溽ｸｾ: ${formatMsShort(weekTotal)}</span>
      <span style="color:${weekPct>=100?'var(--ok)':'var(--accent-strong)'}">${weekPct}% / 逶ｮ讓・{goal?.weeklyGoalHours||CFG.DEFAULT_WEEKLY_GOAL_HOURS}h</span>
    </div>
  </div>

  <div class="card">
    <div class="section-label">莉頑律縺ｮ縺翫☆縺吶ａ驟榊・・・{dailyMinutes}蛻・ｼ・/div>
    ${planHtml||'<div style="font-size:13px;color:var(--text-muted)">謨咏ｧ代ョ繝ｼ繧ｿ縺後≠繧翫∪縺帙ｓ</div>'}
    <div style="font-size:10px;color:var(--text-muted);margin-top:8px;line-height:1.6">
      繧ｹ繧ｭ繝ｫ鄙堤・蠎ｦ(${Math.round(CFG.PLAN.skillWeight*100)}%) ﾂｷ 繝・せ繝育ｵ先棡(${Math.round(CFG.PLAN.testWeight*100)}%) ﾂｷ 逶ｴ霑大ｭｦ鄙・${Math.round(CFG.PLAN.recencyWeight*100)}%)縺ｧ險育ｮ・    </div>
  </div>

  <button class="btn btn-primary btn-full" onclick="generateAndSavePlan()">莉頑律縺ｮ險育判縺ｨ縺励※繧ｻ繝・ヨ</button>`;
}

function checkForUpdate() {
  if(!navigator.onLine)return;
  fetch(location.href.split('?')[0]+'?_cb='+Date.now(),{cache:'no-store'})
    .then(r=>r.text()).then(html=>{
      const m=html.match(/APP_VERSION:'([^']+)'/);
      if(m&&m[1]!==CFG.APP_VERSION)showUpdateBanner(m[1]);
    }).catch(()=>{});
}

function showUpdateBanner(newVer){
  const prev=document.getElementById('update-banner');if(prev)prev.remove();
  const b=document.createElement('div');b.id='update-banner';
  b.style.cssText='position:fixed;top:calc(var(--safe-top)+8px);left:50%;transform:translateX(-50%);z-index:3000;background:var(--accent-strong);color:#0d1117;padding:10px 16px;border-radius:12px;font-size:12px;font-weight:700;display:flex;align-items:center;gap:10px;max-width:calc(100vw - 32px)';
  b.innerHTML=`<span>笨ｦ v${newVer} 縺ｫ繧｢繝・・繝・・繝医′縺ゅｊ縺ｾ縺・/span>
    <button onclick="location.reload(true)" style="background:#0d1117;color:var(--accent-strong);border:none;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit">莉翫☆縺宣←逕ｨ</button>
    <button onclick="this.parentElement.remove()" style="background:transparent;border:none;color:#0d1117;font-size:14px;cursor:pointer;opacity:.7">笨・/button>`;
  document.body.appendChild(b);
  setTimeout(()=>{if(b.parentNode)b.remove();},30000);
}