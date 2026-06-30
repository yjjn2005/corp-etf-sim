// ── 시뮬레이션 계산 엔진
//
// 계산 기준 (수정 #3, #4 명확화):
//  - "기초자산 기준" 적용: 매 해의 배당은 "그 해 시작 시점의 자산"에 대해 계산
//  - 1년차(만60세, 2026년)는 투자원금 그대로 기준 → 원금 10억에 3.3% = 3,300만원 배당
//  - 그 해 말에 자산이 성장(다음 해 시작 자산이 됨)
//  - 만100세는 2026+40=2066년 (수정 #4: 기존 2065년 표기 오류 수정)
const DEFAULT_PARAMS = {
  schdPrincipal: 1_000_000_000,
  tltwPrincipal: 400_000_000,
  schdGrowth: 0.05,
  schdDivRate: 0.033,
  schdDivGrowth: 0.05,
  schdDivCap: 0.12,
  tltwGrowth: 0.00,
  tltwDivRate: 0.12,
  tltwDivChange: -0.015,
  tltwDivFloor: 0.08,
  usTax: 0.15,
  loanInit: 1_100_000_000,
  repayAnnual: 48_000_000,
  pbr: 1.0,
  shareholders: { A: 0.25, B: 0.25, C: 0.30, dad: 0.05, mom: 0.05 }
};

function runSimulation(p = {}) {
  const P = { ...DEFAULT_PARAMS, ...p };
  const rows = [];

  // 기초자산(그 해 시작 시점) — 1년차는 투자원금 그대로
  let sAsset_begin = P.schdPrincipal;
  let tAsset_begin = P.tltwPrincipal;
  let loanBal = P.loanInit;
  let reserve = 0;

  for (let i = 0; i < 41; i++) {
    const age = 60 + i;
    const yr  = 2026 + i;   // 만60세=2026년, 만100세=2066년(수정#4)

    // ── 배당률: i번째 해의 배당수익률 (i=0이 첫해, 원금 기준 배당률)
    const sDivY = Math.min(P.schdDivRate * Math.pow(1 + P.schdDivGrowth, i), P.schdDivCap);
    const tDivY = Math.max(P.tltwDivRate * Math.pow(1 + P.tltwDivChange, i), P.tltwDivFloor);

    // ── 배당 = 기초자산 × 배당률 (수정#3: 원금 기준 첫해 배당 정확화)
    const sDiv_gross = sAsset_begin * sDivY;
    const tDiv_gross = tAsset_begin * tDivY;
    const sDiv_net   = sDiv_gross * (1 - P.usTax);
    const tDiv_net   = tDiv_gross * (1 - P.usTax);
    const totalDiv   = sDiv_net + tDiv_net;
    const monthlyDiv = totalDiv / 12;

    // ── 가수금 상환 (세후 배당으로 우선 충당, 한도 내)
    const actualRepay = Math.min(totalDiv, loanBal, P.repayAnnual);
    loanBal = Math.max(loanBal - actualRepay, 0);
    reserve += Math.max(totalDiv - actualRepay, 0);

    // ── 기말자산 = 기초자산 × (1+성장률) — 다음 해의 기초자산이 됨
    const sAsset_end = sAsset_begin * (1 + P.schdGrowth);
    const tAsset_end = tAsset_begin * (1 + P.tltwGrowth);

    const corpAsset  = sAsset_end + tAsset_end + reserve;
    const corpValue  = corpAsset * P.pbr;
    const childShare = corpValue * 0.80;

    rows.push({
      age, yr, i,
      sAsset: sAsset_end, tAsset: tAsset_end,        // 표시용 = 기말자산(연말 평가액)
      sAsset_begin, tAsset_begin,                      // 그 해 배당 산정 기준 자산
      sDiv_gross, tDiv_gross, sDiv_net, tDiv_net,
      totalDiv, monthlyDiv,
      loanBal, actualRepay,
      reserve, corpAsset, corpValue, childShare,
      sDivY, tDivY
    });

    // 다음 해 기초자산 업데이트
    sAsset_begin = sAsset_end;
    tAsset_begin = tAsset_end;
  }
  return rows;
}

// 숫자 포맷 헬퍼
function fw(v) {
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(2) + '십억';
  if (Math.abs(v) >= 1e8) return (v / 1e8).toFixed(1) + '억';
  if (Math.abs(v) >= 1e7) return (v / 1e7).toFixed(1) + '천만';
  return Math.round(v / 10000).toLocaleString() + '만';
}
function fwFull(v) { return '₩' + Math.round(v).toLocaleString(); }
function fw2(v)    { return '₩' + fw(v); }
function fpct(v)   { return (v * 100).toFixed(1) + '%'; }
