-- ============================================================
-- [학습] DDL(Data Definition Language): 테이블 구조를 정의하는 SQL
--        CREATE / ALTER / DROP 등이 여기에 해당
-- ============================================================


-- ────────────────────────────────────────
-- 1. companies (종목 기본 정보)
-- ────────────────────────────────────────
-- [학습] PRIMARY KEY: 각 행을 고유하게 식별하는 컬럼
-- [학습] AUTOINCREMENT: 행을 삽입할 때마다 id가 1씩 자동 증가
--        → 직접 id 값을 지정하지 않아도 됨
-- [학습] UNIQUE: 같은 값을 두 번 넣으면 에러 발생
--        → ticker는 종목 코드(AAPL, MSFT 등)이므로 중복 불가
-- [학습] NOT NULL: 이 컬럼은 반드시 값이 있어야 함
--        → ticker 없이 종목을 저장하는 건 의미가 없으므로 NOT NULL
-- [학습] DEFAULT CURRENT_TIMESTAMP: 값을 따로 지정하지 않으면
--        DB가 현재 시각을 자동으로 채워줌
CREATE TABLE companies (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker      TEXT NOT NULL UNIQUE,   -- 종목 코드 (예: 'AAPL')
  name        TEXT,                   -- 기업명 (예: 'Apple Inc.')
  sector      TEXT,                   -- 섹터 (예: 'Technology')
  industry    TEXT,                   -- 산업군 (예: 'Consumer Electronics')
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- ────────────────────────────────────────
-- 2. stock_prices (일별 주가)
-- ────────────────────────────────────────
-- [학습] REAL: 소수점이 있는 숫자 (주가는 소수점 있음 → REAL)
--        INTEGER: 정수만 저장 (거래량은 소수점 없음 → INTEGER)
-- [학습] UNIQUE(ticker, date): 두 컬럼의 조합이 유일해야 함
--        → 같은 종목(ticker)의 같은 날짜(date) 데이터를 중복 삽입 방지
--        → 예: ('AAPL', '2024-01-01')은 한 번만 저장 가능
-- [학습] FOREIGN KEY: 다른 테이블의 컬럼을 참조
--        → ticker가 companies 테이블에 없는 값이면 삽입 거부
--        → 이를 "참조 무결성"이라고 함
CREATE TABLE stock_prices (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker      TEXT NOT NULL,
  date        DATE NOT NULL,   -- 날짜 (예: '2024-01-15')
  open        REAL,            -- 시가
  high        REAL,            -- 고가
  low         REAL,            -- 저가
  close       REAL,            -- 종가 (가장 많이 사용)
  volume      INTEGER,         -- 거래량
  UNIQUE(ticker, date),
  FOREIGN KEY (ticker) REFERENCES companies(ticker)
);


-- ────────────────────────────────────────
-- 3. financials (재무제표 원시 데이터)
-- ────────────────────────────────────────
-- [학습] period 컬럼을 TEXT로 저장하는 이유:
--        '2024Q4'(4분기), '2024FY'(연간) 같은 형식을 하나의 컬럼으로 표현
--        날짜 타입으로는 분기 구분이 어렵기 때문
-- [학습] UNIQUE(ticker, period): 동일 종목의 동일 분기 데이터 중복 방지
--        → ('AAPL', '2024Q4')는 딱 한 행만 존재
-- [학습] 원시 데이터(raw data)를 별도 테이블에 보관하는 이유:
--        계산에 오류가 생겨도 원본 데이터는 보존되어 있어 재계산 가능
CREATE TABLE financials (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker             TEXT NOT NULL,
  period             TEXT NOT NULL,    -- 예: '2024Q4', '2024FY'
  revenue            REAL,            -- 매출액
  net_income         REAL,            -- 순이익 (음수면 적자)
  total_assets       REAL,            -- 총자산
  total_equity       REAL,            -- 자기자본 (총자산 - 총부채)
  total_debt         REAL,            -- 총부채
  operating_income   REAL,            -- 영업이익
  shares_outstanding INTEGER,         -- 발행 주식수
  UNIQUE(ticker, period),
  FOREIGN KEY (ticker) REFERENCES companies(ticker)
);


-- ────────────────────────────────────────
-- 4. calculated_indicators (계산된 재무 지표)
-- ────────────────────────────────────────
-- [학습] 파생 데이터(derived data)를 원시 데이터와 분리하는 설계 이유:
--        1) 계산 공식이 바뀌면 이 테이블만 재계산하면 됨
--        2) financials 테이블은 항상 원본을 유지
--        3) SELECT 시 매번 계산하지 않아도 되어 성능 향상
-- [학습] updated_at: 언제 마지막으로 계산했는지 추적
--        → 데이터가 최신인지 확인할 때 사용
CREATE TABLE calculated_indicators (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker      TEXT NOT NULL,
  period      TEXT NOT NULL,
  per         REAL,   -- PER  = 주가 / EPS         (낮을수록 저평가)
  pbr         REAL,   -- PBR  = 주가 / BPS         (1 미만이면 자산 대비 저평가)
  roe         REAL,   -- ROE  = 순이익 / 자기자본  (높을수록 수익성 좋음)
  roa         REAL,   -- ROA  = 순이익 / 총자산    (자산 활용 효율)
  debt_ratio  REAL,   -- 부채비율 = 총부채 / 자기자본
  op_margin   REAL,   -- 영업이익률 = 영업이익 / 매출액
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ticker, period)
);


-- ────────────────────────────────────────
-- 5. 인덱스 (검색 속도 최적화)
-- ────────────────────────────────────────
-- [학습] 인덱스가 없으면: DB가 전체 행을 하나씩 훑음 (Full Table Scan)
-- [학습] 인덱스가 있으면: 책의 목차처럼 바로 위치를 찾아감 (Index Scan)
-- [학습] WHERE ticker = 'AAPL' 같은 쿼리가 자주 실행되므로
--        ticker 컬럼에 인덱스를 만들면 조회 속도가 크게 향상됨
-- [학습] 단점: 인덱스도 저장 공간을 차지하고 INSERT 시 약간 느려짐
--        → 자주 조회되는 컬럼에만 선택적으로 생성
CREATE INDEX idx_stock_prices_ticker ON stock_prices(ticker);
CREATE INDEX idx_financials_ticker   ON financials(ticker);