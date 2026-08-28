/**
 * 小程序 API 地址配置
 * - 开发者工具模拟器：用 127.0.0.1（勿用 localhost，部分 Windows 环境 localhost 不通）
 * - 真机调试：改为电脑局域网 IP，如 http://192.168.1.100:3000/api
 */
module.exports = {
  // 默认指向本机后端（微信开发者工具模拟器适用）
  // 真机调试请改为电脑局域网 IP（例：http://192.168.1.100:3000/api）
  apiBase: 'http://127.0.0.1:3000/api',
  // 连接失败时依次尝试（保留局域网 IP 供真机使用）
  apiBaseCandidates: [
    'http://127.0.0.1:3000/api',
    'http://172.17.120.181:3000/api',
    'http://localhost:3000/api',
  ],
};
