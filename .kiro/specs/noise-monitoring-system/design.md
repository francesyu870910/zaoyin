# 智能噪声监测管理系统设计文档

## 系统概述

智能噪声监测管理系统采用经典的B/S架构，使用最简单稳定的技术栈确保易于开发和维护。系统界面采用左侧导航、右侧内容的专业布局，配色方案体现商用级别的专业性。

## 技术架构

### 技术栈选择
- **后端框架**：Node.js + Express.js
- **数据库**：SQLite（文件数据库，零配置）
- **前端技术**：原生HTML + CSS + JavaScript
- **图表库**：Chart.js（轻量级，无依赖）
- **地图组件**：Leaflet + OpenStreetMap
- **HTTP客户端**：原生fetch API

### 架构优势
- 无复杂框架依赖，调试简单
- SQLite数据库无需安装配置
- 前端原生技术，兼容性好
- 整体技术栈学习成本低

## 系统架构

### 整体架构图
```
┌─────────────────┐    HTTP请求    ┌─────────────────┐
│   浏览器客户端   │ ──────────────→ │   Express服务器  │
│                │                │                │
│ - HTML页面      │ ←────────────── │ - 路由处理      │
│ - CSS样式       │    JSON响应     │ - 业务逻辑      │
│ - JavaScript    │                │ - 数据验证      │
└─────────────────┘                └─────────────────┘
                                           │
                                           │ SQL查询
                                           ▼
                                   ┌─────────────────┐
                                   │   SQLite数据库   │
                                   │                │
                                   │ - 用户表        │
                                   │ - 监测点表      │
                                   │ - 监测数据表    │
                                   │ - 告警记录表    │
                                   └─────────────────┘
```

## 数据库设计

### 核心数据表

#### 1. 用户表 (users)
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);
```

#### 2. 监测点位表 (monitoring_points)
```sql
CREATE TABLE monitoring_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    status VARCHAR(20) DEFAULT 'active',
    threshold_day DECIMAL(5,2) DEFAULT 55.0,
    threshold_night DECIMAL(5,2) DEFAULT 45.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. 监测数据表 (noise_data)
```sql
CREATE TABLE noise_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    point_id INTEGER,
    noise_level DECIMAL(5,2) NOT NULL,
    measurement_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_type VARCHAR(20) DEFAULT 'realtime',
    FOREIGN KEY (point_id) REFERENCES monitoring_points(id)
);
```

#### 4. 告警记录表 (alerts)
```sql
CREATE TABLE alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    point_id INTEGER,
    noise_level DECIMAL(5,2),
    threshold_value DECIMAL(5,2),
    alert_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    handled_by INTEGER,
    handled_at DATETIME,
    FOREIGN KEY (point_id) REFERENCES monitoring_points(id),
    FOREIGN KEY (handled_by) REFERENCES users(id)
);
```

## 前端界面设计

### 整体布局结构
```html
<!DOCTYPE html>
<html>
<head>
    <title>智能噪声监测管理系统</title>
    <link rel="stylesheet" href="styles/main.css">
</head>
<body>
    <div class="app-container">
        <!-- 顶部标题栏 -->
        <header class="app-header">
            <h1>智能噪声监测管理系统</h1>
            <div class="user-info">
                <span id="username"></span>
                <button onclick="logout()">退出</button>
            </div>
        </header>
        
        <!-- 主体内容区 -->
        <div class="app-body">
            <!-- 左侧导航 -->
            <nav class="sidebar">
                <ul class="nav-menu">
                    <li><a href="#dashboard">系统首页</a></li>
                    <li><a href="#points">点位管理</a></li>
                    <li><a href="#realtime">实时监测</a></li>
                    <li><a href="#analysis">数据分析</a></li>
                    <li><a href="#alerts">预警管理</a></li>
                    <li><a href="#history">历史查询</a></li>
                    <li><a href="#reports">报告生成</a></li>
                    <li><a href="#settings">系统设置</a></li>
                </ul>
            </nav>
            
            <!-- 右侧内容区 -->
            <main class="content-area">
                <div id="page-content">
                    <!-- 动态加载页面内容 -->
                </div>
            </main>
        </div>
    </div>
</body>
</html>
```

### CSS设计规范

#### 配色方案
```css
:root {
    /* 主色调 - 专业蓝 */
    --primary-color: #2c3e50;
    --primary-light: #34495e;
    --accent-color: #3498db;
    --accent-hover: #2980b9;
    
    /* 功能色 */
    --success-color: #27ae60;
    --warning-color: #f39c12;
    --danger-color: #e74c3c;
    --info-color: #3498db;
    
    /* 中性色 */
    --bg-color: #ecf0f1;
    --card-bg: #ffffff;
    --text-primary: #2c3e50;
    --text-secondary: #7f8c8d;
    --border-color: #bdc3c7;
}
```

#### 核心样式
```css
/* 整体布局 */
.app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-family: 'Microsoft YaHei', Arial, sans-serif;
}

.app-header {
    background: var(--primary-color);
    color: white;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 60px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.app-body {
    display: flex;
    flex: 1;
    overflow: hidden;
}

/* 左侧导航 */
.sidebar {
    width: 240px;
    background: var(--primary-color);
    color: white;
    overflow-y: auto;
}

.nav-menu {
    list-style: none;
    padding: 0;
    margin: 0;
}

.nav-menu li a {
    display: block;
    padding: 15px 20px;
    color: white;
    text-decoration: none;
    border-bottom: 1px solid var(--primary-light);
    transition: background-color 0.3s;
}

.nav-menu li a:hover,
.nav-menu li a.active {
    background: var(--accent-color);
}

/* 右侧内容区 */
.content-area {
    flex: 1;
    background: var(--bg-color);
    padding: 20px;
    overflow-y: auto;
}

/* 卡片样式 */
.card {
    background: var(--card-bg);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* 按钮样式 */
.btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s;
}

.btn-primary {
    background: var(--accent-color);
    color: white;
}

.btn-primary:hover {
    background: var(--accent-hover);
}
```

## 核心组件设计

### 1. 路由管理器
```javascript
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = '';
    }
    
    register(path, handler) {
        this.routes[path] = handler;
    }
    
    navigate(path) {
        if (this.routes[path]) {
            this.currentRoute = path;
            this.routes[path]();
            this.updateActiveNav(path);
        }
    }
    
    updateActiveNav(path) {
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${path}"]`).classList.add('active');
    }
}
```

### 2. API客户端
```javascript
class ApiClient {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }
        
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }
    
    get(endpoint) {
        return this.request(endpoint);
    }
    
    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    }
    
    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    }
    
    delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}
```

### 3. 图表组件
```javascript
class ChartManager {
    constructor() {
        this.charts = {};
    }
    
    createLineChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const defaultOptions = {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '噪声监测数据'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '分贝 (dB)'
                    }
                }
            }
        };
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: data,
            options: { ...defaultOptions, ...options }
        });
        
        return this.charts[canvasId];
    }
    
    updateChart(canvasId, newData) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].data = newData;
            this.charts[canvasId].update();
        }
    }
    
    destroyChart(canvasId) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
            delete this.charts[canvasId];
        }
    }
}
```

## 后端API设计

### RESTful API规范

#### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户退出
- `GET /api/auth/profile` - 获取用户信息

#### 监测点位管理
- `GET /api/points` - 获取所有监测点
- `POST /api/points` - 创建新监测点
- `GET /api/points/:id` - 获取指定监测点
- `PUT /api/points/:id` - 更新监测点信息
- `DELETE /api/points/:id` - 删除监测点

#### 监测数据
- `GET /api/data/realtime` - 获取实时数据
- `POST /api/data` - 添加监测数据
- `GET /api/data/history` - 获取历史数据
- `GET /api/data/statistics` - 获取统计数据

#### 告警管理
- `GET /api/alerts` - 获取告警列表
- `PUT /api/alerts/:id/handle` - 处理告警
- `GET /api/alerts/statistics` - 获取告警统计

### Express.js路由结构
```javascript
// app.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('noise_monitoring.db');

// 中间件
app.use(express.json());
app.use(express.static('public'));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/points', require('./routes/points'));
app.use('/api/data', require('./routes/data'));
app.use('/api/alerts', require('./routes/alerts'));

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});
```

## 错误处理策略

### 前端错误处理
```javascript
class ErrorHandler {
    static showError(message, type = 'error') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            document.body.removeChild(alertDiv);
        }, 5000);
    }
    
    static handleApiError(error) {
        console.error('API Error:', error);
        this.showError('操作失败，请稍后重试');
    }
}
```

### 后端错误处理
```javascript
// 全局错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || '服务器内部错误',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});
```

## 测试策略

### 单元测试
- 使用Jest框架进行JavaScript函数测试
- 测试API端点的输入输出
- 测试数据库操作的正确性

### 集成测试
- 测试前后端数据交互
- 测试用户操作流程
- 测试异常情况处理

### 用户界面测试
- 测试各页面的加载和显示
- 测试表单提交和验证
- 测试响应式布局

## 部署方案

### 开发环境
```bash
# 安装依赖
npm install express sqlite3 cors

# 启动开发服务器
npm run dev
```

### 生产环境
- 使用PM2进行进程管理
- 配置Nginx反向代理
- 设置SSL证书确保HTTPS访问
- 配置日志轮转和监控

## 性能优化

### 前端优化
- CSS和JavaScript文件压缩
- 图片资源优化
- 使用浏览器缓存
- 异步加载非关键资源

### 后端优化
- 数据库查询优化
- 添加适当的索引
- 实现数据分页
- 使用连接池管理数据库连接

### 数据库优化
```sql
-- 为常用查询字段添加索引
CREATE INDEX idx_noise_data_point_time ON noise_data(point_id, measurement_time);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_monitoring_points_status ON monitoring_points(status);
```

这个设计文档提供了完整的系统架构和实现方案，采用最简单稳定的技术栈，确保易于开发和维护。