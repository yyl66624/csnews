/**
 * 小程序 API 地址配置
 * - 开发者工具模拟器：用 127.0.0.1（勿用 localhost，部分 Windows 环境 localhost 不通）
 * - 真机调试：改为电脑局域网 IP，如 http://192.168.1.100:3000/api
 */
module.exports = {
  apiBase: 'http://172.17.120.181:3000/api',
  // 连接失败时依次尝试（优先局域网IP，Windows 模拟器 127.0.0.1 常超时）
  apiBaseCandidates: [
    'http://172.17.120.181:3000/api',
    'http://127.0.0.1:3000/api',
    'http://localhost:3000/api',
  ],
};
