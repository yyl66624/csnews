# 优学家教 — 一对一家教微信小程序

> C2C 家教撮合平台 | 当前版本 **v1.2**  
> 产品范围：**预约 · 支付 · 评价**（不含在线音视频授课）

## 项目结构

```
csnews/
├── apps/miniprogram/   # 微信小程序
├── apps/server/        # NestJS 后端（默认 MySQL）
├── apps/admin/         # React 管理后台
├── docs/               # 规划与进度文档
└── scripts/init.sql    # MySQL 初始化脚本（可选）
```

## 文档

| 文档 | 说明 |
|------|------|
| [开发技术步骤文档](docs/开发技术步骤文档.md) | 全阶段技术路线与功能清单 |
| [下一阶段规划](docs/下一阶段规划.md) | A→D 阶段任务与阻塞项 |
| [阶段ABC实施进度](docs/阶段ABC实施进度.md) | 代码实现状态与后续优先级 |

## 快速开始

> **环境要求：** Node.js ≥ 18（见 `package.json` 的 `engines`）、MySQL 8（或用 Docker）。

### 1. 准备 MySQL

方式 A —— 用 Docker 一键启动（含建库与初始化脚本）：

```bash
npm run docker:up        # 等价于 docker-compose up -d（MySQL + Redis）
```

方式 B —— 本地 MySQL：手动建库后，后端首次启动会自动建表并导入演示数据。

```sql
CREATE DATABASE IF NOT EXISTS csnews DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 配置并启动后端

```bash
cd apps/server
cp .env.example .env
# 编辑 .env 填入 MySQL 账号密码
npm install
npm run start:dev
```

首次启动会自动建表、导入 3 位演示教师、创建管理员账号。

> 也可使用根目录脚本：`npm run dev:server`（等同上面的后端命令）、`npm run dev:admin`。

- API：`http://127.0.0.1:3000/api`
- 停止占用端口：`npm run stop`
- E2E 测试：`npm run test:e2e`

### 3. 启动小程序

1. 微信开发者工具打开 `apps/miniprogram`
2. 「详情 → 本地设置」勾选 **不校验合法域名**
3. 确认 `utils/config.js` 中 `apiBase` 为 `http://127.0.0.1:3000/api`（勿用 `localhost`）
4. 编译运行

真机调试时将 API 改为你电脑的局域网 IP。

### 4. 管理后台（可选）

```bash
cd apps/admin
npm install
npm run dev
```

OpenID 填 `dev_admin_openid_placeholder`（开发模式）登录。

## 生产支付配置

在 `apps/server/.env` 配置微信支付 APIv3 证书，详见 `.env.example`。未配置时开发环境使用 mock 支付。

## 备选：SQLite

```env
DB_TYPE=sqlite
DB_PATH=./data/csnews.sqlite
```

## GitHub

https://github.com/yyl66624/csnews.git

**标签：** [v1.2](https://github.com/yyl66624/csnews/releases/tag/v1.2) · [v1.1](https://github.com/yyl66624/csnews/releases/tag/v1.1)
