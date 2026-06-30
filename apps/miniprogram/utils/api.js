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
    var app = getApp();
    if (app) return app;
  } catch (e) {
    // getApp 在 App 注册完成前可能不可用
  }
  return { globalData: { token: '', userInfo: null, apiBase: config.apiBase } };
}

function getGlobalData() {
  var app = getAppInstance();
  if (!app.globalData) {
    app.globalData = { token: '', userInfo: null, apiBase: config.apiBase };
  }
  return app.globalData;
}

function getApiBaseCandidates() {
  if (config.apiBaseCandidates && config.apiBaseCandidates.length) {
    return config.apiBaseCandidates;
  }
  return [config.apiBase];
}

function getApiBase() {
  var stored = wx.getStorageSync('api_base');
  if (stored) return stored;
  var gd = getGlobalData();
  if (gd.apiBase) return gd.apiBase;
  return config.apiBase;
}

function setApiBase(base) {
  getGlobalData().apiBase = base;
  wx.setStorageSync('api_base', base);
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
  var gd = getGlobalData();
  gd.token = '';
  gd.userInfo = null;
  wx.removeStorageSync('token');
  wx.removeStorageSync('userInfo');
}

function request(options) {
  const header = Object.assign({ 'Content-Type': 'application/json' }, options.header || {});
  const gd = getGlobalData();
  const useAuth = options.auth !== false;

  if (useAuth && gd.token) {
    header.Authorization = 'Bearer ' + gd.token;
  }

  var candidates = getApiBaseCandidates();
  var startIndex = Math.max(0, candidates.indexOf(getApiBase()));
  if (startIndex < 0) startIndex = 0;

  function tryRequest(candidateIndex) {
    var base = candidates[candidateIndex];
    if (!base) {
      return Promise.reject(new Error('网络错误，请检查 utils/config.js 中的 API 地址'));
    }

    return new Promise(function (resolve, reject) {
      wx.request({
        url: base + options.url,
        method: options.method || 'GET',
        data: options.data,
        header: header,
        timeout: options.timeout || 15000,
        success: function (res) {
          if (candidateIndex !== startIndex) {
            setApiBase(base);
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
            return;
          }
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
          var msg = (err && err.errMsg) || '';
          var isTimeout = msg.indexOf('timeout') !== -1;
          var hasNext = candidateIndex + 1 < candidates.length && !options._noFallback;

          if (hasNext && (isTimeout || msg.indexOf('fail') !== -1)) {
            tryRequest(candidateIndex + 1).then(resolve).catch(reject);
            return;
          }

          if (isTimeout) {
            reject(new Error('请求超时，当前 API：' + base));
          } else {
            reject(new Error('网络错误，当前 API：' + base));
          }
        },
      });
    });
  }

  return tryRequest(startIndex);
}

function isDevApi() {
  var base = getApiBase();
  return (
    base.indexOf('127.0.0.1') !== -1 ||
    base.indexOf('localhost') !== -1 ||
    base.indexOf('192.168.') !== -1 ||
    base.indexOf('172.') !== -1 ||
    base.indexOf('10.') !== -1
  );
}

function postWxLogin(code) {
  return request({
    url: '/auth/wx-login',
    method: 'POST',
    data: { code: code, nickname: '微信用户' },
    auth: false,
  }).then(function (data) {
    var gd = getGlobalData();
    gd.token = data.token;
    gd.userInfo = data.user;
    wx.setStorageSync('token', data.token);
    wx.setStorageSync('userInfo', data.user);
    return data;
  });
}

function login() {
  return new Promise(function (resolve, reject) {
    // 本地开发跳过 wx.login，避免开发者工具中 wx.login 超时
    if (isDevApi()) {
      postWxLogin(getDevOpenId()).then(resolve).catch(reject);
      return;
    }
    wx.login({
      success: function (res) {
        var code = res.code || '';
        if (!code) { reject(new Error('获取微信code失败')); return; }
        postWxLogin(code).then(resolve).catch(reject);
      },
      fail: function (err) {
        var msg = (err && err.errMsg) || '微信登录失败';
        reject(new Error(msg.indexOf('timeout') !== -1 ? '微信登录超时，请重试' : msg));
      },
    });
  });
}

function fetchProfile() {
  return request({ url: '/users/profile' }).then(function (user) {
    getGlobalData().userInfo = user;
    wx.setStorageSync('userInfo', user);
    return user;
  });
}

function ensureLogin() {
  var gd = getGlobalData();
  if (gd.token && gd.userInfo) {
    return Promise.resolve(gd.userInfo);
  }
  var token = wx.getStorageSync('token');
  if (token) {
    gd.token = token;
    var cached = wx.getStorageSync('userInfo');
    if (cached) {
      gd.userInfo = cached;
      return Promise.resolve(cached);
    }
    if (isDevApi()) {
      return login().then(function (d) { return d.user; });
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
  isDevApi: isDevApi,
  config: config,
};
