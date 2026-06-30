// ── 메인 앱 진입점
window.APP_PARAMS = { ...DEFAULT_PARAMS };
window.APP_ROWS   = [];

function init() {
  // manual-input.js의 통합 저장소에서 복구
  if (typeof loadAllPersisted === 'function') loadAllPersisted();
  recalcAll();
}

function recalcAll() {
  const rows = runSimulation(window.APP_PARAMS);
  window.APP_ROWS = rows;

  if (typeof renderTaxDisclosure === 'function') renderTaxDisclosure();
  renderKPIGrid(rows);
  renderChart(rows, currentChartType || 'asset');
  renderMilestones(rows);
  renderInputGroups(window.APP_PARAMS);
  renderSimTable(rows, document.getElementById('simFilter')?.value || 'all');
  renderCashflow(rows);
  renderChildren(rows, window.APP_PARAMS);
  if (typeof renderMemoHistory === 'function') renderMemoHistory();
}

// ── 탭 전환
function switchTab(id, el) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  el.classList.add('active');
}

// ── 가정값 변경 핸들러 (가정 탭 직접 입력)
function onParamChange(input) {
  const key = input.dataset.key;
  const val = parseFloat(input.value);
  if (isNaN(val)) return;

  const pMap = {
    schdPrincipal: v => ({ schdPrincipal: v }),
    tltwPrincipal: v => ({ tltwPrincipal: v }),
    schdGrowth:    v => ({ schdGrowth: v / 100 }),
    schdDivRate:   v => ({ schdDivRate: v / 100 }),
    schdDivGrowth: v => ({ schdDivGrowth: v / 100 }),
    tltwDivRate:   v => ({ tltwDivRate: v / 100 }),
    tltwDivChange: v => ({ tltwDivChange: v / 100 }),
    loanInit:      v => ({ loanInit: v }),
    repayAnnual:   v => ({ repayAnnual: v }),
    usTax:         v => ({ usTax: v / 100 }),
    pbr:           v => ({ pbr: v }),
    sh_A:  v => ({ shareholders: { ...window.APP_PARAMS.shareholders, A: v / 100 } }),
    sh_B:  v => ({ shareholders: { ...window.APP_PARAMS.shareholders, B: v / 100 } }),
    sh_C:  v => ({ shareholders: { ...window.APP_PARAMS.shareholders, C: v / 100 } }),
    sh_dad:v => ({ shareholders: { ...window.APP_PARAMS.shareholders, dad: v / 100 } }),
    sh_mom:v => ({ shareholders: { ...window.APP_PARAMS.shareholders, mom: v / 100 } }),
  };

  if (pMap[key]) {
    window.APP_PARAMS = { ...window.APP_PARAMS, ...pMap[key](val) };
  }
}

// ── 40년 테이블 필터 (수정 #2: HTML onchange와 시그니처 일치)
function renderSimTableFiltered() {
  const filter = document.getElementById('simFilter').value;
  renderSimTable(window.APP_ROWS, filter);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('simFilter')?.addEventListener('change', renderSimTableFiltered);
  init();
});
