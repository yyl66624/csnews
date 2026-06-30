const config = require('./utils/config');
const api = require('./utils/api');

function isLocalDevApi(base) {
  return (
    base.indexOf('127.0.0.1') !== -1 ||
    base.indexOf('localhost') !== -1 ||
    base.indexOf('192.168.') !== -1 ||
    base.indexOf('172.') !== -1 ||
    base.indexOf('10.') !== -1
  );
}

App({
  globalData: {
    userInfo: null,
    token: '',
    apiBase: config.apiBase,
    apiConnected: false,
  },

  onLaunch: function () {
    wx.removeStorageSync('api_base');
    var token = wx.getStorageSync('token');
    var userInfo = wx.getStorageSync('userInfo');
    if (token) {
      this.globalData.token = token;
    }
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }

    if (isLocalDevApi(config.apiBase)) {
      this.checkDevApi();
    }
  },

  // 捕获基础库内部错误（如 WAServiceMainContext 的 timeout），避免红屏
  onError: function (err) {
    // 忽略来自微信基础库的内部超时（非业务代码问题）
    if (err && err.indexOf && err.indexOf('timeout') !== -1) {
      console.warn('[app] 基础库内部超时（已忽略）:', err);
      return;
    }
    console.error('[app] onError:', err);
  },

  checkDevApi: function () {
    var that = this;
    api.request({ url: '/teachers?page=1&pageSize=1', auth: false, timeout: 8000 })
      .then(function () {
        that.globalData.apiConnected = true;
        if (!wx.getStorageSync('token')) {
          api.login().catch(function () {});
        }
      })
      .catch(function (err) {
        that.globalData.apiConnected = false;
        wx.showModal({
          title: '无法连接后端',
          content: '请先在终端启动后端：\ncd apps/server\nnpm run start:dev\n\n当前 API：' + config.apiBase + '\n错误：' + (err.message || 'timeout'),
          showCancel: false,
        });
      });
  },
});
