// ── 저장 모듈 (이 브라우저/기기에만 저장되는 localStorage 기반)
//
// 수정 #5: "동기화"라는 표현은 다른 기기와 자동으로 데이터가 맞춰진다는
// 오해를 줄 수 있어 전부 "이 기기 저장"으로 정정.
// 다른 기기로 데이터를 옮기려면 "내보내기(JSON 파일)" → 다른 기기에서 "가져오기"를
// 수동으로 해야 합니다. 이는 진짜 동기화(서버/클라우드 자동 연동)가 아닙니다.

const STORAGE_KEY = 'uandk_corp_sim_v1';

function saveToLocal() {
  const data = {
    params: window.APP_PARAMS,
    actualData: window.ACTUAL_DATA || {},
    memos: window.MEMOS || [],
    savedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  updateSyncStatus('이 기기에 저장됨: ' + new Date().toLocaleString('ko-KR'));
  showToast('이 기기에 저장 완료 ✓');
}

function loadFromLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// 헤더의 저장 버튼 — 정직하게 "이 기기 저장"만 수행 (서버 동기화 아님)
function syncData() {
  const btn = document.getElementById('syncBtn');
  btn.style.opacity = '.5';
  setTimeout(() => {
    saveToLocal();
    btn.style.opacity = '1';
  }, 400);
}

function updateSyncStatus(msg) {
  const el = document.getElementById('syncStatus');
  if (el) el.textContent = msg;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── 다른 기기로 데이터 이전: 내보내기(JSON 다운로드) / 가져오기(JSON 업로드)
// 이것이 실제로 기기 간 데이터를 옮길 수 있는 유일한 방법입니다.
function exportDataToFile() {
  const data = {
    params: window.APP_PARAMS,
    actualData: window.ACTUAL_DATA || {},
    memos: window.MEMOS || [],
    exportedAt: new Date().toISOString(),
    note: '유앤김 자산관리 법인 ETF 시뮬레이터 백업 파일 — 다른 기기에서 "가져오기"로 복원하세요.'
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `corp-sim-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('백업 파일 다운로드 완료 ✓');
}

function importDataFromFile(fileInput) {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.params) window.APP_PARAMS = { ...DEFAULT_PARAMS, ...data.params };
      if (data.actualData) window.ACTUAL_DATA = data.actualData;
      if (data.memos) window.MEMOS = data.memos;
      saveToLocal();
      if (typeof recalcAll === 'function') recalcAll();
      showToast('백업 파일 불러오기 완료 ✓');
    } catch (err) {
      showToast('파일을 읽을 수 없습니다 — 형식을 확인하세요');
    }
  };
  reader.readAsText(file);
  fileInput.value = '';
}

// ── 실제 입력 데이터 (manual-input.js와 공유)
window.ACTUAL_DATA = window.ACTUAL_DATA || {};
window.MEMOS = window.MEMOS || [];
