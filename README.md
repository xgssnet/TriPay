# 三合一收款码

一个简洁优雅的三合一收款码生成工具，支持将 QQ、微信、支付宝收款码合并为一个专属链接，方便分享和扫码支付。

## 功能特性

- **三码合一**：将 QQ、微信、支付宝收款码合并为一个页面
- **智能识别**：自动识别上传的二维码属于哪个支付平台，避免上传错误
- **专属链接**：生成短链接，方便分享到社交媒体
- **手机适配**：完美适配手机扫码访问，自动检测浏览器类型并提示
- **一键跳转**：支持直接跳转到对应的支付 App
- **二维码下载**：可下载生成的聚合二维码图片
- **隐私保护**：图片本地存储，不上传到第三方服务器

## 技术栈

### 后端
- **Node.js** + **Express** - Web 框架
- **SQLite** - 轻量级数据库
- **Multer** - 文件上传处理
- **UUID** - 唯一标识符生成

### 前端
- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 下一代前端构建工具
- **Element Plus** - UI 组件库
- **QRCode.js** - 二维码生成
- **jsQR** - 二维码识别（可选）

## 快速开始

### 环境要求

- Node.js >= 16
- npm >= 8

### 本地开发

1. 克隆项目

```bash
git clone <repository-url>
cd QQ-WEIXIN-ZHIFUBAO
```

2. 安装后端依赖

```bash
cd backend
npm install
```

3. 安装前端依赖

```bash
cd ../frontend
npm install
```

4. 启动后端服务

```bash
cd ../backend
node server.js
```

后端服务默认运行在 http://localhost:3000

5. 启动前端开发服务器

```bash
cd ../frontend
npm run dev
```

前端开发服务器默认运行在 http://localhost:5173

6. 打开浏览器访问 http://localhost:5173

## 部署上线

### 方式一：手动部署（推荐）

#### 1. 服务器准备

- 一台 Linux 服务器（Ubuntu/CentOS）
- 安装 Node.js 16+ 和 npm
- 安装 PM2（进程管理）

```bash
npm install -g pm2
```

#### 2. 构建前端

```bash
cd frontend
npm install
npm run build
```

构建后的文件位于 `frontend/dist` 目录。

#### 3. 配置后端

编辑 `backend/server.js`，确保以下配置正确：

```javascript
const PORT = process.env.PORT || 3000;
const FRONTEND_DIST = path.join(__dirname, '../frontend/dist');
```

#### 4. 配置生产环境 API

创建 `frontend/.env.production`：

```env
VITE_API_BASE_URL=https://your-domain.com
```

#### 5. 使用 PM2 启动服务

```bash
cd backend
pm2 start server.js --name qrcode-server
```

#### 6. 配置 Nginx（可选但推荐）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态资源
    location / {
        root /path/to/QQ-WEIXIN-ZHIFUBAO/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 上传文件访问
    location /uploads/ {
        alias /path/to/QQ-WEIXIN-ZHIFUBAO/backend/uploads/;
    }
}
```

#### 7. 配置 HTTPS（推荐）

使用 Let's Encrypt 免费证书：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 方式二：Docker 部署

#### 1. 创建 Dockerfile

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# 运行阶段
FROM node:18-alpine

WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production

COPY backend/ ./
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 3000

CMD ["node", "server.js"]
```

#### 2. 构建并运行

```bash
docker build -t qrcode-app .
docker run -d -p 3000:3000 -v $(pwd)/backend/uploads:/app/uploads qrcode-app
```

### 方式三：Vercel / Netlify 部署（前端）+ Railway / Render 部署（后端）

#### 前端部署（Vercel）

1. 将代码推送到 GitHub
2. 在 Vercel 导入项目
3. 设置构建命令：`cd frontend && npm run build`
4. 设置输出目录：`frontend/dist`
5. 添加环境变量：`VITE_API_BASE_URL=https://your-backend-url.com`

#### 后端部署（Railway / Render）

1. 在 Railway/Render 创建新项目
2. 连接 GitHub 仓库
3. 设置启动命令：`cd backend && node server.js`
4. 添加环境变量（如需要）

## 项目结构

```
QQ-WEIXIN-ZHIFUBAO/
├── backend/                 # 后端服务
│   ├── server.js           # 主入口文件
│   ├── uploads/            # 上传文件目录
│   ├── database.sqlite     # SQLite 数据库
│   └── package.json
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── api/            # API 接口
│   │   ├── views/          # 页面组件
│   │   ├── utils/          # 工具函数
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── style.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## 环境变量

### 后端

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 服务端口 | 3000 |
| `NODE_ENV` | 运行环境 | development |

### 前端

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_API_BASE_URL` | API 基础地址 | http://localhost:3000 |

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/qrcode | 上传收款码并生成 |
| GET | /api/qrcode/:id | 获取收款码信息 |
| GET | /api/health | 健康检查 |

## 常见问题

### 1. 前端无法连接后端

确保前端 `.env` 文件中的 `VITE_API_BASE_URL` 配置正确，且后端服务已启动。

### 2. 上传文件失败

检查 `backend/uploads` 目录是否存在且有写入权限：

```bash
mkdir -p backend/uploads
chmod 755 backend/uploads
```

### 3. 二维码无法识别

二维码识别功能依赖 `jsQR` 库，如需使用请安装：

```bash
cd frontend
npm install jsqr
```

不安装也能正常使用，只是无法自动识别平台。

### 4. 数据库迁移

如需重置数据库，直接删除 `backend/database.sqlite` 文件，服务重启后会自动创建。

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 致谢

- [Vue.js](https://vuejs.org/)
- [Element Plus](https://element-plus.org/)
- [Express](https://expressjs.com/)
- [QRCode.js](https://github.com/soldair/node-qrcode)
