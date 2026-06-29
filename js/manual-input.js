// ── 수동 입력 전용 모듈
// 탭: 배당수령 | 가수금 | 시세 | 가정조정 | 메모 | 기록조회

const MONTHS_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

// ── 모달 열기/닫기
function openManualInput() {
  rebuildModal();
  document.getElementById('manualModal').classList.add('open');
  // 기본 탭 활성
  switchMT('dividend');
}
function closeManualModal(e) {
  if (!e || e.target.id === 'manualModal')
    document.getElementById('manualModal').classList.remove('open');
}

// ── 탭 전환
function switchMT(tab) {
  document.querySelectorAll('.mt-pane').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.mt-tab').forEach(b => b.classList.remove('active'));
  const pane = document.getElementById('mt-' + tab);
  const btn  = document.querySelector(`.mt-tab[data-tab="${tab}"]`);
  if (pane) pane.style.display = 'block';
  if (btn)  btn.classList.add('active');
}

// ── 모달 동적 빌드
function rebuildModal() {
  document.getElementById('manualModalBody').innerHTML = `
    <!-- 탭 버튼 -->
    <div class="mt-tabs">
      <button class="mt-tab active" data-tab="dividend" onclick="switchMT('dividend')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        배당 수령
      </button>
      <button class="mt-tab" data-tab="loan" onclick="switchMT('loan')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        가수금
      </button>
      <button class="mt-tab" data-tab="price" onclick="switchMT('price')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        시세/환율
      </button>
      <button class="mt-tab" data-tab="params" onclick="switchMT('params')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
        가정 조정
      </button>
      <button class="mt-tab" data-tab="memo" onclick="switchMT('memo')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        메모
      </button>
      <button class="mt-tab" data-tab="history" onclick="switchMT('history');loadHistory()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        기록
      </button>
    </div>

    <!-- ① 배당 수령 입력 -->
    <div id="mt-dividend" class="mt-pane">
      <div class="mt-pane-title">실제 배당 수령액 기록</div>
      <div class="mi-row3">
        <div class="mi-field">
          <label>연도</label>
          <select id="mi_year">${Array.from({length:40},(_,i)=>2026+i).map(y=>`<option value="${y}" ${y===new Date().getFullYear()?'selected':''}>${y}</option>`).join('')}</select>
        </div>
        <div class="mi-field">
          <label>월</label>
          <select id="mi_month">${MONTHS_KO.map((m,i)=>`<option value="${i+1}" ${i+1===new Date().getMonth()+1?'selected':''}>${m}</option>`).join('')}</select>
        </div>
      </div>
      <div class="mi-divider">SCHD 배당</div>
      <div class="mi-row2">
        <div class="mi-field">
          <label>세전 ($)</label>
          <input type="number" id="mi_schd_usd" placeholder="0.00" step="0.01" oninput="calcKrw('schd')">
        </div>
        <div class="mi-field">
          <label>원/달러</label>
          <input type="number" id="mi_usd_rate" value="1380" step="1" oninput="calcKrw('schd')">
        </div>
      </div>
      <div class="mi-field">
        <label>세후 수령액 (원) — 자동계산</label>
        <div class="mi-calc-row">
          <input type="number" id="mi_schd_krw" placeholder="원화 금액" step="1000">
          <span class="mi-calc-hint" id="mi_schd_hint">미국 원천세 15% 적용</span>
        </div>
      </div>
      <div class="mi-divider">TLTW 배당</div>
      <div class="mi-row2">
        <div class="mi-field">
          <label>세전 ($)</label>
          <input type="number" id="mi_tltw_usd" placeholder="0.00" step="0.01" oninput="calcKrw('tltw')">
        </div>
        <div class="mi-field">
          <label>주당 배당 ($)</label>
          <input type="number" id="mi_tltw_per_share" placeholder="0.21" step="0.001" oninput="calcTltwTotal()">
        </div>
      </div>
      <div class="mi-field">
        <label>세후 수령액 (원) — 자동계산</label>
        <div class="mi-calc-row">
          <input type="number" id="mi_tltw_krw" placeholder="원화 금액" step="1000">
          <span class="mi-calc-hint" id="mi_tltw_hint">미국 원천세 15% 적용</span>
        </div>
      </div>
      <div class="mi-divider">합계</div>
      <div class="mi-total-box" id="mi_total_box">
        <div class="mi-total-row"><span>합계 월배당 (세후)</span><span id="mi_total_monthly">—</span></div>
        <div class="mi-total-row sub"><span>연환산</span><span id="mi_total_annual">—</span></div>
      </div>
      <div class="mi-field">
        <label>비고</label>
        <input type="text" id="mi_div_note" placeholder="예: SCHD 분기배당 수령">
      </div>
      <button class="mi-save-btn" onclick="saveDividendEntry()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        배당 기록 저장
      </button>
    </div>

    <!-- ② 가수금 입력 -->
    <div id="mt-loan" class="mt-pane" style="display:none">
      <div class="mt-pane-title">가수금 상환 기록</div>
      <div class="mi-loan-status" id="mi_loan_status_box"></div>
      <div class="mi-row3">
        <div class="mi-field">
          <label>연도</label>
          <select id="mi_loan_year">${Array.from({length:40},(_,i)=>2026+i).map(y=>`<option value="${y}" ${y===new Date().getFullYear()?'selected':''}>${y}</option>`).join('')}</select>
        </div>
        <div class="mi-field">
          <label>월</label>
          <select id="mi_loan_month">${MONTHS_KO.map((m,i)=>`<option value="${i+1}" ${i+1===new Date().getMonth()+1?'selected':''}>${m}</option>`).join('')}</select>
        </div>
      </div>
      <div class="mi-field">
        <label>이번 달 상환액 (원)</label>
        <input type="number" id="mi_loan_amount" value="4000000" step="100000">
      </div>
      <div class="mi-field">
        <label>상환 후 잔액 (원)</label>
        <input type="number" id="mi_loan_balance" placeholder="잔여 가수금">
      </div>
      <div class="mi-field">
        <label>이자 지급액 (원, 해당 시)</label>
        <input type="number" id="mi_loan_interest" placeholder="4.6% 적정이자율">
      </div>
      <div class="mi-field">
        <label>비고</label>
        <input type="text" id="mi_loan_note" placeholder="예: 3월 TLTW 배당으로 충당">
      </div>
      <button class="mi-save-btn" onclick="saveLoanEntry()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        상환 기록 저장
      </button>
    </div>

    <!-- ③ 시세/환율 -->
    <div id="mt-price" class="mt-pane" style="display:none">
      <div class="mt-pane-title">ETF 시세 & 환율 기록</div>
      <div class="mi-field">
        <label>기준일</label>
        <input type="date" id="mi_price_date" value="${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="mi-divider">SCHD</div>
      <div class="mi-row2">
        <div class="mi-field">
          <label>현재가 ($)</label>
          <input type="number" id="mi_schd_price" placeholder="예: 28.50" step="0.01" oninput="calcPortValue()">
        </div>
        <div class="mi-field">
          <label>보유 주수</label>
          <input type="number" id="mi_schd_shares" placeholder="예: 35000" oninput="calcPortValue()">
        </div>
      </div>
      <div class="mi-divider">TLTW</div>
      <div class="mi-row2">
        <div class="mi-field">
          <label>현재가 ($)</label>
          <input type="number" id="mi_tltw_price" placeholder="예: 22.30" step="0.01" oninput="calcPortValue()">
        </div>
        <div class="mi-field">
          <label>보유 주수</label>
          <input type="number" id="mi_tltw_shares" placeholder="예: 17900" oninput="calcPortValue()">
        </div>
      </div>
      <div class="mi-divider">환율</div>
      <div class="mi-row2">
        <div class="mi-field">
          <label>원/달러 환율</label>
          <input type="number" id="mi_fx" value="1380" step="0.1" oninput="calcPortValue()">
        </div>
        <div class="mi-field">
          <label>달러/엔 (참고)</label>
          <input type="number" id="mi_usdjpy" placeholder="예: 155.0" step="0.1">
        </div>
      </div>
      <div class="mi-portfolio-box" id="mi_portfolio_box">
        <div class="mi-port-row"><span>SCHD 평가액</span><span id="mi_schd_eval">—</span></div>
        <div class="mi-port-row"><span>TLTW 평가액</span><span id="mi_tltw_eval">—</span></div>
        <div class="mi-port-row total"><span>법인 포트 총평가</span><span id="mi_port_total">—</span></div>
      </div>
      <button class="mi-save-btn" onclick="savePriceEntry()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        시세 기록 저장
      </button>
    </div>

    <!-- ④ 가정 조정 -->
    <div id="mt-params" class="mt-pane" style="display:none">
      <div class="mt-pane-title">시뮬레이션 가정값 조정</div>
      <div class="mi-hint">변경 후 재계산하면 모든 시트에 즉시 반영됩니다.</div>
      <div class="mi-param-section">SCHD</div>
      <div class="mi-row2">
        <div class="mi-field"><label>주가 상승률 (%/년)</label><input type="number" id="p_schdGrow" step="0.5" value="${(window.APP_PARAMS?.schdGrowth*100||9).toFixed(1)}"></div>
        <div class="mi-field"><label>배당 성장률 (%/년)</label><input type="number" id="p_schdDivG" step="0.5" value="${(window.APP_PARAMS?.schdDivGrowth*100||7).toFixed(1)}"></div>
      </div>
      <div class="mi-row2">
        <div class="mi-field"><label>초기 배당률 (%)</label><input type="number" id="p_schdDivR" step="0.1" value="${(window.APP_PARAMS?.schdDivRate*100||3.3).toFixed(2)}"></div>
        <div class="mi-field"><label>배당 상한 (%)</label><input type="number" id="p_schdCap" step="0.5" value="${(window.APP_PARAMS?.schdDivCap*100||16).toFixed(1)}"></div>
      </div>
      <div class="mi-param-section">TLTW</div>
      <div class="mi-row2">
        <div class="mi-field"><label>초기 배당률 (%)</label><input type="number" id="p_tltwDivR" step="0.1" value="${(window.APP_PARAMS?.tltwDivRate*100||12).toFixed(1)}"></div>
        <div class="mi-field"><label>배당 변동 (%/년)</label><input type="number" id="p_tltwChg" step="0.1" value="${(window.APP_PARAMS?.tltwDivChange*100||-1.5).toFixed(2)}"></div>
      </div>
      <div class="mi-param-section">법인 / 가수금</div>
      <div class="mi-row2">
        <div class="mi-field"><label>가수금 월 상환 (만원)</label><input type="number" id="p_repay" step="10" value="${Math.round((window.APP_PARAMS?.repayAnnual||48000000)/12/10000)}"></div>
        <div class="mi-field"><label>기업가치 PBR 배수</label><input type="number" id="p_pbr" step="0.1" min="0.5" max="5" value="${(window.APP_PARAMS?.pbr||1).toFixed(1)}"></div>
      </div>
      <div class="mi-param-section">원천세</div>
      <div class="mi-row2">
        <div class="mi-field"><label>미국 원천세율 (%)</label><input type="number" id="p_ustax" step="0.5" value="${(window.APP_PARAMS?.usTax*100||15).toFixed(0)}"></div>
      </div>
      <button class="mi-save-btn" onclick="applyParamsAndRecalc()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.1"/></svg>
        적용 및 전체 재계산
      </button>
    </div>

    <!-- ⑤ 메모 -->
    <div id="mt-memo" class="mt-pane" style="display:none">
      <div class="mt-pane-title">투자 메모 / 일지</div>
      <div class="mi-field">
        <label>제목</label>
        <input type="text" id="mi_memo_title" placeholder="예: 2026년 1분기 SCHD 배당 수령">
      </div>
      <div class="mi-field">
        <label>카테고리</label>
        <select id="mi_memo_cat">
          <option value="배당">배당 수령</option>
          <option value="가수금">가수금 상환</option>
          <option value="시세">시세 기록</option>
          <option value="전략">전략 메모</option>
          <option value="기타">기타</option>
        </select>
      </div>
      <div class="mi-field">
        <label>내용</label>
        <textarea id="mi_memo_content" rows="5" placeholder="자유롭게 기록하세요...&#10;예) SCHD 3월 배당 $0.26/주 × 35,000주 = $9,100&#10;세후 환산: ₩10,680,300 수령"></textarea>
      </div>
      <button class="mi-save-btn" onclick="saveMemoEntry()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        메모 저장
      </button>
    </div>

    <!-- ⑥ 기록 조회 -->
    <div id="mt-history" class="mt-pane" style="display:none">
      <div class="mt-pane-title">입력 기록 조회</div>
      <div class="mi-hist-filter">
        <select id="hist_filter" onchange="loadHistory()">
          <option value="all">전체</option>
          <option value="배당">배당 수령</option>
          <option value="가수금">가수금 상환</option>
          <option value="시세">시세 기록</option>
          <option value="메모">메모</option>
        </select>
        <button class="mi-del-all" onclick="clearAllHistory()">전체 삭제</button>
      </div>
      <div id="hist_list" class="mi-hist-list"></div>
    </div>
  `;

  // 초기화
  setTimeout(() => {
    updateLoanStatus();
    calcTotals();
  }, 50);
}

// ── 계산 헬퍼
function calcKrw(type) {
  const usd  = parseFloat(document.getElementById(`mi_${type}_usd`)?.value) || 0;
  const rate = parseFloat(document.getElementById('mi_usd_rate')?.value) || 1380;
  const net  = usd * rate * 0.85;
  const el   = document.getElementById(`mi_${type}_krw`);
  const hint = document.getElementById(`mi_${type}_hint`);
  if (el) el.value = net ? Math.round(net) : '';
  if (hint && usd > 0) hint.textContent = `$${usd.toFixed(2)} × ${rate} × 85% = ₩${Math.round(net).toLocaleString()}`;
  calcTotals();
}

function calcTltwTotal() {
  const perShare = parseFloat(document.getElementById('mi_tltw_per_share')?.value) || 0;
  const rate     = parseFloat(document.getElementById('mi_usd_rate')?.value) || 1380;
  if (perShare > 0) {
    const shares = window.ACTUAL_SHARES?.tltw || 0;
    if (shares > 0) {
      const usdEl = document.getElementById('mi_tltw_usd');
      if (usdEl) { usdEl.value = (perShare * shares).toFixed(2); calcKrw('tltw'); }
    }
  }
  calcTotals();
}

function calcTotals() {
  const schd = parseFloat(document.getElementById('mi_schd_krw')?.value) || 0;
  const tltw = parseFloat(document.getElementById('mi_tltw_krw')?.value) || 0;
  const total = schd + tltw;
  const tb = document.getElementById('mi_total_box');
  const tm = document.getElementById('mi_total_monthly');
  const ta = document.getElementById('mi_total_annual');
  if (tb && total > 0) {
    tb.style.opacity = '1';
    if (tm) tm.textContent = '₩' + Math.round(total).toLocaleString();
    if (ta) ta.textContent = '₩' + Math.round(total * 12).toLocaleString() + '/년';
  }
}

function calcPortValue() {
  const sp = parseFloat(document.getElementById('mi_schd_price')?.value) || 0;
  const ss = parseFloat(document.getElementById('mi_schd_shares')?.value) || 0;
  const tp = parseFloat(document.getElementById('mi_tltw_price')?.value) || 0;
  const ts = parseFloat(document.getElementById('mi_tltw_shares')?.value) || 0;
  const fx = parseFloat(document.getElementById('mi_fx')?.value) || 1380;
  const schdKrw = sp * ss * fx;
  const tltwKrw = tp * ts * fx;
  const total   = schdKrw + tltwKrw;
  const se = document.getElementById('mi_schd_eval');
  const te = document.getElementById('mi_tltw_eval');
  const pt = document.getElementById('mi_port_total');
  if (se) se.textContent = schdKrw ? '₩' + Math.round(schdKrw / 1e8).toFixed(1) + '억' : '—';
  if (te) te.textContent = tltwKrw ? '₩' + Math.round(tltwKrw / 1e8).toFixed(1) + '억' : '—';
  if (pt) pt.textContent = total    ? '₩' + (total / 1e8).toFixed(2) + '억' : '—';
}

function updateLoanStatus() {
  const el = document.getElementById('mi_loan_status_box');
  if (!el) return;
  const rows = window.APP_ROWS || [];
  const init = window.APP_PARAMS?.loanInit || 1_100_000_000;
  const actual = window.LOAN_ENTRIES || [];
  const totalRepaid = actual.reduce((s, e) => s + (e.amount || 0), 0);
  const remaining = Math.max(init - totalRepaid, 0);
  const pct = ((1 - remaining / init) * 100).toFixed(1);
  el.innerHTML = `
    <div class="mi-loan-bar-wrap">
      <div class="mi-loan-bar" style="width:${pct}%"></div>
    </div>
    <div class="mi-loan-nums">
      <span>상환 완료 ₩${(totalRepaid / 1e8).toFixed(2)}억 (${pct}%)</span>
      <span style="color:#A83030">잔여 ₩${(remaining / 1e8).toFixed(2)}억</span>
    </div>
  `;
}

// ── 저장 함수들
window.DIVIDEND_ENTRIES = window.DIVIDEND_ENTRIES || [];
window.LOAN_ENTRIES     = window.LOAN_ENTRIES || [];
window.PRICE_ENTRIES    = window.PRICE_ENTRIES || [];
window.MEMO_ENTRIES     = window.MEMO_ENTRIES || [];

function saveDividendEntry() {
  const yr    = parseInt(document.getElementById('mi_year').value);
  const mo    = parseInt(document.getElementById('mi_month').value);
  const schd  = parseFloat(document.getElementById('mi_schd_krw').value) || 0;
  const tltw  = parseFloat(document.getElementById('mi_tltw_krw').value) || 0;
  const note  = document.getElementById('mi_div_note').value;
  if (!schd && !tltw) { showToast('배당 금액을 입력하세요'); return; }
  const entry = { id: Date.now(), type: '배당', yr, mo, schd, tltw, total: schd + tltw, note, at: new Date().toISOString() };
  window.DIVIDEND_ENTRIES.unshift(entry);
  persistAll();
  showToast(`${yr}년 ${mo}월 배당 저장 ✓  합계 ₩${Math.round(entry.total / 10000)}만`);
  document.getElementById('manualModal').classList.remove('open');
}

function saveLoanEntry() {
  const yr  = parseInt(document.getElementById('mi_loan_year').value);
  const mo  = parseInt(document.getElementById('mi_loan_month').value);
  const amt = parseFloat(document.getElementById('mi_loan_amount').value) || 0;
  const bal = parseFloat(document.getElementById('mi_loan_balance').value) || 0;
  const int = parseFloat(document.getElementById('mi_loan_interest').value) || 0;
  const note = document.getElementById('mi_loan_note').value;
  if (!amt) { showToast('상환액을 입력하세요'); return; }
  window.LOAN_ENTRIES.unshift({ id: Date.now(), type: '가수금', yr, mo, amount: amt, balance: bal, interest: int, note, at: new Date().toISOString() });
  persistAll();
  showToast(`${yr}년 ${mo}월 가수금 상환 저장 ✓`);
  document.getElementById('manualModal').classList.remove('open');
}

function savePriceEntry() {
  const date   = document.getElementById('mi_price_date').value;
  const sPrice = parseFloat(document.getElementById('mi_schd_price').value) || 0;
  const sShares= parseFloat(document.getElementById('mi_schd_shares').value) || 0;
  const tPrice = parseFloat(document.getElementById('mi_tltw_price').value) || 0;
  const tShares= parseFloat(document.getElementById('mi_tltw_shares').value) || 0;
  const fx     = parseFloat(document.getElementById('mi_fx').value) || 1380;
  window.PRICE_ENTRIES.unshift({ id: Date.now(), type: '시세', date, sPrice, sShares, tPrice, tShares, fx, at: new Date().toISOString() });
  window.ACTUAL_SHARES = { schd: sShares, tltw: tShares };
  persistAll();
  showToast(`${date} 시세 저장 ✓`);
  document.getElementById('manualModal').classList.remove('open');
}

function saveMemoEntry() {
  const title   = document.getElementById('mi_memo_title').value.trim();
  const cat     = document.getElementById('mi_memo_cat').value;
  const content = document.getElementById('mi_memo_content').value.trim();
  if (!title) { showToast('제목을 입력하세요'); return; }
  window.MEMO_ENTRIES.unshift({ id: Date.now(), type: '메모', cat, title, content, at: new Date().toISOString() });
  persistAll();
  showToast('메모 저장 ✓');
  document.getElementById('mi_memo_title').value = '';
  document.getElementById('mi_memo_content').value = '';
  switchMT('history'); loadHistory();
}

function applyParamsAndRecalc() {
  const g = id => parseFloat(document.getElementById(id)?.value);
  window.APP_PARAMS = {
    ...window.APP_PARAMS,
    schdGrowth:    g('p_schdGrow') / 100,
    schdDivGrowth: g('p_schdDivG') / 100,
    schdDivRate:   g('p_schdDivR') / 100,
    schdDivCap:    g('p_schdCap')  / 100,
    tltwDivRate:   g('p_tltwDivR') / 100,
    tltwDivChange: g('p_tltwChg')  / 100,
    repayAnnual:   g('p_repay') * 10000 * 12,
    pbr:           g('p_pbr'),
    usTax:         g('p_ustax') / 100,
  };
  recalcAll();
  persistAll();
  showToast('재계산 완료 ✓');
  document.getElementById('manualModal').classList.remove('open');
}

// ── 기록 조회
function loadHistory() {
  const filter  = document.getElementById('hist_filter')?.value || 'all';
  const all = [
    ...window.DIVIDEND_ENTRIES.map(e => ({ ...e, _cat: '배당' })),
    ...window.LOAN_ENTRIES.map(e =>     ({ ...e, _cat: '가수금' })),
    ...window.PRICE_ENTRIES.map(e =>    ({ ...e, _cat: '시세' })),
    ...window.MEMO_ENTRIES.map(e =>     ({ ...e, _cat: '메모' })),
  ].sort((a, b) => b.id - a.id);
  const filtered = filter === 'all' ? all : all.filter(e => e._cat === filter);
  const el = document.getElementById('hist_list');
  if (!el) return;
  if (!filtered.length) { el.innerHTML = '<div class="mi-empty">기록이 없습니다</div>'; return; }
  const colorMap = { 배당: '#4A3AA7', 가수금: '#A83030', 시세: '#1558A0', 메모: '#1A6B3C' };
  el.innerHTML = filtered.map(e => {
    let sub = '';
    if (e._cat === '배당')    sub = `SCHD ₩${Math.round((e.schd||0)/10000)}만 + TLTW ₩${Math.round((e.tltw||0)/10000)}만 = ₩${Math.round((e.total||0)/10000)}만`;
    else if (e._cat === '가수금') sub = `상환 ₩${Math.round((e.amount||0)/10000)}만 / 잔액 ₩${Math.round((e.balance||0)/10000)}만`;
    else if (e._cat === '시세')   sub = `SCHD $${e.sPrice} / TLTW $${e.tPrice} / ${e.fx}원`;
    else sub = e.content?.slice(0, 60) + (e.content?.length > 60 ? '…' : '');
    const dt = e.yr ? `${e.yr}년 ${e.mo}월` : (e.date || new Date(e.at).toLocaleDateString('ko-KR'));
    return `
      <div class="mi-hist-item">
        <div class="mi-hist-badge" style="background:${colorMap[e._cat]}22;color:${colorMap[e._cat]}">${e._cat}</div>
        <div class="mi-hist-body">
          <div class="mi-hist-title">${e.title || dt} ${e.note ? '— '+e.note : ''}</div>
          <div class="mi-hist-sub">${sub}</div>
          <div class="mi-hist-time">${new Date(e.at).toLocaleString('ko-KR')}</div>
        </div>
        <button class="mi-del-btn" onclick="deleteEntry(${e.id})">✕</button>
      </div>
    `;
  }).join('');
}

function deleteEntry(id) {
  window.DIVIDEND_ENTRIES = window.DIVIDEND_ENTRIES.filter(e => e.id !== id);
  window.LOAN_ENTRIES     = window.LOAN_ENTRIES.filter(e => e.id !== id);
  window.PRICE_ENTRIES    = window.PRICE_ENTRIES.filter(e => e.id !== id);
  window.MEMO_ENTRIES     = window.MEMO_ENTRIES.filter(e => e.id !== id);
  persistAll(); loadHistory();
}
function clearAllHistory() {
  if (!confirm('모든 기록을 삭제할까요?')) return;
  window.DIVIDEND_ENTRIES = [];
  window.LOAN_ENTRIES = [];
  window.PRICE_ENTRIES = [];
  window.MEMO_ENTRIES = [];
  persistAll(); loadHistory();
}

// ── 영속성
function persistAll() {
  const data = {
    params: window.APP_PARAMS,
    dividends: window.DIVIDEND_ENTRIES,
    loans: window.LOAN_ENTRIES,
    prices: window.PRICE_ENTRIES,
    memos: window.MEMO_ENTRIES,
    shares: window.ACTUAL_SHARES,
    savedAt: new Date().toISOString()
  };
  localStorage.setItem('uandk_corp_sim_v2', JSON.stringify(data));
  document.getElementById('syncStatus').textContent = '마지막 저장: ' + new Date().toLocaleTimeString('ko-KR');
}

function loadAllPersisted() {
  const raw = localStorage.getItem('uandk_corp_sim_v2') || localStorage.getItem('uandk_corp_sim_v1');
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    if (d.params)    window.APP_PARAMS         = { ...DEFAULT_PARAMS, ...d.params };
    if (d.dividends) window.DIVIDEND_ENTRIES   = d.dividends;
    if (d.loans)     window.LOAN_ENTRIES       = d.loans;
    if (d.prices)    window.PRICE_ENTRIES      = d.prices;
    if (d.memos)     window.MEMO_ENTRIES       = d.memos;
    if (d.shares)    window.ACTUAL_SHARES      = d.shares;
    if (d.savedAt)   document.getElementById('syncStatus').textContent = '마지막 저장: ' + new Date(d.savedAt).toLocaleString('ko-KR');
  } catch(e) { console.warn('load failed', e); }
}
