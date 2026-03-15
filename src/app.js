// src/app.js
// [Phase 5] Express 앱 진입점

import express from 'express';
import 'dotenv/config';
import companiesRouter from './routes/companies.js';
import recommendRouter from './routes/recommend.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

// ─────────────────────────────────────────
// 미들웨어
// ─────────────────────────────────────────
// [학습] express.json(): 요청 body를 JSON으로 파싱해 req.body에 넣어줌
app.use(express.json());

// ─────────────────────────────────────────
// 라우터
// ─────────────────────────────────────────
// [학습] app.use('/api/companies', router) → router 내부의 '/'가 '/api/companies'로 마운트됨
app.use('/api/companies', companiesRouter);
app.use('/api/recommend', recommendRouter);

// ─────────────────────────────────────────
// 전역 에러 핸들러
// ─────────────────────────────────────────
// [학습] Express는 인자가 4개(err, req, res, next)인 미들웨어를 에러 핸들러로 인식
// 라우터에서 next(err)를 호출하면 여기로 떨어짐
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});

export default app;
