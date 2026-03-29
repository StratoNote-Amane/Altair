// app-study.js — タイマー・カレンダー・勉強時間ログ
// ============================================================

let timerUpdateInterval = null;
let selectedCalDate     = null;
let currentCalDate      = new Date();
let studyLogTab         = 'day';

let tSubj = '';
let tRun  = false;
let tStart= 0;
let tIv   = null;

function updateHeaderTimer() {}

// ============================================================
// TIMER — 今日の記録セクション削除済み
// ============================================================

function renderTimer() {
  const subjects = getAllSubjects();
  if (!tSubj && timerSubject) tSubj = timerSubject;
  if (!timerSubject && tSubj) timerSubject = tSubj;

  const elapsed = tRun && tStart > 0 ? Date.now() - tStart : 0;
  const todayMs = getTodayMs();
  const runCls  = tRun ? 'running' : tStart > 0 ? 'paused' : '';
  const btnBg   = tRun ? 'var(--warn)' : 'var(--accent-soft)';
  const btnIcon = tRun ? '&#9646;&#9646;' : '&#9654;';

  const startLabel = tStart > 0
    ? `<div id="t-start-label" style="font-size:12px;color:var(--text-muted);margin-top:4px;text-align:center">開始: ${pad(new Date(tStart).getHours())}:${pad(new Date(tStart).getMinutes())}:${pad(new Date(tStart).getSeconds())}</div>` : '';

  const chipsHtml = subjects.map(s=>{
    const color=getSubjectColor(s),isOn=s===tSubj;
    return `<div class="chip ${isOn?'active':''}" onclick="selTS(this,'${sanitize(s)}')"
      style="${isOn?`border-color:${color};color:${color}`:''}">${sanitize(s)}</div>`;
  }).join('');

  return `<div class="page-header">
    <div style="display:flex;align-items:center;gap:8px">
      <button class="btn btn-ghost btn-sm" onclick="navigateTo('study')">← 戻る</button>
      <div><div class="page-title" style="font-size:18px">タイマー</div></div>
    </div>
  </div>

  <div class="card">
    <div class="section-label">教科を選択</div>
    <div class="chips" id="tchips">${chipsHtml}</div>
  </div>

  <div class="card" style="text-align:center;padding:20px 16px">
    <div class="timer-display ${runCls}" id="tdisp">${formatMs(elapsed)}</div>
    <div style="font-size:12px;color:var(--text-muted);margin-top:4px" id="tslbl" style="color:${getSubjectColor(tSubj)}">${tSubj||'教科を選択'}</div>
    ${startLabel}
    <div style="margin:16px 0">
      <button onclick="toggleT()" id="tbtn" style="width:72px;height:72px;border-radius:50%;border:none;font-size:28px;cursor:pointer;background:${btnBg};color:#fff;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 6px 24px rgba(76,168,216,.3);transition:background .2s">${btnIcon}</button>
    </div>
    <div style="font-size:13px;color:var(--text-secondary)">今日の累積:
      <b id="t-today-disp" style="color:var(--accent-strong);font-size:16px">${formatMs(todayMs)}</b>
    </div>
    <div style="font-size:11px;color:var(--text-muted);margin-top:6px">${tRun?'タップで停止・記録':'タップで開始'}</div>
  </div>`;
}

function selTS(el, s) {
  tSubj = s; timerSubject = s;
  const sc = getSubjectColor(s);
  document.querySelectorAll('#tchips .chip').forEach(c=>{
    c.classList.toggle('active',c===el);
    if(c===el){c.style.borderColor=sc;c.style.color=sc;}
    else{c.style.borderColor='';c.style.color='';}
  });
  const lbl=document.getElementById('tslbl');
  if(lbl){lbl.textContent=s;lbl.style.color=sc;}
}

function toggleT() {
  if (tRun) {
    tRun=false;
    clearInterval(tIv);tIv=null;
    const elapsed=Date.now()-tStart;
    if (elapsed>4000) {
      recordSession(tSubj, elapsed);
    } else {
      tStart=0;
      const disp=document.getElementById('tdisp');
      if(disp){disp.textContent='0:00:00';disp.className='timer-display';}
    }
    try{localStorage.removeItem(CFG.TIMER_KEY);}catch(e){}
  } else {
    if (!tSubj) { showToast('教科を選択してください'); return; }
    if (tStart===0) tStart=Date.now();
    S.todayMs_base=getTodayMs();
    tRun=true;
    clearInterval(tIv);
    tIv=setInterval(tickT,500);
    try{localStorage.setItem(CFG.TIMER_KEY,JSON.stringify({ts:tStart,subj:tSubj}));}catch(e){}
  }
  const btn=document.getElementById('tbtn');
  if(btn){btn.innerHTML=tRun?'&#9646;&#9646;':'&#9654;';btn.style.background=tRun?'var(--warn)':'var(--accent-soft)';}
  const disp=document.getElementById('tdisp');
  if(disp)disp.className='timer-display '+(tRun?'running':tStart>0?'paused':'');
  updateStartLabel();
}

function tickT() {
  const elapsed=tStart>0?Date.now()-tStart:0;
  const d=document.getElementById('tdisp');if(d)d.textContent=formatMs(elapsed);
  const base=getTodayMs();
  const el=document.getElementById('t-today-disp');
  if(el)el.textContent=formatMs(base+elapsed);
}

function updateStartLabel() {
  const disp=document.getElementById('tdisp');if(!disp)return;
  const old=document.getElementById('t-start-label');if(old)old.remove();
  if(tStart>0){
    const st=new Date(tStart);
    const lbl=document.createElement('div');lbl.id='t-start-label';
    lbl.style.cssText='font-size:12px;color:var(--text-muted);margin-top:4px;text-align:center';
    lbl.textContent='開始: '+pad(st.getHours())+':'+pad(st.getMinutes())+':'+pad(st.getSeconds());
    disp.parentNode.insertBefore(lbl,disp.nextSibling);
  }
}

function recordSession(subj, dur) {
  if(!subj||dur<=0)return;
  S.sessions=S.sessions||[];
  S.sessions.push({id:generateId(),subj,dur,ts:tStart||Date.now()-dur});
  updateTodayPlanActual(subj,dur);
  updateStreak();
  tStart=0;saveState();checkBadges();
  const disp=document.getElementById('tdisp');
  if(disp){disp.textContent='0:00:00';disp.className='timer-display';}
  const btn=document.getElementById('tbtn');
  if(btn){btn.innerHTML='&#9654;';btn.style.background='var(--accent-soft)';}
  const lbl=document.getElementById('t-start-label');if(lbl)lbl.remove();
  showToast(`${formatMs(dur)} 記録しました`);
  navigateTo('timer');
}

function restoreTimer() {
  try{
    const stored=localStorage.getItem(CFG.TIMER_KEY);if(!stored)return;
    const obj=JSON.parse(stored);
    const ts=obj.ts,subj=obj.subj;
    const elapsed=Date.now()-ts;if(elapsed<=0)return;
    tStart=ts;tSubj=subj||tSubj;timerSubject=tSubj;
    tRun=true;S.todayMs_base=S.todayMs||0;
    clearInterval(tIv);tIv=setInterval(tickT,500);
    const disp=document.getElementById('tdisp');
    if(disp){disp.textContent=formatMs(elapsed);disp.className='timer-display running';}
    const btn=document.getElementById('tbtn');
    if(btn){btn.innerHTML='&#9646;&#9646;';btn.style.background='var(--warn)';}
    showToast('タイマーを復元して再開中（'+formatMs(elapsed)+'経過）— タップで停止して記録');
  }catch(e){}
}

function startTimerDisplay(){}
function stopTimerDisplay(){}

function updateTodayPlanActual(subj,durMs) {
  const plan=getTodayPlan();if(!plan)return;
  const item=plan.items.find(it=>it.subj===subj);
  if(item){item.actualMinutes+=Math.floor(durMs/60000);saveTodayPlan(plan.items);}
}

// ============================================================
// CALENDAR — 土日祝カラー + スライドアニメーション
// ============================================================

function isJapaneseHoliday(year,month,day) {
  const m=month+1;
  const fixed={
    '1-1':1,'1-2':1,'1-3':1,
    '2-11':1,'2-23':1,
    '4-29':1,
    '5-3':1,'5-4':1,'5-5':1,
    '7-15':1,
    '8-11':1,
    '9-15':1,
    '10-14':1,
    '11-3':1,'11-23':1,
  };
  if(fixed[`${m}-${day}`])return true;
  if(m===3&&(day===20||day===21))return true;
  if(m===9&&(day===22||day===23))return true;
  return false;
}

let _calAnimDir=0;

function renderCalendar() {
  const year=currentCalDate.getFullYear(),month=currentCalDate.getMonth();
  const monthStr=`${year}年${month+1}月`;

  let evListHtml='';
  if(selectedCalDate){
    const dp=selectedCalDate.split('-');
    const selEvs=(S.events||[]).filter(e=>e.date===selectedCalDate);
    const selMs=(S.sessions||[]).filter(s=>localDateStr(new Date(s.ts))===selectedCalDate).reduce((a,s)=>a+s.dur,0);
    const load=calcLoad(selectedCalDate);
    const loadColor=load>=8?'var(--bad)':load>=4?'var(--warn)':'var(--ok)';

    evListHtml=`<div class="card mt-8">
      <div class="flex justify-between items-center mb-8">
        <div class="section-label" style="margin:0">${dp[0]}年${+dp[1]}月${+dp[2]}日</div>
      </div>
      ${selMs>0?`<div style="font-size:12px;color:var(--accent-soft);margin-bottom:8px">学習: ${formatMsShort(selMs)} · 負荷: <span style="color:${loadColor}">${load}</span></div>`:''}
      ${selEvs.length
        ? selEvs.map(e=>{
            const ri=S.events.indexOf(e),done=!!e.done,color=getSubjectColor(e.subj);
            return `<div class="event-item" style="opacity:${done?0.55:1};margin-bottom:6px">
              <div class="event-bar" style="background:${done?'#444':color}"></div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:700;${done?'text-decoration:line-through;color:var(--text-muted)':''};overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${sanitize(e.title)}</div>
                <div style="font-size:11px;color:var(--text-muted)">${sanitize(e.subj)} · 負荷${e.load||1}</div>
              </div>
              <div class="flex gap-6" style="flex-shrink:0">
                <button class="btn ${done?'btn-ghost':'btn-primary'} btn-sm" onclick="toggleCalEventDone(${ri})">${done?'↩':'✓'}</button>
                <button class="btn btn-ghost btn-sm" onclick="editCalEvent(${ri})">✎</button>
                <button class="btn btn-danger btn-sm" onclick="deleteCalEvent(${ri})">✕</button>
              </div>
            </div>`;
          }).join('')
        : '<div style="font-size:12px;color:var(--text-muted)">予定なし</div>'}
    </div>`;
  }

  return `<div class="page-header">
    <div style="display:flex;align-items:center;gap:8px">
      <button class="btn btn-ghost btn-sm" onclick="navigateTo('study')">← 戻る</button>
      <div class="page-title" style="font-size:18px">カレンダー</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-ghost btn-sm" onclick="calNav(-1)" style="font-size:16px">‹</button>
      <span style="font-size:13px;font-weight:700;color:var(--text-primary);min-width:80px;text-align:center">${monthStr}</span>
      <button class="btn btn-ghost btn-sm" onclick="calNav(1)" style="font-size:16px">›</button>
      <button class="btn btn-primary btn-sm" onclick="openCalEventModal()">＋</button>
    </div>
  </div>
  <div class="card" style="padding:10px;overflow:hidden">
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:3px">
      <div style="text-align:center;font-size:10px;font-weight:700;padding:3px 0;color:#e87070;background:rgba(226,75,74,0.07);border-radius:4px">日</div>
      <div style="text-align:center;font-size:10px;font-weight:700;padding:3px 0;color:var(--text-muted)">月</div>
      <div style="text-align:center;font-size:10px;font-weight:700;padding:3px 0;color:var(--text-muted)">火</div>
      <div style="text-align:center;font-size:10px;font-weight:700;padding:3px 0;color:var(--text-muted)">水</div>
      <div style="text-align:center;font-size:10px;font-weight:700;padding:3px 0;color:var(--text-muted)">木</div>
      <div style="text-align:center;font-size:10px;font-weight:700;padding:3px 0;color:var(--text-muted)">金</div>
      <div style="text-align:center;font-size:10px;font-weight:700;padding:3px 0;color:#76c0ea;background:rgba(118,192,234,0.07);border-radius:4px">土</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;transition:transform 0.28s cubic-bezier(.4,0,.2,1),opacity 0.28s" id="calendar-grid"></div>
  </div>
  ${evListHtml}`;
}

function calcLoad(ds){
  const evLoad=(S.events||[]).filter(e=>e.date===ds).reduce((a,e)=>a+(e.load||1),0);
  const sesLoad=Math.round((S.sessions||[]).filter(s=>localDateStr(new Date(s.ts))===ds).reduce((a,s)=>a+s.dur,0)/900000);
  return evLoad+sesLoad;
}

function calNav(delta) {
  _calAnimDir=delta;
  const grid=document.getElementById('calendar-grid');
  if(grid){
    grid.style.transform=`translateX(${delta>0?'-':'+'}30px)`;
    grid.style.opacity='0';
  }
  setTimeout(()=>{
    currentCalDate=new Date(currentCalDate.getFullYear(),currentCalDate.getMonth()+delta,1);
    navigateTo('calendar');
  },180);
}

function renderCalendarGrid() {
  const grid=document.getElementById('calendar-grid');if(!grid)return;
  const year=currentCalDate.getFullYear(),month=currentCalDate.getMonth();
  const todayStr=today(),daysInMonth=new Date(year,month+1,0).getDate();
  const firstDow=new Date(year,month,1).getDay();

  // アニメーション開始
  grid.style.transform=`translateX(${_calAnimDir>0?'30px':_calAnimDir<0?'-30px':'0'})`;
  grid.style.opacity=_calAnimDir!==0?'0':'1';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    grid.style.transition='transform 0.28s cubic-bezier(.4,0,.2,1),opacity 0.28s';
    grid.style.transform='translateX(0)';
    grid.style.opacity='1';
    _calAnimDir=0;
  }));

  let html='';
  for(let i=0;i<firstDow;i++){
    const d=new Date(year,month,-firstDow+i+1);
    html+=`<div style="min-height:46px;border-radius:6px;opacity:0.3;padding:3px 2px"><span style="font-size:12px;font-weight:700">${d.getDate()}</span></div>`;
  }

  for(let d=1;d<=daysInMonth;d++){
    const ds=`${year}-${pad(month+1)}-${pad(d)}`;
    const isToday=ds===todayStr,isSel=ds===selectedCalDate;
    const dow=new Date(year,month,d).getDay(); // 0=日,6=土
    const isSun=dow===0, isSat=dow===6;
    const isHoliday=isJapaneseHoliday(year,month,d);
    const evs=(S.events||[]).filter(e=>e.date===ds);
    const sessMs=(S.sessions||[]).filter(s=>s.dur>0&&localDateStr(new Date(s.ts))===ds).reduce((a,s)=>a+s.dur,0);
    const load=calcLoad(ds),incomplete=evs.filter(e=>!e.done).length;

    let bg='',border='',textColor='var(--text-secondary)';
    if(isToday){bg='background:var(--accent-strong);';textColor='#0d1117';}
    else if(isSel){border='border:1.5px solid var(--accent-soft);background:var(--accent-bg)';textColor='var(--accent-strong)';}
    else if(isSun||isHoliday)textColor='#e87070';
    else if(isSat)textColor='#76c0ea';

    const mini=[];
    if(sessMs>0){
      const hh=Math.floor(sessMs/3600000),mm=Math.floor((sessMs%3600000)/60000);
      mini.push(`<div style="font-size:8px;color:${isToday?'rgba(13,17,23,.7)':'var(--accent-soft)'}">${hh>0?hh+'h':''}${mm}m</div>`);
    }
    if(load>0)mini.push(`<div style="font-size:8px;color:${isToday?'rgba(13,17,23,.7)':load>=8?'var(--bad)':load>=4?'var(--warn)':'var(--ok)'}">負${load}</div>`);
    if(incomplete>0)mini.push(`<div style="font-size:8px;color:${isToday?'rgba(13,17,23,.7)':'var(--warn)'}">□${incomplete}</div>`);

    html+=`<div onclick="selectCalDate('${ds}')" style="min-height:46px;border-radius:6px;padding:3px 2px;cursor:pointer;${bg}${border?border+';':''}color:${textColor}">
      <div style="font-size:12px;font-weight:700">${d}</div>
      ${mini.join('')}
    </div>`;
  }
  grid.innerHTML=html;
}

function selectCalDate(ds) {
  selectedCalDate=ds;
  renderCalendarGrid();
  const container=document.getElementById('main-content');
  if(container){
    container.innerHTML=renderCalendar();
    setTimeout(()=>renderCalendarGrid(),10);
  }
}

function openCalEventModal() {
  editEventIndex=-1;
  document.getElementById('modal-event-title').textContent='予定を追加';
  document.getElementById('input-event-title').value='';
  document.getElementById('input-event-date').value=selectedCalDate||today();
  document.getElementById('input-event-load').value=2;
  fillSubjectSelects();
  openModal('modal-event');
}

function toggleCalEventDone(idx){
  const ev=(S.events||[])[idx];if(!ev)return;
  ev.done=!ev.done;saveState();checkBadges();
  selectCalDate(selectedCalDate);
}

function editCalEvent(idx){
  editEventIndex=idx;
  const ev=(S.events||[])[idx];if(!ev)return;
  document.getElementById('modal-event-title').textContent='予定を編集';
  document.getElementById('input-event-title').value=ev.title||'';
  document.getElementById('input-event-date').value=ev.date||today();
  document.getElementById('input-event-load').value=ev.load||2;
  fillSubjectSelects();
  document.getElementById('input-event-subject').value=ev.subj||'';
  openModal('modal-event');
}

function deleteCalEvent(idx){
  if(!confirm('この予定を削除しますか？'))return;
  S.events.splice(idx,1);saveState();showToast('削除しました');
  selectCalDate(selectedCalDate);
}

let editEventIndex=-1;
function saveEvent(){
  const title=document.getElementById('input-event-title').value.trim();
  const date=document.getElementById('input-event-date').value;
  const subj=document.getElementById('input-event-subject').value;
  const load=parseInt(document.getElementById('input-event-load').value)||2;
  if(!title){showToast('タイトルを入力してください');return;}
  if(!date){showToast('日付を選択してください');return;}
  const ev={id:generateId(),title:sanitize(title),date,subj,load,done:false};
  if(editEventIndex>=0){
    S.events[editEventIndex]=Object.assign({},S.events[editEventIndex],ev);editEventIndex=-1;
  }else{S.events=S.events||[];S.events.push(ev);}
  saveState();closeModal('modal-event');
  document.getElementById('input-event-title').value='';
  showToast('予定を保存しました');
  selectedCalDate=date;
  selectCalDate(date);
}

// ============================================================
// STUDY LOG — 放射状円グラフ + トレンド分析タブ
// ============================================================

function renderStudyLog(){
  const tabs=[{k:'day',l:'日別'},{k:'week',l:'週別'},{k:'month',l:'月別'},{k:'year',l:'年別'},{k:'trend',l:'トレンド'}];
  const tabsHtml=tabs.map(t=>`<button class="page-tab ${t.k===studyLogTab?'active':''}"
    onclick="studyLogTab='${t.k}';navigateTo('study-log')">${t.l}</button>`).join('');
  return `<div class="page-header">
    <div style="display:flex;align-items:center;gap:8px">
      <button class="btn btn-ghost btn-sm" onclick="navigateTo('study')">← 戻る</button>
      <div class="page-title" style="font-size:18px">勉強時間</div>
    </div>
  </div>
  <div class="page-tabs">${tabsHtml}</div>
  <div id="study-log-content"></div>`;
}

function renderStudyLogCharts(){
  const container=document.getElementById('study-log-content');if(!container)return;
  if(studyLogTab==='trend'){renderTrendTab(container);return;}

  const sessions=S.sessions||[];
  const groups={};
  sessions.forEach(s=>{
    if(!s.dur||s.dur<=0)return;
    const d=new Date(s.ts);
    let key;
    if(studyLogTab==='day')key=localDateStr(d);
    else if(studyLogTab==='week')key=weekKeyOf(d);
    else if(studyLogTab==='month')key=localMonthStr(d);
    else key=String(d.getFullYear());
    if(!groups[key])groups[key]={total:0,subj:{}};
    groups[key].total+=s.dur;
    groups[key].subj[s.subj]=(groups[key].subj[s.subj]||0)+s.dur;
  });

  const now=new Date(),allowed=new Set();
  if(studyLogTab==='day'){
    allowed.add(localDateStr(now));
    const yd=new Date(now);yd.setDate(yd.getDate()-1);allowed.add(localDateStr(yd));
  }else if(studyLogTab==='week'){
    allowed.add(weekKeyOf(now));
    const lw=new Date(now);lw.setDate(lw.getDate()-7);allowed.add(weekKeyOf(lw));
  }else if(studyLogTab==='month'){
    allowed.add(localMonthStr(now));
    const lm=new Date(now.getFullYear(),now.getMonth()-1,1);allowed.add(localMonthStr(lm));
  }else{allowed.add(String(now.getFullYear()));allowed.add(String(now.getFullYear()-1));}

  const keys=Object.keys(groups).filter(k=>allowed.has(k)).sort().reverse();
  if(!keys.length){
    container.innerHTML='<div style="text-align:center;padding:32px;color:var(--text-muted);font-size:13px">記録がありません</div>';return;
  }

  const totalAll=keys.reduce((a,k)=>a+groups[k].total,0);
  const avgMs=keys.length?Math.round(totalAll/keys.length):0;
  const unitLabel={day:'日数',week:'週数',month:'月数',year:'年数'}[studyLogTab];

  const summaryHtml=`<div class="card"><div class="stats-row">
    <div class="stat-card"><div class="stat-val" style="font-size:16px">${formatMsShort(totalAll)}</div><div class="stat-lbl">合計</div></div>
    <div class="stat-card"><div class="stat-val">${keys.length}</div><div class="stat-lbl">${unitLabel}</div></div>
    <div class="stat-card"><div class="stat-val" style="font-size:16px">${keys.length?formatMsShort(avgMs):'−'}</div><div class="stat-lbl">平均</div></div>
  </div></div>`;

  const blocksHtml=keys.map(k=>{
    const g=groups[k];
    const tot=Object.values(g.subj).reduce((a,b)=>a+b,0)||1;
    const entries=Object.entries(g.subj).sort((a,b)=>b[1]-a[1]);
    const cid='slpie'+(_trendCID++);

    (function(cid,entries,tot,k){
      requestAnimationFrame(()=>setTimeout(()=>{
        const cv=document.getElementById(cid);if(!cv)return;
        drawSpiderPieChart(cv, entries, tot, fmtLogKey(k));
      },20));
    })(cid,entries,tot,k);

    return `<div class="card">
      <div class="flex justify-between items-center mb-10">
        <div style="font-size:13px;font-weight:800">${fmtLogKey(k)}</div>
        <div style="font-size:17px;font-weight:800;color:var(--accent-strong)">${formatMsShort(g.total)}</div>
      </div>
      <canvas id="${cid}" style="width:100%;display:block"></canvas>
    </div>`;
  }).join('');

  container.innerHTML=summaryHtml+blocksHtml;
}

// トレンド分析タブ
function renderTrendTab(container) {
  const sessions=S.sessions||[];
  if(!sessions.length){
    container.innerHTML='<div style="text-align:center;padding:32px;color:var(--text-muted)">記録がありません</div>';return;
  }

  // 日別集計
  const byDay={};
  sessions.forEach(s=>{
    if(!s.dur||s.dur<=0)return;
    const k=localDateStr(new Date(s.ts));
    byDay[k]=(byDay[k]||0)+s.dur;
  });
  const dayKeys=Object.keys(byDay).sort();
  const dayVals=dayKeys.map(k=>byDay[k]);
  const avgMs=dayVals.length?Math.round(dayVals.reduce((a,b)=>a+b,0)/dayVals.length):0;

  // 直近7日と前7日で傾向判定
  const recent7=dayKeys.slice(-7).map(k=>byDay[k]);
  const prev7=dayKeys.slice(-14,-7).map(k=>byDay[k]);
  const recentAvg=recent7.length?recent7.reduce((a,b)=>a+b,0)/recent7.length:0;
  const prevAvg=prev7.length?prev7.reduce((a,b)=>a+b,0)/prev7.length:0;
  const trendDiff=recentAvg-prevAvg;
  const trendIcon=trendDiff>3600000?'📈':trendDiff<-3600000?'📉':'➡️';
  const trendText=trendDiff>3600000?'上昇傾向':trendDiff<-3600000?'下降傾向':'横ばい';
  const trendColor=trendDiff>3600000?'var(--ok)':trendDiff<-3600000?'var(--bad)':'var(--text-muted)';

  // 教科別集計
  const bySubj={};
  sessions.forEach(s=>{if(s.dur>0)bySubj[s.subj]=(bySubj[s.subj]||0)+s.dur;});
  const subjEntries=Object.entries(bySubj).sort((a,b)=>b[1]-a[1]);
  const topSubj=subjEntries[0],botSubj=subjEntries[subjEntries.length-1];

  // 最長勉強日
  const maxDay=dayKeys.reduce((best,k)=>byDay[k]>byDay[best]?k:best,dayKeys[0]);

  // 移動平均グラフ用データ
  const MA7=dayKeys.map((_,i)=>{
    const sl=dayVals.slice(Math.max(0,i-6),i+1);
    return sl.reduce((a,b)=>a+b,0)/sl.length;
  });

  const cid='trend-chart'+(_trendCID++);
  const pieCid='trend-pie'+(_trendCID++);
  const totSubj=Object.values(bySubj).reduce((a,b)=>a+b,0)||1;

  // 直近14日分 折れ線グラフ
  const recentKeys=dayKeys.slice(-14);
  const recentVals=recentKeys.map(k=>byDay[k]);

  setTimeout(()=>{
    // 折れ線グラフ（直近14日・画面内に収める）
    const cv=document.getElementById(cid);if(!cv)return;
    const dpr=window.devicePixelRatio||1,W=cv.parentElement.clientWidth||300,H=120;
    cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';
    const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
    ctx.fillStyle='#161b22';ctx.fillRect(0,0,W,H);
    // padding: t=値ラベル用, b=x軸ラベル用, l=y軸ラベル用, r=右マージン
    const pd={t:16,r:10,b:22,l:34};
    const gW=W-pd.l-pd.r,gH=H-pd.t-pd.b;
    const maxV=Math.max(...recentVals,1);
    const n=recentVals.length;
    const xOf=i=>Math.round(pd.l+(n>1?i/(n-1)*gW:gW/2));
    const yOf=v=>Math.round(pd.t+gH*(1-v/maxV));
    const pts=recentVals.map((v,i)=>({x:xOf(i),y:yOf(v),v}));

    // y軸グリッド（0, 最大の半分, 最大）
    const ySteps=[0, maxV/2, maxV];
    ySteps.forEach(v=>{
      const y=yOf(v);
      ctx.strokeStyle='#21262d';ctx.lineWidth=0.5;
      ctx.beginPath();ctx.moveTo(pd.l,y);ctx.lineTo(W-pd.r,y);ctx.stroke();
      const h=Math.floor(v/3600000),m2=Math.floor((v%3600000)/60000);
      const lbl=v===0?'0':h>0?h+'h':m2+'m';
      ctx.fillStyle='#8b949e';ctx.font='8px sans-serif';ctx.textAlign='right';ctx.textBaseline='middle';
      ctx.fillText(lbl,pd.l-3,y);
    });

    // 平均線
    const clampedAvg=Math.min(avgMs,maxV);
    const avgY=yOf(clampedAvg);
    ctx.setLineDash([4,3]);ctx.strokeStyle='rgba(153,216,255,0.4)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(pd.l,avgY);ctx.lineTo(W-pd.r,avgY);ctx.stroke();
    ctx.setLineDash([]);

    // グラデーション塗り
    const grad=ctx.createLinearGradient(0,pd.t,0,pd.t+gH);
    grad.addColorStop(0,'rgba(118,192,234,0.2)');grad.addColorStop(1,'rgba(118,192,234,0)');
    ctx.beginPath();ctx.moveTo(pts[0].x,pd.t+gH);
    pts.forEach(p=>ctx.lineTo(p.x,Math.min(p.y,pd.t+gH)));
    ctx.lineTo(pts[pts.length-1].x,pd.t+gH);ctx.closePath();
    ctx.fillStyle=grad;ctx.fill();

    // 折れ線
    ctx.beginPath();ctx.strokeStyle='#76c0ea';ctx.lineWidth=2;ctx.lineJoin='round';ctx.lineCap='round';
    pts.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));ctx.stroke();

    // 点＋ラベル（値がある点のみ、labelをgraph内に収める）
    pts.forEach((p,i)=>{
      ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);
      ctx.fillStyle=i===pts.length-1?'#99d8ff':'#76c0ea';ctx.fill();
      if(p.v>0){
        const h=Math.floor(p.v/3600000),m2=Math.floor((p.v%3600000)/60000);
        const lbl=h>0?`${h}h${m2?m2+'m':''}`:m2+'m';
        ctx.font=`bold 7px sans-serif`;ctx.textAlign='center';
        // ラベルをy上側に置く。y-13が0より小さければ下側に
        const lblY=p.y-10<pd.t+4?p.y+10:p.y-4;
        ctx.textBaseline=p.y-10<pd.t+4?'top':'bottom';
        ctx.fillStyle=i===pts.length-1?'#99d8ff':'#8b949e';
        ctx.fillText(lbl,p.x,lblY);
      }
    });

    // x軸ラベル（最初・真ん中・最後）をgraph底部に固定
    const xAxisY=pd.t+gH+4; // グラフ底辺+余白
    ctx.textBaseline='top';ctx.fillStyle='#8b949e';ctx.font='7px sans-serif';
    if(recentKeys.length>0){
      ctx.textAlign='left';ctx.fillText(recentKeys[0].slice(5),pd.l,xAxisY);
      if(recentKeys.length>1){
        const mi=Math.floor((recentKeys.length-1)/2);
        ctx.textAlign='center';ctx.fillText(recentKeys[mi].slice(5),xOf(mi),xAxisY);
        ctx.textAlign='right';ctx.fillText(recentKeys[recentKeys.length-1].slice(5),W-pd.r,xAxisY);
      }
    }

    // 放射状円グラフ（全教科累計）
    const cv2=document.getElementById(pieCid);if(!cv2)return;
    drawSpiderPieChart(cv2,subjEntries,totSubj,'累計');
  },50);

  container.innerHTML=`
  <div class="card">
    <div class="section-label">直近傾向</div>
    <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
      <div style="flex:1;min-width:70px;background:var(--bg-base);border-radius:var(--radius-sm);padding:8px 10px;border:1px solid var(--bg-border)">
        <div style="font-size:16px">${trendIcon}</div>
        <div style="font-size:12px;font-weight:800;color:${trendColor}">${trendText}</div>
        <div style="font-size:9px;color:var(--text-muted)">直近7日 vs 前7日</div>
      </div>
      <div style="flex:1;min-width:70px;background:var(--bg-base);border-radius:var(--radius-sm);padding:8px 10px;border:1px solid var(--bg-border)">
        <div style="font-size:12px;font-weight:800;color:var(--accent-strong)">${formatMsShort(avgMs)}</div>
        <div style="font-size:9px;color:var(--text-muted)">日平均</div>
      </div>
      <div style="flex:1;min-width:70px;background:var(--bg-base);border-radius:var(--radius-sm);padding:8px 10px;border:1px solid var(--bg-border)">
        <div style="font-size:12px;font-weight:800;color:var(--accent-soft)">${dayKeys.length}日</div>
        <div style="font-size:9px;color:var(--text-muted)">記録日数</div>
      </div>
      ${maxDay?`<div style="flex:1;min-width:70px;background:var(--bg-base);border-radius:var(--radius-sm);padding:8px 10px;border:1px solid var(--bg-border)">
        <div style="font-size:11px;font-weight:800;color:var(--accent-strong)">${formatMsShort(byDay[maxDay])}</div>
        <div style="font-size:9px;color:var(--text-muted)">最長 ${maxDay.slice(5)}</div>
      </div>`:''}
    </div>
    <canvas id="${cid}" style="width:100%;display:block"></canvas>
    <div style="font-size:9px;color:var(--text-muted);margin-top:3px">直近14日の学習時間（-- 全体平均）</div>
  </div>

  <div class="card">
    <div class="section-label">全教科の累計時間</div>
    ${topSubj?`<div style="display:flex;gap:12px;margin-bottom:8px">
      <span style="font-size:11px;color:var(--text-muted)">🏆 最多: <b style="color:${getSubjectColor(topSubj[0])}">${sanitize(topSubj[0])}</b> ${formatMsShort(topSubj[1])}</span>
      ${botSubj&&botSubj[0]!==topSubj?.[0]?`<span style="font-size:11px;color:var(--text-muted)">📌 最少: <b style="color:${getSubjectColor(botSubj[0])}">${sanitize(botSubj[0])}</b> ${formatMsShort(botSubj[1])}</span>`:''}
    </div>`:''}
    <canvas id="${pieCid}" style="width:100%;display:block"></canvas>
  </div>`;
}

function fmtLogKey(k){
  if(studyLogTab==='day'){const p=k.split('-');return `${p[0]}年${+p[1]}月${+p[2]}日`;}
  if(studyLogTab==='week'){const ws=new Date(k+'T00:00:00'),we=new Date(ws);we.setDate(ws.getDate()+6);return `${ws.getMonth()+1}/${ws.getDate()}〜${we.getMonth()+1}/${we.getDate()}`;}
  if(studyLogTab==='month'){const p=k.split('-');return `${p[0]}年${+p[1]}月`;}
  return k+'年';
}
