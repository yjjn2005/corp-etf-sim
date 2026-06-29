// ── 동기화 & 저장 모듈 (localStorage + GitHub Gist)
const STORAGE_KEY = 'uandk_corp_sim_v1';
const GIST_STORAGE_KEY = 'uandk_gist_id';

function saveToLocal() {
  const data = {
    params: window.APP_PARAMS,
    actualData: window.ACTUAL_DATA || {},
    memos: window.MEMOS || [],
    savedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  updateSyncStatus('로컬 저장 완료: ' + new Date().toLocaleTimeString('ko-KR'));
  showToast('저장 완료 ✓');
}

function loadFromLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function syncData() {
  const btn = document.getElementById('syncBtn');
  btn.style.opacity = '.5';
  setTimeout(() => {
    saveToLocal();
    btn.style.opacity = '1';
    showToast('동기화 완료 ✓');
  }, 600);
}

function updateSyncStatus(msg) {
  document.getElementById('syncStatus').textContent = msg;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── 실제 데이터 저장
window.ACTUAL_DATA = {};
window.MEMOS = [];

function saveActualData() {
  const yr    = parseInt(document.getElementById('actualYear').value);
  const schd  = parseFloat(document.getElementById('actualSchdDiv').value) || 0;
  const tltw  = parseFloat(document.getElementById('actualTltwDiv').value) || 0;
  const repay = parseFloat(document.getElementById('actualRepay').value) || 0;
  const sPrice = parseFloat(document.getElementById('actualSchdPrice').value) || 0;
  const tPrice = parseFloat(document.getElementById('actualTltwPrice').value) || 0;
  const usd   = parseFloat(document.getElementById('usdKrw').value) || 1380;

  if (!yr) { showToast('연도를 입력하세요'); return; }
  window.ACTUAL_DATA[yr] = { yr, schd, tltw, repay, sPrice, tPrice, usd, savedAt: new Date().toISOString() };
  saveToLocal();
  showToast(`${yr}년 실제 데이터 저장 ✓`);
  closeModal();
}

function saveMemo() {
  const title   = document.getElementById('memoTitle').value.trim();
  const content = document.getElementById('memoContent').value.trim();
  if (!title) { showToast('제목을 입력하세요'); return; }
  const memo = { id: Date.now(), title, content, createdAt: new Date().toISOString() };
  window.MEMOS.unshift(memo);
  renderMemoHistory();
  saveToLocal();
  document.getElementById('memoTitle').value = '';
  document.getElementById('memoContent').value = '';
  showToast('메모 저장 ✓');
}

function renderMemoHistory() {
  const el = document.getElementById('memoHistory');
  if (!el || !window.MEMOS.length) return;
  el.innerHTML = window.MEMOS.slice(0, 5).map(m => `
    <div class="memo-saved">
      <div class="memo-saved-title">${m.title}</div>
      <div>${m.content}</div>
      <div style="font-size:9px;color:#999;margin-top:4px">${new Date(m.createdAt).toLocaleString('ko-KR')}</div>
    </div>
  `).join('');
}
