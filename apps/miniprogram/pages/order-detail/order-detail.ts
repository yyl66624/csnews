const api = require('../../utils/api');

Page({
  data: {
    order: null,
    statusMap: api.ORDER_STATUS_MAP,
    teacherName: '',
  },

  onLoad: function (options) {
    if (options.id) {
      this.loadOrder(Number(options.id));
    }
  },

  loadOrder: function (id) {
    var that = this;
    api.ensureLogin()
      .then(function () {
        return api.request({ url: '/orders/' + id });
      })
      .then(function (order) {
        that.setData({
          order: order,
          teacherName: (order.teacher && order.teacher.nickname) || '教师',
        });
      })
      .catch(function () {
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  cancelOrder: function () {
    var that = this;
    var order = this.data.order;
    if (!order) return;
    wx.showModal({
      title: '确认取消',
      content: '确定要取消此订单吗？',
      success: function (res) {
        if (res.confirm) {
          api.request({ url: '/orders/' + order.id + '/cancel', method: 'PUT', data: {} })
            .then(function () {
              wx.showToast({ title: '已取消', icon: 'success' });
              that.loadOrder(order.id);
            })
            .catch(function (err) {
              wx.showToast({ title: err.message || '取消失败', icon: 'none' });
            });
        }
      },
    });
  },

  goReview: function () {
    var order = this.data.order;
    if (!order) return;
    wx.navigateTo({ url: '/pages/review/review?orderId=' + order.id });
  },
});
