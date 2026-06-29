// ── 메인 앱 진입점
window.APP_PARAMS = { ...DEFAULT_PARAMS };
window.APP_ROWS   = [];

function init() {
  // 새 통합 저장소에서 복구 (manual-input.js)
  if (typeof loadAllPersisted === 'function') loadAllPersisted();

  recalcAll();
}

function recalcAll() {
  const rows = runSimulation(window.APP_PARAMS);
  window.APP_ROWS = rows;

  renderKPIGrid(rows);
  renderChart(rows, currentChartType || 'asset');
  renderMilestones(rows);
  renderInputGroups(window.APP_PARAMS);
  renderSimTable(rows, document.getElementById('simFilter')?.value || 'all');
  renderCashflow(rows);
  renderChildren(rows, window.APP_PARAMS);
  renderMemoHistory();
}

// ── 탭 전환
function switchTab(id, el) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  el.classList.add('active');
}

// ── 가정값 변경 핸들러
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

// ── 모달
function openManualInput() {
  document.getElementById('modalOverlay').classList.add('open');
  initAdjustInputs();
}
function closeModal(e) {
  if (!e || e.target === document.getElementById('modalOverlay'))
    document.getElementById('modalOverlay').classList.remove('open');
}
function switchMTab(id, el) {
  document.querySelectorAll('.modal-content').forEach(c => c.style.display = 'none');
  document.querySelectorAll('.mtab').forEach(b => b.classList.remove('active'));
  document.getElementById('mtab-' + id).style.display = 'block';
  el.classList.add('active');
}

function initAdjustInputs() {
  const p = window.APP_PARAMS;
  const f = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  f('adj_schdGrowth',    (p.schdGrowth * 100).toFixed(1));
  f('adj_schdDivGrowth', (p.schdDivGrowth * 100).toFixed(1));
  f('adj_tltwDivRate',   (p.tltwDivRate * 100).toFixed(1));
  f('adj_repayMonthly',  Math.round(p.repayAnnual / 12 / 10000));
  f('adj_pbr',           p.pbr.toFixed(1));
}

function applyAdjust() {
  const g = id => parseFloat(document.getElementById(id).value);
  window.APP_PARAMS = {
    ...window.APP_PARAMS,
    schdGrowth:    g('adj_schdGrowth') / 100,
    schdDivGrowth: g('adj_schdDivGrowth') / 100,
    tltwDivRate:   g('adj_tltwDivRate') / 100,
    repayAnnual:   g('adj_repayMonthly') * 10000 * 12,
    pbr:           g('adj_pbr'),
  };
  recalcAll();
  showToast('재계산 완료 ✓');
  closeModal();
}

// ── 40년 테이블 필터
function renderSimTableFiltered() {
  const filter = document.getElementById('simFilter').value;
  renderSimTable(window.APP_ROWS, filter);
}
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('simFilter')?.addEventListener('change', renderSimTableFiltered);
  init();
});
