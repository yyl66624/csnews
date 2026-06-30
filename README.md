# 优学家教 — 一对一家教微信小程序

> C2C 家教撮合平台 | Phase 1 MVP

## 项目结构

```
csnews/
├── apps/miniprogram/   # 微信小程序
├── apps/server/        # NestJS 后端（默认 MySQL）
├── apps/admin/         # React 管理后台
└── scripts/init.sql    # MySQL 初始化脚本（可选）
```

## 快速开始

### 1. 准备 MySQL

在 MySQL 中创建数据库（只需执行一次）：

```sql
CREATE DATABASE IF NOT EXISTS csnews DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

或使用命令行：

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS csnews DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 2. 配置并启动后端

```bash
cd apps/server
cp .env.example .env
```

编辑 `.env`，填入你的 MySQL 账号密码：

```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=你的密码
DB_DATABASE=csnews
```

启动服务：

```bash
npm install
npm run start:dev
```

首次启动会自动：
- 建表（开发模式 `synchronize` 自动同步）
- 导入 3 位演示教师
- 创建管理员账号

API 地址：`http://127.0.0.1:3000/api`

> 也可手动执行 `scripts/init.sql` 初始化表结构（生产环境推荐关闭 synchronize，改用迁移）。

### 3. 启动小程序

1. 微信开发者工具打开 `apps/miniprogram`
2. 「详情 → 本地设置」勾选 **不校验合法域名**
3. 确认 `utils/config.js` 中 `apiBase` 为 `http://127.0.0.1:3000/api`
4. 编译运行

真机调试时将 API 地址改为你电脑的局域网 IP。

### 4. 管理后台（可选）

```bash
cd apps/admin
npm install
npm run dev
```

OpenID 填 `dev_admin_openid_placeholder` 登录。

## 备选：SQLite（无 MySQL 时）

`.env` 中改为：

```env
DB_TYPE=sqlite
DB_PATH=./data/csnews.sqlite
```

无需安装 MySQL，数据保存在本地 sqlite 文件。

## GitHub

https://github.com/yyl66624/csnews.git
