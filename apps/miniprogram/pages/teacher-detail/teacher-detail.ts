const api = require('../../utils/api');

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

Page({
  data: {
    teacher: null,
    reviews: [],
    scheduleList: [],
    loading: true,
  },

  onLoad: function (options) {
    if (options.id) {
      this.loadDetail(Number(options.id));
    }
  },

  loadDetail: function (id) {
    var that = this;
    api.request({ url: '/teachers/' + id, auth: false })
      .then(function (data) {
        var schedules = data.schedules || [];
        var scheduleList = schedules.map(function (s) {
          return {
            id: s.id,
            label: '周' + DAY_NAMES[s.dayOfWeek] + ' ' + s.startTime + ' - ' + s.endTime,
          };
        });
        that.setData({
          teacher: Object.assign({}, data, {
            subjects: data.subjects || [],
          }),
          reviews: data.reviews || [],
          scheduleList: scheduleList,
          loading: false,
        });
      })
      .catch(function () {
        wx.showToast({ title: '加载失败', icon: 'none' });
        that.setData({ loading: false });
      });
  },

  goBooking: function () {
    var teacher = this.data.teacher;
    if (!teacher) return;
    wx.navigateTo({ url: '/pages/booking/booking?teacherId=' + teacher.id });
  },
});

export {};
