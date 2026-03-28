// ============================================================
// app-study.js 窶・繧ｿ繧､繝槭・繝ｻ繧ｫ繝ｬ繝ｳ繝繝ｼ繝ｻ蜍牙ｼｷ譎る俣繝ｭ繧ｰ
// ============================================================

let timerUpdateInterval = null;
let selectedCalDate     = null;
let currentCalDate      = new Date();
let studyLogTab         = 'day';

// StratoNote莠呈鋤縺ｮ繧ｰ繝ｭ繝ｼ繝舌Ν螟画焚
let tSubj = '';
let tRun  = false;
let tStart= 0;
let tIv   = null;

function updateHeaderTimer() {} // 繝倥ャ繝繝ｼ繧ｿ繧､繝槭・蟒・ｭ｢

// ============================================================
// TIMER 窶・StratoNote螳悟・讓｡蛟｣
// ============================================================

function renderTimer() {
  const subjects = getAllSubjects();
  // timerSubject 繧稚Subj縺ｨ蜷梧悄
  if (!tSubj && timerSubject) tSubj = timerSubject;
  if (!timerSubject && tSubj) timerSubject = tSubj;

  const elapsed = tRun && tStart > 0 ? Date.now() - tStart : 0;
  const todayMs = getTodayMs();
  const runCls  = tRun ? 'running' : tStart > 0 ? 'paused' : '';
  const btnBg   = tRun ? 'var(--warn)' : 'var(--accent-soft)';
  const btnIcon = tRun ? '&#9646;&#9646;' : '&#9654;';

  const startLabel = tStart > 0
    ? `<div id="t-start-label" style="font-size:12px;color:var(--text-muted);margin-top:4px;text-align:center">髢句ｧ・ ${pad(new Date(tStart).getHours())}:${pad(new Date(tStart).getMinutes())}:${pad(new Date(tStart).getSeconds())}</div>` : '';

  const chipsHtml = subjects.map(s=>{
    const color=getSubjectColor(s),isOn=s===tSubj;
    return `<div class="chip ${isOn?'active':''}" onclick="selTS(this,'${sanitize(s)}')"
      style="${isOn?`border-color:${color};color:${color}`:''}">${sanitize(s)}</div>`;
  }).join('');

  // 莉頑律縺ｮ繧ｻ繝・す繝ｧ繝ｳ
  const todayStr=today();
  const todaySessions=(S.sessions||[]).filter(s=>localDateStr(new Date(s.ts))===todayStr).slice().reverse();
  const sessHtml=todaySessions.length
    ? todaySessions.map(s=>{
        const color=getSubjectColor(s.subj);
        return `<div class="list-row">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0"></div>
            <div style="font-size:13px">${sanitize(s.subj)}</div>
          </div>
          <div style="font-size:12px;color:var(--text-muted)">${formatMsShort(s.dur)}</div>
        </div>`;
      }).join('')
    : '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:8px">縺ｾ縺險倬鹸縺ｪ縺・/div>';

  return `<div class="page-header">
    <div style="display:flex;align-items:center;gap:8px">
      <button class="btn btn-ghost btn-sm" onclick="navigateTo('study')">竊・謌ｻ繧・/button>
      <div><div class="page-title" style="font-size:18px">繧ｿ繧､繝槭・</div></div>
    </div>
  </div>

  <div class="card">
    <div class="section-label">謨咏ｧ代ｒ驕ｸ謚・/div>
    <div class="chips" id="tchips">${chipsHtml}</div>
  </div>

  <div class="card" style="text-align:center;padding:20px 16px">
    <div class="timer-display ${runCls}" id="tdisp">${formatMs(elapsed)}</div>
    <div style="font-size:12px;color:var(--text-muted);margin-top:4px" id="tslbl" style="color:${getSubjectColor(tSubj)}">${tSubj||'謨咏ｧ代ｒ驕ｸ謚・}</div>
    ${startLabel}
    <div style="margin:16px 0">
      <button onclick="toggleT()" id="tbtn" style="width:72px;height:72px;border-radius:50%;border:none;font-size:28px;cursor:pointer;background:${btnBg};color:#fff;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 6px 24px rgba(76,168,216,.3);transition:background .2s">${btnIcon}</button>
    </div>
    <div style="font-size:13px;color:var(--text-secondary)">莉頑律縺ｮ邏ｯ遨・
      <b id="t-today-disp" style="color:var(--accent-strong);font-size:16px">${formatMs(todayMs)}</b>
    </div>
    <div style="font-size:11px;color:var(--text-muted);margin-top:6px">${tRun?'繧ｿ繝・・縺ｧ蛛懈ｭ｢繝ｻ險倬鹸':'繧ｿ繝・・縺ｧ髢句ｧ・}</div>
  </div>

  <div class="card">
    <div class="section-label">莉頑律縺ｮ險倬鹸</div>
    ${sessHtml}
  </div>`;
}

// StratoNote螳悟・讓｡蛟｣
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
    // 蛛懈ｭ｢
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
    if (!tSubj) tSubj = getAllSubjects()[0]||'';
    if (tStart===0) tStart=Date.now();
    S.todayMs_base=S.todayMs||0;
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
  const base=S.todayMs_base||0;
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
    lbl.textContent='髢句ｧ・ '+pad(st.getHours())+':'+pad(st.getMinutes())+':'+pad(st.getSeconds());
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
  showToast(`${formatMs(dur)} 險倬鹸縺励∪縺励◆`);
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
    showToast('繧ｿ繧､繝槭・繧貞ｾｩ蜈・＠縺ｦ蜀埼幕荳ｭ・・+formatMs(elapsed)+'邨碁℃・俄・繧ｿ繝・・縺ｧ蛛懈ｭ｢縺励※險倬鹸');
  }catch(e){}
}

// timerIsRunning莠呈鋤・・tore.js縺ｨ縺ｮ讖区ｸ｡縺暦ｼ・function startTimerDisplay(){}
function stopTimerDisplay(){}

function updateTodayPlanActual(subj,durMs) {
  const plan=getTodayPlan();if(!plan)return;
  const item=plan.items.find(it=>it.subj===subj);
  if(item){item.actualMinutes+=Math.floor(durMs/60000);saveTodayPlan(plan.items);}
}

// ============================================================
// CALENDAR
// ============================================================

function renderCalendar() {
  const year=currentCalDate.getFullYear(),month=currentCalDate.getMonth();
  const monthStr=`${year}蟷ｴ${month+1}譛・;

  // 莠亥ｮ壻ｸ隕ｧ・磯∈謚樊律・・  let evListHtml='';
  if(selectedCalDate){
    const dp=selectedCalDate.split('-');
    const selEvs=(S.events||[]).filter(e=>e.date===selectedCalDate);
    const selMs=(S.sessions||[]).filter(s=>localDateStr(new Date(s.ts))===selectedCalDate).reduce((a,s)=>a+s.dur,0);
    const load=calcLoad(selectedCalDate);
    const loadColor=load>=8?'var(--bad)':load>=4?'var(--warn)':'var(--ok)';

    evListHtml=`<div class="card mt-8">
      <div class="flex justify-between items-center mb-8">
        <div class="section-label" style="margin:0">${dp[0]}蟷ｴ${+dp[1]}譛・{+dp[2]}譌･</div>
      </div>
      ${selMs>0?`<div style="font-size:12px;color:var(--accent-soft);margin-bottom:8px">蟄ｦ鄙・ ${formatMsShort(selMs)} ﾂｷ 雋闕ｷ: <span style="color:${loadColor}">${load}</span></div>`:''}
      ${selEvs.length
        ? selEvs.map(e=>{
            const ri=S.events.indexOf(e),done=!!e.done,color=getSubjectColor(e.subj);
            return `<div class="event-item" style="opacity:${done?0.55:1};margin-bottom:6px">
              <div class="event-bar" style="background:${done?'#444':color}"></div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:700;${done?'text-decoration:line-through;color:var(--text-muted)':''};overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${sanitize(e.title)}</div>
                <div style="font-size:11px;color:var(--text-muted)">${sanitize(e.subj)} ﾂｷ 雋闕ｷ${e.load||1}</div>
              </div>
              <div class="flex gap-6" style="flex-shrink:0">
                <button class="btn ${done?'btn-ghost':'btn-primary'} btn-sm" onclick="toggleCalEventDone(${ri})">${done?'竊ｩ':'笨・}</button>
                <button class="btn btn-ghost btn-sm" onclick="editCalEvent(${ri})">笨・/button>
                <button class="btn btn-danger btn-sm" onclick="deleteCalEvent(${ri})">笨・/button>
              </div>
            </div>`;
          }).join('')
        : '<div style="font-size:12px;color:var(--text-muted)">莠亥ｮ壹↑縺・/div>'}
    </div>`;
  }

  return `<div class="page-header">
    <div style="display:flex;align-items:center;gap:8px">
      <button class="btn btn-ghost btn-sm" onclick="navigateTo('study')">竊・謌ｻ繧・/button>
      <div class="page-title" style="font-size:18px">繧ｫ繝ｬ繝ｳ繝繝ｼ</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-ghost btn-sm" onclick="calNav(-1)">窶ｹ</button>
      <span style="font-size:13px;font-weight:700;color:var(--text-primary)">${monthStr}</span>
      <button class="btn btn-ghost btn-sm" onclick="calNav(1)">窶ｺ</button>
      <button class="btn btn-primary btn-sm" onclick="openCalEventModal()">・・/button>
    </div>
  </div>
  <div class="card" style="padding:10px">
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:3px">
      <div style="text-align:center;font-size:10px;font-weight:700;padding:3px 0;color:#e24b4a">譌･</div>
      <div style="text-align:center;font-size:10px;font-weight:700;padding:3px 0;color:var(--text-muted)">譛・/div>
      <div style="text-align:center;font-size:10px;font-weight:700;padding:3px 0;color:var(--text-muted)">轣ｫ</div>
      <div style="text-align:center;font-size:10px;font-weight:700;padding:3px 0;color:var(--text-muted)">豌ｴ</div>
      <div style="text-align:center;font-size:10px;font-weight:700;padding:3px 0;color:var(--text-muted)">譛ｨ</div>
      <div style="text-align:center;font-size:10px;font-weight:700;padding:3px 0;color:var(--text-muted)">驥・/div>
      <div style="text-align:center;font-size:10px;font-weight:700;padding:3px 0;color:#76c0ea">蝨・/div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px" id="calendar-grid"></div>
  </div>
  ${evListHtml}`;
}

function calcLoad(ds){
  const evLoad=(S.events||[]).filter(e=>e.date===ds).reduce((a,e)=>a+(e.load||1),0);
  const sesLoad=Math.round((S.sessions||[]).filter(s=>localDateStr(new Date(s.ts))===ds).reduce((a,s)=>a+s.dur,0)/900000);
  return evLoad+sesLoad;
}

function calNav(delta) {
  currentCalDate=new Date(currentCalDate.getFullYear(),currentCalDate.getMonth()+delta,1);
  navigateTo('calendar');
}

function renderCalendarGrid() {
  const grid=document.getElementById('calendar-grid');if(!grid)return;
  const year=currentCalDate.getFullYear(),month=currentCalDate.getMonth();
  const todayStr=today(),daysInMonth=new Date(year,month+1,0).getDate();
  const firstDow=new Date(year,month,1).getDay(); // 0=譌･

  let html='';
  for(let i=0;i<firstDow;i++){
    const d=new Date(year,month,-firstDow+i+1);
    html+=`<div style="min-height:46px;border-radius:6px;opacity:0.3;padding:3px 2px"><span style="font-size:12px;font-weight:700">${d.getDate()}</span></div>`;
  }

  for(let d=1;d<=daysInMonth;d++){
    const ds=`${year}-${pad(month+1)}-${pad(d)}`;
    const isToday=ds===todayStr,isSel=ds===selectedCalDate;
    const evs=(S.events||[]).filter(e=>e.date===ds);
    const sessMs=(S.sessions||[]).filter(s=>s.dur>0&&localDateStr(new Date(s.ts))===ds).reduce((a,s)=>a+s.dur,0);
    const load=calcLoad(ds),incomplete=evs.filter(e=>!e.done).length;

    let bg='',border='',textColor='var(--text-secondary)';
    if(isToday){bg='background:var(--accent-strong);';textColor='#0d1117';}
    else if(isSel){border='border:1.5px solid var(--accent-soft);background:var(--accent-bg);';}

    const mini=[];
    if(sessMs>0){
      const hh=Math.floor(sessMs/3600000),mm=Math.floor((sessMs%3600000)/60000);
      mini.push(`<div style="font-size:8px;color:${isToday?'rgba(13,17,23,.7)':'var(--accent-soft)'};">${hh>0?hh+'h':''}${mm}m</div>`);
    }
    if(load>0)mini.push(`<div style="font-size:8px;color:${isToday?'rgba(13,17,23,.7)':load>=8?'var(--bad)':load>=4?'var(--warn)':'var(--ok)'};">雋${load}</div>`);
    if(incomplete>0)mini.push(`<div style="font-size:8px;color:${isToday?'rgba(13,17,23,.7)':'var(--warn)'};">笆｡${incomplete}</div>`);

    html+=`<div onclick="selectCalDate('${ds}')" style="min-height:46px;border-radius:6px;padding:3px 2px;cursor:pointer;${bg}${border}color:${textColor}">
      <div style="font-size:12px;font-weight:700">${d}</div>
      ${mini.join('')}
    </div>`;
  }
  grid.innerHTML=html;
}

function selectCalDate(ds) {
  selectedCalDate=ds;
  // 蜊ｳ譎ょ渚譏・壹げ繝ｪ繝・ラ縺縺大・謠冗判縺励※繝ｪ繧ｹ繝磯Κ蛻・ｒ譖ｴ譁ｰ
  renderCalendarGrid();
  // 莠亥ｮ壻ｸ隕ｧ繧貞叉譎よ峩譁ｰ
  const container=document.getElementById('main-content');
  if(container){
    container.innerHTML=renderCalendar();
    setTimeout(()=>renderCalendarGrid(),10);
  }
}

function openCalEventModal() {
  editEventIndex=-1;
  document.getElementById('modal-event-title').textContent='莠亥ｮ壹ｒ霑ｽ蜉';
  document.getElementById('input-event-title').value='';
  document.getElementById('input-event-date').value=selectedCalDate||today();
  document.getElementById('input-event-load').value=2;
  document.getElementById('input-event-load-display').textContent=2;
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
  document.getElementById('modal-event-title').textContent='莠亥ｮ壹ｒ邱ｨ髮・;
  document.getElementById('input-event-title').value=ev.title||'';
  document.getElementById('input-event-date').value=ev.date||today();
  document.getElementById('input-event-load').value=ev.load||2;
  document.getElementById('input-event-load-display').textContent=ev.load||2;
  fillSubjectSelects();
  document.getElementById('input-event-subject').value=ev.subj||'';
  openModal('modal-event');
}

function deleteCalEvent(idx){
  if(!confirm('縺薙・莠亥ｮ壹ｒ蜑企勁縺励∪縺吶°・・))return;
  S.events.splice(idx,1);saveState();showToast('蜑企勁縺励∪縺励◆');
  selectCalDate(selectedCalDate);
}

let editEventIndex=-1;
function saveEvent(){
  const title=document.getElementById('input-event-title').value.trim();
  const date=document.getElementById('input-event-date').value;
  const subj=document.getElementById('input-event-subject').value;
  const load=parseInt(document.getElementById('input-event-load').value)||2;
  if(!title){showToast('繧ｿ繧､繝医Ν繧貞・蜉帙＠縺ｦ縺上□縺輔＞');return;}
  if(!date){showToast('譌･莉倥ｒ驕ｸ謚槭＠縺ｦ縺上□縺輔＞');return;}
  const ev={id:generateId(),title:sanitize(title),date,subj,load,done:false};
  if(editEventIndex>=0){
    S.events[editEventIndex]=Object.assign({},S.events[editEventIndex],ev);editEventIndex=-1;
  }else{S.events=S.events||[];S.events.push(ev);}
  saveState();closeModal('modal-event');
  document.getElementById('input-event-title').value='';
  showToast('莠亥ｮ壹ｒ菫晏ｭ倥＠縺ｾ縺励◆');
  selectedCalDate=date;
  selectCalDate(date);
}

// ============================================================
// STUDY LOG 窶・蜀・げ繝ｩ繝輔・縺ｿ
// ============================================================

function renderStudyLog(){
  const tabs=[{k:'day',l:'譌･蛻･'},{k:'week',l:'騾ｱ蛻･'},{k:'month',l:'譛亥挨'},{k:'year',l:'蟷ｴ蛻･'}];
  const tabsHtml=tabs.map(t=>`<button class="page-tab ${t.k===studyLogTab?'active':''}"
    onclick="studyLogTab='${t.k}';navigateTo('study-log')">${t.l}</button>`).join('');
  return `<div class="page-header">
    <div style="display:flex;align-items:center;gap:8px">
      <button class="btn btn-ghost btn-sm" onclick="navigateTo('study')">竊・謌ｻ繧・/button>
      <div class="page-title" style="font-size:18px">蜍牙ｼｷ譎る俣</div>
    </div>
  </div>
  <div class="page-tabs">${tabsHtml}</div>
  <div id="study-log-content"></div>`;
}

function renderStudyLogCharts(){
  const container=document.getElementById('study-log-content');if(!container)return;
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
    container.innerHTML='<div style="text-align:center;padding:32px;color:var(--text-muted);font-size:13px">險倬鹸縺後≠繧翫∪縺帙ｓ</div>';return;
  }

  const totalAll=keys.reduce((a,k)=>a+groups[k].total,0);
  const avgMs=keys.length?Math.round(totalAll/keys.length):0;
  const unitLabel={day:'譌･謨ｰ',week:'騾ｱ謨ｰ',month:'譛域焚',year:'蟷ｴ謨ｰ'}[studyLogTab];

  const summaryHtml=`<div class="card"><div class="stats-row">
    <div class="stat-card"><div class="stat-val" style="font-size:16px">${formatMsShort(totalAll)}</div><div class="stat-lbl">蜷郁ｨ・/div></div>
    <div class="stat-card"><div class="stat-val">${keys.length}</div><div class="stat-lbl">${unitLabel}</div></div>
    <div class="stat-card"><div class="stat-val" style="font-size:16px">${keys.length?formatMsShort(avgMs):'竏・}</div><div class="stat-lbl">蟷ｳ蝮・/div></div>
  </div></div>`;

  const blocksHtml=keys.map(k=>{
    const g=groups[k];
    const tot=Object.values(g.subj).reduce((a,b)=>a+b,0)||1;
    const entries=Object.entries(g.subj).sort((a,b)=>b[1]-a[1]);
    const cid='slpie'+(_trendCID++);

    const legendHtml=entries.map(([subj,ms])=>{
      const pct=Math.round(ms/tot*100),color=getSubjectColor(subj);
      return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
        <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></div>
        <div style="font-size:11px;font-weight:700;flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:${color}">${sanitize(subj)}</div>
        <div style="font-size:11px;color:var(--text-muted);white-space:nowrap">${formatMsShortSec(ms)}</div>
        <div style="font-size:11px;font-weight:800;color:var(--accent-strong);width:32px;text-align:right">${pct}%</div>
      </div>`;
    }).join('');

    // 蜀・げ繝ｩ繝墓緒逕ｻ
    (function(cid,entries,tot){
      requestAnimationFrame(()=>setTimeout(()=>{
        const cv=document.getElementById(cid);if(!cv)return;
        const dpr=window.devicePixelRatio||1,S_=90;
        cv.width=S_*dpr;cv.height=S_*dpr;cv.style.width=S_+'px';cv.style.height=S_+'px';
        const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
        const cx=S_/2,cy=S_/2,R=S_/2-3,inner=R*0.55;
        let angle=-Math.PI/2;
        entries.forEach(([subj,ms])=>{
          const sweep=(ms/tot)*Math.PI*2;
          ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,R,angle,angle+sweep);ctx.closePath();
          ctx.fillStyle=getSubjectColor(subj);ctx.fill();
          ctx.strokeStyle='#0d1117';ctx.lineWidth=1;ctx.stroke();
          angle+=sweep;
        });
        ctx.beginPath();ctx.arc(cx,cy,inner,0,Math.PI*2);ctx.fillStyle='#161b22';ctx.fill();
        const th=Math.floor(tot/3600000),tm=Math.floor((tot%3600000)/60000);
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillStyle='#fff';ctx.font=`bold 10px sans-serif`;ctx.fillText(`${th}h${pad(tm)}m`,cx,cy-4);
        ctx.fillStyle='#8b949e';ctx.font='8px sans-serif';ctx.fillText(fmtLogKey(k),cx,cy+6);
      },20));
    })(cid,entries,tot);

    return `<div class="card">
      <div class="flex justify-between items-center mb-10">
        <div style="font-size:13px;font-weight:800">${fmtLogKey(k)}</div>
        <div style="font-size:17px;font-weight:800;color:var(--accent-strong)">${formatMsShort(g.total)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        <canvas id="${cid}" width="90" height="90" style="width:90px;height:90px;flex-shrink:0"></canvas>
        <div style="flex:1;min-width:120px">${legendHtml}</div>
      </div>
    </div>`;
  }).join('');

  container.innerHTML=summaryHtml+blocksHtml;
}

function fmtLogKey(k){
  if(studyLogTab==='day'){const p=k.split('-');return `${p[0]}蟷ｴ${+p[1]}譛・{+p[2]}譌･`;}
  if(studyLogTab==='week'){const ws=new Date(k+'T00:00:00'),we=new Date(ws);we.setDate(ws.getDate()+6);return `${ws.getMonth()+1}/${ws.getDate()}縲・{we.getMonth()+1}/${we.getDate()}`;}
  if(studyLogTab==='month'){const p=k.split('-');return `${p[0]}蟷ｴ${+p[1]}譛・;}
  return k+'蟷ｴ';
}