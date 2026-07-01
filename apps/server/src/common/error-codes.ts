/** 统一业务错误码（阶段 B2） */
export enum ErrorCode {
  OK = 0,

  // 通用 1xxx
  BAD_REQUEST = 1000,
  UNAUTHORIZED = 1001,
  FORBIDDEN = 1002,
  NOT_FOUND = 1003,
  VALIDATION_FAILED = 1004,

  // 用户/认证 2xxx
  WX_LOGIN_FAILED = 2001,

  // 订单 3xxx
  ORDER_NOT_FOUND = 3001,
  ORDER_STATUS_INVALID = 3002,
  ORDER_FORBIDDEN = 3003,
  ORDER_ALREADY_PAID = 3004,

  // 支付 4xxx
  PAYMENT_NOT_CONFIGURED = 4001,
  PAYMENT_FAILED = 4002,
  PAYMENT_NOTIFY_INVALID = 4003,
  REFUND_FAILED = 4004,

  // 教师 5xxx
  TEACHER_NOT_APPROVED = 5001,

  // 风控 6xxx
  SENSITIVE_CONTENT = 6001,
}

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.OK]: '成功',
  [ErrorCode.BAD_REQUEST]: '请求参数错误',
  [ErrorCode.UNAUTHORIZED]: '请先登录',
  [ErrorCode.FORBIDDEN]: '无权访问',
  [ErrorCode.NOT_FOUND]: '资源不存在',
  [ErrorCode.VALIDATION_FAILED]: '参数校验失败',
  [ErrorCode.WX_LOGIN_FAILED]: '微信登录失败',
  [ErrorCode.ORDER_NOT_FOUND]: '订单不存在',
  [ErrorCode.ORDER_STATUS_INVALID]: '订单状态不允许此操作',
  [ErrorCode.ORDER_FORBIDDEN]: '无权操作此订单',
  [ErrorCode.ORDER_ALREADY_PAID]: '订单已支付',
  [ErrorCode.PAYMENT_NOT_CONFIGURED]: '微信支付未配置',
  [ErrorCode.PAYMENT_FAILED]: '支付失败',
  [ErrorCode.PAYMENT_NOTIFY_INVALID]: '支付回调验签失败',
  [ErrorCode.REFUND_FAILED]: '退款失败',
  [ErrorCode.TEACHER_NOT_APPROVED]: '教师未通过审核',
  [ErrorCode.SENSITIVE_CONTENT]: '内容包含敏感词，请修改后重试',
};
