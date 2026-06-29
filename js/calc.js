// ── 시뮬레이션 계산 엔진 (엑셀 수식 JS 구현)
const DEFAULT_PARAMS = {
  schdPrincipal: 1_000_000_000,
  tltwPrincipal: 400_000_000,
  schdGrowth: 0.09,
  schdDivRate: 0.033,
  schdDivGrowth: 0.07,
  schdDivCap: 0.16,
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
  let sAsset = P.schdPrincipal;
  let tAsset = P.tltwPrincipal;
  let sDivY  = P.schdDivRate;
  let tDivY  = P.tltwDivRate;
  let loanBal = P.loanInit;
  let reserve = 0;

  for (let i = 0; i < 41; i++) {
    const age = 60 + i;
    const yr  = 2026 + i;

    // 자산 성장
    sAsset = P.schdPrincipal * Math.pow(1 + P.schdGrowth, i + 1);
    tAsset = P.tltwPrincipal * Math.pow(1 + P.tltwGrowth, i + 1);

    // 배당률 계산
    sDivY = Math.min(P.schdDivRate * Math.pow(1 + P.schdDivGrowth, i), P.schdDivCap);
    tDivY = Math.max(P.tltwDivRate * Math.pow(1 + P.tltwDivChange, i), P.tltwDivFloor);

    const sDiv_gross = sAsset * sDivY;
    const tDiv_gross = tAsset * tDivY;
    const sDiv_net   = sDiv_gross * (1 - P.usTax);
    const tDiv_net   = tDiv_gross * (1 - P.usTax);
    const totalDiv   = sDiv_net + tDiv_net;
    const monthlyDiv = totalDiv / 12;

    // 가수금 상환 (세후 배당으로 우선 충당)
    const actualRepay = Math.min(totalDiv, loanBal, P.repayAnnual);
    loanBal = Math.max(loanBal - actualRepay, 0);
    reserve += Math.max(totalDiv - actualRepay, 0);

    const corpAsset   = sAsset + tAsset + reserve;
    const corpValue   = corpAsset * P.pbr;
    const childShare  = corpValue * 0.80;
    const netMonthly  = totalDiv - actualRepay / 12 * 12;

    rows.push({
      age, yr, i,
      sAsset, tAsset,
      sDiv_gross, tDiv_gross, sDiv_net, tDiv_net,
      totalDiv, monthlyDiv,
      loanBal, actualRepay,
      reserve, corpAsset, corpValue, childShare,
      netMonthly: Math.max(totalDiv - actualRepay, 0),
      sDivY, tDivY
    });
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
