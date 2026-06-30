const api = require('../../utils/api');

Page({
  data: {
    teacherId: 0,
    teacher: null,
    subjects: api.SUBJECTS,
    gradeLevels: api.GRADE_LEVELS,
    selectedSubject: '',
    selectedGrade: '',
    lessonDate: '',
    startTime: '09:00',
    endTime: '10:00',
    requirement: '',
    lessonFee: 0,
    isDev: false,
    today: '',
  },

  onLoad: function (options) {
    var today = new Date().toISOString().slice(0, 10);
    var isDev = api.config.apiBase.indexOf('127.0.0.1') !== -1 || api.config.apiBase.indexOf('localhost') !== -1;
    this.setData({ today: today, teacherId: Number(options.teacherId), isDev: isDev });
    this.loadTeacher();
  },

  loadTeacher: function () {
    var that = this;
    api.request({ url: '/teachers/' + this.data.teacherId, auth: false })
      .then(function (teacher) {
        var subjects = teacher.subjects || [];
        that.setData({
          teacher: teacher,
          selectedSubject: subjects[0] ? subjects[0].subject : api.SUBJECTS[0],
          selectedGrade: subjects[0] ? subjects[0].gradeLevel : api.GRADE_LEVELS[0],
        });
        that.calcPrice();
      })
      .catch(function () {
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  calcPrice: function () {
    var teacher = this.data.teacher;
    if (!teacher) return;
    var subjects = teacher.subjects || [];
    var match = null;
    for (var i = 0; i < subjects.length; i++) {
      if (subjects[i].subject === this.data.selectedSubject &&
          subjects[i].gradeLevel === this.data.selectedGrade) {
        match = subjects[i];
        break;
      }
    }
    var lessonFee = match ? Number(match.price) : 0;
    this.setData({ lessonFee: lessonFee });
  },

  onSubjectChange: function (e) {
    this.setData({ selectedSubject: api.SUBJECTS[Number(e.detail.value)] });
    this.calcPrice();
  },

  onGradeChange: function (e) {
    this.setData({ selectedGrade: api.GRADE_LEVELS[Number(e.detail.value)] });
    this.calcPrice();
  },

  onDateChange: function (e) {
    this.setData({ lessonDate: e.detail.value });
  },

  onStartTimeChange: function (e) {
    this.setData({ startTime: e.detail.value });
  },

  onEndTimeChange: function (e) {
    this.setData({ endTime: e.detail.value });
  },

  onRequirementInput: function (e) {
    this.setData({ requirement: e.detail.value });
  },

  submit: function () {
    var that = this;
    if (!this.data.lessonDate) {
      wx.showToast({ title: '请选择上课日期', icon: 'none' });
      return;
    }
    if (this.data.lessonFee <= 0) {
      wx.showToast({ title: '请选择有效的科目', icon: 'none' });
      return;
    }

    api.ensureLogin()
      .then(function () {
        return api.request({
          url: '/orders',
          method: 'POST',
          data: {
            teacherId: that.data.teacherId,
            subject: that.data.selectedSubject,
            gradeLevel: that.data.selectedGrade,
            lessonDate: that.data.lessonDate,
            startTime: that.data.startTime,
            endTime: that.data.endTime,
            requirement: that.data.requirement,
          },
        });
      })
      .then(function (order) {
        // 开发环境自动模拟支付，生产环境走真实支付流程
        if (that.data.isDev) {
          return api.request({ url: '/payments/mock-success/' + order.id, method: 'POST' })
            .then(function () { return order; });
        }
        return api.request({ url: '/payments/prepay/' + order.id, method: 'POST' })
          .then(function (prepayData) {
            return new Promise(function (resolve, reject) {
              wx.requestPayment({
                timeStamp: prepayData.paymentParams.timeStamp,
                nonceStr: prepayData.paymentParams.nonceStr,
                package: prepayData.paymentParams.package,
                signType: prepayData.paymentParams.signType,
                paySign: prepayData.paymentParams.paySign,
                success: function () { resolve(order); },
                fail: function (err) { reject(err); },
              });
            });
          });
      })
      .then(function (order) {
        wx.showToast({ title: '预约成功', icon: 'success' });
        setTimeout(function () {
          wx.redirectTo({ url: '/pages/order-detail/order-detail?id=' + order.id });
        }, 1500);
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '预约失败', icon: 'none' });
      });
  },
});
