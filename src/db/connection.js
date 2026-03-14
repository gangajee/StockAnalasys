// src/db/connection.js
// [Phase 1] SQLite 연결 모듈
// TODO: better-sqlite3로 DB 연결 설정

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, '../../stock.db');

// TODO: DB 연결 및 외래키 활성화 구현
const db = null;

export default db;