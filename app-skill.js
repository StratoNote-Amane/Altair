// ============================================================
// app-grades.js
// 萓晏ｭ・ config.js, store.js, badges.js, app-core.js
// 雋ｬ蜍・ 繝・せ繝亥・譫撰ｼ郁､・焚謨咏ｧ代・遞ｮ蛻･蛻･繝医Ξ繝ｳ繝会ｼ峨・螳溽ｸｾ
// ============================================================

let testAnalysisType = '蜈ｨ縺ｦ';
let editTestIndex    = -1;
let tempTest         = null;
let tempTestSubjects = [];

// ============================================================
// GRADES HUB
// ============================================================

function renderGradesHub() {
  const nc = (page, title, sub) => `<div onclick="navigateTo('${page}')" class="card"
    style="cursor:pointer;display:flex;align-items:center;gap:14px;padding:16px">
    <div style="flex:1"><div style="font-size:15px;font-weight:800">${title}</div>
    <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${sub}</div></div>
    <span style="color:var(--accent-soft);font-size:20px">窶ｺ</span></div>`;
  return `<div class="page-header"><div class="page-title">謌千ｸｾ</div></div>
    ${nc('test-analysis','繝・せ繝亥・譫・,`${(S.rounds||[]).length}莉ｶ險倬鹸貂医∩`)}
    ${nc('badges','螳溽ｸｾ',`${S.earnedBadges.length}/${BADGE_DEFS.length} 隗｣髯､貂・)}`;
}

// ============================================================
// TEST ANALYSIS 窶・蠑ｷ蛹也沿
// ============================================================

function renderTestAnalysis() {
  const allTypes = [...new Set((S.rounds||[]).map(r => r.type||'縺昴・莉・))];
  if (!allTypes.length) allTypes.push('閠・渊');
  if (!allTypes.includes(testAnalysisType)) testAnalysisType = allTypes[0];

  const tabsHtml = allTypes.map(t =>
    `<button class="page-tab ${t===testAnalysisType?'active':''}"
      onclick="testAnalysisType='${sanitize(t)}';navigateTo('test-analysis')">${sanitize(t)}</button>`
  ).join('');

  const rounds = (S.rounds||[])
    .filter(r => testAnalysisType==='蜈ｨ縺ｦ' || (r.type||'縺昴・莉・)===testAnalysisType)
    .sort((a,b) => a.date.localeCompare(b.date));

  // 繧ｵ繝槭Μ繝ｼ邨ｱ險・  let summaryHtml = '';
  if (rounds.length > 0) {
    const avgs   = rounds.map(r => calcRoundAvg(r));
    const avgAll = avgs.length ? Math.round(avgs.reduce((a,b)=>a+b,0)/avgs.length) : 0;
    const maxAvg = Math.max(...avgs);
    const minAvg = Math.min(...avgs);
    const latest = rounds[rounds.length-1];
    const latestAvg = calcRoundAvg(latest);
    const trend = rounds.length >= 2 ? latestAvg - calcRoundAvg(rounds[rounds.length-2]) : 0;
    const trendColor = trend > 0 ? 'var(--ok)' : trend < 0 ? 'var(--bad)' : 'var(--text-muted)';
    const trendStr = trend > 0 ? `笆ｲ +${trend}` : trend < 0 ? `笆ｼ ${trend}` : `竊・0`;
    summaryHtml = `<div class="card">
      <div class="section-label">繧ｵ繝槭Μ繝ｼ・・{testAnalysisType}・・/div>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-val">${avgAll}<span class="stat-val-unit">%</span></div><div class="stat-lbl">蜈ｨ菴灘ｹｳ蝮・/div></div>
        <div class="stat-card"><div class="stat-val" style="color:var(--ok)">${maxAvg}<span class="stat-val-unit">%</span></div><div class="stat-lbl">譛鬮・/div></div>
        <div class="stat-card"><div class="stat-val" style="color:${trendColor};font-size:16px">${trendStr}</div><div class="stat-lbl">逶ｴ霑第耳遘ｻ</div></div>
      </div>
    </div>`;
  }

  // 蟷ｳ蝮・耳遘ｻ繧ｰ繝ｩ繝・  const avgChartHtml = rounds.length >= 2 ? `<div class="card">
    <div class="section-label">蟷ｳ蝮・せ謗ｨ遘ｻ</div>
    <canvas id="avg-trend-chart" style="width:100%;height:120px;display:block" height="120"></canvas>
    <div id="avg-trend-labels" style="display:flex;margin-top:4px"></div>
  </div>` : '';

  // 謨咏ｧ大挨繝医Ξ繝ｳ繝峨げ繝ｩ繝・  const subjChartHtml = rounds.length >= 2 ? `<div class="card">
    <div class="section-label">謨咏ｧ大挨轤ｹ謨ｰ謗ｨ遘ｻ</div>
    <canvas id="subj-trend-chart" style="width:100%;height:140px;display:block;cursor:pointer" height="140"></canvas>
    <div id="subj-trend-labels" style="display:flex;margin-top:4px"></div>
    <div id="subj-legend" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px"></div>
  </div>` : '';

  // 蜷・屓荳隕ｧ・域眠縺励＞鬆・ｼ・  const listHtml = rounds.length
    ? [...rounds].reverse().map((r, ri) => {
        const realIdx = S.rounds.indexOf(r);
        const avg     = calcRoundAvg(r);
        const avgColor= avg>=80?'var(--ok)':avg>=60?'var(--warn)':'var(--bad)';
        const bid     = 'tb'+ri;
        const scoreRows = Object.entries(r.scores||{}).map(([subj,sc]) => {
          const pct    = calcSubjPct(sc);
          const sColor = pct>=80?'var(--ok)':pct>=60?'var(--warn)':'var(--bad)';
          const sc2    = getSubjectColor(subj);
          return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <div style="font-size:12px;font-weight:800;color:${sc2};width:52px;flex-shrink:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${sanitize(subj)}</div>
            <div style="flex:1;height:10px;background:var(--bg-border);border-radius:5px;overflow:hidden">
              <div style="height:100%;border-radius:5px;background:${sColor};width:${pct}%;transition:width .4s" data-pct="${pct}"></div>
            </div>
            <div style="font-size:12px;font-weight:800;color:${sColor};width:34px;text-align:right">${pct}%</div>
            <div style="font-size:10px;color:var(--text-muted);width:48px;text-align:right">${sc.score}/${sc.max}</div>
            ${sc.dev!=null?`<div style="font-size:9px;color:var(--text-muted);width:40px;text-align:right">蛛・{sc.dev}</div>`:''}
          </div>`;
        }).join('');
        return `<div class="accordion">
          <div class="accordion-header" onclick="toggleAccordion('${bid}')">
            <div style="flex:1;min-width:0">
              <div class="accordion-title" style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${sanitize(r.name)}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${r.date} ﾂｷ ${r.type||''}</div>
            </div>
            <div class="flex items-center gap-8" style="flex-shrink:0">
              <span style="font-weight:800;color:${avgColor}">${avg}%</span>
              <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openEditTest(${realIdx})" style="padding:3px 8px">笨・/button>
              <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteTest(${realIdx})" style="padding:3px 8px">笨・/button>
            </div>
          </div>
          <div class="accordion-body" id="${bid}">${scoreRows}</div>
        </div>`;
      }).join('')
    : '<div class="card"><div style="font-size:13px;color:var(--text-muted);text-align:center;padding:16px">繝・せ繝医ｒ霑ｽ蜉縺励※縺上□縺輔＞</div></div>';

  return `<div class="page-header">
    <div style="display:flex;align-items:center;gap:8px">
      <button class="btn btn-ghost btn-sm" onclick="navigateTo('grades')">竊・謌ｻ繧・/button>
      <div class="page-title" style="font-size:18px">繝・せ繝亥・譫・/div>
    </div>
    <button class="btn btn-primary btn-sm" onclick="openAddTest()">・・霑ｽ蜉</button>
  </div>
  <div class="page-tabs" style="overflow-x:auto;white-space:nowrap;display:flex;gap:6px;padding-bottom:4px">${tabsHtml}</div>
  ${summaryHtml}
  ${avgChartHtml}
  ${subjChartHtml}
  ${listHtml}`;
}

function renderTestChart() {
  const rounds = (S.rounds||[])
    .filter(r => testAnalysisType==='蜈ｨ縺ｦ'||(r.type||'縺昴・莉・)===testAnalysisType)
    .sort((a,b) => a.date.localeCompare(b.date));
  if (rounds.length < 2) return;

  const allDates = rounds.map(r => r.date);
  const dpr = window.devicePixelRatio || 1;

  // 蟷ｳ蝮・耳遘ｻ繝√Ε繝ｼ繝・  requestAnimationFrame(() => {
    const cv = document.getElementById('avg-trend-chart'); if (!cv) return;
    const W = cv.offsetWidth||300, H = 120;
    cv.width=W*dpr; cv.height=H*dpr; cv.style.width=W+'px'; cv.style.height=H+'px';
    const ctx=cv.getContext('2d'); ctx.scale(dpr,dpr);
    const avgs = rounds.map(r => calcRoundAvg(r));
    const pd={t:16,r:12,b:24,l:32}, gW=W-pd.l-pd.r, gH=H-pd.t-pd.b;
    ctx.fillStyle='#161b22'; ctx.fillRect(0,0,W,H);
    [0,25,50,75,100].forEach(v=>{
      const y=pd.t+gH-(v/100*gH);
      ctx.strokeStyle='#21262d';ctx.lineWidth=0.5;
      ctx.beginPath();ctx.moveTo(pd.l,y);ctx.lineTo(W-pd.r,y);ctx.stroke();
      ctx.fillStyle='#8b949e';ctx.font='9px sans-serif';ctx.textAlign='right';
      ctx.fillText(v,pd.l-3,y+3);
    });
    const pts=avgs.map((v,i)=>({x:pd.l+(rounds.length>1?i/(rounds.length-1)*gW:gW/2),y:pd.t+gH-(v/100*gH),v}));
    const grad=ctx.createLinearGradient(0,pd.t,0,pd.t+gH);
    grad.addColorStop(0,'rgba(153,216,255,0.3)');grad.addColorStop(1,'rgba(153,216,255,0.02)');
    ctx.beginPath();ctx.moveTo(pts[0].x,pd.t+gH);
    pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.lineTo(pts[pts.length-1].x,pd.t+gH);
    ctx.closePath();ctx.fillStyle=grad;ctx.fill();
    ctx.beginPath();ctx.strokeStyle='#99d8ff';ctx.lineWidth=2;ctx.lineJoin='round';
    pts.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));ctx.stroke();
    pts.forEach(p=>{
      const c=p.v>=80?'var(--ok)':p.v>=60?'var(--warn)':'var(--bad)';
      ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);
      ctx.fillStyle=c;ctx.fill();
    });
    const labelsEl=document.getElementById('avg-trend-labels');
    if(labelsEl)labelsEl.innerHTML=allDates.map(d=>`<div style="flex:1;text-align:center;font-size:9px;color:var(--text-muted);overflow:hidden;white-space:nowrap">${d.slice(5)}</div>`).join('');
  });

  // 謨咏ｧ大挨繝医Ξ繝ｳ繝・  requestAnimationFrame(() => {
    const cv2=document.getElementById('subj-trend-chart'); if(!cv2)return;
    const bySubj={};
    rounds.forEach(r=>{Object.entries(r.scores||{}).forEach(([subj,sc])=>{
      if(!bySubj[subj])bySubj[subj]=[];
      bySubj[subj].push({date:r.date,pct:calcSubjPct(sc)});
    });});
    const subjKeys=Object.keys(bySubj); if(!subjKeys.length)return;
    const W2=cv2.offsetWidth||300, H2=140;
    cv2.width=W2*dpr;cv2.height=H2*dpr;cv2.style.width=W2+'px';cv2.style.height=H2+'px';
    const ctx2=cv2.getContext('2d');ctx2.scale(dpr,dpr);
    const pd={t:16,r:12,b:24,l:32},gW=W2-pd.l-pd.r,gH=H2-pd.t-pd.b;
    ctx2.fillStyle='#161b22';ctx2.fillRect(0,0,W2,H2);
    [0,25,50,75,100].forEach(v=>{
      const y=pd.t+gH-(v/100*gH);
      ctx2.strokeStyle='#21262d';ctx2.lineWidth=0.5;
      ctx2.beginPath();ctx2.moveTo(pd.l,y);ctx2.lineTo(W2-pd.r,y);ctx2.stroke();
      ctx2.fillStyle='#8b949e';ctx2.font='9px sans-serif';ctx2.textAlign='right';
      ctx2.fillText(v,pd.l-3,y+3);
    });
    subjKeys.forEach(subj=>{
      const color=getSubjectColor(subj);
      const pts=allDates.map((d,i)=>{
        const e=bySubj[subj]?.find(x=>x.date===d);if(!e)return null;
        return{x:pd.l+(rounds.length>1?i/(rounds.length-1)*gW:gW/2),y:pd.t+gH-(e.pct/100*gH)};
      }).filter(Boolean);
      if(pts.length<1)return;
      ctx2.strokeStyle=color;ctx2.lineWidth=1.5;ctx2.lineJoin='round';
      ctx2.beginPath();pts.forEach((p,i)=>i===0?ctx2.moveTo(p.x,p.y):ctx2.lineTo(p.x,p.y));ctx2.stroke();
      pts.forEach(p=>{ctx2.beginPath();ctx2.arc(p.x,p.y,3,0,Math.PI*2);ctx2.fillStyle=color;ctx2.fill();});
    });
    const labelsEl2=document.getElementById('subj-trend-labels');
    if(labelsEl2)labelsEl2.innerHTML=allDates.map(d=>`<div style="flex:1;text-align:center;font-size:9px;color:var(--text-muted);overflow:hidden;white-space:nowrap">${d.slice(5)}</div>`).join('');
    const legendEl=document.getElementById('subj-legend');
    if(legendEl)legendEl.innerHTML=subjKeys.map(s=>`<div style="display:flex;align-items:center;gap:4px">
      <div style="width:10px;height:3px;border-radius:2px;background:${getSubjectColor(s)}"></div>
      <span style="font-size:10px;color:var(--text-muted)">${sanitize(s)}</span>
    </div>`).join('');
  });
}

function animateTestBars() {
  document.querySelectorAll('.accordion-body.open [data-pct]').forEach(bar => {
    bar.style.transition='width .5s ease';bar.style.width=bar.getAttribute('data-pct')+'%';
  });
}

function toggleAccordion(id) {
  const el=document.getElementById(id);if(!el)return;
  el.classList.toggle('open');
  if(el.classList.contains('open')){
    setTimeout(()=>{el.querySelectorAll('[data-pct]').forEach(bar=>{
      bar.style.transition='width .5s ease';bar.style.width=bar.getAttribute('data-pct')+'%';
    });},20);
  }
}

function calcRoundAvg(r) {
  const entries=Object.values(r.scores||{});if(!entries.length)return 0;
  const ts=entries.reduce((a,s)=>a+(parseFloat(s.score)||0),0);
  const tm=entries.reduce((a,s)=>a+(parseFloat(s.max)||0),0);
  return tm>0?Math.round(ts/tm*100):0;
}

function calcSubjPct(sc) {
  const score=parseFloat(sc.score)||0,max=parseFloat(sc.max)||0;
  return max>0?Math.round(score/max*100):0;
}

function deleteTest(idx) {
  if(!confirm('縺薙・繝・せ繝郁ｨ倬鹸繧貞炎髯､縺励∪縺吶°・・))return;
  S.rounds.splice(idx,1);saveState();showToast('蜑企勁縺励∪縺励◆');navigateTo('test-analysis');
}

// ============================================================
// 繝・せ繝育匳骭ｲ・・繧ｹ繝・ャ繝暦ｼ・// ============================================================

function openAddTest() {
  editTestIndex=-1;tempTest=null;tempTestSubjects=[];
  document.getElementById('modal-test-title').textContent='繝・せ繝医ｒ霑ｽ蜉';
  document.getElementById('input-test-name').value='';
  document.getElementById('input-test-date').value=today();
  const typeEl=document.getElementById('input-test-type');
  if(typeEl)typeEl.innerHTML=CFG.TEST_TYPES.map(t=>`<option value="${t}">${t}</option>`).join('');
  buildTestSubjectChips();
  openModal('modal-test');
}

function openEditTest(idx) {
  const r=(S.rounds||[])[idx];if(!r)return;
  editTestIndex=idx;tempTest=null;tempTestSubjects=Object.keys(r.scores||{});
  document.getElementById('modal-test-title').textContent='繝・せ繝医ｒ邱ｨ髮・;
  document.getElementById('input-test-name').value=r.name||'';
  document.getElementById('input-test-date').value=r.date||today();
  const typeEl=document.getElementById('input-test-type');
  if(typeEl)typeEl.innerHTML=CFG.TEST_TYPES.map(t=>`<option value="${t}" ${t===(r.type||'')?'selected':''}>${t}</option>`).join('');
  buildTestSubjectChips();
  setTimeout(()=>{
    tempTestSubjects.forEach(s=>{
      document.querySelectorAll('#test-subj-chips .chip').forEach(c=>{
        if(c.getAttribute('data-subj')===s){
          c.classList.add('active');c.style.borderColor=getSubjectColor(s);c.style.color=getSubjectColor(s);
        }
      });
    });
  },50);
  openModal('modal-test');
}

function buildTestSubjectChips() {
  const container=document.getElementById('test-subj-chips');if(!container)return;
  container.innerHTML=getAllSubjects().map(s=>{
    const color=getSubjectColor(s);
    return `<div class="chip" data-subj="${sanitize(s)}" onclick="toggleTestSubject(this,'${sanitize(s)}')">${sanitize(s)}</div>`;
  }).join('');
}

function toggleTestSubject(el,subj) {
  const color=getSubjectColor(subj);
  if(tempTestSubjects.includes(subj)){
    tempTestSubjects=tempTestSubjects.filter(s=>s!==subj);
    el.classList.remove('active');el.style.borderColor='';el.style.color='';
  }else{
    tempTestSubjects.push(subj);el.classList.add('active');
    el.style.borderColor=color;el.style.color=color;
  }
}

function nextTestStep() {
  const name=document.getElementById('input-test-name').value.trim();
  if(!name){showToast('繝・せ繝亥錐繧貞・蜉帙＠縺ｦ縺上□縺輔＞');return;}
  if(!tempTestSubjects.length){showToast('謨咏ｧ代ｒ驕ｸ謚槭＠縺ｦ縺上□縺輔＞');return;}
  const type=document.getElementById('input-test-type')?.value||'';
  const date=document.getElementById('input-test-date').value||today();
  const r=(editTestIndex>=0)?(S.rounds||[])[editTestIndex]:null;
  tempTest={id:r?.id||generateId(),name:sanitize(name),type,date,subjects:[...tempTestSubjects],scores:{}};
  const infoEl=document.getElementById('test-score-info');
  if(infoEl)infoEl.textContent=`${name}・・{type}・・{date}`;
  const inpsEl=document.getElementById('test-score-inputs');
  if(inpsEl){
    inpsEl.innerHTML=tempTestSubjects.map((s,i)=>{
      const color=getSubjectColor(s);
      const prev=r?.scores?.[s];
      return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;padding:8px 10px;background:var(--accent-bg);border-radius:var(--radius-sm);border-left:3px solid ${color}">
        <div style="width:52px;flex-shrink:0;font-size:12px;font-weight:800;color:${color};overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${sanitize(s)}</div>
        <input type="number" id="sc-score-${i}" placeholder="蠕礼せ" value="${prev?.score!=null?prev.score:''}" min="0" inputmode="decimal"
          style="flex:1;text-align:center;background:var(--bg-base);color:var(--text-primary);border:1px solid var(--bg-border);border-radius:7px;padding:7px;font-size:14px">
        <span style="color:var(--text-muted);font-weight:700;flex-shrink:0">/</span>
        <input type="number" id="sc-max-${i}" placeholder="貅轤ｹ" value="${prev?.max!=null?prev.max:100}" min="1" inputmode="decimal"
          style="width:50px;flex-shrink:0;text-align:center;background:var(--bg-base);color:var(--text-primary);border:1px solid var(--bg-border);border-radius:7px;padding:7px;font-size:14px">
        <input type="number" id="sc-dev-${i}" placeholder="蛛丞ｷｮ蛟､" value="${prev?.dev!=null?prev.dev:''}" min="0" max="100" inputmode="decimal"
          style="width:50px;flex-shrink:0;text-align:center;background:var(--bg-base);color:var(--text-muted);border:1px solid var(--bg-border);border-radius:7px;padding:7px;font-size:14px">
      </div>`;
    }).join('');
    const hint=document.getElementById('test-score-hint');
    if(hint)hint.textContent='蠕礼せ / 貅轤ｹ / 蛛丞ｷｮ蛟､・井ｻｻ諢擾ｼ峨・鬆・〒蜈･蜉・;
  }
  closeModal('modal-test');
  document.getElementById('modal-test-score')?.classList.add('open');
}

function saveTestScore() {
  if(!tempTest)return;
  tempTestSubjects.forEach((s,i)=>{
    const score=parseFloat(document.getElementById(`sc-score-${i}`)?.value)||0;
    const max  =parseFloat(document.getElementById(`sc-max-${i}`)?.value)||100;
    const devV =document.getElementById(`sc-dev-${i}`)?.value.trim();
    const dev  =devV?parseFloat(devV):null;
    tempTest.scores[s]={score:isNaN(score)?0:score,max:isNaN(max)?100:max,dev};
  });
  S.rounds=S.rounds||[];
  if(editTestIndex>=0&&editTestIndex<S.rounds.length){
    S.rounds[editTestIndex]=tempTest;editTestIndex=-1;
  }else{S.rounds.push(tempTest);}
  S.rounds.sort((a,b)=>a.date.localeCompare(b.date));
  tempTest=null;tempTestSubjects=[];
  saveState();checkBadges();
  document.getElementById('modal-test-score')?.classList.remove('open');
  showToast('繝・せ繝医ｒ險倬鹸縺励∪縺励◆');navigateTo('test-analysis');
}

// ============================================================
// BADGES
// ============================================================

function renderBadges() {
  const earned=new Set(S.earnedBadges),dates=S.earnedDates||{};
  const total=BADGE_DEFS.length,count=S.earnedBadges.length;
  const pct=total>0?Math.round(count/total*100):0;
  const tierNames=['','Tier 1  隨ｬ荳豁ｩ','Tier 2  螟ｩ逡悟ｭｦ蝨・,'Tier 3  繧ｱ繝・う繧貞鴨縺ｫ','Tier 4  繧ｴ繝ｪ繝ｩ','Tier 5  THE ABSOLUTE IDOL','譛鬮倬屮譏灘ｺｦ'];
  const tierColors=['','#8b949e','#3aaa72','#76c0ea','#e09030','#e24b4a','#e24b4a'];
  let tiersHtml='';
  for(let tier=1;tier<=6;tier++){
    const tb=BADGE_DEFS.filter(b=>b.tier===tier);if(!tb.length)continue;
    const ec=tb.filter(b=>earned.has(b.id)).length;
    tiersHtml+=`<div style="font-size:10px;font-weight:700;color:${tierColors[tier]};margin:14px 0 8px;letter-spacing:.8px">${tierNames[tier]} (${ec}/${tb.length})</div>
      <div class="badge-grid">${tb.map(b=>makeBadgeCard(b,earned,dates,false)).join('')}</div>`;
  }
  const gag=BADGE_DEFS.filter(b=>b.tier===0);
  if(gag.length){
    const eg=gag.filter(b=>earned.has(b.id)).length;
    tiersHtml+=`<div style="font-size:10px;font-weight:700;color:var(--text-muted);margin:14px 0 8px;letter-spacing:.8px">繝阪ち螳溽ｸｾ (${eg}/${gag.length})</div>
      <div class="badge-grid">${gag.map(b=>makeBadgeCard(b,earned,dates,true)).join('')}</div>`;
  }
  return `<div class="page-header">
    <div style="display:flex;align-items:center;gap:8px">
      <button class="btn btn-ghost btn-sm" onclick="navigateTo('grades')">竊・謌ｻ繧・/button>
      <div><div class="page-title" style="font-size:18px">螳溽ｸｾ</div><div class="page-subtitle">${count}/${total} 隗｣髯､貂・/div></div>
    </div>
  </div>
  <div class="card">
    <div class="flex justify-between mb-8"><span style="font-size:12px">驕疲・邇・/span><b style="color:var(--accent-strong)">${pct}%</b></div>
    <div class="bar-track" style="height:8px"><div class="bar-fill" style="width:${pct}%;background:var(--accent-soft)"></div></div>
  </div>
  ${tiersHtml}`;
}

function makeBadgeCard(b,earned,dates,isGag){
  const isEarned=earned.has(b.id);
  const border=isGag&&!isEarned?'border-style:dashed':'';
  const dateHtml=isEarned&&dates[b.id]?`<div style="font-size:9px;color:var(--text-muted);margin-top:3px">${dates[b.id]}</div>`:'';
  const hintHtml=isEarned?(b.hint?`<div class="achievement-hint" style="color:var(--accent-strong)">${b.hint}</div>`:''):(!isGag&&b.hint?`<div class="achievement-hint">庁 ${b.hint}</div>`:`<div class="achievement-hint">???</div>`);
  return `<div class="achievement-card ${isEarned?'earned':''}" style="${border}" onclick="showBadgeDetail('${b.id}')">
    <span class="achievement-icon">${isEarned?b.icon:'?'}</span>
    <div class="achievement-name">${isEarned?sanitize(b.name):'???'}</div>
    ${hintHtml}${dateHtml}
  </div>`;
}

function showBadgeDetail(id){
  const b=BADGE_DEFS.find(x=>x.id===id);if(!b)return;
  const isEarned=S.earnedBadges.includes(b.id),dates=S.earnedDates||{};
  const tierNames=['繝阪ち','Tier 1 隨ｬ荳豁ｩ','Tier 2 螟ｩ逡悟ｭｦ蝨・,'Tier 3 繧ｱ繝・う繧貞鴨縺ｫ','Tier 4 繧ｴ繝ｪ繝ｩ','Tier 5 THE ABSOLUTE IDOL','譛鬮倬屮譏灘ｺｦ'];
  const prev=document.getElementById('badge-detail-overlay');if(prev)prev.remove();
  const overlay=document.createElement('div');
  overlay.id='badge-detail-overlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1100;display:flex;align-items:flex-end;justify-content:center';
  const box=document.createElement('div');
  box.style.cssText='background:var(--bg-card);border-radius:14px 14px 0 0;padding:24px 20px;width:100%;max-width:480px;padding-bottom:calc(20px + var(--safe-bottom));border-top:2px solid var(--accent-soft)';
  box.innerHTML=`<div style="text-align:center">
    <div style="font-size:40px;margin-bottom:8px">${isEarned?b.icon:'?'}</div>
    <div style="font-size:18px;font-weight:800;margin-bottom:4px">${isEarned?sanitize(b.name):'???'}</div>
    <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px">${tierNames[b.tier]||''}</div>
    <div style="font-size:13px;color:var(--text-secondary);line-height:1.7;text-align:left;background:var(--accent-bg);border-radius:10px;padding:12px 14px">
      ${isEarned?(b.hint?'驕疲・譚｡莉ｶ: '+b.hint:'・磯＃謌先擅莉ｶ縺ｯ遘伜ｯ・ｼ・):(b.tier===0?'???':(b.hint?'驕疲・譚｡莉ｶ: '+b.hint:'譚｡莉ｶ繧呈ｺ縺溘☆縺ｨ隗｣髯､縺輔ｌ縺ｾ縺・))}
    </div>
    ${isEarned&&dates[id]?`<div style="margin-top:10px;font-size:11px;color:var(--text-muted)">隗｣髯､譌･: ${dates[id]}</div>`:''}
  </div>
  <button class="btn btn-ghost btn-full mt-16" onclick="document.getElementById('badge-detail-overlay').remove()">髢峨§繧・/button>`;
  overlay.appendChild(box);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}