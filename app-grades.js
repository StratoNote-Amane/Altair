// app-grades.js
// ============================================================

let testAnalysisType = '全て';
let editTestIndex    = -1;
let tempTest         = null;
let tempTestSubjects = [];

function renderGradesHub() {
  const nc = (page, title, sub) => `<div onclick="navigateTo('${page}')" class="card"
    style="cursor:pointer;display:flex;align-items:center;gap:14px;padding:16px">
    <div style="flex:1"><div style="font-size:15px;font-weight:800">${title}</div>
    <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${sub}</div></div>
    <span style="color:var(--accent-soft);font-size:20px">›</span></div>`;
  return `<div class="page-header"><div class="page-title">成績</div></div>
    ${nc('test-analysis','テスト分析',`${(S.rounds||[]).length}件記録済み`)}
    ${nc('badges','実績',`${S.earnedBadges.length}/${BADGE_DEFS.length} 解除済`)}`;
}

// ============================================================
// TEST ANALYSIS
// ============================================================

function renderTestAnalysis() {
  const allTypes = [...new Set((S.rounds||[]).map(r => r.type||'その他'))];
  if (!allTypes.length) allTypes.push('考査');
  if (!allTypes.includes(testAnalysisType)) testAnalysisType = allTypes[0];

  const tabsHtml = allTypes.map(t =>
    `<button class="page-tab ${t===testAnalysisType?'active':''}"
      onclick="testAnalysisType='${sanitize(t)}';navigateTo('test-analysis')">${sanitize(t)}</button>`
  ).join('');

  const rounds = (S.rounds||[])
    .filter(r => testAnalysisType==='全て' || (r.type||'その他')===testAnalysisType)
    .sort((a,b) => a.date.localeCompare(b.date));

  let summaryHtml = '';
  if (rounds.length > 0) {
    const avgs   = rounds.map(r => calcRoundAvg(r));
    const avgAll = avgs.length ? Math.round(avgs.reduce((a,b)=>a+b,0)/avgs.length) : 0;
    const maxAvg = Math.max(...avgs);
    const minAvg = Math.min(...avgs);
    const latest = rounds[rounds.length-1];
    const latestAvg = calcRoundAvg(latest);
    const trend = rounds.length >= 2 ? latestAvg - calcRoundAvg(rounds[rounds.length-2]) : 0;
    const trendColor = trend > 0 ? 'var(--ok)' : trend < 0 ? 'var(--bad)' : 'var(--text-muted)';
    const trendStr = trend > 0 ? `▲ +${trend}` : trend < 0 ? `▼ ${trend}` : `→ 0`;
    // 教科別平均と差分析
    const subjAvgMap={};
    const allSubjsInRounds=new Set();
    rounds.forEach(r=>Object.keys(r.scores||{}).forEach(s=>allSubjsInRounds.add(s)));
    allSubjsInRounds.forEach(subj=>{
      let tot=0,cnt=0;
      rounds.forEach(r=>{const sc=r.scores?.[subj];if(sc&&sc.max>0){tot+=sc.score/sc.max*100;cnt++;}});
      if(cnt>0)subjAvgMap[subj]=Math.round(tot/cnt);
    });
    const subjAvgAll=Object.values(subjAvgMap).length?Math.round(Object.values(subjAvgMap).reduce((a,b)=>a+b,0)/Object.values(subjAvgMap).length):0;
    // 平均点・偏差値差分も使った苦手/得意分析
    const subjDiffMap={};
    allSubjsInRounds.forEach(subj=>{
      let diffs=[];
      rounds.forEach(r=>{
        const sc=r.scores?.[subj];
        if(sc){const d=calcSubjDiffFromAvg(sc);if(d!=null)diffs.push(d);}
      });
      if(diffs.length)subjDiffMap[subj]=Math.round(diffs.reduce((a,b)=>a+b,0)/diffs.length);
    });
    const hasDiffData=Object.keys(subjDiffMap).length>0;

    const diffRows=Object.entries(subjAvgMap).sort((a,b)=>a[1]-b[1]).map(([subj,avg])=>{
      const diff=avg-subjAvgAll;
      const rawDiff=subjDiffMap[subj];
      const diffColor=diff>=5?'var(--ok)':diff<=-5?'var(--bad)':'var(--text-muted)';
      const color=getSubjectColor(subj);
      const tag=diff<=-10?'⚠ 要強化':diff>=10?'✓ 得意':'';
      const rawDiffStr=rawDiff!=null?(rawDiff>=0?`+${rawDiff}`:String(rawDiff)):'';
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <div style="font-size:11px;font-weight:700;width:44px;color:${color};flex-shrink:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${sanitize(subj)}</div>
        <div style="flex:1;height:6px;background:var(--bg-border);border-radius:3px;overflow:hidden">
          <div style="height:100%;background:${color};width:${avg}%;border-radius:3px"></div>
        </div>
        <div style="font-size:11px;font-weight:700;color:${color};width:28px;text-align:right;flex-shrink:0">${avg}%</div>
        <div style="font-size:10px;color:${diffColor};width:28px;text-align:right;flex-shrink:0">${diff>=0?'+':''}${diff}</div>
        ${rawDiffStr?`<div style="font-size:9px;color:var(--text-muted);width:28px;text-align:right;flex-shrink:0">${rawDiffStr}</div>`:''}
        ${tag?`<div style="font-size:9px;color:${diffColor};flex-shrink:0">${tag}</div>`:''}
      </div>`;
    }).join('');

    summaryHtml = `<div class="card">
      <div class="section-label">サマリー（${testAnalysisType}）</div>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-val">${avgAll}<span class="stat-val-unit">%</span></div><div class="stat-lbl">全体平均</div></div>
        <div class="stat-card"><div class="stat-val" style="color:var(--ok)">${maxAvg}<span class="stat-val-unit">%</span></div><div class="stat-lbl">最高</div></div>
        <div class="stat-card"><div class="stat-val" style="color:${trendColor};font-size:16px">${trendStr}</div><div class="stat-lbl">直近推移</div></div>
      </div>
      ${diffRows?`<div style="margin-top:10px"><div style="font-size:10px;color:var(--text-muted);margin-bottom:6px">教科別得点率 / 全体平均${subjAvgAll}%との差${hasDiffData?' / 入力された平均・偏差値との差':''} | ±10%で得意/要強化判定</div>${diffRows}</div>`:''}
    </div>`;
  }

  // 文理別
  function isScienceSubj(subj) {
    if (CFG.SUBJECT_SCIENCE[subj] !== undefined) return CFG.SUBJECT_SCIENCE[subj];
    const custom = S.settings?.customSubjects?.[subj];
    if (custom) return custom.isScience;
    return false;
  }
  const scienceSubjs = [], liberalSubjs = [];
  if (rounds.length > 0) {
    const allSubjs = new Set();
    rounds.forEach(r => Object.keys(r.scores||{}).forEach(s => allSubjs.add(s)));
    allSubjs.forEach(s => { if(isScienceSubj(s)) scienceSubjs.push(s); else liberalSubjs.push(s); });
  }
  function calcSubjAvg(subjs) {
    if (!subjs.length || !rounds.length) return null;
    let total = 0, count = 0;
    rounds.forEach(r => {
      subjs.forEach(s => {
        const sc = r.scores?.[s];
        if (sc && sc.max > 0) { total += sc.score / sc.max * 100; count++; }
      });
    });
    return count > 0 ? Math.round(total / count) : null;
  }
  const sciAvg = calcSubjAvg(scienceSubjs), libAvg = calcSubjAvg(liberalSubjs);
  const subjTendencyHtml = (scienceSubjs.length || liberalSubjs.length) ? `<div class="card">
    <div class="section-label">文理別傾向</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div style="background:var(--bg-base);border-radius:var(--radius-sm);padding:12px;border:1px solid #3a9ade33">
        <div style="font-size:10px;font-weight:700;color:#76c0ea;margin-bottom:6px">理系</div>
        ${scienceSubjs.length ? `<div style="font-size:20px;font-weight:800;color:${sciAvg>=80?'var(--ok)':sciAvg>=60?'var(--warn)':'var(--bad)'}">  ${sciAvg!=null?sciAvg+'%':'−'}</div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${scienceSubjs.join('・')}</div>` : '<div style="font-size:11px;color:var(--text-muted)">記録なし</div>'}
      </div>
      <div style="background:var(--bg-base);border-radius:var(--radius-sm);padding:12px;border:1px solid #c084fc33">
        <div style="font-size:10px;font-weight:700;color:#c084fc;margin-bottom:6px">文系</div>
        ${liberalSubjs.length ? `<div style="font-size:20px;font-weight:800;color:${libAvg>=80?'var(--ok)':libAvg>=60?'var(--warn)':'var(--bad)'}">  ${libAvg!=null?libAvg+'%':'−'}</div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${liberalSubjs.join('・')}</div>` : '<div style="font-size:11px;color:var(--text-muted)">記録なし</div>'}
      </div>
    </div>
    ${sciAvg!=null&&libAvg!=null?`<div style="font-size:11px;color:var(--text-muted);margin-top:8px">${sciAvg>libAvg?'📊 理系が得意な傾向です。文系科目の強化を検討してください。':sciAvg<libAvg?'📊 文系が得意な傾向です。理系科目の強化を検討してください。':'📊 文理バランスが取れています。'}</div>`:''}
  </div>` : '';

  const avgChartHtml = '';

  const subjChartHtml = rounds.length >= 2 ? `<div class="card">
    <div class="section-label">教科別点数推移</div>
    <div style="position:relative">
      <canvas id="subj-trend-chart" style="width:100%;height:140px;display:block;cursor:pointer" height="140" onclick="expandChart('subj')"></canvas>
      <div id="chart-tooltip" style="display:none;position:absolute;background:var(--bg-card);border:1px solid var(--accent-border);border-radius:6px;padding:5px 8px;font-size:11px;pointer-events:none;z-index:10"></div>
    </div>
    <div id="subj-trend-labels" style="display:flex;margin-top:4px"></div>
    <div id="subj-legend" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px"></div>
  </div>` : '';

  const listHtml = rounds.length
    ? [...rounds].reverse().map((r, ri) => {
        const realIdx = S.rounds.indexOf(r);
        const avg     = calcRoundAvg(r);
        const avgColor= avg>=80?'var(--ok)':avg>=60?'var(--warn)':'var(--bad)';
        const bid     = 'tb'+ri;
        const scoreRows = Object.entries(r.scores||{}).map(([subj,sc]) => {
          const pct    = calcSubjPct(sc);
          const diff   = calcSubjDiffFromAvg(sc);
          const sColor = pct>=80?'var(--ok)':pct>=60?'var(--warn)':'var(--bad)';
          const sc2    = getSubjectColor(subj);
          const diffStr= diff!=null?(diff>=0?`+${diff}%`:`${diff}%`):'';
          const diffCol= diff!=null?(diff>=0?'var(--ok)':'var(--bad)'):'var(--text-muted)';
          const extra  = sc.avg!=null?`avg${sc.avg}`:sc.dev!=null?`偏${sc.dev}`:'';
          return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
            <div style="font-size:11px;font-weight:800;color:${sc2};width:44px;flex-shrink:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${sanitize(subj)}</div>
            <div style="flex:1;height:8px;background:var(--bg-border);border-radius:4px;overflow:hidden">
              <div style="height:100%;border-radius:4px;background:${sColor};width:${pct}%;transition:width .4s" data-pct="${pct}"></div>
            </div>
            <div style="font-size:11px;font-weight:800;color:${sColor};width:30px;text-align:right">${pct}%</div>
            <div style="font-size:10px;color:var(--text-muted);width:44px;text-align:right">${sc.score}/${sc.max}</div>
            ${extra?`<div style="font-size:9px;color:var(--text-muted);width:36px;text-align:right">${extra}</div>`:''}
            ${diffStr?`<div style="font-size:9px;font-weight:700;color:${diffCol};width:28px;text-align:right">${diffStr}</div>`:''}
          </div>`;
        }).join('');
        return `<div class="accordion">
          <div class="accordion-header" onclick="toggleAccordion('${bid}')">
            <div style="flex:1;min-width:0">
              <div class="accordion-title" style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${sanitize(r.name)}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${r.date} · ${r.type||''}</div>
            </div>
            <div class="flex items-center gap-8" style="flex-shrink:0">
              <span style="font-weight:800;color:${avgColor}">${avg}%</span>
              <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openEditTest(${realIdx})" style="padding:3px 8px">✎</button>
              <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteTest(${realIdx})" style="padding:3px 8px">✕</button>
            </div>
          </div>
          <div class="accordion-body" id="${bid}">${scoreRows}</div>
        </div>`;
      }).join('')
    : '<div class="card"><div style="font-size:13px;color:var(--text-muted);text-align:center;padding:16px">テストを追加してください</div></div>';

  return `<div class="page-header">
    <div style="display:flex;align-items:center;gap:8px">
      <button class="btn btn-ghost btn-sm" onclick="navigateTo('grades')">← 戻る</button>
      <div class="page-title" style="font-size:18px">テスト分析</div>
    </div>
    <button class="btn btn-primary btn-sm" onclick="openAddTest()">＋ 追加</button>
  </div>
  <div class="page-tabs" style="overflow-x:auto;white-space:nowrap;display:flex;gap:6px;padding-bottom:4px">${tabsHtml}</div>
  ${summaryHtml}
  ${subjTendencyHtml}
  ${avgChartHtml}
  ${subjChartHtml}
  ${listHtml}`;
}

// グラフ描画 — スコアレンジを自動調整
function renderTestChart() {
  const rounds = (S.rounds||[])
    .filter(r => testAnalysisType==='全て'||(r.type||'その他')===testAnalysisType)
    .sort((a,b) => a.date.localeCompare(b.date));
  if (rounds.length < 2) return;

  const allDates = rounds.map(r => r.date);
  const dpr = window.devicePixelRatio || 1;
  const avgs = rounds.map(r => calcRoundAvg(r));

  // スコアレンジ自動調整（最小値-10〜最大値+10、5の倍数にスナップ）
  function getRange(values) {
    const minV=Math.min(...values), maxV=Math.max(...values);
    const pad=Math.max(5, Math.round((maxV-minV)*0.15));
    const lo=Math.max(0, Math.floor((minV-pad)/5)*5);
    const hi=Math.min(100, Math.ceil((maxV+pad)/5)*5);
    return {lo, hi};
  }

  // 教科別トレンド
  requestAnimationFrame(() => {
    const cv2=document.getElementById('subj-trend-chart'); if(!cv2)return;
    const bySubj={};
    rounds.forEach((r,ri)=>{Object.entries(r.scores||{}).forEach(([subj,sc])=>{
      if(!bySubj[subj])bySubj[subj]=Array(rounds.length).fill(null);
      bySubj[subj][ri]=calcSubjPct(sc);
    });});
    const subjKeys=Object.keys(bySubj); if(!subjKeys.length)return;
    const allVals=Object.values(bySubj).flat().filter(v=>v!=null);
    const {lo,hi}=getRange(allVals);
    const W2=cv2.offsetWidth||300, H2=140;
    cv2.width=W2*dpr;cv2.height=H2*dpr;cv2.style.width=W2+'px';cv2.style.height=H2+'px';
    const ctx2=cv2.getContext('2d');ctx2.scale(dpr,dpr);
    const series=subjKeys.map(s=>({label:s,values:bySubj[s],color:getSubjectColor(s)}));
    drawLineChart(ctx2,W2,H2,rounds,series,lo,hi,dpr);
    const labelsEl2=document.getElementById('subj-trend-labels');
    if(labelsEl2)labelsEl2.innerHTML=allDates.map(d=>`<div style="flex:1;text-align:center;font-size:9px;color:var(--text-muted);overflow:hidden;white-space:nowrap">${d.slice(5)}</div>`).join('');
    const legendEl=document.getElementById('subj-legend');
    if(legendEl)legendEl.innerHTML=subjKeys.map(s=>`<div style="display:flex;align-items:center;gap:4px">
      <div style="width:10px;height:3px;border-radius:2px;background:${getSubjectColor(s)}"></div>
      <span style="font-size:10px;color:var(--text-muted)">${sanitize(s)}</span>
    </div>`).join('');

    // ホバーで点数詳細表示（修正: bySubjはindex配列なので i で参照）
    const tooltip=document.getElementById('chart-tooltip');
    const allPts2=[];
    const gH2=H2-pd.t-pd.b;
    subjKeys.forEach(subj=>{
      const color=getSubjectColor(subj);
      (bySubj[subj]||[]).forEach((pct,i)=>{
        if(pct==null)return;
        const x=pd.l+(rounds.length>1?i/(rounds.length-1)*gW:gW/2);
        const y=pd.t+gH2-((pct-lo)/Math.max(hi-lo,1)*gH2);
        // 詳細ラベル: 得点/満点 + 平均点/偏差値
        const sc=rounds[i]?.scores?.[subj];
        let detail=`${subj}: ${pct}%`;
        if(sc){
          detail=`${subj}  ${sc.score}/${sc.max}点 (${pct}%)`;
          if(sc.avg!=null)detail+=`  平均${sc.avg}`;
          if(sc.dev!=null)detail+=`  偏差値${sc.dev}`;
        }
        allPts2.push({x,y,label:detail,color});
      });
    });
    cv2.addEventListener('mousemove',ev=>{
      const r=cv2.getBoundingClientRect();
      const mx=(ev.clientX-r.left)*W2/r.width,my=(ev.clientY-r.top)*H2/r.height;
      let closest=null,minD=22;
      allPts2.forEach(p=>{const d=Math.sqrt((p.x-mx)**2+(p.y-my)**2);if(d<minD){minD=d;closest=p;}});
      if(closest&&tooltip){
        tooltip.style.display='block';
        tooltip.innerHTML=`<b style="color:${closest.color}">${closest.label}</b>`;
        const tx=Math.min(closest.x+10,W2-130);
        const ty=Math.max(closest.y-30,0);
        tooltip.style.left=tx+'px';
        tooltip.style.top=ty+'px';
      }else if(tooltip){tooltip.style.display='none';}
    });
    cv2.addEventListener('mouseleave',()=>{if(tooltip)tooltip.style.display='none';});
    cv2.addEventListener('touchmove',ev=>{
      ev.preventDefault();
      const r=cv2.getBoundingClientRect(),t=ev.touches[0];
      const mx=(t.clientX-r.left)*W2/r.width,my=(t.clientY-r.top)*H2/r.height;
      let closest=null,minD=30;
      allPts2.forEach(p=>{const d=Math.sqrt((p.x-mx)**2+(p.y-my)**2);if(d<minD){minD=d;closest=p;}});
      if(closest&&tooltip){
        tooltip.style.display='block';
        tooltip.innerHTML=`<b style="color:${closest.color}">${closest.label}</b>`;
        tooltip.style.left=Math.min(closest.x+10,W2-130)+'px';
        tooltip.style.top=Math.max(closest.y-30,0)+'px';
      }
    },{passive:false});
    cv2.addEventListener('touchend',()=>{if(tooltip)setTimeout(()=>tooltip.style.display='none',1200);});
  });
}

// 汎用折れ線グラフ（スコアレンジ指定可能）
function drawLineChart(ctx, W, H, rounds, series, lo, hi, dpr) {
  const pd={t:16,r:12,b:4,l:32}, gW=W-pd.l-pd.r, gH=H-pd.t-pd.b;
  ctx.fillStyle='#161b22'; ctx.fillRect(0,0,W,H);
  const range=hi-lo||1;
  const yOf=v=>pd.t+gH-((v-lo)/range*gH);
  const xOf=i=>pd.l+(rounds.length>1?i/(rounds.length-1)*gW:gW/2);

  // グリッド線 & Yラベル
  const steps=4;
  for(let i=0;i<=steps;i++){
    const v=lo+Math.round(range/steps*i);
    const y=yOf(v);
    ctx.strokeStyle='#21262d';ctx.lineWidth=0.5;
    ctx.beginPath();ctx.moveTo(pd.l,y);ctx.lineTo(W-pd.r,y);ctx.stroke();
    ctx.fillStyle='#8b949e';ctx.font='9px sans-serif';ctx.textAlign='right';
    ctx.fillText(v,pd.l-3,y+3);
  }

  series.forEach(({values,color})=>{
    const pts=values.map((v,i)=>v!=null?{x:xOf(i),y:yOf(v),v}:null).filter(Boolean);
    if(pts.length<1)return;
    if(pts.length===1){
      ctx.beginPath();ctx.arc(pts[0].x,pts[0].y,4,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
      return;
    }
    // グラデーション塗り
    if(series.length===1){
      const grad=ctx.createLinearGradient(0,pd.t,0,pd.t+gH);
      grad.addColorStop(0,color.replace('#','rgba(')+'33)'.replace('rgba(','rgba(')||'rgba(153,216,255,0.2)');
      grad.addColorStop(1,'rgba(0,0,0,0)');
      try{
        grad.addColorStop(0,'rgba(153,216,255,0.2)');
        ctx.beginPath();ctx.moveTo(pts[0].x,pd.t+gH);
        pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.lineTo(pts[pts.length-1].x,pd.t+gH);
        ctx.closePath();ctx.fillStyle=grad;ctx.fill();
      }catch(e){}
    }
    ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=series.length===1?2:1.5;ctx.lineJoin='round';
    pts.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));ctx.stroke();
    pts.forEach(p=>{
      ctx.beginPath();ctx.arc(p.x,p.y,series.length===1?4:3,0,Math.PI*2);
      ctx.fillStyle=series.length===1?(p.v>=80?'#3aaa72':p.v>=60?'#e09030':'#e24b4a'):color;
      ctx.fill();
    });
  });
}

function expandChart(type) {
  const prev = document.getElementById('chart-expand-overlay'); if (prev) prev.remove();
  const overlay = document.createElement('div');
  overlay.id = 'chart-expand-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px';
  const box = document.createElement('div');
  box.style.cssText = 'background:var(--bg-card);border-radius:14px;padding:16px;width:100%;max-width:520px;border-top:2px solid var(--accent-soft)';
  const titleTxt = type==='avg' ? '平均点推移' : '教科別点数推移';
  const rounds = (S.rounds||[]).filter(r=>testAnalysisType==='全て'||(r.type||'その他')===testAnalysisType).sort((a,b)=>a.date.localeCompare(b.date));
  const allDates = rounds.map(r=>r.date);
  const cid = 'expand-chart-'+Date.now();
  const h = type==='avg' ? 200 : 260;
  box.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
    <div style="font-size:14px;font-weight:800">${titleTxt}</div>
    <button onclick="document.getElementById('chart-expand-overlay').remove()" style="background:none;border:none;color:var(--text-muted);font-size:18px;cursor:pointer">✕</button>
  </div>
  <canvas id="${cid}" style="width:100%;height:${h}px;display:block" height="${h}"></canvas>
  <div style="display:flex;margin-top:4px">${allDates.map(d=>`<div style="flex:1;text-align:center;font-size:9px;color:var(--text-muted);overflow:hidden;white-space:nowrap">${d.slice(5)}</div>`).join('')}</div>
  <div id="expand-legend" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px"></div>`;
  overlay.appendChild(box);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);

  requestAnimationFrame(()=>{
    const cv=document.getElementById(cid);if(!cv)return;
    const dpr=window.devicePixelRatio||1;
    const W=cv.offsetWidth||480;
    cv.width=W*dpr;cv.height=h*dpr;cv.style.width=W+'px';cv.style.height=h+'px';
    const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
    if(type==='avg'){
      const avgs=rounds.map(r=>calcRoundAvg(r));
      const {lo,hi}=getRange2(avgs);
      drawLineChart(ctx,W,h,rounds,[{label:'平均',values:avgs,color:'#99d8ff'}],lo,hi,dpr);
    }else{
      const bySubj={};
      rounds.forEach((r,ri)=>{Object.entries(r.scores||{}).forEach(([subj,sc])=>{
        if(!bySubj[subj])bySubj[subj]=Array(rounds.length).fill(null);
        bySubj[subj][ri]=calcSubjPct(sc);
      });});
      const subjKeys=Object.keys(bySubj);
      const allVals=Object.values(bySubj).flat().filter(v=>v!=null);
      const {lo,hi}=getRange2(allVals);
      const series=subjKeys.map(s=>({label:s,values:bySubj[s],color:getSubjectColor(s)}));
      drawLineChart(ctx,W,h,rounds,series,lo,hi,dpr);
      const leg=document.getElementById('expand-legend');
      if(leg)leg.innerHTML=subjKeys.map(s=>`<div style="display:flex;align-items:center;gap:4px"><div style="width:10px;height:3px;background:${getSubjectColor(s)};border-radius:2px"></div><span style="font-size:10px;color:var(--text-muted)">${sanitize(s)}</span></div>`).join('');
    }
  });
}

function getRange2(values) {
  const minV=Math.min(...values.filter(v=>v!=null)), maxV=Math.max(...values.filter(v=>v!=null));
  const pad=Math.max(5, Math.round((maxV-minV)*0.15));
  return {lo:Math.max(0,Math.floor((minV-pad)/5)*5), hi:Math.min(100,Math.ceil((maxV+pad)/5)*5)};
}
// エイリアス
function getRange(values){return getRange2(values);}

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

function calcSubjDiffFromAvg(sc) {
  // ユーザーが入力した平均点がある場合: (得点-平均点)/満点 の差分率
  if(sc.avg!=null && sc.max>0){
    return Math.round((sc.score - sc.avg) / sc.max * 100);
  }
  // 偏差値がある場合: 50（全体平均）基準の差
  if(sc.dev!=null){
    return Math.round(sc.dev - 50);
  }
  return null;
}

function deleteTest(idx) {
  if(!confirm('このテスト記録を削除しますか？'))return;
  S.rounds.splice(idx,1);saveState();showToast('削除しました');navigateTo('test-analysis');
}

// ============================================================
// テスト登録（偏差値 or 平均点選択）
// ============================================================

function openAddTest() {
  editTestIndex=-1;tempTest=null;tempTestSubjects=[];
  document.getElementById('modal-test-title').textContent='テストを追加';
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
  document.getElementById('modal-test-title').textContent='テストを編集';
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

// 入力モード: 'pct'(得点/満点) or 'dev'(偏差値)
let testInputMode = 'score_avg';

function nextTestStep() {
  const name=document.getElementById('input-test-name').value.trim();
  if(!name){showToast('テスト名を入力してください');return;}
  if(!tempTestSubjects.length){showToast('教科を選択してください');return;}
  const type=document.getElementById('input-test-type')?.value||'';
  const date=document.getElementById('input-test-date').value||today();
  const r=(editTestIndex>=0)?(S.rounds||[])[editTestIndex]:null;
  tempTest={id:r?.id||generateId(),name:sanitize(name),type,date,subjects:[...tempTestSubjects],scores:{}};
  const infoEl=document.getElementById('test-score-info');
  if(infoEl)infoEl.textContent=`${name}（${type}）${date}`;

  const inpsEl=document.getElementById('test-score-inputs');
  if(inpsEl){
    // 入力モード切替ボタン
    // モード: 'score_avg'=得点+平均点, 'score_dev'=得点+偏差値
    const modeToggle=`<div style="display:flex;gap:8px;margin-bottom:12px">
      <button class="btn ${testInputMode==='score_avg'?'btn-primary':'btn-ghost'} btn-sm" onclick="setTestInputMode('score_avg')">得点＋平均点</button>
      <button class="btn ${testInputMode==='score_dev'?'btn-primary':'btn-ghost'} btn-sm" onclick="setTestInputMode('score_dev')">得点＋偏差値</button>
    </div>`;

    inpsEl.innerHTML=modeToggle+tempTestSubjects.map((s,i)=>{
      const color=getSubjectColor(s);
      const prev=r?.scores?.[s];
      if(testInputMode==='score_dev'){
        return `<div style="display:flex;align-items:center;gap:5px;margin-bottom:10px;padding:8px 10px;background:var(--accent-bg);border-radius:var(--radius-sm);border-left:3px solid ${color}">
          <div style="width:44px;flex-shrink:0;font-size:11px;font-weight:800;color:${color};overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${sanitize(s)}</div>
          <input type="number" id="sc-score-${i}" placeholder="得点*" value="${prev?.score!=null?prev.score:''}" min="0" inputmode="decimal" required
            style="flex:1;text-align:center;background:var(--bg-base);color:var(--text-primary);border:1px solid var(--accent-border);border-radius:7px;padding:6px;font-size:13px">
          <span style="color:var(--text-muted);font-weight:700;flex-shrink:0">/</span>
          <input type="number" id="sc-max-${i}" placeholder="満点*" value="${prev?.max!=null?prev.max:100}" min="1" inputmode="decimal" required
            style="width:50px;flex-shrink:0;text-align:center;background:var(--bg-base);color:var(--text-primary);border:1px solid var(--accent-border);border-radius:7px;padding:6px;font-size:13px">
          <input type="number" id="sc-dev-${i}" placeholder="偏差値" value="${prev?.dev!=null?prev.dev:''}" min="0" max="100" inputmode="decimal"
            style="width:48px;flex-shrink:0;text-align:center;background:var(--bg-base);color:var(--text-muted);border:1px solid var(--bg-border);border-radius:7px;padding:6px;font-size:13px">
        </div>`;
      }
      // score_avg モード: 得点+満点+平均点
      return `<div style="display:flex;align-items:center;gap:5px;margin-bottom:10px;padding:8px 10px;background:var(--accent-bg);border-radius:var(--radius-sm);border-left:3px solid ${color}">
        <div style="width:44px;flex-shrink:0;font-size:11px;font-weight:800;color:${color};overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${sanitize(s)}</div>
        <input type="number" id="sc-score-${i}" placeholder="得点*" value="${prev?.score!=null?prev.score:''}" min="0" inputmode="decimal" required
          style="flex:1;text-align:center;background:var(--bg-base);color:var(--text-primary);border:1px solid var(--accent-border);border-radius:7px;padding:6px;font-size:13px">
        <span style="color:var(--text-muted);font-weight:700;flex-shrink:0">/</span>
        <input type="number" id="sc-max-${i}" placeholder="満点*" value="${prev?.max!=null?prev.max:100}" min="1" inputmode="decimal" required
          style="width:50px;flex-shrink:0;text-align:center;background:var(--bg-base);color:var(--text-primary);border:1px solid var(--accent-border);border-radius:7px;padding:6px;font-size:13px">
        <input type="number" id="sc-avg-${i}" placeholder="平均" value="${prev?.avg!=null?prev.avg:''}" min="0" inputmode="decimal"
          style="width:48px;flex-shrink:0;text-align:center;background:var(--bg-base);color:var(--text-muted);border:1px solid var(--bg-border);border-radius:7px;padding:6px;font-size:13px">
      </div>`;
    }).join('');
    const hint=document.getElementById('test-score-hint');
    if(hint)hint.textContent=testInputMode==='score_dev'?'得点*/満点* は必須。偏差値は任意':'得点*/満点* は必須。平均点は任意（* = 必須）';
  }
  closeModal('modal-test');
  document.getElementById('modal-test-score')?.classList.add('open');
}

function setTestInputMode(mode) {
  testInputMode=mode;
  // nextTestStep を再実行して再描画
  nextTestStep();
  document.getElementById('modal-test-score')?.classList.add('open');
}

function saveTestScore() {
  if(!tempTest)return;
  // 得点・満点は必須
  let hasError=false;
  tempTestSubjects.forEach((s,i)=>{
    const scoreV=document.getElementById(`sc-score-${i}`)?.value.trim();
    const maxV=document.getElementById(`sc-max-${i}`)?.value.trim();
    if(!scoreV||!maxV){showToast(`${s}の得点と満点を入力してください`);hasError=true;}
  });
  if(hasError)return;

  tempTestSubjects.forEach((s,i)=>{
    const score=parseFloat(document.getElementById(`sc-score-${i}`)?.value)||0;
    const max  =parseFloat(document.getElementById(`sc-max-${i}`)?.value)||100;
    if(testInputMode==='score_dev'){
      const devV=document.getElementById(`sc-dev-${i}`)?.value?.trim();
      const dev=devV?parseFloat(devV):null;
      tempTest.scores[s]={score,max,dev};
    }else{
      // score_avg モード
      const avgV=document.getElementById(`sc-avg-${i}`)?.value?.trim();
      const avg=avgV?parseFloat(avgV):null;
      tempTest.scores[s]={score,max,avg};
    }
  });
  S.rounds=S.rounds||[];
  if(editTestIndex>=0&&editTestIndex<S.rounds.length){
    S.rounds[editTestIndex]=tempTest;editTestIndex=-1;
  }else{S.rounds.push(tempTest);}
  S.rounds.sort((a,b)=>a.date.localeCompare(b.date));
  tempTest=null;tempTestSubjects=[];
  saveState();checkBadges();
  document.getElementById('modal-test-score')?.classList.remove('open');
  showToast('テストを記録しました');navigateTo('test-analysis');
}

// ============================================================
// BADGES
// ============================================================

function renderBadges() {
  const earned=new Set(S.earnedBadges),dates=S.earnedDates||{};
  const total=BADGE_DEFS.length,count=S.earnedBadges.length;
  const pct=total>0?Math.round(count/total*100):0;
  const tierNames=['','Tier 1  第一歩','Tier 2  天界学園','Tier 3  ケツイを力に','Tier 4  ゴリラ','Tier 5  THE ABSOLUTE IDOL','最高難易度'];
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
    tiersHtml+=`<div style="font-size:10px;font-weight:700;color:var(--text-muted);margin:14px 0 8px;letter-spacing:.8px">ネタ実績 (${eg}/${gag.length})</div>
      <div class="badge-grid">${gag.map(b=>makeBadgeCard(b,earned,dates,true)).join('')}</div>`;
  }
  return `<div class="page-header">
    <div style="display:flex;align-items:center;gap:8px">
      <button class="btn btn-ghost btn-sm" onclick="navigateTo('grades')">← 戻る</button>
      <div><div class="page-title" style="font-size:18px">実績</div><div class="page-subtitle">${count}/${total} 解除済</div></div>
    </div>
  </div>
  <div class="card">
    <div class="flex justify-between mb-8"><span style="font-size:12px">達成率</span><b style="color:var(--accent-strong)">${pct}%</b></div>
    <div class="bar-track" style="height:8px"><div class="bar-fill" style="width:${pct}%;background:var(--accent-soft)"></div></div>
  </div>
  ${tiersHtml}`;
}

function makeBadgeCard(b,earned,dates,isGag){
  const isEarned=earned.has(b.id);
  const border=isGag&&!isEarned?'border-style:dashed':'';
  const dateHtml=isEarned&&dates[b.id]?`<div style="font-size:9px;color:var(--text-muted);margin-top:3px">${dates[b.id]}</div>`:'';
  const hintHtml=b.hint ? `<div class="achievement-hint" style="color:${isEarned?'var(--accent-strong)':'var(--text-muted)'}">${isEarned?b.hint:'💡 '+b.hint}</div>` : (isGag&&!isEarned?`<div class="achievement-hint">???</div>`:'');
  return `<div class="achievement-card ${isEarned?'earned':''}" style="${border}" onclick="showBadgeDetail('${b.id}')">
    <span class="achievement-icon">${isEarned?b.icon:'?'}</span>
    <div class="achievement-name">${isEarned?sanitize(b.name):'???'}</div>
    ${hintHtml}${dateHtml}
  </div>`;
}

function showBadgeDetail(id){
  const b=BADGE_DEFS.find(x=>x.id===id);if(!b)return;
  const isEarned=S.earnedBadges.includes(b.id),dates=S.earnedDates||{};
  const tierNames=['ネタ','Tier 1 第一歩','Tier 2 天界学園','Tier 3 ケツイを力に','Tier 4 ゴリラ','Tier 5 THE ABSOLUTE IDOL','最高難易度'];
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
      ${isEarned?(b.hint?'達成条件: '+b.hint:'（達成条件は秘密）'):(b.tier===0?'???':(b.hint?'達成条件: '+b.hint:'条件を満たすと解除されます'))}
    </div>
    ${isEarned&&dates[id]?`<div style="margin-top:10px;font-size:11px;color:var(--text-muted)">解除日: ${dates[id]}</div>`:''}
  </div>
  <button class="btn btn-ghost btn-full mt-16" onclick="document.getElementById('badge-detail-overlay').remove()">閉じる</button>`;
  overlay.appendChild(box);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}
