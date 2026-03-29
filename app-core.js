// app-core.js — init・ナビゲーション・ホーム・計画エンジン
// ============================================================

let currentPage = null;
let _trendCID   = 0;
let _homeTaskExpanded = false;

// ============================================================
// 負荷値計算ユーティリティ
// 「負荷値1のタスクを1時間やる」= 負荷単位1
// 負荷値 × 時間(h) で統一指標を出す
// ============================================================

function calcDayLoad(ds) {
  // イベント負荷: load値 × 1h相当（タスク1件ごと）
  const evLoad = (S.events||[])
    .filter(e => e.date === ds)
    .reduce((a, e) => a + (e.load||1), 0);
  // セッション負荷: 時間(h) × デフォルト負荷1
  const sesLoad = (S.sessions||[])
    .filter(s => localDateStr(new Date(s.ts)) === ds)
    .reduce((a, s) => {
      // セッションの教科に紐づくその日のタスク平均負荷を使う
      const subj = s.subj;
      const relatedEvs = (S.events||[]).filter(e => e.date === ds && e.subj === subj);
      const avgLoad = relatedEvs.length
        ? relatedEvs.reduce((sum, e) => sum + (e.load||1), 0) / relatedEvs.length
        : 1;
      return a + avgLoad * (s.dur / 3600000);
    }, 0);
  return Math.round((evLoad + sesLoad) * 10) / 10;
}

function getWeekLoadByDay() {
  const now = new Date();
  const dow = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  weekStart.setHours(0,0,0,0);
  const loads = [0,0,0,0,0,0,0];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const ds = localDateStr(d);
    loads[i] = calcDayLoad(ds);
  }
  return loads;
}

// ============================================================
// INIT
// ============================================================

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
  setTimeout(checkForUpdate, 3000);
  window.addEventListener('offline',()=>document.getElementById('offline-badge').style.display='block');
  window.addEventListener('online', ()=>document.getElementById('offline-badge').style.display='none');
  if (!navigator.onLine) document.getElementById('offline-badge').style.display='block';
  document.querySelectorAll('.modal-overlay').forEach(o=>{
    o.addEventListener('click',e=>{ if(e.target===o) closeModal(o.id); });
  });
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.navigator.standalone) {
    setTimeout(()=>showToast('Safariの「共有」→「ホーム画面に追加」でアプリとして使えます'),6000);
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
// HOME
// ============================================================

function renderHome() {
  const now=new Date();
  const dateStr=now.toLocaleDateString('ja-JP',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
  const todayMs=getTodayMs(), weekTotal=getWeekTotalMs();
  const streak=S.streak||0, goal=S.goal, todayPlan=getTodayPlan();
  const skillDone=Object.values(S.skills).reduce((a,arr)=>a+arr.filter(s=>s.done).length,0);
  const weekGoalMs=(goal?.weeklyGoalHours||CFG.DEFAULT_WEEKLY_GOAL_HOURS)*3600000;
  const todayEvs=(S.events||[]).filter(e=>e.date===today());
  const planItems=todayPlan?.items||[];
  const TASK_FOLD = 5;

  let planPart='';
  if(planItems.length){
    planPart=planItems.map(item=>{
      const pct=item.plannedMinutes>0?Math.min(Math.round(item.actualMinutes/item.plannedMinutes*100),100):0;
      const color=getSubjectColor(item.subj);
      const done=pct>=100;
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <div style="width:6px;height:6px;border-radius:50%;background:${color};flex-shrink:0"></div>
        <div style="font-size:13px;flex:1;color:${done?'var(--ok)':'var(--text-primary)'}">${sanitize(item.subj)}</div>
        <div style="font-size:11px;color:var(--text-muted)">${item.plannedMinutes}分</div>
        <div style="width:50px;height:4px;background:var(--bg-border);border-radius:2px;overflow:hidden;flex-shrink:0">
          <div style="height:100%;border-radius:2px;background:${done?'var(--ok)':color};width:${pct}%"></div>
        </div>
      </div>`;
    }).join('');
  } else {
    planPart=`<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">計画未生成</div>`;
  }

  let evPart='';
  if(todayEvs.length===0){
    evPart='<div style="font-size:12px;color:var(--text-muted);padding:4px 0">今日の予定なし</div>';
  } else {
    const showEvs = _homeTaskExpanded ? todayEvs : todayEvs.slice(0, TASK_FOLD);
    const evHtml = showEvs.map(e=>{
      const ri=S.events.indexOf(e),done=!!e.done,color=getSubjectColor(e.subj);
      return `<div class="event-item" style="opacity:${done?0.55:1};margin-bottom:6px;padding:8px 10px">
        <div class="event-bar" style="background:${done?'#444':color}"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;${done?'text-decoration:line-through;color:var(--text-muted)':''};overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${sanitize(e.title)}</div>
          <div style="font-size:11px;color:var(--text-muted)">${sanitize(e.subj)} · 負荷${e.load||1}</div>
        </div>
        <button class="btn ${done?'btn-ghost':'btn-primary'} btn-sm" style="flex-shrink:0" onclick="toggleEventDone(${ri})">${done?'↩':'✓'}</button>
      </div>`;
    }).join('');
    const foldBtn = todayEvs.length > TASK_FOLD
      ? `<button class="btn btn-ghost btn-sm" style="width:100%;margin-top:4px;font-size:11px"
           onclick="_homeTaskExpanded=!_homeTaskExpanded;refreshHomeTaskList()">
           ${_homeTaskExpanded ? `▲ 折りたたむ` : `▼ 残り${todayEvs.length-TASK_FOLD}件を表示`}
         </button>`
      : '';
    evPart = `<div id="home-task-list">${evHtml}</div>${foldBtn}`;
  }

  const unifiedHtml=`<div class="card-deep">
    <div class="flex justify-between items-center mb-8">
      <div class="card-label" style="margin:0">TODAY${goal?` — 残り${calcRemainingDays(goal.examDate)}日`:''}</div>
      <button class="btn btn-primary btn-sm" onclick="navigateTo('timer')">▶ タイマー</button>
    </div>
    ${planPart}
    ${planItems.length?'<div style="border-top:1px solid var(--bg-border);margin:8px 0"></div>':''}
    ${evPart}
    <div class="flex gap-8 mt-8">
      ${planItems.length?'':`<button class="btn btn-secondary btn-sm" onclick="navigateTo('plan-engine')">計画を見る</button>`}
      <button class="btn btn-ghost btn-sm" onclick="navigateTo('calendar')" style="margin-left:auto">カレンダー →</button>
    </div>
  </div>`;

  const statsHtml=`<div class="stats-row">
    <div class="stat-card"><div class="stat-val" style="color:var(--accent-strong)">${formatMsShort(todayMs)}</div><div class="stat-lbl">今日の学習</div></div>
    <div class="stat-card"><div class="stat-val">${formatMsShort(weekTotal)}</div><div class="stat-lbl">今週合計</div></div>
    <div class="stat-card"><div class="stat-val" style="color:var(--accent-soft)">${skillDone}</div><div class="stat-lbl">習得スキル</div></div>
  </div>`;

  let goalHtml='';
  if(goal){
    const rem=calcRemainingDays(goal.examDate);
    const weekPct=weekGoalMs>0?Math.min(Math.round(weekTotal/weekGoalMs*100),100):0;
    goalHtml=`<div class="card">
      <div class="flex justify-between items-center mb-8">
        <div style="font-size:14px;font-weight:800">${sanitize(goal.school||'志望校未設定')}</div>
        <div style="font-size:20px;font-weight:800;color:var(--accent-strong)">${rem}<span style="font-size:11px;color:var(--text-muted)">日</span></div>
      </div>
      <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">今週の進捗 ${weekPct}% (目標${goal.weeklyGoalHours||CFG.DEFAULT_WEEKLY_GOAL_HOURS}h)</div>
      <div class="bar-track" style="height:6px">
        <div class="bar-fill" style="width:${weekPct}%;background:${weekPct>=100?'var(--ok)':'var(--accent-strong)'}"></div>
      </div>
    </div>`;
  } else {
    goalHtml=`<div class="card" onclick="openModal('modal-goal')" style="cursor:pointer">
      <div style="font-size:13px;color:var(--text-muted);text-align:center;padding:8px">目標を設定する →</div>
    </div>`;
  }

  const weekBarsHtml=`<div class="card">
    <div class="section-label">今週の学習負荷</div>
    <div id="home-week-bar"></div>
  </div>`;

  const pieHtml=`<div class="card">
    <div class="section-label">教科別バランス（今週）</div>
    <div id="home-pie-container"></div>
  </div>`;

  const recent=BADGE_DEFS.filter(b=>S.earnedBadges.includes(b.id)).slice(-3);
  const badgeHtml=recent.length?recent.map(b=>`<span style="font-size:20px">${b.icon}</span>`).join(''):'<span style="font-size:12px;color:var(--text-muted)">まだバッジなし</span>';

  return `<div class="flex justify-between items-center mb-8">
    <div><div class="page-title">Altair</div><div class="page-subtitle">${dateStr}</div></div>
    <div class="streak-badge">✦ ${streak}日連続</div>
  </div>
  ${unifiedHtml}
  ${statsHtml}
  ${goalHtml}
  ${weekBarsHtml}
  ${pieHtml}
  <div class="card" onclick="navigateTo('badges')" style="cursor:pointer">
    <div class="section-label">獲得実績</div>
    <div class="flex items-center gap-8">${badgeHtml}<span style="font-size:11px;color:var(--text-muted);margin-left:auto">${S.earnedBadges.length}/${BADGE_DEFS.length} →</span></div>
  </div>`;
}

function refreshHomeTaskList() {
  const todayEvs=(S.events||[]).filter(e=>e.date===today());
  const TASK_FOLD=5;
  const showEvs = _homeTaskExpanded ? todayEvs : todayEvs.slice(0, TASK_FOLD);
  const evHtml = showEvs.map(e=>{
    const ri=S.events.indexOf(e),done=!!e.done,color=getSubjectColor(e.subj);
    return `<div class="event-item" style="opacity:${done?0.55:1};margin-bottom:6px;padding:8px 10px">
      <div class="event-bar" style="background:${done?'#444':color}"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;${done?'text-decoration:line-through;color:var(--text-muted)':''};overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${sanitize(e.title)}</div>
        <div style="font-size:11px;color:var(--text-muted)">${sanitize(e.subj)} · 負荷${e.load||1}</div>
      </div>
      <button class="btn ${done?'btn-ghost':'btn-primary'} btn-sm" style="flex-shrink:0" onclick="toggleEventDone(${ri})">${done?'↩':'✓'}</button>
    </div>`;
  }).join('');
  const listEl = document.getElementById('home-task-list');
  if(listEl) listEl.innerHTML = evHtml;
}

// ============================================================
// 今週の学習負荷グラフ（負荷値ベース）
// ============================================================

function renderHomeWeekBar() {
  const container=document.getElementById('home-week-bar'); if(!container)return;
  const weekLoad=getWeekLoadByDay();  // 負荷値配列（月〜日）
  const weekMs=getWeekMs();           // 時間配列（補助表示）
  const days=['月','火','水','木','金','土','日'];
  const todayDow=(new Date().getDay()+6)%7;
  const cid='wkbar'+(_trendCID++);
  container.innerHTML=`<canvas id="${cid}" style="width:100%;display:block"></canvas>
    <div style="display:flex;margin-top:6px">${days.map((d,i)=>`<div style="flex:1;text-align:center;font-size:9px;color:${i===todayDow?'var(--accent-strong)':i===6?'#76c0ea':i===5?'#e24b4a':'var(--text-muted)'}">${d}</div>`).join('')}</div>
    <div style="font-size:9px;color:var(--text-muted);margin-top:4px">負荷値 = タスク負荷 × 時間(h) の合計</div>`;
  requestAnimationFrame(()=>setTimeout(()=>{
    const cv=document.getElementById(cid);if(!cv)return;
    const dpr=window.devicePixelRatio||1,W=cv.parentElement.clientWidth||280,H=80;
    cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';
    const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
    ctx.clearRect(0,0,W,H);
    const maxLoad=Math.max(...weekLoad,0.1);
    const R=4,pd={t:R+4,r:R+4,b:R+2,l:R+4};
    const gW=W-pd.l-pd.r,gH=H-pd.t-pd.b;
    const xOf=i=>pd.l+(days.length>1?i/(days.length-1)*gW:gW/2);
    const yOf=v=>pd.t+gH*(1-v/maxLoad);
    const pts=weekLoad.map((v,i)=>({x:xOf(i),y:yOf(v),v,ms:weekMs[i]}));
    // グラデーション面
    const grad=ctx.createLinearGradient(0,pd.t,0,pd.t+gH);
    grad.addColorStop(0,'rgba(118,192,234,0.25)');grad.addColorStop(1,'rgba(118,192,234,0.0)');
    ctx.beginPath();ctx.moveTo(pts[0].x,pd.t+gH);
    pts.forEach(p=>ctx.lineTo(p.x,p.y));
    ctx.lineTo(pts[pts.length-1].x,pd.t+gH);ctx.closePath();
    ctx.fillStyle=grad;ctx.fill();
    // 折れ線
    ctx.beginPath();ctx.strokeStyle='#76c0ea';ctx.lineWidth=2;ctx.lineJoin='round';ctx.lineCap='round';
    pts.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));ctx.stroke();
    // ラベル（負荷値）
    pts.forEach((p,i)=>{
      if(p.v>0){
        ctx.font=`bold ${dpr>1?8:7}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='bottom';
        ctx.fillStyle=i===todayDow?'#99d8ff':'#8b949e';
        ctx.fillText(p.v.toFixed(1),p.x,p.y-R-1);
      }
    });
    // 点
    pts.forEach((p,i)=>{
      ctx.beginPath();ctx.arc(p.x,p.y,R,0,Math.PI*2);
      ctx.fillStyle=i===todayDow?'#99d8ff':'#76c0ea';ctx.fill();
      ctx.strokeStyle='#161b22';ctx.lineWidth=1.5;ctx.stroke();
    });
  },30));
}

// 教科別円グラフ（放射状ラベル）
function renderHomePieChart() {
  const container=document.getElementById('home-pie-container'); if(!container)return;
  const now=new Date(),dow=now.getDay();
  const weekStart=new Date(now);
  weekStart.setDate(now.getDate()-(dow===0?6:dow-1));weekStart.setHours(0,0,0,0);
  const sd={};
  (S.sessions||[]).filter(s=>new Date(s.ts)>=weekStart).forEach(s=>{sd[s.subj]=(sd[s.subj]||0)+s.dur;});
  const tot=Object.values(sd).reduce((a,b)=>a+b,0);
  if(!tot){container.innerHTML='<div style="font-size:12px;color:var(--text-muted)">まだ記録なし</div>';return;}
  const entries=Object.entries(sd).sort((a,b)=>b[1]-a[1]);
  const cid='pie'+(_trendCID++);
  container.innerHTML=`<canvas id="${cid}" style="width:100%;display:block"></canvas>`;
  requestAnimationFrame(()=>setTimeout(()=>{
    const cv=document.getElementById(cid);if(!cv)return;
    drawSpiderPieChart(cv, entries, tot, '今週計');
  },20));
}

function drawSpiderPieChart(cv, entries, tot, centerLabel) {
  const dpr=window.devicePixelRatio||1;
  const W=cv.parentElement.clientWidth||300;
  const H=Math.max(W*0.75, 200);
  cv.width=W*dpr; cv.height=H*dpr;
  cv.style.width=W+'px'; cv.style.height=H+'px';
  const ctx=cv.getContext('2d'); ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,W,H);

  const cx=W/2, cy=H/2;
  const R=Math.min(W,H)*0.3;
  const inner=R*0.52;
  const labelR=R*1.45;
  const lineR=R*1.08;

  const angles=[];
  let a=-Math.PI/2;
  entries.forEach(([subj,ms])=>{
    const sweep=(ms/tot)*Math.PI*2;
    angles.push({subj,ms,start:a,mid:a+sweep/2,end:a+sweep,sweep});
    a+=sweep;
  });

  angles.forEach(({subj,start,end})=>{
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,R,start,end);ctx.closePath();
    ctx.fillStyle=getSubjectColor(subj);ctx.fill();
    ctx.strokeStyle='#0d1117';ctx.lineWidth=1.5;ctx.stroke();
  });

  ctx.beginPath();ctx.arc(cx,cy,inner,0,Math.PI*2);ctx.fillStyle='#161b22';ctx.fill();
  const th=Math.floor(tot/3600000),tm=Math.floor((tot%3600000)/60000);
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#fff';ctx.font=`bold 12px sans-serif`;ctx.fillText(`${th}h${pad(tm)}m`,cx,cy-6);
  ctx.fillStyle='#8b949e';ctx.font='9px sans-serif';ctx.fillText(centerLabel,cx,cy+7);

  const labelSlots=angles.map(({subj,ms,mid})=>{
    const pct=Math.round(ms/tot*100);
    return {subj,ms,pct,mid,lx:cx+Math.cos(mid)*labelR,ly:cy+Math.sin(mid)*labelR,color:getSubjectColor(subj)};
  });

  const MIN_GAP=13;
  for(let iter=0;iter<30;iter++){
    let moved=false;
    for(let i=0;i<labelSlots.length;i++){
      for(let j=i+1;j<labelSlots.length;j++){
        const a2=labelSlots[i],b2=labelSlots[j];
        if(Math.sign(Math.cos(a2.mid))!==Math.sign(Math.cos(b2.mid)))continue;
        const dy=b2.ly-a2.ly;
        if(Math.abs(dy)<MIN_GAP){
          const push=(MIN_GAP-Math.abs(dy))/2+1;
          a2.ly-=push; b2.ly+=push; moved=true;
        }
      }
    }
    if(!moved)break;
  }

  labelSlots.forEach(({subj,ms,pct,mid,lx,ly,color})=>{
    const lx0=cx+Math.cos(mid)*lineR, ly0=cy+Math.sin(mid)*lineR;
    const isRight=lx>cx;
    const textX=isRight?lx+4:lx-4;
    ctx.beginPath();ctx.moveTo(cx+Math.cos(mid)*(R+1),cy+Math.sin(mid)*(R+1));
    ctx.lineTo(lx0,ly0);ctx.lineTo(lx,ly);
    ctx.strokeStyle=color;ctx.lineWidth=1;ctx.stroke();
    const h2=Math.floor(ms/3600000),m2=Math.floor((ms%3600000)/60000);
    const timeStr=h2>0?`${h2}h${m2>0?m2+'m':''}`:`${m2}m`;
    ctx.textAlign=isRight?'left':'right';ctx.textBaseline='middle';
    ctx.fillStyle=color;ctx.font=`bold 10px sans-serif`;
    ctx.fillText(sanitize(subj),textX,ly-5);
    ctx.fillStyle='#8b949e';ctx.font='9px sans-serif';
    ctx.fillText(`${timeStr} ${pct}%`,textX,ly+5);
  });
}

function toggleEventDone(idx) {
  const ev=(S.events||[])[idx];if(!ev)return;
  ev.done=!ev.done;saveState();checkBadges();
  refreshHomeTaskList();
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

function formatMsShortSec(ms) {
  const totalSec=Math.floor(ms/1000);
  if(totalSec<60)return totalSec+'秒';
  const h=Math.floor(totalSec/3600),m=Math.floor((totalSec%3600)/60);
  if(h===0)return m+'分';
  if(m===0)return h+'h';
  return h+'h '+m+'m';
}

// ============================================================
// STUDY HUB
// ============================================================

function renderStudyHub() {
  const nc=(page,title,sub)=>`<div onclick="navigateTo('${page}')" class="card"
    style="cursor:pointer;display:flex;align-items:center;gap:14px;padding:16px">
    <div style="flex:1"><div style="font-size:15px;font-weight:800">${title}</div>
    <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${sub}</div></div>
    <span style="color:var(--accent-soft);font-size:20px">›</span></div>`;
  return `<div class="page-header"><div class="page-title">学習</div></div>
    ${nc('timer','タイマー','教科を選んで学習時間を記録')}
    ${nc('calendar','カレンダー','予定・負荷管理・学習履歴')}
    ${nc('study-log','勉強時間','日・週・月・年ごとの記録')}
    ${nc('flashcard','暗記カード','フラッシュカードで暗記練習')}
    ${nc('plan-engine','計画エンジン','今日の学習おすすめ配分を確認')}`;
}

// ============================================================
// PLAN ENGINE — おすすめ表示のみ（セット機能廃止）
// ============================================================

function renderPlanEngine() {
  const goal=S.goal;
  const dow=(new Date().getDay()+6)%7; // 月=0
  const weekTotal=getWeekTotalMs();
  const goalMs=(goal?.weeklyGoalHours||CFG.DEFAULT_WEEKLY_GOAL_HOURS)*3600000;
  const goalAchieved=weekTotal>=goalMs;
  const daysLeft=Math.max(1,7-dow);
  const remainMs=Math.max(0,goalMs-weekTotal);
  const weekPct=Math.min(Math.round(weekTotal/goalMs*100),100);
  const daysLabel=['月','火','水','木','金','土','日'][dow];

  // 今日の残り目標時間（今日すでに勉強した分を引く）
  const todayDone=getTodayMs();
  let recDailyMinutes;
  if(goalAchieved){
    recDailyMinutes=0; // 達成済みは推奨なし
  } else {
    // 残り目標 ÷ 残り日数 - 今日の勉強済み分
    const dailyTargetMs=remainMs/daysLeft;
    const todayRemMs=Math.max(0,dailyTargetMs-todayDone);
    recDailyMinutes=Math.round(todayRemMs/60000);
    recDailyMinutes=Math.min(recDailyMinutes,480); // 最大8h
  }

  const plan=generateTodayPlan(Math.max(recDailyMinutes,goalAchieved?0:30));

  const planHtml=plan.map(item=>{
    const color=getSubjectColor(item.subj);
    // 教科ごとにスコア理由を簡易表示
    return `<div class="list-row">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:8px;height:8px;border-radius:50%;background:${color}"></div>
        <div style="font-size:13px;font-weight:700">${sanitize(item.subj)}</div>
      </div>
      <div style="font-weight:700;color:${color};font-size:15px">${item.plannedMinutes}分</div>
    </div>`;
  }).join('');

  // 負荷値サマリー（今日の累積）
  const todayLoad=calcDayLoad(today());
  const todayLoadColor=todayLoad>=5?'var(--bad)':todayLoad>=3?'var(--warn)':'var(--ok)';

  return `<div class="page-header">
    <div style="display:flex;align-items:center;gap:8px">
      <button class="btn btn-ghost btn-sm" onclick="navigateTo('study')">← 戻る</button>
      <div class="page-title" style="font-size:18px">計画エンジン</div>
    </div>
  </div>

  <div class="card">
    <div class="section-label">今週の進捗</div>
    <div class="flex justify-between" style="font-size:12px;color:var(--text-muted);margin-bottom:6px">
      <span>実績: ${formatMsShort(weekTotal)}</span>
      ${goalAchieved
        ? `<span style="color:var(--ok);font-weight:700">✓ 週目標達成！</span>`
        : `<span style="color:var(--accent-strong)">残り ${formatMsShort(remainMs)} (${weekPct}%)</span>`
      }
    </div>
    <div class="bar-track" style="height:8px">
      <div class="bar-fill" style="width:${weekPct}%;background:${weekPct>=100?'var(--ok)':'var(--accent-strong)'}"></div>
    </div>
    <div class="flex justify-between" style="font-size:10px;color:var(--text-muted);margin-top:6px">
      <span>今日の累積負荷: <b style="color:${todayLoadColor}">${todayLoad.toFixed(1)}</b></span>
      <span>${goalAchieved?'苦手強化モード':`残り${daysLeft}日で配分`}</span>
    </div>
  </div>

  <div class="card">
    <div class="section-label">
      ${goalAchieved?'苦手強化おすすめ配分':
        `今日のおすすめ (${daysLabel}曜日 · 残り${recDailyMinutes}分)`}
    </div>
    ${goalAchieved?'<div style="font-size:11px;color:var(--ok);margin-bottom:8px">週目標達成済み。平均点の低い教科の強化を推奨します。</div>':
      recDailyMinutes===0?'<div style="font-size:12px;color:var(--ok)">今日の目標分は達成済みです 🎉</div>':
      `<div style="font-size:10px;color:var(--text-muted);margin-bottom:8px">
        1日の目標 ${formatMsShort(Math.round(goalMs/7))} のうち今日残り ${recDailyMinutes}分 を教科別に配分
      </div>`}
    ${recDailyMinutes>0||goalAchieved?planHtml:''}
    <div style="font-size:10px;color:var(--text-muted);margin-top:10px;line-height:1.6;border-top:1px solid var(--bg-border);padding-top:8px">
      直近学習(${Math.round(CFG.PLAN.recencyWeight*100)}%) · 平均点との差(${Math.round(CFG.PLAN.testWeight*100)}%) · スキル習熟度(${Math.round(CFG.PLAN.skillWeight*100)}%)で算出
    </div>
  </div>`;
}

// ============================================================
// アップデートチェック（自動適用）
// ============================================================

function checkForUpdate() {
  if(!navigator.onLine)return;
  fetch(location.href.split('?')[0]+'?_cb='+Date.now(),{cache:'no-store'})
    .then(r=>r.text()).then(html=>{
      const m=html.match(/APP_VERSION:'([^']+)'/);
      if(m&&m[1]!==CFG.APP_VERSION){
        showToast(`v${m[1]} に自動アップデートします…`);
        setTimeout(()=>location.reload(true),2000);
      }
    }).catch(()=>{});
}

// generateAndSavePlan は使用しないが後方互換用に残す
function generateAndSavePlan() { navigateTo('plan-engine'); }
