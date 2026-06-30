const config = require('./config');

const SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];
const GRADE_LEVELS = ['小学', '初中', '高中'];

const ORDER_STATUS_MAP = {
  pending: '待确认',
  confirmed: '已确认',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款',
};

function getAppInstance() {
  try {
    return getApp();
  } catch (e) {
    return { globalData: { token: '', userInfo: null, apiBase: config.apiBase } };
  }
}

function getApiBase() {
  const app = getAppInstance();
  return (app.globalData && app.globalData.apiBase) || config.apiBase;
}

function getDevOpenId() {
  let id = wx.getStorageSync('dev_openid');
  if (!id) {
    id = 'dev_user_' + Date.now();
    wx.setStorageSync('dev_openid', id);
  }
  return id;
}

function clearAuthState() {
  const app = getAppInstance();
  if (app.globalData) {
    app.globalData.token = '';
    app.globalData.userInfo = null;
  }
  wx.removeStorageSync('token');
  wx.removeStorageSync('userInfo');
}

function request(options) {
  const header = Object.assign({ 'Content-Type': 'application/json' }, options.header || {});
  const app = getAppInstance();
  const useAuth = options.auth !== false;

  if (useAuth && app.globalData && app.globalData.token) {
    header.Authorization = 'Bearer ' + app.globalData.token;
  }

  return new Promise(function (resolve, reject) {
    wx.request({
      url: getApiBase() + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: header,
      success: function (res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }
        // 401: token 过期或无效，尝试重新登录后重试一次
        if (res.statusCode === 401 && useAuth && !options._retryAfterLogin) {
          clearAuthState();
          login()
            .then(function () {
              return request(Object.assign({}, options, { _retryAfterLogin: true }));
            })
            .then(resolve)
            .catch(reject);
          return;
        }
        var body = res.data || {};
        var msg = body.message;
        if (Array.isArray(msg)) msg = msg[0];
        reject(new Error(msg || '请求失败(' + res.statusCode + ')'));
      },
      fail: function (err) {
        reject(new Error('网络错误，请确认后端已启动且 API 地址正确'));
      },
    });
  });
}

function login() {
  return new Promise(function (resolve, reject) {
    var isDev = config.apiBase.indexOf('127.0.0.1') !== -1 || config.apiBase.indexOf('localhost') !== -1;
    wx.login({
      success: function (res) {
        var code = isDev ? getDevOpenId() : (res.code || '');
        if (!code) { reject(new Error('获取微信code失败')); return; }
        request({
          url: '/auth/wx-login',
          method: 'POST',
          data: { code: code, nickname: '微信用户' },
          auth: false,
        })
          .then(function (data) {
            var app = getAppInstance();
            app.globalData.token = data.token;
            app.globalData.userInfo = data.user;
            wx.setStorageSync('token', data.token);
            wx.setStorageSync('userInfo', data.user);
            resolve(data);
          })
          .catch(reject);
      },
      fail: reject,
    });
  });
}

function fetchProfile() {
  return request({ url: '/users/profile' }).then(function (user) {
    var app = getAppInstance();
    app.globalData.userInfo = user;
    wx.setStorageSync('userInfo', user);
    return user;
  });
}

function ensureLogin() {
  var app = getAppInstance();
  if (app.globalData && app.globalData.token) {
    if (app.globalData.userInfo) {
      return Promise.resolve(app.globalData.userInfo);
    }
    return fetchProfile();
  }
  var token = wx.getStorageSync('token');
  if (token) {
    app.globalData.token = token;
    var cached = wx.getStorageSync('userInfo');
    if (cached) {
      app.globalData.userInfo = cached;
      return Promise.resolve(cached);
    }
    return fetchProfile();
  }
  return login().then(function (d) { return d.user; });
}

module.exports = {
  SUBJECTS: SUBJECTS,
  GRADE_LEVELS: GRADE_LEVELS,
  ORDER_STATUS_MAP: ORDER_STATUS_MAP,
  request: request,
  login: login,
  ensureLogin: ensureLogin,
  fetchProfile: fetchProfile,
  getAppInstance: getAppInstance,
  config: config,
};
