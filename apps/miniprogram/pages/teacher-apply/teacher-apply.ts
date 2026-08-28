const api = require('../../utils/api');

Page({
  data: {
    subjects: api.SUBJECTS,
    gradeLevels: api.GRADE_LEVELS,
    form: {
      realName: '',
      idCard: '',
      education: '本科',
      teachingYears: 1,
      bio: '',
      teachingStyle: '',
      city: '',
    },
    subjectPrices: [{ subject: '数学', gradeLevel: '初中', price: 100 }],
    schedules: [{ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }],
    educationOptions: ['专科', '本科', '硕士', '博士'],
  },

  onInput: function (e) {
    var field = e.currentTarget.dataset.field;
    var key = 'form.' + field;
    var update = {};
    update[key] = e.detail.value;
    this.setData(update);
  },

  onEducationChange: function (e) {
    this.setData({ 'form.education': this.data.educationOptions[Number(e.detail.value)] });
  },

  onYearsChange: function (e) {
    this.setData({ 'form.teachingYears': e.detail.value });
  },

  addSubject: function () {
    this.setData({
      subjectPrices: this.data.subjectPrices.concat([
        { subject: '数学', gradeLevel: '初中', price: 100 },
      ]),
    });
  },

  onSubjectPriceChange: function (e) {
    var idx = Number(e.currentTarget.dataset.index);
    var field = e.currentTarget.dataset.field;
    var items = this.data.subjectPrices.slice();
    if (field === 'price') items[idx].price = Number(e.detail.value);
    else items[idx][field] = e.detail.value;
    this.setData({ subjectPrices: items });
  },

  addSchedule: function () {
    this.setData({
      schedules: this.data.schedules.concat([
        { dayOfWeek: 1, startTime: '14:00', endTime: '17:00' },
      ]),
    });
  },

  submit: function () {
    var form = this.data.form;
    if (!form.realName || !form.idCard) {
      wx.showToast({ title: '请填写姓名和身份证', icon: 'none' });
      return;
    }
    api.ensureLogin()
      .then(function () {
        return api.request({
          url: '/teachers/apply',
          method: 'POST',
          data: {
            realName: form.realName,
            idCard: form.idCard,
            education: form.education,
            teachingYears: Number(form.teachingYears),
            bio: form.bio,
            teachingStyle: form.teachingStyle,
            city: form.city,
            subjects: this.data.subjectPrices,
            schedules: this.data.schedules,
          },
        });
      }.bind(this))
      .then(function () {
        wx.showModal({
          title: '提交成功',
          content: '您的入驻申请已提交，请等待平台审核',
          showCancel: false,
          success: function () { wx.navigateBack(); },
        });
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '提交失败', icon: 'none' });
      });
  },
});

export {};
