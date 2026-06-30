Component({
  properties: {
    /** 骨架类型: card | list | avatar | text | detail */
    type: {
      type: String,
      value: 'card',
    },
    /** 重复数量 */
    count: {
      type: Number,
      value: 3,
    },
  },

  data: {
    _dummy: [] as number[],
  },

  observers: {
    count: function (val: number) {
      this.setData({
        _dummy: Array.from({ length: val }, function (_, i) { return i; }),
      });
    },
  },

  lifetimes: {
    attached: function () {
      this.setData({
        _dummy: Array.from({ length: this.data.count }, function (_, i) { return i; }),
      });
    },
  },
});
