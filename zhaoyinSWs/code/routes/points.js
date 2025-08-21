const express = require('express');
const router = express.Router();

// 获取所有监测点位
router.get('/', (req, res) => {
    const db = req.app.get('db');
    
    db.all('SELECT * FROM monitoring_points ORDER BY created_at DESC', (err, points) => {
        if (err) {
            console.error('查询监测点位错误:', err);
            return res.status(500).json({
                success: false,
                message: '服务器内部错误'
            });
        }
        
        res.json({
            success: true,
            data: points
        });
    });
});

// 创建新监测点位
router.post('/', (req, res) => {
    const { name, location, latitude, longitude, threshold_day, threshold_night } = req.body;
    
    if (!name || !location || !latitude || !longitude) {
        return res.status(400).json({
            success: false,
            message: '监测点名称、位置、经纬度不能为空'
        });
    }
    
    const db = req.app.get('db');
    
    const sql = `INSERT INTO monitoring_points 
                 (name, location, latitude, longitude, threshold_day, threshold_night) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [name, location, latitude, longitude, threshold_day || 55.0, threshold_night || 45.0], 
        function(err) {
            if (err) {
                console.error('创建监测点位错误:', err);
                return res.status(500).json({
                    success: false,
                    message: '创建监测点位失败'
                });
            }
            
            res.json({
                success: true,
                message: '监测点位创建成功',
                data: { id: this.lastID }
            });
        });
});

// 获取指定监测点位
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const db = req.app.get('db');
    
    db.get('SELECT * FROM monitoring_points WHERE id = ?', [id], (err, point) => {
        if (err) {
            console.error('查询监测点位错误:', err);
            return res.status(500).json({
                success: false,
                message: '服务器内部错误'
            });
        }
        
        if (!point) {
            return res.status(404).json({
                success: false,
                message: '监测点位不存在'
            });
        }
        
        res.json({
            success: true,
            data: point
        });
    });
});

// 更新监测点位
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, location, latitude, longitude, threshold_day, threshold_night, status } = req.body;
    
    const db = req.app.get('db');
    
    const sql = `UPDATE monitoring_points 
                 SET name = ?, location = ?, latitude = ?, longitude = ?, 
                     threshold_day = ?, threshold_night = ?, status = ?
                 WHERE id = ?`;
    
    db.run(sql, [name, location, latitude, longitude, threshold_day, threshold_night, status, id], 
        function(err) {
            if (err) {
                console.error('更新监测点位错误:', err);
                return res.status(500).json({
                    success: false,
                    message: '更新监测点位失败'
                });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: '监测点位不存在'
                });
            }
            
            res.json({
                success: true,
                message: '监测点位更新成功'
            });
        });
});

// 删除监测点位
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const db = req.app.get('db');
    
    db.run('DELETE FROM monitoring_points WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('删除监测点位错误:', err);
            return res.status(500).json({
                success: false,
                message: '删除监测点位失败'
            });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: '监测点位不存在'
            });
        }
        
        res.json({
            success: true,
            message: '监测点位删除成功'
        });
    });
});

module.exports = router;