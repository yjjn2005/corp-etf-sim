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

function renderChart(rows, type) {
  currentChartType = type;
  const ctx = document.getElementById('mainChart').getContext('2d');
  const labels = rows.map(r => r.age + '세');

  let datasets;
  if (type === 'asset') {
    datasets = [
      { label: 'SCHD 자산', data: rows.map(r => Math.round(r.sAsset / 1e8)), borderColor: '#1558A0', backgroundColor: 'rgba(21,88,160,.08)', fill: true, tension: .35, borderWidth: 2, pointRadius: 0 },
      { label: 'TLTW 자산', data: rows.map(r => Math.round(r.tAsset / 1e8)), borderColor: '#0D7065', backgroundColor: 'rgba(13,112,101,.08)', fill: true, tension: .35, borderWidth: 2, pointRadius: 0 },
      { label: '법인총자산', data: rows.map(r => Math.round(r.corpAsset / 1e8)), borderColor: '#B5711A', backgroundColor: 'transparent', fill: false, tension: .35, borderWidth: 2.5, borderDash: [5, 3], pointRadius: 0 },
    ];
  } else if (type === 'dividend') {
    datasets = [
      { label: 'SCHD 월배당', data: rows.map(r => Math.round(r.sDiv_net / 12 / 1e4)), borderColor: '#1558A0', backgroundColor: 'rgba(21,88,160,.1)', fill: true, tension: .35, borderWidth: 2, pointRadius: 0 },
      { label: 'TLTW 월배당', data: rows.map(r => Math.round(r.tDiv_net / 12 / 1e4)), borderColor: '#0D7065', backgroundColor: 'rgba(13,112,101,.1)', fill: true, tension: .35, borderWidth: 2, pointRadius: 0 },
    ];
  } else {
    datasets = [
      { label: '가수금 잔액', data: rows.map(r => Math.round(r.loanBal / 1e8)), borderColor: '#A83030', backgroundColor: 'rgba(168,48,48,.1)', fill: true, tension: .35, borderWidth: 2, pointRadius: 0 },
    ];
  }

  const yLabel = type === 'dividend' ? '만원' : '억원';
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'line', data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${c.parsed.y.toLocaleString()}${yLabel}` } } },
      scales: {
        x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10, font: { size: 10 }, color: '#888' }, grid: { display: false } },
        y: { ticks: { font: { size: 10 }, color: '#888', callback: v => v.toLocaleString() + yLabel }, grid: { color: 'rgba(0,0,0,.06)' } }
      }
    }
  });
}

function toggleChart(type, el) {
  document.querySelectorAll('.ctog').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  if (window.APP_ROWS) renderChart(window.APP_ROWS, type);
}

function renderMilestones(rows) {
  const loanPaidAge = rows.find(r => r.loanBal === 0)?.age || '완납 미도달';
  const items = [
    { age: '만60세', yr: '2026', title: '투자 시작', val: fw2(rows[0].monthlyDiv) + '/월', color: '#1558A0' },
    { age: '만70세', yr: '2036', title: '월배당', val: fw2(rows[10].monthlyDiv) + '/월', color: '#0D7065' },
    { age: typeof loanPaidAge === 'number' ? `만${loanPaidAge}세` : '가수금', yr: typeof loanPaidAge === 'number' ? String(2026 + loanPaidAge - 60) : '', title: '가수금 완납', val: '₩11억 상환 완료', color: '#1A6B3C' },
    { age: '만80세', yr: '2046', title: '월배당', val: fw2(rows[20].monthlyDiv) + '/월', color: '#B5711A' },
    { age: '만100세', yr: '2065', title: '최종 기업가치', val: fw2(rows[40].corpValue), color: '#4A3AA7' },
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
