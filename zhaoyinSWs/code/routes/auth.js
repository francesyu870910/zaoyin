const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码不能为空'
            });
        }
        
        const db = req.app.get('db');
        
        // 查询用户
        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
            if (err) {
                console.error('数据库查询错误:', err);
                return res.status(500).json({
                    success: false,
                    message: '服务器内部错误'
                });
            }
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: '用户名或密码错误'
                });
            }
            
            // 验证密码
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: '用户名或密码错误'
                });
            }
            
            // 更新最后登录时间
            db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
            
            // 设置会话
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.role = user.role;
            req.session.name = user.name; // Store user's name in session
            
            res.json({
                success: true,
                message: '登录成功',
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name, // Include user's name in response
                    role: user.role
                }
            });
        });
        
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 用户退出
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: '退出失败'
            });
        }
        
        res.json({
            success: true,
            message: '退出成功'
        });
    });
});

// 获取用户信息
router.get('/profile', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: '未登录'
        });
    }
    
    res.json({
        success: true,
        user: {
            id: req.session.userId,
            username: req.session.username,
            name: req.session.name, // Include user's name from session
            role: req.session.role
        }
    });
});

module.exports = router;