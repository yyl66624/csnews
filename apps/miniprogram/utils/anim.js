/**
 * 小程序动画工具库
 * 使用 wx.createAnimation() 实现平滑入场、列表交错、触摸反馈等
 */

// =============== 缓动曲线 ===============
// 近似 GSAP 的常用 easing（小程序原生 API 限制，用贝塞尔曲线近似）
const EASE = {
  power1Out: 'cubic-bezier(0.0, 0.0, 0.0, 1.0)',
  power2Out: 'cubic-bezier(0.11, 0.0, 0.11, 1.0)',
  power3Out: 'cubic-bezier(0.16, 0.0, 0.16, 1.0)',
  backOut: 'cubic-bezier(0.34, 1.56, 0.64, 1.0)',
  elasticOut: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
};

/**
 * 创建基础动画
 * @param {Object} options — { duration, delay, easing, ...props }
 * @returns {Animation} wx.createAnimation 实例
 */
function createAnim(options) {
  var opts = options || {};
  var anim = wx.createAnimation({
    duration: opts.duration || 350,
    timingFunction: opts.easing || EASE.power2Out,
    delay: opts.delay || 0,
    transformOrigin: opts.origin || '50% 50% 0',
  });
  return anim;
}

/**
 * 淡入 + 上移
 * @param {number} fromY — 起始 Y 偏移（rpx），默认 24
 * @param {Object} options
 * @returns {Object} — animationData 可直接 setData
 */
function fadeInUp(fromY, options) {
  fromY = fromY || 24;
  var anim = createAnim(options);
  anim.translateY(fromY).opacity(0).step({ duration: 1 });
  anim.translateY(0).opacity(1).step();
  return anim.export();
}

/**
 * 纯淡入
 */
function fadeIn(options) {
  var anim = createAnim(options);
  anim.opacity(0).step({ duration: 1 });
  anim.opacity(1).step();
  return anim.export();
}

/**
 * 淡出
 */
function fadeOut(options) {
  var anim = createAnim(options);
  anim.opacity(0).step();
  return anim.export();
}

/**
 * 缩放淡入（卡片弹入效果）
 */
function scaleIn(options) {
  var anim = createAnim(Object.assign({ easing: EASE.backOut }, options));
  anim.scale(0.85).opacity(0).step({ duration: 1 });
  anim.scale(1).opacity(1).step();
  return anim.export();
}

/**
 * 从左滑入
 */
function slideInLeft(fromX, options) {
  fromX = fromX || -40;
  var anim = createAnim(options);
  anim.translateX(fromX).opacity(0).step({ duration: 1 });
  anim.translateX(0).opacity(1).step();
  return anim.export();
}

/**
 * 触摸反馈缩放（点击时缩小，松开恢复）
 * 适合配合 bindtouchstart / bindtouchend 使用
 */
function pressIn() {
  var anim = wx.createAnimation({ duration: 120, timingFunction: EASE.power2Out });
  anim.scale(0.96).step();
  return anim.export();
}

function pressOut() {
  var anim = wx.createAnimation({ duration: 200, timingFunction: EASE.backOut });
  anim.scale(1).step();
  return anim.export();
}

/**
 * 生成列表交错动画数据
 * 每项延迟 staggerDelay * index 毫秒入场
 *
 * @param {Array} list — 数据列表
 * @param {string} animKey — 存放 animationData 的字段名，默认 'animData'
 * @param {Object} options — { staggerDelay, fromY, duration, easing }
 * @returns {Array} — 原列表浅拷贝 + animData 字段
 */
function staggerList(list, animKey, options) {
  var opts = options || {};
  var delay = opts.staggerDelay || 60;
  var fromY = opts.fromY || 20;
  var duration = opts.duration || 350;
  var easing = opts.easing || EASE.power2Out;
  var key = animKey || 'animData';

  return (list || []).map(function (item, index) {
    var anim = wx.createAnimation({
      duration: duration,
      timingFunction: easing,
      delay: index * delay,
    });
    anim.translateY(fromY).opacity(0).step({ duration: 1 });
    anim.translateY(0).opacity(1).step();

    var result = {};
    result[key] = anim.export();
    return Object.assign({}, item, result);
  });
}

/**
 * 暴露缓动曲线供 WXS/CSS 直接引用
 */
module.exports = {
  EASE: EASE,

  // 基础
  createAnim: createAnim,
  fadeIn: fadeIn,
  fadeInUp: fadeInUp,
  fadeOut: fadeOut,
  scaleIn: scaleIn,
  slideInLeft: slideInLeft,

  // 交互
  pressIn: pressIn,
  pressOut: pressOut,

  // 列表
  staggerList: staggerList,
};
