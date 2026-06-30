/**
 * 自动创建 MySQL 数据库（若不存在）
 * DB_TYPE=sqlite 时自动跳过
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  });
}

async function main() {
  loadEnv();

  if ((process.env.DB_TYPE || 'mysql') !== 'mysql') {
    console.log('DB_TYPE 非 mysql，跳过数据库初始化');
    return;
  }

  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USERNAME || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_DATABASE || 'csnews';

  console.log(`连接 MySQL ${host}:${port}，创建数据库 ${database}...`);

  const conn = await mysql.createConnection({ host, port, user, password });
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await conn.end();

  console.log('MySQL 数据库就绪');
}

main().catch((err) => {
  console.error('MySQL 初始化失败:', err.message);
  console.error('请检查 apps/server/.env 中的 DB_HOST / DB_USERNAME / DB_PASSWORD');
  process.exit(1);
});
