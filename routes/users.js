
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { requireAuth } = require('../utils/auth-middleware');

// GET /api/users - 获取所有用户
router.get('/', (req, res) => {
    const db = req.app.get('db');
    const sql = `
        SELECT id, username, name, role, created_at, last_login 
        FROM users 
        ORDER BY created_at DESC
    `;
    
    db.all(sql, [], (err, users) => {
        if (err) {
            console.error('查询用户列表错误:', err);
            return res.status(500).json({ success: false, message: '服务器内部错误' });
        }
        res.json({ success: true, data: users });
    });
});

// POST /api/users - 创建新用户
router.post('/', async (req, res) => {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name || !role) {
        return res.status(400).json({ success: false, message: '用户名、密码、姓名和角色不能为空' });
    }

    if (password.length < 6) {
        return res.status(400).json({ success: false, message: '密码长度不能少于6位' });
    }

    const db = req.app.get('db');

    try {
        // 检查用户名是否已存在
        db.get('SELECT id FROM users WHERE username = ?', [username], async (err, user) => {
            if (err) {
                console.error('查询用户错误:', err);
                return res.status(500).json({ success: false, message: '服务器内部错误' });
            }
            if (user) {
                return res.status(400).json({ success: false, message: '用户名已存在' });
            }

            // 哈希密码
            const hashedPassword = await bcrypt.hash(password, 10);

            // 插入新用户
            const insertSql = 'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)';
            db.run(insertSql, [username, hashedPassword, name, role], function(err) {
                if (err) {
                    console.error('创建用户失败:', err);
                    return res.status(500).json({ success: false, message: '创建用户失败' });
                }
                res.status(201).json({ success: true, message: '用户创建成功', data: { id: this.lastID } });
            });
        });
    } catch (error) {
        console.error('处理用户创建请求时出错:', error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
});

// GET /api/users/:id - 获取单个用户
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const db = req.app.get('db');
    const sql = 'SELECT id, username, name, role FROM users WHERE id = ?';

    db.get(sql, [id], (err, user) => {
        if (err) {
            console.error('查询用户错误:', err);
            return res.status(500).json({ success: false, message: '服务器内部错误' });
        }
        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        res.json({ success: true, data: user });
    });
});

// PUT /api/users/:id - 更新用户
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { username, name, role } = req.body;

    if (!username || !name || !role) {
        return res.status(400).json({ success: false, message: '用户名、姓名和角色不能为空' });
    }

    const db = req.app.get('db');

    // 首先，获取被编辑的用户信息
    db.get('SELECT username FROM users WHERE id = ?', [id], (err, userToEdit) => {
        if (err) {
            return res.status(500).json({ success: false, message: '服务器内部错误' });
        }
        if (!userToEdit) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        if (userToEdit.username === 'admin') {
            return res.status(403).json({ success: false, message: '不允许编辑管理员账户' });
        }

        // 继续更新
        const sql = 'UPDATE users SET username = ?, name = ?, role = ? WHERE id = ?';
        db.run(sql, [username, name, role, id], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed: users.username')) {
                    return res.status(400).json({ success: false, message: '该用户名已被使用' });
                }
                console.error('更新用户失败:', err);
                return res.status(500).json({ success: false, message: '更新用户失败' });
            }
            res.json({ success: true, message: '用户更新成功' });
        });
    });
});

// GET /api/users/me - 获取当前登录用户的信息
router.get('/me', requireAuth, (req, res) => {
    console.log('Session in /api/users/me:', req.session);
    const db = req.app.get('db');
    const userId = req.session.userId;
    console.log('User ID from session:', userId);
    const sql = 'SELECT id, username, name, role FROM users WHERE id = ?';

    db.get(sql, [userId], (err, user) => {
        if (err) {
            console.error('查询当前用户错误:', err);
            return res.status(500).json({ success: false, message: '服务器内部错误' });
        }
        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        res.json({ success: true, data: user });
    });
});

// POST /api/users/change-password - 修改密码
router.post('/change-password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.userId;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: '当前密码和新密码不能为空' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: '新密码长度不能少于6位' });
    }

    const db = req.app.get('db');

    try {
        // 获取当前用户密码
        db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
            if (err) {
                console.error('查询用户错误:', err);
                return res.status(500).json({ success: false, message: '服务器内部错误' });
            }
            if (!user) {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }

            // 验证当前密码
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: '当前密码不正确' });
            }

            // 哈希新密码
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // 更新密码
            const updateSql = 'UPDATE users SET password = ? WHERE id = ?';
            db.run(updateSql, [hashedPassword, userId], function(err) {
                if (err) {
                    console.error('更新密码失败:', err);
                    return res.status(500).json({ success: false, message: '密码更新失败' });
                }
                res.json({ success: true, message: '密码修改成功' });
            });
        });
    } catch (error) {
        console.error('处理密码修改请求时出错:', error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
});

module.exports = router;
