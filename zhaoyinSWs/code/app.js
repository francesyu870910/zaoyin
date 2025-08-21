const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3003;

// 中间件配置
app.use(cors({
    origin: 'http://localhost:3003', // 只允许来自这个源的请求
    credentials: true // 允许发送cookies
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 会话配置
app.use(session({
    secret: 'noise-monitoring-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // 开发环境设为false，生产环境应设为true
        maxAge: 24 * 60 * 60 * 1000 // 24小时
    }
}));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 初始化数据库
let db;
initializeDatabase().then(database => {
    db = database;
    app.set('db', db);
    console.log('数据库初始化完成');
}).catch(err => {
    console.error('数据库初始化失败:', err);
    process.exit(1);
});

// 路由配置
app.use('/api/auth', require('./routes/auth'));
app.use('/api/points', require('./routes/points'));
app.use('/api/data', require('./routes/data'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/users', require('./routes/users'));

// 根路径重定向到登录页面
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err.stack);
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || '服务器内部错误',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '请求的资源不存在'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`环境噪声监测管理系统服务器运行在端口 ${PORT}`);
    console.log(`访问地址: http://localhost:${PORT}`);
    console.log('默认管理员账户: admin / admin123');
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n正在关闭服务器...');
    if (db) {
        db.close((err) => {
            if (err) {
                console.error('关闭数据库连接失败:', err.message);
            } else {
                console.log('数据库连接已关闭');
            }
        });
    }
    process.exit(0);
});

module.exports = app;