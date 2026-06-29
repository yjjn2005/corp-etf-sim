# 법인 ETF 100세 시뮬레이터 — 유앤김 자산관리

> 1966년생(만60세) → 만100세 | SCHD ₩10억 + TLTW ₩4억 | 법인 투자 시뮬레이터

## 배포 URL
```
https://yjjn2005.github.io/corp-etf-sim/
```

## 기능
- **요약 대시보드** — KPI 카드 + 차트 + 이정표
- **가정 설정** — 모든 투자 파라미터 실시간 수정 및 재계산
- **40년 시뮬레이션** — 연도별 자산·배당·가수금 테이블
- **월현금흐름** — 세후 배당으로 가수금 우선 충당 구조
- **자녀지분가치** — 80/85/90/95/100세 기준 주주별 지분 시각화
- **수동 입력** — 실제 배당수령액, 가수금 상환액, 주가 기록
- **로컬 저장/동기화** — localStorage 기반 자동 저장

## GitHub Pages 배포 방법
1. `yjjn2005` 계정에 `corp-etf-sim` 레포지토리 생성
2. 이 폴더 내용을 Push
3. Settings → Pages → Source: GitHub Actions 선택
4. Actions 탭에서 배포 확인

## 파일 구조
```
corp-sim-app/
├── index.html        # 메인 앱
├── manifest.json     # PWA 설정
├── css/style.css     # 스타일
├── js/
│   ├── calc.js       # 시뮬레이션 계산 엔진
│   ├── render.js     # 화면 렌더링
│   ├── sync.js       # 저장/동기화
│   └── app.js        # 앱 메인
└── .github/workflows/deploy.yml  # 자동 배포
```

<!-- deploy trigger -->