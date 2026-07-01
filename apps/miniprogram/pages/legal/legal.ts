const userAgreement = require('./legal-content');
const privacyPolicy = require('./privacy-content');

Page({
  data: {
    doc: null,
  },

  onLoad: function (options) {
    var type = options.type || 'user';
    var doc = type === 'privacy' ? privacyPolicy : userAgreement;
    wx.setNavigationBarTitle({ title: doc.title });
    this.setData({ doc: doc });
  },
});
