const express = require('express');
const router = express.Router();

// 获取实时数据
router.get('/realtime', (req, res) => {
    const db = req.app.get('db');
    
    const sql = `
        SELECT nd.*, mp.name as point_name, mp.location, mp.threshold_day, mp.threshold_night
        FROM noise_data nd
        JOIN monitoring_points mp ON nd.point_id = mp.id
        WHERE nd.measurement_time >= datetime('now', '-1 hour')
        ORDER BY nd.measurement_time DESC
    `;
    
    db.all(sql, (err, data) => {
        if (err) {
            console.error('查询实时数据错误:', err);
            return res.status(500).json({
                success: false,
                message: '服务器内部错误'
            });
        }
        
        res.json({
            success: true,
            data: data
        });
    });
});

// 添加监测数据
router.post('/', (req, res) => {
    const { point_id, noise_level, data_type } = req.body;
    
    if (!point_id || noise_level === undefined) {
        return res.status(400).json({
            success: false,
            message: '监测点ID和噪声值不能为空'
        });
    }
    
    const db = req.app.get('db');
    
    const sql = `INSERT INTO noise_data (point_id, noise_level, data_type) VALUES (?, ?, ?)`;
    
    db.run(sql, [point_id, noise_level, data_type || 'realtime'], function(err) {
        if (err) {
            console.error('添加监测数据错误:', err);
            return res.status(500).json({
                success: false,
                message: '添加监测数据失败'
            });
        }
        
        // 检查是否需要生成告警
        checkAndCreateAlert(db, point_id, noise_level);
        
        res.json({
            success: true,
            message: '监测数据添加成功',
            data: { id: this.lastID }
        });
    });
});

// 获取历史数据
router.get('/history', (req, res) => {
    const { point_id, start_date, end_date, page = 1, limit = 10 } = req.query; // Default limit to 10
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let baseSql = `
        SELECT nd.*, mp.name as point_name, mp.location
        FROM noise_data nd
        JOIN monitoring_points mp ON nd.point_id = mp.id
        WHERE 1=1
    `;
    const baseParams = [];

    if (point_id) {
        baseSql += ' AND nd.point_id = ?';
        baseParams.push(point_id);
    }

    if (start_date) {
        baseSql += ' AND nd.measurement_time >= ?';
        baseParams.push(start_date);
    }

    if (end_date) {
        baseSql += ' AND nd.measurement_time <= ?';
        baseParams.push(end_date);
    }

    const db = req.app.get('db');

    // First, get the total count with the applied filters
    const countSql = `SELECT COUNT(*) as count FROM noise_data nd JOIN monitoring_points mp ON nd.point_id = mp.id WHERE 1=1`
        + baseSql.substring(baseSql.indexOf('WHERE 1=1') + 'WHERE 1=1'.length);

    db.get(countSql, baseParams, (err, row) => {
        if (err) {
            console.error('查询历史数据总数错误:', err);
            return res.status(500).json({
                success: false,
                message: '服务器内部错误'
            });
        }

        const total_count = row.count;

        // Then, get the paginated data
        let dataSql = baseSql + ' ORDER BY nd.measurement_time DESC LIMIT ? OFFSET ?';
        const dataParams = [...baseParams, parseInt(limit), parseInt(offset)];

        db.all(dataSql, dataParams, (err, data) => {
            if (err) {
                console.error('查询历史数据错误:', err);
                return res.status(500).json({
                    success: false,
                    message: '服务器内部错误'
                });
            }

            res.json({
                success: true,
                data: data,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_count: total_count
                }
            });
        });
    });
});

// 获取统计数据
router.get('/statistics', (req, res) => {
    const { point_id, start_date, end_date } = req.query;
    
    let sql = `
        SELECT 
            COUNT(*) as total_count,
            AVG(noise_level) as avg_level,
            MIN(noise_level) as min_level,
            MAX(noise_level) as max_level,
            point_id
        FROM noise_data
        WHERE 1=1
    `;
    const params = [];
    
    if (point_id) {
        sql += ' AND point_id = ?';
        params.push(point_id);
    }
    
    if (start_date) {
        sql += ' AND date(measurement_time) >= ?';
        params.push(start_date);
    }
    
    if (end_date) {
        sql += ' AND date(measurement_time) <= ?';
        params.push(end_date);
    }
    
    sql += ' GROUP BY point_id';
    
    const db = req.app.get('db');
    
    db.all(sql, params, (err, stats) => {
        if (err) {
            console.error('查询统计数据错误:', err);
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

// 获取分析数据
router.get('/analysis', (req, res) => {
    const { point_id, start_date, end_date, analysis_type = 'comparison', time_granularity = 'day' } = req.query;

    let sql = '';
    const params = [];

    // Base WHERE clause
    let whereClause = ' WHERE 1=1 ';
    if (point_id) {
        whereClause += ' AND point_id = ? ';
        params.push(point_id);
    }
    if (start_date) {
        whereClause += ' AND date(measurement_time) >= ? ';
        params.push(start_date);
    }
    if (end_date) {
        whereClause += ' AND date(measurement_time) <= ? ';
        params.push(end_date);
    }

    switch (analysis_type) {
        case 'trend':
            let dateFormat;
            switch (time_granularity) {
                case 'hour':
                    dateFormat = `strftime('%Y-%m-%d %H:00', measurement_time)`;
                    break;
                case 'week':
                    dateFormat = `strftime('%Y-%W', measurement_time)`;
                    break;
                case 'month':
                    dateFormat = `strftime('%Y-%m', measurement_time)`;
                    break;
                case 'day':
                default:
                    dateFormat = `date(measurement_time)`;
                    break;
            }
            sql = `
                SELECT 
                    ${dateFormat} as time_group,
                    AVG(noise_level) as avg_level,
                    MAX(noise_level) as max_level,
                    MIN(noise_level) as min_level
                FROM noise_data
                ${whereClause}
                GROUP BY time_group
                ORDER BY time_group
            `;
            break;
        
        case 'distribution':
             sql = `
                SELECT 
                    CAST(noise_level / 10 AS INTEGER) * 10 as noise_range,
                    COUNT(*) as count
                FROM noise_data
                ${whereClause}
                GROUP BY noise_range
                ORDER BY noise_range
            `;
            break;

        case 'comparison':
        default:
            sql = `
                SELECT 
                    mp.name as point_name,
                    d.point_id,
                    COUNT(*) as total_count,
                    AVG(d.noise_level) as avg_level,
                    MIN(d.noise_level) as min_level,
                    MAX(d.noise_level) as max_level
                FROM noise_data d
                JOIN monitoring_points mp ON d.point_id = mp.id
                ${whereClause.replace(/point_id/g, 'd.point_id').replace(/measurement_time/g, 'd.measurement_time')}
                GROUP BY d.point_id, mp.name
            `;
            break;
    }

    const db = req.app.get('db');
    db.all(sql, params, (err, data) => {
        if (err) {
            console.error(`执行分析查询错误 (type: ${analysis_type}):`, err);
            return res.status(500).json({ success: false, message: '服务器内部错误' });
        }
        res.json({ success: true, data: data });
    });
});

// 检查并创建告警的辅助函数
function checkAndCreateAlert(db, point_id, noise_level) {
    // 获取监测点的阈值设置
    db.get('SELECT threshold_day, threshold_night FROM monitoring_points WHERE id = ?', [point_id], (err, point) => {
        if (err || !point) return;
        
        const currentHour = new Date().getHours();
        const threshold = (currentHour >= 6 && currentHour < 22) ? point.threshold_day : point.threshold_night;
        
        if (noise_level > threshold) {
            const alertSql = `INSERT INTO alerts (point_id, noise_level, threshold_value) VALUES (?, ?, ?)`;
            db.run(alertSql, [point_id, noise_level, threshold], (err) => {
                if (err) {
                    console.error('创建告警记录错误:', err);
                }
            });
        }
    });
}

module.exports = router;