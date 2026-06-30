const api = require('../../utils/api');

Page({
  data: {
    orderId: 0,
    rating: 5,
    content: '',
    tags: ['讲解清晰', '耐心负责', '准时守约', '方法有效'],
    selectedTags: [],
    isAnonymous: false,
  },

  onLoad: function (options) {
    this.setData({ orderId: Number(options.orderId) });
  },

  onRatingChange: function (e) {
    this.setData({ rating: Number(e.detail.value) });
  },

  onContentInput: function (e) {
    this.setData({ content: e.detail.value });
  },

  onTagTap: function (e) {
    var tag = e.currentTarget.dataset.tag;
    var selected = this.data.selectedTags.slice();
    var idx = selected.indexOf(tag);
    if (idx >= 0) selected.splice(idx, 1);
    else selected.push(tag);
    this.setData({ selectedTags: selected });
  },

  onAnonymousChange: function (e) {
    this.setData({ isAnonymous: e.detail.value });
  },

  submit: function () {
    api.ensureLogin()
      .then(function () {
        return api.request({
          url: '/reviews',
          method: 'POST',
          data: {
            orderId: this.data.orderId,
            rating: this.data.rating,
            content: this.data.content,
            tags: this.data.selectedTags,
            isAnonymous: this.data.isAnonymous,
          },
        });
      }.bind(this))
      .then(function () {
        wx.showToast({ title: '评价成功', icon: 'success' });
        setTimeout(function () { wx.navigateBack(); }, 1500);
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '评价失败', icon: 'none' });
      });
  },
});
