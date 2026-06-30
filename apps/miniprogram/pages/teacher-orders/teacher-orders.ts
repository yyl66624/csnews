const api = require('../../utils/api');

Page({
  data: {
    orders: [],
    statusMap: api.ORDER_STATUS_MAP,
  },

  onShow: function () {
    this.loadOrders();
  },

  loadOrders: function () {
    var that = this;
    api.ensureLogin()
      .then(function () {
        return api.request({ url: '/orders?role=teacher' });
      })
      .then(function (res) {
        var items = (res.items || []).map(function (o) {
          return Object.assign({}, o, {
            studentName: (o.student && o.student.nickname) || '学生',
          });
        });
        that.setData({ orders: items });
      })
      .catch(function () {
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  confirm: function (e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    api.request({ url: '/orders/' + id + '/confirm', method: 'PUT' })
      .then(function () {
        wx.showToast({ title: '已确认', icon: 'success' });
        that.loadOrders();
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '操作失败', icon: 'none' });
      });
  },

  start: function (e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    api.request({ url: '/orders/' + id + '/start', method: 'PUT' })
      .then(function () {
        wx.showToast({ title: '课程已开始', icon: 'success' });
        that.loadOrders();
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '操作失败', icon: 'none' });
      });
  },

  reject: function (e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    api.request({ url: '/orders/' + id + '/reject', method: 'PUT', data: { reason: '时间冲突' } })
      .then(function () {
        wx.showToast({ title: '已拒绝', icon: 'success' });
        that.loadOrders();
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '操作失败', icon: 'none' });
      });
  },

  complete: function (e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    api.request({ url: '/orders/' + id + '/complete', method: 'PUT' })
      .then(function () {
        wx.showToast({ title: '课程已完成', icon: 'success' });
        that.loadOrders();
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '操作失败', icon: 'none' });
      });
  },
});
