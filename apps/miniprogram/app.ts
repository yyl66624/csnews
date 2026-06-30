const config = require('./utils/config');

App({
  globalData: {
    userInfo: null,
    token: '',
    apiBase: config.apiBase,
  },

  onLaunch: function () {
    var token = wx.getStorageSync('token');
    var userInfo = wx.getStorageSync('userInfo');
    if (token) {
      this.globalData.token = token;
    }
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
  },
});
