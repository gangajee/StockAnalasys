// src/db/connection.js
// SQLite DB에 연결하고, 연결된 db 객체를 내보내는 모듈
// 다른 파일에서 import db from './connection.js' 하면 이 객체를 가져다 씀

// better-sqlite3: Node.js에서 SQLite를 사용하게 해주는 라이브러리
// MySQL, PostgreSQL 같은 DB는 네트워크 서버가 필요하지만
// SQLite는 파일 하나로 동작하기 때문에 로컬 개발에 적합함
import Database from "better-sqlite3";

// path: 파일 경로를 OS에 맞게 처리해주는 Node.js 내장 모듈
// Windows는 '\', macOS/Linux는 '/' 를 쓰는데 path가 자동으로 맞춰줌
import path from "path";

// ESM(ES Module)에서는 __dirname이 기본 제공되지 않음
// fileURLToPath + import.meta.url 조합으로 현재 파일의 절대 경로를 구함
import { fileURLToPath } from "url";

// .env 파일의 내용을 process.env에 자동으로 로드
// 예: .env에 DB_PATH=./stock.db 라고 쓰면 process.env.DB_PATH로 읽힘
import "dotenv/config";

// import.meta.url: 현재 파일의 URL (예: file:///Users/.../connection.js)
// fileURLToPath: URL → 일반 파일 경로로 변환
// path.dirname: 파일 경로에서 디렉토리 부분만 추출
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// DB 파일 경로 결정
// ?? (null 병합 연산자): 왼쪽이 null 또는 undefined일 때만 오른쪽 값 사용
// → .env에 DB_PATH가 있으면 그걸 쓰고, 없으면 프로젝트 루트의 stock.db 사용
const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, "../../stock.db");

// DB 연결 생성
// new Database(경로): 해당 경로에 파일이 없으면 자동으로 새로 만들고 연결
// 파일이 이미 있으면 기존 파일에 연결
const db = new Database(DB_PATH);

// SQLite는 성능상의 이유로 외래키(FOREIGN KEY) 기능을 기본적으로 꺼놓음
// pragma는 SQLite의 설정값을 바꾸는 명령
// foreign_keys = ON: 외래키 제약조건을 활성화
// → 이게 없으면 001_init.sql에 FOREIGN KEY를 써놔도 실제로 체크하지 않음
db.pragma("foreign_keys = ON");

export default db;
