/**
 * P0#1 检查微信支付 APIv3 配置是否完整
 * 用法: node scripts/check-payment-config.js
 */
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ 未找到 .env，请先复制 .env.example');
    process.exit(1);
  }
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

function check() {
  loadEnv();
  const required = [
    'WX_APPID',
    'WX_MCH_ID',
    'WX_MCH_SERIAL_NO',
    'WX_API_V3_KEY',
    'WX_NOTIFY_URL',
  ];
  const missing = required.filter((k) => !process.env[k] || process.env[k].startsWith('your_'));

  const keyPath = process.env.WX_MCH_PRIVATE_KEY_PATH;
  const inlineKey = process.env.WX_MCH_PRIVATE_KEY;
  if (!inlineKey && (!keyPath || !fs.existsSync(path.resolve(__dirname, '..', keyPath)))) {
    missing.push('WX_MCH_PRIVATE_KEY 或 WX_MCH_PRIVATE_KEY_PATH');
  }

  if (missing.length === 0) {
    console.log('✅ 微信支付 APIv3 配置完整，可联调真实支付');
    console.log('   回调地址:', process.env.WX_NOTIFY_URL);
    console.log('   健康检查: GET http://127.0.0.1:3000/api/health/payments');
    process.exit(0);
  }

  console.log('⚠️  当前为 mock 模式，以下配置缺失:');
  missing.forEach((m) => console.log('   -', m));
  console.log('\n请参考 apps/server/.env.example 补全后重启后端');
  process.exit(1);
}

check();
