// ── 렌더링 모듈
let chartInstance = null;
let shareChartInstance = null;
let currentChartType = 'asset';

function renderKPIGrid(rows) {
  const r1 = rows[0], r9 = rows[9], r19 = rows[19], r29 = rows[29], r40 = rows[40];
  const totalCumDiv = rows.reduce((a, r) => a + r.totalDiv, 0);
  const capitalGain = r40.sAsset - DEFAULT_PARAMS.schdPrincipal;

  const cards = [
    { label: '초기 월배당 (세후)', val: fw2(r1.monthlyDiv), sub: '만60세 기준', cls: 'c-purple' },
    { label: '10년차 월배당 (세후)', val: fw2(r9.monthlyDiv), sub: '만69세 기준', cls: 'c-blue' },
    { label: '20년차 월배당 (세후)', val: fw2(r19.monthlyDiv), sub: '만79세 기준', cls: 'c-teal' },
    { label: '40년차 월배당 (세후)', val: fw2(r40.monthlyDiv), sub: '만100세 기준', cls: 'c-amber' },
    { label: '가수금 잔액 (현재)', val: r1.loanBal > 0 ? fw2(r1.loanBal) : '완납', sub: '₩11억 → 배당 충당', cls: 'c-red' },
    { label: '40년 누계 배당 (세후)', val: fw2(totalCumDiv), sub: '40년 합산', cls: 'c-green' },
    { label: 'SCHD 최종 자산', val: fw2(r40.sAsset), sub: '만100세 기준', cls: 'c-blue' },
    { label: '법인 기업가치', val: fw2(r40.corpValue), sub: '순자산 PBR 1.0x', cls: 'c-amber' },
    { label: '자녀지분 합계 (80%)', val: fw2(r40.childShare), sub: '3인 합산', cls: 'c-purple' },
    { label: 'SCHD 자본차익', val: fw2(capitalGain), sub: '원금₩10억 대비', cls: 'c-green' },
  ];

  document.getElementById('kpiGrid').innerHTML = cards.map(c => `
    <div class="kpi-card ${c.cls}">
      <div class="kpi-label">${c.label}</div>
      <div class="kpi-value sm">${c.val}</div>
      <div class="kpi-sub">${c.sub}</div>
    </div>
  `).join('');
}

// ── 그라디언트 헬퍼
function makeGrad(ctx, c1, c2, h=300) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, c1); g.addColorStop(1, c2); return g;
}

// ── 범례 HTML
function renderLegend(items) {
  const el = document.getElementById('chartLegend');
  if (!el) return;
  el.innerHTML = items.map(({color, label, dash, type}) => {
    let mark;
    if (type === 'bar') {
      mark = `<span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${color}"></span>`;
    } else if (dash) {
      mark = `<span style="display:inline-block;width:22px;height:0;border-top:2.5px dashed ${color}"></span>`;
    } else {
      mark = `<span style="display:inline-block;width:22px;height:0;border-top:3px solid ${color}"></span>`;
    }
    return `<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#444;margin-right:14px">${mark}${label}</span>`;
  }).join('');
}

function renderChart(rows, type) {
  currentChartType = type;
  const canvas = document.getElementById('mainChart');
  const ctx = canvas.getContext('2d');

  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  // ── 공통 10년 구간 레이블 (60·70·80·90·100)
  const AGE_MILESTONES = [60,65,70,75,80,85,90,95,100];

  if (type === 'asset') {
    // ── 자산 성장: 연대별 그룹 누적 막대 + 법인자산 라인
    const AGE_GROUPS = ['60대','65','70대','75','80대','85','90대','95','100세'];
    const groupRows = AGE_MILESTONES.map(a => rows.find(r => r.age === a));

    const g1 = makeGrad(ctx,'rgba(21,88,160,.85)','rgba(21,88,160,.55)');
    const g2 = makeGrad(ctx,'rgba(13,112,101,.85)','rgba(13,112,101,.55)');
    const g3 = makeGrad(ctx,'rgba(74,58,167,.85)','rgba(74,58,167,.55)');

    renderLegend([
      {color:'#1558A0', label:'SCHD 자산', type:'bar'},
      {color:'#0D7065', label:'TLTW 자산', type:'bar'},
      {color:'#4A3AA7', label:'유보금', type:'bar'},
      {color:'#B5711A', label:'법인 총자산', dash:true, type:'line'},
    ]);

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: AGE_GROUPS,
        datasets: [
          { label: 'SCHD 자산', type:'bar',
            data: groupRows.map(r => r ? +(r.sAsset/1e8).toFixed(1) : 0),
            backgroundColor: g1, borderRadius:4, borderSkipped:false,
            order: 2 },
          { label: 'TLTW 자산', type:'bar',
            data: groupRows.map(r => r ? +(r.tAsset/1e8).toFixed(1) : 0),
            backgroundColor: g2, borderRadius:4, borderSkipped:false,
            order: 2 },
          { label: '유보금', type:'bar',
            data: groupRows.map(r => r ? +(r.reserve/1e8).toFixed(1) : 0),
            backgroundColor: g3, borderRadius:4, borderSkipped:false,
            order: 2 },
          { label: '법인 총자산', type:'line',
            data: groupRows.map(r => r ? +(r.corpAsset/1e8).toFixed(1) : 0),
            borderColor:'#B5711A', backgroundColor:'transparent',
            borderWidth:3, borderDash:[8,4], tension:0.4,
            pointRadius:6, pointBackgroundColor:'#B5711A',
            pointBorderColor:'#fff', pointBorderWidth:2,
            order: 1 },
        ]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        animation:{ duration:900, easing:'easeInOutQuart' },
        scales: {
          x: { stacked:true,
            ticks:{ font:{size:11}, color:'#666' },
            grid:{ display:false } },
          y: { stacked:true,
            ticks:{ font:{size:10}, color:'#888',
              callback: v => v + '억' },
            grid:{ color:'rgba(0,0,0,.05)' },
            border:{ display:false } }
        },
        plugins: {
          legend:{ display:false },
          tooltip:{
            mode:'index', intersect:false,
            backgroundColor:'rgba(0,31,91,.9)',
            titleColor:'#C9A84C', bodyColor:'#fff',
            borderColor:'rgba(201,168,76,.3)', borderWidth:1,
            padding:12, cornerRadius:10,
            callbacks:{
              title: items => `만 ${items[0].label}`,
              label: c => `  ${c.dataset.label}: ${c.parsed.y.toLocaleString()}억원`
            }
          }
        }
      }
    });

  } else if (type === 'dividend') {
    // ── 배당 추이: TLTW=누적막대, SCHD=우상향 라인, 합계=굵은라인
    const labels = rows.map(r => r.age % 5 === 0 ? r.age+'세' : '');

    const barGradT = makeGrad(ctx,'rgba(13,112,101,.75)','rgba(13,112,101,.35)');
    const barGradS = makeGrad(ctx,'rgba(21,88,160,.75)','rgba(21,88,160,.35)');

    renderLegend([
      {color:'#0D7065', label:'TLTW 월배당', type:'bar'},
      {color:'#1558A0', label:'SCHD 월배당', type:'bar'},
      {color:'#B5711A', label:'합계 월배당', dash:false, type:'line'},
      {color:'#A83030', label:'가수금 상환', dash:true, type:'line'},
    ]);

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label:'TLTW 월배당', type:'bar',
            data: rows.map(r => Math.round(r.tDiv_net/12/1e4)),
            backgroundColor: barGradT, borderRadius:2, borderSkipped:false,
            order:3 },
          { label:'SCHD 월배당', type:'bar',
            data: rows.map(r => Math.round(r.sDiv_net/12/1e4)),
            backgroundColor: barGradS, borderRadius:2, borderSkipped:false,
            order:3 },
          { label:'합계 월배당', type:'line',
            data: rows.map(r => Math.round(r.monthlyDiv/1e4)),
            borderColor:'#B5711A', backgroundColor:'transparent',
            borderWidth:3, tension:.45,
            pointRadius:0, pointHoverRadius:7,
            pointHoverBackgroundColor:'#B5711A', pointHoverBorderColor:'#fff',
            pointHoverBorderWidth:2,
            order:1 },
          { label:'가수금 상환', type:'line',
            data: rows.map((r,i) => {
              const prev = i===0 ? 1.1e9 : rows[i-1].loanBal;
              return Math.round(Math.max(prev - r.loanBal, 0)/1e4/12);
            }),
            borderColor:'rgba(168,48,48,.7)',
            backgroundColor:'transparent',
            borderWidth:1.5, borderDash:[5,3], tension:.3,
            pointRadius:0, pointHoverRadius:5,
            order:2 },
        ]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        animation:{ duration:900, easing:'easeInOutQuart' },
        interaction:{ mode:'index', intersect:false },
        scales: {
          x: { stacked:true,
            ticks:{
              font:{size:10}, color:'#888', autoSkip:false, maxRotation:0,
              callback:(v,i) => rows[i]?.age % 10 === 0 ? rows[i].age+'세' : ''
            },
            grid:{ display:false } },
          y: { stacked:true,
            ticks:{ font:{size:10}, color:'#888',
              callback: v => v + '만' },
            grid:{ color:'rgba(0,0,0,.05)' },
            border:{ display:false } }
        },
        plugins: {
          legend:{ display:false },
          tooltip:{
            backgroundColor:'rgba(0,31,91,.9)',
            titleColor:'#C9A84C', bodyColor:'#fff',
            borderColor:'rgba(201,168,76,.3)', borderWidth:1,
            padding:12, cornerRadius:10,
            callbacks:{
              title: (items) => {
                const i = items[0].dataIndex;
                return `만 ${rows[i].age}세 (${rows[i].yr}년)`;
              },
              label: c => `  ${c.dataset.label}: ${c.parsed.y.toLocaleString()}만원/월`
            }
          }
        }
      }
    });

  } else {
    // ── 가수금: 수평 감소 막대 (남은 잔액 vs 상환완료)
    const AGE_LABELS = AGE_MILESTONES.map(a => `만${a}세`);
    const groupRows = AGE_MILESTONES.map(a => rows.find(r => r.age === a));
    const INIT = 11; // 억

    const remainData = groupRows.map(r => r ? +(r.loanBal/1e8).toFixed(2) : 0);
    const repaidData = groupRows.map(r => r ? +(Math.max(INIT - r.loanBal/1e8, 0)).toFixed(2) : INIT);

    renderLegend([
      {color:'#A83030', label:'잔여 가수금', type:'bar'},
      {color:'#1A6B3C', label:'상환 완료', type:'bar'},
    ]);

    const gR = makeGrad(ctx,'rgba(168,48,48,.8)','rgba(168,48,48,.4)',20);
    const gP = makeGrad(ctx,'rgba(26,107,60,.8)','rgba(26,107,60,.4)',20);

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: AGE_LABELS,
        datasets: [
          { label:'상환 완료', data: repaidData,
            backgroundColor: gP, borderRadius:4, borderSkipped:false },
          { label:'잔여 가수금', data: remainData,
            backgroundColor: gR, borderRadius:4, borderSkipped:false },
        ]
      },
      options: {
        indexAxis:'y',
        responsive:true, maintainAspectRatio:false,
        animation:{ duration:900, easing:'easeInOutQuart' },
        scales: {
          x: { stacked:true, max:12,
            ticks:{ font:{size:10}, color:'#888',
              callback: v => v + '억' },
            grid:{ color:'rgba(0,0,0,.05)' },
            border:{ display:false } },
          y: { stacked:true,
            ticks:{ font:{size:11,weight:'600'}, color:'#444' },
            grid:{ display:false } }
        },
        plugins: {
          legend:{ display:false },
          tooltip:{
            backgroundColor:'rgba(0,31,91,.9)',
            titleColor:'#C9A84C', bodyColor:'#fff',
            borderColor:'rgba(201,168,76,.3)', borderWidth:1,
            padding:12, cornerRadius:10,
            callbacks:{
              title: items => items[0].label,
              label: c => {
                if (c.dataset.label === '잔여 가수금')
                  return `  잔여: ₩${c.parsed.x.toFixed(1)}억`;
                return `  상환: ₩${c.parsed.x.toFixed(1)}억`;
              },
              afterBody: (items) => {
                const i = items[0].dataIndex;
                const remain = remainData[i];
                const pct = ((INIT - remain)/INIT*100).toFixed(0);
                return [`  상환율: ${pct}%`];
              }
            }
          }
        }
      }
    });
  }
}

function toggleChart(type, el) {
  document.querySelectorAll('.ctog').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  if (window.APP_ROWS) renderChart(window.APP_ROWS, type);
}

function renderMilestones(rows) {
  const loanPaidAge = rows.find(r => r.loanBal === 0)?.age || '완납 미도달';
  const items = [
    { age: '만60세', yr: '2026', title: '투자 시작 (원금 기준 첫해 배당)', val: fw2(rows[0].monthlyDiv) + '/월', color: '#1558A0' },
    { age: '만70세', yr: '2036', title: '월배당', val: fw2(rows[10].monthlyDiv) + '/월', color: '#0D7065' },
    { age: typeof loanPaidAge === 'number' ? `만${loanPaidAge}세` : '가수금', yr: typeof loanPaidAge === 'number' ? String(2026 + loanPaidAge - 60) : '', title: '가수금 완납', val: '₩11억 상환 완료', color: '#1A6B3C' },
    { age: '만80세', yr: '2046', title: '월배당', val: fw2(rows[20].monthlyDiv) + '/월', color: '#B5711A' },
    { age: '만100세', yr: '2066', title: '최종 기업가치', val: fw2(rows[40].corpValue), color: '#4A3AA7' },
  ];
  document.getElementById('milestoneList').innerHTML = items.map(m => `
    <div class="milestone-item">
      <div class="ms-age" style="color:${m.color}">${m.age}</div>
      <div class="ms-year">${m.yr}년</div>
      <div class="ms-bar">
        <div class="ms-title">${m.title}</div>
        <div class="ms-value" style="color:${m.color}">${m.val}</div>
      </div>
    </div>
  `).join('');
}

function renderInputGroups(params) {
  const groups = [
    { id: 'g-schd', cls: 'blue', label: 'SCHD 투자 가정', items: [
      { key: 'schdPrincipal', label: 'SCHD 투자원금', unit: '원', fmt: v => v },
      { key: 'schdGrowth',    label: '연 주가 상승률', unit: '%', fmt: v => (v * 100).toFixed(1) },
      { key: 'schdDivRate',   label: '초기 배당수익률', unit: '%', fmt: v => (v * 100).toFixed(2) },
      { key: 'schdDivGrowth', label: '배당 성장률/년', unit: '%', fmt: v => (v * 100).toFixed(1) },
    ]},
    { id: 'g-tltw', cls: 'teal', label: 'TLTW 투자 가정', items: [
      { key: 'tltwPrincipal', label: 'TLTW 투자원금', unit: '원', fmt: v => v },
      { key: 'tltwDivRate',   label: '초기 배당수익률', unit: '%', fmt: v => (v * 100).toFixed(2) },
      { key: 'tltwDivChange', label: '배당 변동률/년', unit: '%', fmt: v => (v * 100).toFixed(2) },
    ]},
    { id: 'g-corp', cls: 'purple', label: '법인 / 가수금', items: [
      { key: 'loanInit',     label: '법인 가수금 (초기)', unit: '원', fmt: v => v },
      { key: 'repayAnnual',  label: '가수금 연 상환액', unit: '원', fmt: v => v },
      { key: 'usTax',        label: '미국 원천징수세', unit: '%', fmt: v => (v * 100).toFixed(0) },
      { key: 'pbr',          label: '기업가치 PBR 배수', unit: 'x', fmt: v => v.toFixed(1) },
    ]},
    { id: 'g-sh', cls: 'amber', label: '주주 지분 (%)', items: [
      { key: 'sh_A',   label: '자녀A 지분', unit: '%', fmt: v => (v * 100).toFixed(0) },
      { key: 'sh_B',   label: '자녀B 지분', unit: '%', fmt: v => (v * 100).toFixed(0) },
      { key: 'sh_C',   label: '자녀C 지분', unit: '%', fmt: v => (v * 100).toFixed(0) },
      { key: 'sh_dad', label: '부(父) 지분', unit: '%', fmt: v => (v * 100).toFixed(0) },
      { key: 'sh_mom', label: '모(母) 지분', unit: '%', fmt: v => (v * 100).toFixed(0) },
    ]},
  ];

  const flatParams = { ...params, sh_A: params.shareholders.A, sh_B: params.shareholders.B, sh_C: params.shareholders.C, sh_dad: params.shareholders.dad, sh_mom: params.shareholders.mom };

  document.getElementById('inputGroups').innerHTML = groups.map(g => `
    <div class="input-group" id="${g.id}">
      <div class="ig-header ${g.cls}">${g.label}</div>
      ${g.items.map(item => `
        <div class="input-item">
          <span class="il-label">${item.label}</span>
          <input class="il-input" type="number" data-key="${item.key}" value="${item.fmt(flatParams[item.key] ?? 0)}" step="any" onchange="onParamChange(this)">
          <span class="il-unit">${item.unit}</span>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function renderSimTable(rows, filter) {
  const filtered = filter === 'all' || !filter ? rows :
    rows.filter(r => r.age >= parseInt(filter) && r.age < parseInt(filter) + 10);

  const decadeClass = age => age < 70 ? 'decade-60' : age < 80 ? 'decade-70' : age < 90 ? 'decade-80' : 'decade-90';
  const table = document.getElementById('simTable');
  table.innerHTML = `
    <thead>
      <tr style="background:#001F5B">
        <th style="min-width:40px">나이</th>
        <th style="min-width:46px">연도</th>
        <th class="col-schd">SCHD자산</th>
        <th class="col-schd">SCHD배당</th>
        <th class="col-tltw">TLTW자산</th>
        <th class="col-tltw">TLTW배당</th>
        <th class="col-total">월배당</th>
        <th class="col-loan">가수금</th>
        <th class="col-asset">법인자산</th>
        <th class="col-child">자녀지분</th>
      </tr>
    </thead>
    <tbody>
      ${filtered.map(r => `
        <tr class="${decadeClass(r.age)}">
          <td>${r.age}세</td>
          <td>${r.yr}</td>
          <td class="col-schd">${fw2(r.sAsset)}</td>
          <td class="col-schd">${fw2(r.sDiv_net)}</td>
          <td class="col-tltw">${fw2(r.tAsset)}</td>
          <td class="col-tltw">${fw2(r.tDiv_net)}</td>
          <td class="col-total">${fw2(r.monthlyDiv)}</td>
          <td class="col-loan">${r.loanBal > 0 ? fw2(r.loanBal) : '<span style="color:#1A6B3C;font-weight:700">완납</span>'}</td>
          <td class="col-asset">${fw2(r.corpAsset)}</td>
          <td class="col-child">${fw2(r.childShare)}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
}

function renderCashflow(rows) {
  const r1 = rows[0], rLast = rows[40];
  const totalCum = rows.reduce((a, r) => a + r.totalDiv, 0);
  const loanPaid = rows.filter(r => r.loanBal === 0).length > 0;

  document.getElementById('cfSummary').innerHTML = `
    <div class="cf-card"><div class="cf-card-lbl">초기 월배당</div><div class="cf-card-val" style="color:#4A3AA7">${fw2(r1.monthlyDiv)}</div></div>
    <div class="cf-card"><div class="cf-card-lbl">최종 월배당</div><div class="cf-card-val" style="color:#4A3AA7">${fw2(rLast.monthlyDiv)}</div></div>
    <div class="cf-card"><div class="cf-card-lbl">40년 누계 배당</div><div class="cf-card-val" style="color:#1A6B3C">${fw2(totalCum)}</div></div>
    <div class="cf-card"><div class="cf-card-lbl">가수금 현황</div><div class="cf-card-val" style="color:${loanPaid ? '#1A6B3C' : '#A83030'}">${loanPaid ? '완납' : fw2(rLast.loanBal)}</div></div>
  `;

  const cfTable = document.getElementById('cfTable');
  cfTable.innerHTML = `
    <thead>
      <tr>
        <th style="min-width:42px">나이</th>
        <th style="min-width:44px">연도</th>
        <th style="color:#9AD0F5">SCHD<br>월배당</th>
        <th style="color:#7ED9C0">TLTW<br>월배당</th>
        <th style="color:#C4B8EF">합계<br>월배당</th>
        <th style="color:#F5B8B8">가수금<br>잔액</th>
        <th style="color:#F5B8B8">월<br>상환액</th>
        <th style="color:#A8E6C0">순<br>월잉여금</th>
        <th style="color:#E8C87A">법인<br>총자산</th>
        <th style="color:#C4B8EF">자녀<br>지분(80%)</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map((r, idx) => {
        const prevLoan = idx === 0 ? DEFAULT_PARAMS.loanInit : rows[idx - 1].loanBal;
        const monthRepay = Math.max(prevLoan - r.loanBal, 0) / 12;
        const net = r.monthlyDiv - monthRepay;
        const dc = r.age < 70 ? 'decade-60' : r.age < 80 ? 'decade-70' : r.age < 90 ? 'decade-80' : 'decade-90';
        return `
          <tr class="${dc}">
            <td>${r.age}세</td>
            <td>${r.yr}</td>
            <td class="col-schd">${fw2(r.sDiv_net / 12)}</td>
            <td class="col-tltw">${fw2(r.tDiv_net / 12)}</td>
            <td class="col-total">${fw2(r.monthlyDiv)}</td>
            <td class="col-loan">${r.loanBal > 0 ? fw2(r.loanBal) : '<b style="color:#1A6B3C">완납</b>'}</td>
            <td class="col-loan">${fw2(monthRepay)}</td>
            <td style="color:${net > 0 ? '#145C2A' : '#A83030'};font-weight:600">${fw2(net)}</td>
            <td class="col-asset">${fw2(r.corpAsset)}</td>
            <td class="col-child">${fw2(r.childShare)}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  `;
}

function renderChildren(rows, params) {
  const ages = [80, 85, 90, 95, 100];
  const sh = params.shareholders;
  const colors = { A: '#1558A0', B: '#0D7065', C: '#4A3AA7', dad: '#888', mom: '#AAA' };
  const bgs   = { A: '#EBF3FB', B: '#E5F5EE', C: '#EEEDFB', dad: '#F3F3F1', mom: '#F3F3F1' };

  document.getElementById('childrenGrid').innerHTML = ages.map(age => {
    const r = rows.find(r => r.age === age);
    if (!r) return '';
    const maxVal = r.corpValue;
    return `
      <div class="age-block">
        <div class="age-block-header">
          <div>
            <div class="age-title">만 ${age}세</div>
            <div class="age-year">${2026 + age - 60}년</div>
          </div>
          <div class="age-corp-val">기업가치 ${fw2(r.corpValue)}</div>
        </div>
        ${Object.entries(sh).map(([k, pct]) => {
          const val = r.corpValue * pct;
          const name = { A: '자녀A (25%)', B: '자녀B (25%)', C: '자녀C (30%)', dad: '부(父) 5%', mom: '모(母) 5%' }[k];
          return `
            <div class="share-row">
              <div class="share-name" style="color:${colors[k]}">${name}</div>
              <div class="share-bar-wrap"><div class="share-bar" style="background:${colors[k]};width:${(pct / 0.3 * 100).toFixed(0)}%"></div></div>
              <div class="share-val" style="color:${colors[k]}">${fw2(val)}</div>
              <div class="share-pct">${(pct * 100).toFixed(0)}%</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }).join('');

  renderShareChart(rows, ages, sh, colors);
  renderTransferMemo();
}

function renderShareChart(rows, ages, sh, colors) {
  const ctx = document.getElementById('shareChart').getContext('2d');
  const labels = ages.map(a => `만${a}세`);
  const datasets = Object.entries(sh).map(([k, pct]) => ({
    label: { A: '자녀A', B: '자녀B', C: '자녀C', dad: '부', mom: '모' }[k],
    data: ages.map(age => {
      const r = rows.find(r => r.age === age);
      return r ? Math.round(r.corpValue * pct / 1e8) : 0;
    }),
    borderColor: colors[k],
    backgroundColor: colors[k] + '22',
    fill: false, tension: .3, borderWidth: 2, pointRadius: 4
  }));
  if (shareChartInstance) shareChartInstance.destroy();
  shareChartInstance = new Chart(ctx, {
    type: 'line', data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: true, labels: { font: { size: 10 }, boxWidth: 10 } }, tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${c.parsed.y}억` } } },
      scales: {
        x: { ticks: { font: { size: 10 }, color: '#888' }, grid: { display: false } },
        y: { ticks: { font: { size: 10 }, color: '#888', callback: v => v + '억' }, grid: { color: 'rgba(0,0,0,.05)' } }
      }
    }
  });
}

function renderTransferMemo() {
  const memos = [
    { icon: '🏢', title: '주식 이전 방법', desc: '법인 주식 보유 → 자녀 지분율로 자동 귀속. 별도 양도 불필요.' },
    { icon: '📈', title: '자본차익 이전', desc: 'SCHD 주가 상승분 = 자녀 주식가치 상승. 주식 매도 없이 이전.' },
    { icon: '💰', title: '배당 수취 경로', desc: '법인 배당결의 → 지분율 비례 → 자녀 개인 계좌로 현금 지급.' },
    { icon: '⚠️', title: '세무 주의사항', desc: '비상장주식 무상이전 시 세법상 보충적평가법 적용 필요. 세무사 확인 필수.' },
    { icon: '✅', title: '가수금 완납 후', desc: '배당 전액 법인 잉여금 누적 → 배당결의로 자녀 현금 이전 가능.' },
  ];
  document.getElementById('memoList').innerHTML = memos.map(m => `
    <div class="memo-item">
      <div style="font-size:18px;min-width:22px">${m.icon}</div>
      <div class="memo-text"><strong>${m.title}</strong>${m.desc}</div>
    </div>
  `).join('');
}

// ── 세무 반영 범위 고지 (수정 #6: 투명성 강화)
function renderTaxDisclosure() {
  const el = document.getElementById('taxDisclosure');
  if (!el) return;
  el.innerHTML = `
    <div style="background:#FFF7E6;border:1px solid #E8C87A;border-radius:10px;padding:13px 14px;margin-bottom:14px">
      <div style="font-size:12px;font-weight:700;color:#7A4800;margin-bottom:8px">⚠️ 이 시뮬레이션이 반영하는 세금 / 반영하지 않는 세금</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:11px;line-height:1.6">
        <div>
          <div style="font-weight:600;color:#145C2A;margin-bottom:4px">✓ 반영됨</div>
          <div style="color:#444">• 미국 배당 원천징수세 15%</div>
        </div>
        <div>
          <div style="font-weight:600;color:#8A1818;margin-bottom:4px">✗ 미반영 (별도 검토 필요)</div>
          <div style="color:#444">
            • 법인세 (법인세율 구간, 익금불산입 비율)<br>
            • 가수금 인정이자 (국세청 고시이율 4.6%) 과세<br>
            • 배당소득 종합과세 (금융소득 2천만원 초과 시)<br>
            • 비상장주식 평가 (보충적평가법, 자녀 증여·상속세)<br>
            • 환율 변동 (원/달러 변동에 따른 평가손익)<br>
            • ETF 실제 분배금 변동 (가정치와 실제 배당 차이)
          </div>
        </div>
      </div>
      <div style="margin-top:9px;padding-top:8px;border-top:1px solid #E8C87A;font-size:10.5px;color:#7A4800">
        본 화면의 모든 수치는 <strong>참고용 추정치</strong>이며, 법인세·증여세·상속세 등 실제 세무 판단은 반드시 세무사·회계사 확인을 거쳐야 합니다.
      </div>
    </div>
  `;
}
