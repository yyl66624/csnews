# 阶段 A/B/C 实施进度

> 更新日期：2026-07-01 | 代码基线：v1.1+  
> 关联文档：[开发技术步骤文档](./开发技术步骤文档.md) · [下一阶段规划](./下一阶段规划.md)

**产品范围：** C2C 家教撮合，**不含在线音视频授课**。

---

## 文档索引

| 文档 | 用途 |
|------|------|
| `开发技术步骤文档.md` | 全阶段技术路线、功能清单、表结构 |
| `下一阶段规划.md` | A→D 阶段任务、阻塞项、行动清单 |
| `阶段ABC实施进度.md`（本文） | 代码实现状态 + 后续开发优先级 |

---

## 阶段 A：补齐基建

| 任务 | 状态 | 说明 |
|------|------|------|
| A1 合规资质 | ⏳ 待办 | 创始人/法务推进 |
| A2 微信生态注册 | ⏳ 待办 | AppID、商户号、域名白名单 |
| A3 产品原型/UI | ⏳ 待办 | Figma |
| A4 微信支付 APIv3 | ✅ 代码就绪 | 配置 `.env` 证书后启用 |
| A5 腾讯云 COS | 🔶 骨架 | `POST /api/storage/upload` |

### A4 已实现 API

- JSAPI 统一下单、小程序 paySign
- 支付回调解密 `POST /api/payments/notify`
- 退款 `POST /api/admin/orders/:id/refund`
- 分账（需 `WX_PROFIT_SHARING_RECEIVER`）
- 支付补偿 `POST /api/payments/sync/:orderId`

### 启用真实支付

```env
# apps/server/.env
WX_MCH_ID=
WX_MCH_SERIAL_NO=
WX_API_V3_KEY=
WX_MCH_PRIVATE_KEY_PATH=./certs/apiclient_key.pem
WX_NOTIFY_URL=https://你的域名/api/payments/notify
```

---

## 阶段 B：测试与审核

| 任务 | 状态 | 说明 |
|------|------|------|
| B1 端到端测试 | 🔶 脚手架 | `npm run test:e2e`（4 项通过，待扩展场景） |
| B2 统一错误码 | ✅ 完成 | `ErrorCode` + `AllExceptionsFilter` |
| B2 权限加固 | ✅ 完成 | 订单/教师 `@Roles` |
| B2 小程序错误态 | 🔶 部分 | 订单详情补支付、API code 解析 |
| B2 敏感信息脱敏 | ⏳ 待办 | 证书水印、身份证脱敏 |
| B3 微信提审 | ⏳ 待办 | 依赖 A1/A2 |

```bash
cd apps/server && npm run test:e2e
```

---

## 阶段 C：Phase 2 核心打磨

> 不涉及在线授课。与 `下一阶段规划.md` 第五节 C1–C5 对齐。

| 编号 | 模块 | 状态 | 代码/备注 |
|------|------|------|-----------|
| C1 | 风控系统 | 🔶 基础 | `RiskService` 敏感词 + 下单频率 |
| C2 | 评价体系完善 | ⏳ 待开发 | 多维评分、标签、申诉 |
| C3 | 运营后台增强 | ⏳ 待开发 | GMV 看板、纠纷工作台 |
| C4 | 性能优化 | 🔶 部分 | Redis 教师列表缓存 ✅；分包 ⏳ |
| C5 | 灰度发布 | ⏳ 待办 | 上线后 |

---

## 已实现 API 一览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/payments/prepay/:orderId` | 预支付（真实/mock） |
| POST | `/api/payments/sync/:orderId` | 支付状态同步 |
| POST | `/api/payments/notify` | 微信支付回调 |
| POST | `/api/admin/orders/:id/refund` | 管理员退款 |
| POST | `/api/storage/upload` | 文件上传（COS 骨架） |

---

## 后续工作优先级（开发侧）

按推荐顺序执行，**A2 商户号到位后**即可并行联调支付。

### P0 — 上线阻塞

| # | 任务 | 模块 | 状态 | 说明 |
|---|------|------|------|------|
| 1 | 配置微信商户 APIv3 证书，真机支付联调 | server + 小程序 | ✅ 代码就绪 | `GET /api/health/payments`、`npm run check:payments` |
| 2 | 扩展 E2E：学生预约→支付→评价 全链路 | server/test | ✅ 已完成 | `test/app.e2e-spec.ts` P0#2 |
| 3 | 扩展 E2E：教师入驻→审核→接单→完成 | server/test | ✅ 已完成 | `test/app.e2e-spec.ts` P0#3 |
| 4 | 小程序敏感信息展示脱敏（证书/手机号） | miniprogram + server | ✅ 已完成 | `mask.util.ts` / `utils/mask.js` |
| 5 | 用户协议 / 隐私政策静态页 | miniprogram | ✅ 已完成 | `pages/legal/legal`，个人中心入口 |

> **P0 剩余非代码项：** 商户号证书到位后真机支付联调；小程序后台配置协议链接（如需外链）。

### P1 — Phase 2 核心

| # | 任务 | 模块 | 预估 |
|---|------|------|------|
| 6 | 评价体系：多维评分 + 标签字段 | server + miniprogram | 3 天 |
| 7 | 评价回复 / 申诉 API + 管理端审核 | server + admin | 3 天 |
| 8 | 运营看板：GMV、订单趋势、转化率 | admin + server | 3 天 |
| 9 | COS SDK 真实上传（教师证书） | server | 2 天 |
| 10 | 风控增强：同 IP 刷单、退款频率检测 | server | 2 天 |

### P2 — 体验与增长

| # | 任务 | 模块 | 预估 |
|---|------|------|------|
| 11 | 小程序分包加载 | miniprogram | 1 天 |
| 12 | 微信订阅消息（预约确认、上课提醒） | server + 小程序 | 2 天 |
| 13 | 管理端纠纷处理工作台 | admin | 3 天 |
| 14 | 灰度白名单 + 监控指标 | server + 运维 | 2 天 |

---

## 非代码事项（需团队推进）

- [ ] 平台定位书面确认（学科 / 非学科 / 成人）
- [ ] 营业执照 + 办学许可（如适用）
- [ ] 微信小程序企业主体 + 教育类目
- [ ] 微信商户号 + 分账能力
- [ ] 生产域名备案 + HTTPS
- [ ] Figma 原型与 UI 终稿

---

*随版本迭代更新本文档「状态」列，完成后标记 ✅。*
