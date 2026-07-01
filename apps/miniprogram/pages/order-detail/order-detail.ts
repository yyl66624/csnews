const api = require('../../utils/api');

Page({
  data: {
    order: null,
    statusMap: api.ORDER_STATUS_MAP,
    payStatusMap: { unpaid: '待支付', paid: '已支付', refunded: '已退款' },
    teacherName: '',
    paying: false,
  },

  onLoad: function (options) {
    if (options.id) {
      this.loadOrder(Number(options.id));
    }
  },

  loadOrder: function (id) {
    var that = this;
    return api.ensureLogin()
      .then(function () {
        return api.request({ url: '/orders/' + id });
      })
      .then(function (order) {
        that.setData({
          order: order,
          teacherName: (order.teacher && order.teacher.nickname) || '教师',
        });
        return order;
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

  payOrder: function () {
    var that = this;
    var order = this.data.order;
    if (!order || this.data.paying) return;

    this.setData({ paying: true });
    var isDev = api.isDevApi();
    var payPromise = isDev
      ? api.request({ url: '/payments/mock-success/' + order.id, method: 'POST' })
      : api.request({ url: '/payments/prepay/' + order.id, method: 'POST' }).then(function (res) {
          return new Promise(function (resolve, reject) {
            wx.requestPayment(Object.assign({}, res.paymentParams, {
              success: resolve,
              fail: function (err) {
                reject(new Error((err && err.errMsg) || '支付取消'));
              },
            }));
          });
        });

    payPromise
      .then(function () {
        wx.showToast({ title: '支付成功', icon: 'success' });
        return that.loadOrder(order.id);
      })
      .catch(function (err) {
        wx.showToast({ title: (err && err.message) || '支付失败', icon: 'none' });
      })
      .finally(function () {
        that.setData({ paying: false });
      });
  },

  syncPayStatus: function () {
    var that = this;
    var order = this.data.order;
    if (!order) return;
    api.request({ url: '/payments/sync/' + order.id, method: 'POST' })
      .then(function () { that.loadOrder(order.id); })
      .catch(function () {});
  },
});
