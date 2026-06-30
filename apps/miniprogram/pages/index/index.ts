const api = require('../../utils/api');

Page({
  data: {
    subjects: api.SUBJECTS,
    gradeLevels: api.GRADE_LEVELS,
    selectedSubject: '',
    selectedGrade: '',
    sortBy: 'rating',
    teachers: [],
    loading: false,
    page: 1,
    hasMore: true,
    loadError: '',
  },

  onLoad: function () {
    this.loadTeachers(true);
  },

  onPullDownRefresh: function () {
    var that = this;
    this.loadTeachers(true).finally(function () {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.loadTeachers(false);
    }
  },

  loadTeachers: function (reset) {
    var that = this;
    if (this.data.loading) return Promise.resolve();
    this.setData({ loading: true, loadError: '' });

    var page = reset ? 1 : this.data.page + 1;
    var params = { page: page, pageSize: 10, sortBy: this.data.sortBy };
    if (this.data.selectedSubject) params.subject = this.data.selectedSubject;
    if (this.data.selectedGrade) params.gradeLevel = this.data.selectedGrade;

    var query = Object.keys(params)
      .map(function (k) { return k + '=' + encodeURIComponent(params[k]); })
      .join('&');

    return api.request({ url: '/teachers?' + query, auth: false })
      .then(function (res) {
        var teachers = reset ? res.items : that.data.teachers.concat(res.items);
        that.setData({
          teachers: teachers,
          page: page,
          hasMore: teachers.length < res.total,
          loading: false,
        });
      })
      .catch(function (err) {
        that.setData({
          loading: false,
          loadError: err.message || '加载失败',
        });
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  onSubjectTap: function (e) {
    var subject = e.currentTarget.dataset.subject;
    this.setData({
      selectedSubject: this.data.selectedSubject === subject ? '' : subject,
    });
    this.loadTeachers(true);
  },

  onGradeTap: function (e) {
    var grade = e.currentTarget.dataset.grade;
    this.setData({
      selectedGrade: this.data.selectedGrade === grade ? '' : grade,
    });
    this.loadTeachers(true);
  },

  onSortChange: function (e) {
    var sorts = ['rating', 'price', 'experience'];
    this.setData({ sortBy: sorts[Number(e.detail.value)] });
    this.loadTeachers(true);
  },

  goDetail: function (e) {
    wx.navigateTo({ url: '/pages/teacher-detail/teacher-detail?id=' + e.currentTarget.dataset.id });
  },
});
