import db from "./connection.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(
  path.join(__dirname, "migrations/001_init.sql"),
  "utf-8",
);

db.exec(sql);
console.log("테이블 생성 완료");
