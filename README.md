# 智能噪声监测管理系统

环保部门专用的噪声污染监测管理平台，提供实时数据采集、分析、预警和管理功能。

## 系统特点

- **专业界面设计**：左侧导航 + 右侧内容的经典布局，深蓝色商用配色
- **简单技术栈**：Node.js + Express + SQLite，易于开发和部署
- **完整功能模块**：8个核心模块，涵盖监测管理全流程
- **无框架依赖**：前端使用原生HTML/CSS/JavaScript，兼容性好

## 功能模块

1. **用户登录管理** - 安全认证和权限控制
2. **监测点位管理** - 地图展示和点位信息管理
3. **实时数据采集** - 实时监测数据展示和图表
4. **数据分析统计** - 多维度数据分析和趋势图表
5. **预警告警管理** - 自动告警检测和处理流程
6. **历史数据查询** - 灵活的数据检索和导出
7. **报告生成管理** - 自动化报告生成和下载
8. **系统设置管理** - 参数配置和用户管理

## 技术架构

- **后端**：Node.js + Express.js
- **数据库**：SQLite（文件数据库，零配置）
- **前端**：原生HTML + CSS + JavaScript
- **图表**：Chart.js
- **地图**：Leaflet + OpenStreetMap

## 快速开始

### 环境要求

- Node.js 14.0 或更高版本
- npm 6.0 或更高版本

### 安装依赖

```bash
npm install
```

### 启动服务器

```bash
npm start
```

### 访问系统

打开浏览器访问：http://localhost:3000

默认管理员账户：
- 用户名：admin
- 密码：admin123

## 项目结构

```
noise-monitoring-system/
├── app.js                 # 主服务器文件
├── package.json           # 项目配置文件
├── README.md             # 项目说明文档
├── database/             # 数据库相关
│   └── init.js          # 数据库初始化脚本
├── routes/              # API路由
│   ├── auth.js         # 认证相关路由
│   ├── points.js       # 监测点位路由
│   ├── data.js         # 数据管理路由
│   └── alerts.js       # 告警管理路由
├── utils/               # 工具函数
│   └── auth-middleware.js # 认证中间件
└── public/              # 前端静态文件
    ├── index.html       # 主页面
    ├── login.html       # 登录页面
    ├── styles/          # CSS样式文件
    └── js/              # JavaScript文件
```

## 数据库结构

系统使用SQLite数据库，包含4个核心数据表：

1. **users** - 用户信息表
2. **monitoring_points** - 监测点位表
3. **noise_data** - 噪声数据表
4. **alerts** - 告警记录表

## 开发说明

### 添加新功能

1. 在 `routes/` 目录下创建新的路由文件
2. 在 `public/` 目录下添加对应的前端页面
3. 在 `app.js` 中注册新的路由

### 数据库操作

系统使用SQLite数据库，所有数据库操作都通过 `req.app.get('db')` 获取数据库连接。

### 前端开发

前端使用原生JavaScript，主要文件：
- `js/api-client.js` - API请求封装
- `js/router.js` - 前端路由管理
- `js/main.js` - 主要业务逻辑

## 部署说明

### 开发环境

```bash
npm run dev
```

### 生产环境

1. 设置环境变量 `NODE_ENV=production`
2. 配置HTTPS和域名
3. 使用PM2进行进程管理

```bash
npm install -g pm2
pm2 start app.js --name noise-monitoring
```

## 许可证

MIT License

## 联系方式

如有问题或建议，请联系开发团队。