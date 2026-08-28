const api = require('../../utils/api');

Page({
  data: {
    profile: null,
    auditStatusMap: { pending: '审核中', approved: '已通过', rejected: '已驳回' },
  },

  onShow: function () {
    this.loadProfile();
  },

  loadProfile: function () {
    var that = this;
    api.ensureLogin()
      .then(function () {
        return api.request({ url: '/teachers/profile/me' });
      })
      .then(function (profile) {
        that.setData({ profile: profile });
      })
      .catch(function () {
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  goOrders: function () {
    wx.navigateTo({ url: '/pages/teacher-orders/teacher-orders' });
  },
});

export {};
