const api = require('../../utils/api');
const mask = require('../../utils/mask');

Page({
  data: {
    userInfo: null,
    displayPhone: '',
    isTeacher: false,
  },

  onShow: function () {
    this.loadProfile();
  },

  loadProfile: function () {
    var that = this;
    var app = api.getAppInstance();
    if (app.globalData && app.globalData.userInfo) {
      var user = app.globalData.userInfo;
      that.setData({
        userInfo: user,
        displayPhone: mask.maskPhone(user.phone),
        isTeacher: user.role === 'teacher',
      });
      return;
    }
    var token = wx.getStorageSync('token');
    if (!token) {
      that.setData({ userInfo: null, isTeacher: false });
      return;
    }
    api.fetchProfile()
      .then(function (user) {
        that.setData({
          userInfo: user,
          displayPhone: mask.maskPhone(user.phone),
          isTeacher: user.role === 'teacher',
        });
      })
      .catch(function () {
        that.setData({ userInfo: null });
      });
  },

  onLogin: function () {
    var that = this;
    api.login()
      .then(function (data) {
        that.setData({
          userInfo: data.user,
          displayPhone: mask.maskPhone(data.user.phone),
          isTeacher: data.user.role === 'teacher',
        });
        wx.showToast({ title: '登录成功', icon: 'success' });
      })
      .catch(function () {
        wx.showToast({ title: '登录失败', icon: 'none' });
      });
  },

  goTeacherApply: function () {
    wx.navigateTo({ url: '/pages/teacher-apply/teacher-apply' });
  },

  goTeacherHome: function () {
    wx.navigateTo({ url: '/pages/teacher-home/teacher-home' });
  },

  goUserAgreement: function () {
    wx.navigateTo({ url: '/pages/legal/legal?type=user' });
  },

  goPrivacy: function () {
    wx.navigateTo({ url: '/pages/legal/legal?type=privacy' });
  },

  logout: function () {
    var app = api.getAppInstance();
    app.globalData.token = '';
    app.globalData.userInfo = null;
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    this.setData({ userInfo: null, displayPhone: '', isTeacher: false });
    wx.showToast({ title: '已退出', icon: 'success' });
  },
});

export {};
