// src/app.js
// [Phase 5] Express 앱 진입점
// TODO: 미들웨어, 라우터, 전역 에러 핸들러 등록

import express from 'express';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT ?? 3000;

// TODO: 미들웨어 등록 (express.json 등)
// TODO: 라우터 등록 (/api/companies, /api/recommend)
// TODO: 전역 에러 핸들링 미들웨어

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});

export default app;