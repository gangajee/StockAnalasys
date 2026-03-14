# 📊 주식 재무 지표 자동 수집 및 수리적 분석 파이프라인

> **과제 1 | 개인 학습 로드맵 기획안**
> 작성일: 2026-03-13
> **학습 목표: JavaScript · Node.js · SQL 핵심 역량 확립**
> 기술 스택: Node.js · SQL (SQLite → PostgreSQL) · JavaScript · 벡터 유사도 알고리즘

---

## 1. 프로젝트 개요

### 1.1 한 줄 요약

원시 재무 데이터를 수집·가공하여 PER/PBR 등 핵심 지표를 JS로 직접 계산하고, SQL로 관리하며, Node.js 기반 추천 API를 구축하는 **학습 중심 백엔드 파이프라인**.

### 1.2 이 프로젝트로 무엇을 배우는가

이 프로젝트의 핵심은 **완성된 결과물**보다 **각 기술을 실전에서 익히는 과정**이다. 세 기술이 유기적으로 맞물리는 구조를 직접 만들어보면서 다음을 체득한다.

| 기술           | 이 프로젝트에서 배우는 것                                               |
| -------------- | ----------------------------------------------------------------------- |
| **JavaScript** | 비동기 처리(async/await), 순수 함수 설계, 수식의 코드화, 배열/객체 조작 |
| **Node.js**    | 모듈 시스템(ESM), HTTP 요청, 파일 I/O, 이벤트 루프, 스케줄링            |
| **SQL**        | 스키마 설계, CRUD, JOIN, 집계 쿼리, 인덱스, 트랜잭션                    |

---

## 2. 기술 스택 및 선택 근거

| 구분      | 선택 기술            | 학습 관점에서의 근거                                            |
| --------- | -------------------- | --------------------------------------------------------------- |
| 런타임    | Node.js (v20+)       | 비동기 I/O 원리를 직접 체감하기 가장 좋은 환경                  |
| 언어      | JavaScript (ES2022+) | 동기·비동기 코드를 같은 언어로 작성하며 차이를 학습             |
| DB (개발) | SQLite               | 설치 없이 파일 하나로 SQL 전체 문법 연습 가능                   |
| DB (확장) | PostgreSQL           | SQLite와 문법 호환, 실무 DB로 자연스럽게 이전                   |
| API 서버  | Express.js           | 미들웨어 개념·라우팅·에러 핸들링을 가장 명시적으로 배울 수 있음 |
| HTTP 요청 | axios                | Promise 기반 인터페이스로 async/await 패턴 학습에 적합          |
| 벡터 연산 | 순수 JS (직접 구현)  | 라이브러리 없이 수식을 코드로 옮기는 연습이 핵심                |
| 스케줄러  | node-cron            | Node.js 이벤트 루프와 타이머 개념 실습                          |
| 테스트    | Jest                 | 함수 단위 테스트를 통해 "올바른 JS 함수"를 정의하는 습관 형성   |

---

## 3. 핵심 기능 및 구현 계획

### Phase 1 — SQL: 스키마 설계 및 데이터 적재

**이 Phase에서 SQL의 무엇을 배우는가:**

- CREATE TABLE, 데이터 타입, PRIMARY KEY, UNIQUE 제약조건
- INSERT, SELECT, UPDATE, DELETE (CRUD 전체)
- JOIN으로 테이블 간 관계 탐색
- 인덱스의 필요성과 생성 방법

**DB 스키마 설계 (학습 포인트 주석 포함):**

```sql
-- [학습] PRIMARY KEY와 AUTOINCREMENT의 차이 이해
-- [학습] UNIQUE 제약조건으로 중복 삽입 방지
CREATE TABLE companies (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker      TEXT NOT NULL UNIQUE,
  name        TEXT,
  sector      TEXT,
  industry    TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- [학습] 복합 UNIQUE (ticker + date)로 같은 날짜 중복 적재 방지
-- [학습] REAL vs INTEGER 타입 선택 기준
CREATE TABLE stock_prices (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker      TEXT NOT NULL,
  date        DATE NOT NULL,
  open        REAL,
  high        REAL,
  low         REAL,
  close       REAL,
  volume      INTEGER,
  UNIQUE(ticker, date),
  FOREIGN KEY (ticker) REFERENCES companies(ticker)
);

-- [학습] FOREIGN KEY로 테이블 간 참조 무결성 설정
-- [학습] 기간 표현을 TEXT로 정규화하는 설계 결정
CREATE TABLE financials (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker             TEXT NOT NULL,
  period             TEXT NOT NULL,  -- '2024Q4', '2024FY'
  revenue            REAL,
  net_income         REAL,
  total_assets       REAL,
  total_equity       REAL,
  total_debt         REAL,
  operating_income   REAL,
  shares_outstanding INTEGER,
  UNIQUE(ticker, period),
  FOREIGN KEY (ticker) REFERENCES companies(ticker)
);

-- [학습] 계산 결과를 별도 테이블로 분리하는 이유:
--        원시 데이터와 파생 데이터를 구분하여 재계산 용이
CREATE TABLE calculated_indicators (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker      TEXT NOT NULL,
  period      TEXT NOT NULL,
  per         REAL,
  pbr         REAL,
  roe         REAL,
  roa         REAL,
  debt_ratio  REAL,
  op_margin   REAL,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ticker, period)
);

-- [학습] 자주 조회되는 컬럼에 인덱스 생성 → 쿼리 속도 비교 실습
CREATE INDEX idx_stock_prices_ticker ON stock_prices(ticker);
CREATE INDEX idx_financials_ticker   ON financials(ticker);
```

**SQL 실습 쿼리 예시 (직접 작성해볼 것):**

```sql
-- 1. 특정 종목의 최근 5일 주가 조회 (ORDER BY, LIMIT)
SELECT date, close, volume
FROM stock_prices
WHERE ticker = 'AAPL'
ORDER BY date DESC
LIMIT 5;

-- 2. 섹터별 평균 PER 집계 (JOIN + GROUP BY + AVG)
SELECT c.sector, AVG(ci.per) AS avg_per, COUNT(*) AS company_count
FROM calculated_indicators ci
JOIN companies c ON ci.ticker = c.ticker
WHERE ci.per IS NOT NULL AND ci.per > 0
GROUP BY c.sector
ORDER BY avg_per ASC;

-- 3. PER 낮고 ROE 높은 종목 스크리닝 (WHERE 복합 조건)
SELECT ci.ticker, c.name, ci.per, ci.roe
FROM calculated_indicators ci
JOIN companies c ON ci.ticker = c.ticker
WHERE ci.per BETWEEN 5 AND 15
  AND ci.roe > 15
ORDER BY ci.roe DESC;
```

**구현 체크리스트:**

- [ ] SQLite 연결 모듈 작성 (`src/db/connection.js`)
- [ ] 마이그레이션 스크립트로 테이블 생성
- [ ] 데이터 수집 모듈: axios로 API 호출 후 DB 삽입
- [ ] INSERT OR IGNORE / ON CONFLICT 처리로 멱등성 확보
- [ ] 직접 SQL 쿼리 작성 연습 (ORM 미사용 권장)

---

### Phase 2 — JavaScript: 재무 지표 직접 계산

**이 Phase에서 JS의 무엇을 배우는가:**

- 순수 함수(pure function) 설계 원칙
- 예외 처리와 방어적 프로그래밍
- 배열 고차 함수 (`map`, `filter`, `reduce`)
- 모듈 분리와 `export`/`import`

**핵심 지표 수식:**

| 지표       | 수식                    | 학습 포인트           |
| ---------- | ----------------------- | --------------------- |
| EPS        | 순이익 ÷ 발행주식수     | null/0 방어 처리      |
| PER        | 현재 주가 ÷ EPS         | 적자(EPS<0) 예외 처리 |
| BPS        | 자기자본 ÷ 발행주식수   | 음수 자기자본 처리    |
| PBR        | 현재 주가 ÷ BPS         | 부채 초과 기업 처리   |
| ROE        | 순이익 ÷ 자기자본 × 100 | % 단위 변환           |
| ROA        | 순이익 ÷ 총자산 × 100   | 자산 0 방어           |
| 부채비율   | 총부채 ÷ 자기자본 × 100 | 음수 자기자본 처리    |
| 영업이익률 | 영업이익 ÷ 매출 × 100   | 매출 0 방어           |

**구현 예시 (학습 주석 포함):**

```javascript
// src/calculators/indicators.js

// [학습] 순수 함수: 동일 입력 → 동일 출력, 부수효과 없음
// [학습] 방어적 프로그래밍: 유효하지 않은 입력은 null 반환

export function calcEPS(netIncome, sharesOutstanding) {
  // [학습] null 병합 연산자(??)와 단축 평가(&&) 활용
  if (!sharesOutstanding || sharesOutstanding <= 0) return null;
  return netIncome / sharesOutstanding;
}

export function calcPER(price, netIncome, sharesOutstanding) {
  const eps = calcEPS(netIncome, sharesOutstanding);
  // [학습] 적자 기업(EPS <= 0)은 PER 의미 없음 → null
  if (eps === null || eps <= 0) return null;
  return price / eps;
}

export function calcPBR(price, totalEquity, sharesOutstanding) {
  if (!sharesOutstanding || sharesOutstanding <= 0) return null;
  const bps = totalEquity / sharesOutstanding;
  // [학습] bps가 0이면 0 나누기 발생 → 처리 필요
  if (bps === 0) return null;
  return price / bps;
}

export function calcROE(netIncome, totalEquity) {
  if (!totalEquity || totalEquity === 0) return null;
  return (netIncome / totalEquity) * 100;
}

// [학습] 여러 지표를 한 번에 계산하는 집약 함수
// [학습] 구조 분해 할당(destructuring)으로 가독성 향상
export function calcAllIndicators({
  price,
  netIncome,
  totalEquity,
  totalAssets,
  totalDebt,
  operatingIncome,
  revenue,
  sharesOutstanding,
}) {
  return {
    eps: calcEPS(netIncome, sharesOutstanding),
    per: calcPER(price, netIncome, sharesOutstanding),
    pbr: calcPBR(price, totalEquity, sharesOutstanding),
    roe: calcROE(netIncome, totalEquity),
    roa: totalAssets ? (netIncome / totalAssets) * 100 : null,
    debtRatio: totalEquity ? (totalDebt / totalEquity) * 100 : null,
    opMargin: revenue ? (operatingIncome / revenue) * 100 : null,
  };
}
```

**Jest 테스트 예시:**

```javascript
// tests/indicators.test.js
// [학습] 단위 테스트: 함수가 "올바르게" 작동하는지 증명하는 문서

import {
  calcPER,
  calcROE,
  calcAllIndicators,
} from "../src/calculators/indicators.js";

describe("calcPER", () => {
  test("정상 케이스: 주가 50000, 순이익 5000, 주식수 10", () => {
    expect(calcPER(50000, 5000, 10)).toBeCloseTo(10); // PER = 10
  });

  test("적자 기업은 null 반환", () => {
    expect(calcPER(50000, -1000, 10)).toBeNull();
  });

  test("발행주식수 0이면 null 반환", () => {
    expect(calcPER(50000, 5000, 0)).toBeNull();
  });
});
```

**구현 체크리스트:**

- [ ] 지표별 순수 함수 구현
- [ ] 모든 엣지 케이스 Jest 테스트 통과
- [ ] `calcAllIndicators()`로 일괄 계산 후 DB 적재
- [ ] `Array.map()`으로 여러 종목 일괄 처리

---

### Phase 3 — Node.js: Express API 서버 + 벡터 유사도

**이 Phase에서 Node.js의 무엇을 배우는가:**

- Express.js 미들웨어 체인 이해
- 라우터 분리로 모듈화
- async/await + try-catch 에러 핸들링 패턴
- 요청(Request) / 응답(Response) 사이클
- 이벤트 기반 스케줄링 (node-cron)

**벡터 유사도 알고리즘 (순수 JS):**

```javascript
// src/similarity/vectorUtils.js
// [학습] 수학 개념(내적, 크기, 코사인)을 JS 배열 연산으로 표현

// z-score 정규화: 서로 단위가 다른 지표들을 같은 스케일로
// [학습] Array.reduce()로 통계량 계산, Array.map()으로 변환
export function zScoreNormalize(data) {
  const keys = Object.keys(data[0]).filter((k) => k !== "ticker");
  const stats = {};

  for (const key of keys) {
    const vals = data.map((d) => d[key]).filter((v) => v != null && !isNaN(v));
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance =
      vals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / vals.length;
    stats[key] = { mean, std: Math.sqrt(variance) };
  }

  return data.map((d) => {
    const normalized = { ticker: d.ticker };
    for (const key of keys) {
      const { mean, std } = stats[key];
      normalized[key] = d[key] != null && std > 0 ? (d[key] - mean) / std : 0;
    }
    return normalized;
  });
}

// 코사인 유사도
// [학습] 두 벡터가 같은 방향일수록 1에 가까움 (범위: -1 ~ 1)
export function cosineSimilarity(vecA, vecB) {
  const keys = Object.keys(vecA).filter((k) => k !== "ticker");
  const dot = keys.reduce((sum, k) => sum + vecA[k] * vecB[k], 0);
  const magA = Math.sqrt(keys.reduce((sum, k) => sum + vecA[k] ** 2, 0));
  const magB = Math.sqrt(keys.reduce((sum, k) => sum + vecB[k] ** 2, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

// 상위 N개 유사 기업 반환
export function findTopSimilar(targetTicker, allVectors, topN = 5) {
  const target = allVectors.find((v) => v.ticker === targetTicker);
  if (!target) return [];

  return allVectors
    .filter((v) => v.ticker !== targetTicker)
    .map((v) => ({ ticker: v.ticker, similarity: cosineSimilarity(target, v) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN);
}
```

**Express 라우터 예시:**

```javascript
// src/routes/recommend.js
// [학습] async 라우트 핸들러 + try-catch 에러 전파 패턴

import { Router } from "express";
import { getIndicators } from "../db/queries.js";
import { zScoreNormalize, findTopSimilar } from "../similarity/vectorUtils.js";

const router = Router();

// GET /api/recommend/:ticker?top=5
router.get("/:ticker", async (req, res, next) => {
  try {
    const { ticker } = req.params;
    const topN = parseInt(req.query.top) || 5;

    // [학습] DB에서 데이터 읽기 → 정규화 → 유사도 계산 파이프라인
    const allIndicators = await getIndicators();
    const normalized = zScoreNormalize(allIndicators);
    const similar = findTopSimilar(ticker, normalized, topN);

    if (similar.length === 0) {
      return res.status(404).json({ error: `Ticker '${ticker}' not found` });
    }

    res.json({ ticker, recommendations: similar });
  } catch (err) {
    next(err); // [학습] 에러를 다음 미들웨어로 전파
  }
});

export default router;
```

**API 엔드포인트 설계:**

```
GET  /api/companies                → 전체 종목 목록 + 지표
GET  /api/companies/:ticker        → 종목 상세 + 계산된 지표
GET  /api/recommend/:ticker?top=5  → 유사 기업 추천 (코사인 유사도 상위 N)
GET  /api/sector/:sector           → 섹터별 지표 비교
POST /api/screen                   → 지표 조건 필터 스크리닝
```

**구현 체크리스트:**

- [ ] Express 앱 기본 구조 (`app.js`, 미들웨어 등록)
- [ ] 라우터 분리: `routes/companies.js`, `routes/recommend.js`
- [ ] 전역 에러 핸들링 미들웨어 구현
- [ ] node-cron으로 매일 자정 데이터 수집 자동화
- [ ] `Promise.all()`로 여러 종목 병렬 수집

---

## 4. 프로젝트 폴더 구조

```
stock-pipeline/
├── src/
│   ├── collectors/          # Node.js: HTTP 요청, 비동기 데이터 수집
│   │   ├── stockPrice.js    # 주가 수집
│   │   └── financials.js    # 재무제표 수집
│   ├── db/                  # SQL: 연결, 마이그레이션, 쿼리
│   │   ├── connection.js    # SQLite 연결
│   │   ├── queries.js       # SQL 쿼리 함수 모음
│   │   └── migrations/      # 테이블 생성 SQL 파일
│   ├── calculators/         # JS: 순수 함수로 지표 계산
│   │   └── indicators.js
│   ├── similarity/          # JS: 벡터 연산 (수식 → 코드)
│   │   └── vectorUtils.js
│   ├── routes/              # Node.js: Express 라우터
│   │   ├── companies.js
│   │   └── recommend.js
│   └── app.js               # Node.js: Express 앱 진입점
├── scheduler.js             # Node.js: node-cron 스케줄
├── tests/                   # JS: Jest 단위 테스트
│   ├── indicators.test.js
│   └── vectorUtils.test.js
├── .env.example
├── package.json
└── README.md
```

---

## 5. 학습 중심 개발 로드맵

| 주차   | 작업                                | 집중 학습 기술                       |
| ------ | ----------------------------------- | ------------------------------------ |
| Week 1 | 환경 세팅, SQLite 연결, 테이블 생성 | **SQL** (DDL, 스키마 설계)           |
| Week 2 | 데이터 수집 모듈, DB 삽입           | **Node.js** (async/await, axios)     |
| Week 3 | 재무 지표 계산 함수 + Jest 테스트   | **JS** (순수 함수, 테스트)           |
| Week 4 | 벡터 유사도 알고리즘 구현           | **JS** (배열 고차 함수, 수식 구현)   |
| Week 5 | Express API 서버 구축               | **Node.js** (라우터, 미들웨어)       |
| Week 6 | 스케줄러 연동 + SQL 쿼리 최적화     | **Node.js** + **SQL** (인덱스, JOIN) |

---

## 6. 기술별 학습 체크포인트

**JavaScript**

- [ ] 동기 함수와 비동기 함수의 차이를 설명할 수 있다
- [ ] `map` / `filter` / `reduce`를 for문 없이 자유롭게 쓴다
- [ ] 순수 함수와 부수효과를 구분하여 설계한다
- [ ] 구조 분해 할당, 스프레드 연산자를 자연스럽게 활용한다

**Node.js**

- [ ] `async/await`와 `Promise`의 관계를 설명할 수 있다
- [ ] Express 미들웨어 체인의 흐름을 그림으로 그릴 수 있다
- [ ] `try-catch-next(err)`로 에러를 일관되게 처리한다
- [ ] `Promise.all()`로 병렬 비동기 작업을 처리한다

**SQL**

- [ ] JOIN의 종류(INNER, LEFT, RIGHT)를 상황에 맞게 선택한다
- [ ] GROUP BY + 집계 함수(AVG, COUNT, SUM)를 자유롭게 쓴다
- [ ] 인덱스가 없을 때와 있을 때 쿼리 속도 차이를 직접 측정한다
- [ ] 트랜잭션이 왜 필요한지 설명하고 코드로 구현한다

---

## 7. API 한계 이해 및 극복 전략

| 한계             | 내용                           | 극복 방법                       |
| ---------------- | ------------------------------ | ------------------------------- |
| 호출 횟수 제한   | 무료 API 일 500회 제한         | 로컬 DB 캐싱 + 증분 업데이트    |
| 계산 방식 불투명 | API가 어떤 공식인지 알 수 없음 | 원시 데이터로 직접 계산         |
| 데이터 누락      | 소형주 데이터 부재             | null 처리 로직 + 누락 로그 관리 |
| 지연 데이터      | 무료 플랜 15분~1일 지연        | 용도에 따라 허용 범위 정의      |

---

_이 기획안은 JS · Node.js · SQL 학습을 목적으로 한 개인 로드맵입니다._
