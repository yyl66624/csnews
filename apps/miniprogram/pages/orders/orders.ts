const api = require('../../utils/api');

Page({
  data: {
    orders: [],
    statusMap: api.ORDER_STATUS_MAP,
    loading: false,
    activeTab: '',
    tabs: [
      { key: '', label: '全部' },
      { key: 'pending', label: '待确认' },
      { key: 'confirmed', label: '已确认' },
      { key: 'completed', label: '已完成' },
    ],
  },

  onShow: function () {
    this.loadOrders();
  },

  onTabTap: function (e) {
    this.setData({ activeTab: e.currentTarget.dataset.key });
    this.loadOrders();
  },

  loadOrders: function () {
    var that = this;
    this.setData({ loading: true });
    api.ensureLogin()
      .then(function () {
        var params = that.data.activeTab ? '?status=' + that.data.activeTab : '';
        return api.request({ url: '/orders' + params });
      })
      .then(function (res) {
        var items = (res.items || []).map(function (o) {
          return Object.assign({}, o, {
            teacherName: (o.teacher && o.teacher.nickname) || '教师',
          });
        });
        that.setData({ orders: items, loading: false });
      })
      .catch(function (err) {
        that.setData({ loading: false, orders: [] });
        wx.showToast({
          title: (err && err.message) || '加载失败',
          icon: 'none',
          duration: 3000,
        });
      });
  },

  goDetail: function (e) {
    wx.navigateTo({ url: '/pages/order-detail/order-detail?id=' + e.currentTarget.dataset.id });
  },
});
