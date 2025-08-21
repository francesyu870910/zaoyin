const express = require('express');
const router = express.Router();

// 获取告警列表
router.get('/', (req, res) => {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
        SELECT a.*, mp.name as point_name, mp.location, u.name as handler_name
        FROM alerts a
        JOIN monitoring_points mp ON a.point_id = mp.id
        LEFT JOIN users u ON a.handled_by = u.id
        WHERE 1=1
    `;
    const params = [];
    
    if (status) {
        sql += ' AND a.status = ?';
        params.push(status);
    }
    
    sql += ' ORDER BY a.alert_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const db = req.app.get('db');
    
    db.all(sql, params, (err, alerts) => {
        if (err) {
            console.error('查询告警列表错误:', err);
            return res.status(500).json({
                success: false,
                message: '服务器内部错误'
            });
        }
        
        res.json({
            success: true,
            data: alerts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    });
});

// 获取告警统计
router.get('/statistics', (req, res) => {
    const { start_date, end_date } = req.query;
    
    let sql = `
        SELECT 
            COUNT(*) as total_alerts,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_alerts,
            SUM(CASE WHEN status = 'handled' THEN 1 ELSE 0 END) as handled_alerts,
            AVG(noise_level) as avg_noise_level,
            MAX(noise_level) as max_noise_level
        FROM alerts
        WHERE date(alert_time) = date('now')
    `;
    const params = [];
    
    if (start_date) {
        sql += ' AND alert_time >= ?';
        params.push(start_date);
    }
    
    if (end_date) {
        sql += ' AND alert_time <= ?';
        params.push(end_date);
    }
    
    const db = req.app.get('db');
    
    db.get(sql, params, (err, stats) => {
        if (err) {
            console.error('查询告警统计错误:', err);
            return res.status(500).json({
                success: false,
                message: '服务器内部错误'
            });
        }
        
        res.json({
            success: true,
            data: stats
        });
    });
});

// 获取单个告警详情
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const db = req.app.get('db');
    const sql = `
        SELECT a.*, mp.name as point_name, mp.location, u.name as handler_name
        FROM alerts a
        JOIN monitoring_points mp ON a.point_id = mp.id
        LEFT JOIN users u ON a.handled_by = u.id
        WHERE a.id = ?
    `;

    db.get(sql, [id], (err, alert) => {
        if (err) {
            console.error('查询告警详情错误:', err);
            return res.status(500).json({ success: false, message: '服务器内部错误' });
        }
        if (!alert) {
            return res.status(404).json({ success: false, message: '告警记录不存在' });
        }
        res.json({ success: true, data: alert });
    });
});

// 处理告警
router.put('/:id/handle', (req, res) => {
    const { id } = req.params;
    const userId = req.session.userId;
    
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: '未登录'
        });
    }
    
    const db = req.app.get('db');
    
    const sql = `UPDATE alerts 
                 SET status = 'handled', handled_by = ?, handled_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`;
    
    db.run(sql, [userId, id], function(err) {
        if (err) {
            console.error('处理告警错误:', err);
            return res.status(500).json({
                success: false,
                message: '处理告警失败'
            });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: '告警记录不存在'
            });
        }
        
        res.json({
            success: true,
            message: '告警处理成功'
        });
    });
});

module.exports = router;