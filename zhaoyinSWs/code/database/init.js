const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// 创建数据库连接
function createDatabase() {
    const dbPath = path.join(__dirname, '..', 'noise_monitoring.db');
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('数据库连接失败:', err.message);
        } else {
            console.log('数据库连接成功');
        }
    });
    
    return db;
}

// 初始化数据库表结构
function initializeTables(db) {
    return new Promise((resolve, reject) => {
        // 用户表
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME
            )
        `;
        
        // 监测点位表
        const createPointsTable = `
            CREATE TABLE IF NOT EXISTS monitoring_points (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                location VARCHAR(200),
                latitude DECIMAL(10,8),
                longitude DECIMAL(11,8),
                status VARCHAR(20) DEFAULT 'active',
                threshold_day DECIMAL(5,2) DEFAULT 55.0,
                threshold_night DECIMAL(5,2) DEFAULT 45.0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        // 监测数据表
        const createDataTable = `
            CREATE TABLE IF NOT EXISTS noise_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                point_id INTEGER,
                noise_level DECIMAL(5,2) NOT NULL,
                measurement_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                data_type VARCHAR(20) DEFAULT 'realtime',
                FOREIGN KEY (point_id) REFERENCES monitoring_points(id)
            )
        `;
        
        // 告警记录表
        const createAlertsTable = `
            CREATE TABLE IF NOT EXISTS alerts (
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
            )
        `;
        
        // 执行表创建
        db.serialize(() => {
            db.run(createUsersTable);
            db.run(createPointsTable);
            db.run(createDataTable);
            db.run(createAlertsTable, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('数据库表创建成功');
                    resolve();
                }
            });
        });
    });
}

// 创建索引
function createIndexes(db) {
    return new Promise((resolve, reject) => {
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_noise_data_point_time ON noise_data(point_id, measurement_time)',
            'CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)',
            'CREATE INDEX IF NOT EXISTS idx_monitoring_points_status ON monitoring_points(status)',
            'CREATE INDEX IF NOT EXISTS idx_alerts_time ON alerts(alert_time)'
        ];
        
        db.serialize(() => {
            indexes.forEach((indexSql, i) => {
                db.run(indexSql, (err) => {
                    if (err) {
                        console.error(`创建索引 ${i + 1} 失败:`, err);
                    }
                    
                    if (i === indexes.length - 1) {
                        console.log('数据库索引创建完成');
                        resolve();
                    }
                });
            });
        });
    });
}

// 插入初始数据
async function insertInitialData(db) {
    return new Promise(async (resolve, reject) => {
        try {
            // 创建默认用户
            const users = [
                { username: 'admin', password: 'admin123', name: '管理员', role: 'admin' },
                { username: 'operator1', password: 'op123456', name: '张丽', role: 'user' },
                { username: 'operator2', password: 'op123456', name: '李志文', role: 'user' },
                { username: 'analyst', password: 'analyst123', name: '王刚', role: 'user' },
                { username: 'analyst2', password: 'analyst123', name: '杨智', role: 'user' },
                { username: 'analyst3', password: 'analyst123', name: '刘立文', role: 'user' },
                { username: 'analyst4', password: 'analyst123', name: '张益铭', role: 'user' },
                { username: 'operator3', password: 'op123456', name: '李高嵩', role: 'user' }
            ];
            
            for (const userData of users) {
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                
                db.get('SELECT id FROM users WHERE username = ?', [userData.username], (err, user) => {
                    if (err) return;
                    
                    if (!user) {
                        db.run('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)', 
                            [userData.username, hashedPassword, userData.name, userData.role], (err) => {
                                if (err) {
                                    console.error(`创建用户${userData.username}失败:`, err);
                                } else {
                                    console.log(`用户${userData.username}创建成功`);
                                }
                            });
                    }
                });
            }
            
            // 创建具体的监测点位（成都市）
            const monitoringPoints = [
                ['天府广场中心监测点', '天府广场地铁站A出口人民南路', 30.6598, 104.0657, 'active', 55.0, 45.0],
                ['春熙路步行街监测点', '春熙路与总府路交叉口IFS门前', 30.6624, 104.0813, 'active', 60.0, 50.0],
                ['宽窄巷子入口监测点', '宽窄巷子长顺街入口处', 30.6739, 104.0556, 'active', 55.0, 45.0],
                ['锦里古街监测点', '锦里古街武侯祠大街入口', 30.6467, 104.0438, 'active', 55.0, 45.0],
                ['双流国际机场T2监测点', 'T2航站楼出发层外侧道路', 30.5728, 103.9478, 'active', 70.0, 60.0],
                ['成都东站监测点', '成都东站东广场迎宾大道', 30.6134, 104.1614, 'active', 65.0, 55.0],
                ['太古里商圈监测点', '太古里大慈寺路入口', 30.6588, 104.0832, 'active', 60.0, 50.0],
                ['九眼桥酒吧街监测点', '九眼桥滨江东路', 30.6398, 104.0889, 'active', 65.0, 55.0],
                ['杜甫草堂监测点', '杜甫草堂博物馆正门青华路', 30.6608, 104.0247, 'active', 50.0, 40.0],
                ['武侯祠大街监测点', '武侯祠大街与高升桥路交叉口', 30.6445, 104.0465, 'active', 60.0, 50.0],
                ['金沙遗址博物馆监测点', '金沙遗址路金沙遗址博物馆', 30.6889, 104.0156, 'active', 50.0, 40.0],
                ['环球中心监测点', '环球中心天府大道中段', 30.5756, 104.0678, 'active', 60.0, 50.0],
                ['高新区软件园监测点', '高新区天府软件园', 30.5634, 104.0567, 'active', 55.0, 45.0],
                ['文殊院监测点', '文殊院街文殊院正门', 30.6856, 104.0634, 'active', 50.0, 40.0],
                ['青羊宫监测点', '青羊宫一环路西二段', 30.6734, 104.0445, 'active', 50.0, 40.0]
            ];
            
            // 生成测试数据
            await generateTestData(db, monitoringPoints);
            
            db.get('SELECT COUNT(*) as count FROM monitoring_points', (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (result.count === 0) {
                    const insertPoint = db.prepare(`
                        INSERT INTO monitoring_points 
                        (name, location, latitude, longitude, status, threshold_day, threshold_night) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `);
                    
                    monitoringPoints.forEach(point => {
                        insertPoint.run(point);
                    });
                    
                    insertPoint.finalize((err) => {
                        if (err) {
                            reject(err);
                        } else {
                            console.log(`${monitoringPoints.length}个监测点位创建成功`);
                            resolve();
                        }
                    });
                } else {
                    resolve();
                }
            });
            
        } catch (error) {
            reject(error);
        }
    });
}

// 生成测试数据
async function generateTestData(db, monitoringPoints) {
    return new Promise((resolve, reject) => {
        // 检查是否已有测试数据
        db.get('SELECT COUNT(*) as count FROM noise_data', (err, result) => {
            if (err) {
                console.error('检查测试数据失败:', err);
                resolve(); // 不阻塞初始化
                return;
            }
            
            // if (result.count > 0) {
            //     console.log('测试数据已存在，跳过生成');
            //     resolve();
            //     return;
            // }
            
            console.log('开始生成测试数据...');
            
            // 生成最近7天的测试数据
            const now = new Date();
            const testData = [];

            for (let day = 6; day >= 0; day--) {
                const date = new Date(now);
                date.setDate(date.getDate() - day);
                
                // 每天为每个监测点生成24小时的数据（每小时1条）
                for (let hour = 0; hour < 24; hour++) {
                    const measurementTime = new Date(date);
                    measurementTime.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
                    
                    monitoringPoints.forEach((point, index) => {
                        const pointId = index + 1;
                        const baseNoise = point[5]; // 日间阈值作为基准
                        
                        // 根据时间段调整噪声值
                        let noiseLevel;
                        if (hour >= 6 && hour < 22) {
                            // 日间：基准值 ± 15dB
                            noiseLevel = baseNoise + (Math.random() - 0.5) * 30;
                        } else {
                            // 夜间：较低噪声
                            noiseLevel = point[6] + (Math.random() - 0.5) * 20; // 夜间阈值 ± 10dB
                        }
                        
                        // 添加一些随机的高峰值（模拟交通高峰等）
                        if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
                            noiseLevel += Math.random() * 10; // 高峰期增加0-10dB
                        }
                        
                        // 确保噪声值在合理范围内
                        noiseLevel = Math.max(30, Math.min(85, noiseLevel));
                        noiseLevel = parseFloat(noiseLevel.toFixed(1));
                        
                        testData.push([pointId, noiseLevel, measurementTime.toISOString()]);
                    });
                }
            }

            // 为当前小时生成一些数据
            const currentHour = now.getHours();
            monitoringPoints.forEach((point, index) => {
                const pointId = index + 1;
                const baseNoise = point[5]; // 日间阈值作为基准
                let noiseLevel;
                if (currentHour >= 6 && currentHour < 22) {
                    noiseLevel = baseNoise + (Math.random() - 0.5) * 30;
                } else {
                    noiseLevel = point[6] + (Math.random() - 0.5) * 20;
                }
                noiseLevel = Math.max(30, Math.min(85, noiseLevel));
                noiseLevel = parseFloat(noiseLevel.toFixed(1));
                testData.push([pointId, noiseLevel, now.toISOString()]);
            });
            
            // 批量插入测试数据
            const insertData = db.prepare(`
                INSERT INTO noise_data (point_id, noise_level, measurement_time, data_type) 
                VALUES (?, ?, ?, 'realtime')
            `);
            
            let insertedCount = 0;
            testData.forEach(data => {
                insertData.run(data, (err) => {
                    if (err) {
                        console.error('插入测试数据失败:', err);
                    }
                    insertedCount++;
                    
                    if (insertedCount === testData.length) {
                        insertData.finalize();
                        console.log(`测试数据生成完成，共插入 ${testData.length} 条记录`);
                        
                        // 生成一些告警数据
                        generateAlertData(db, resolve);
                    }
                });
            });
        });
    });
}

// 生成告警数据
function generateAlertData(db, callback) {
    // 查询超标的数据生成告警
    const sql = `
        SELECT nd.*, mp.threshold_day, mp.threshold_night 
        FROM noise_data nd 
        JOIN monitoring_points mp ON nd.point_id = mp.id 
        WHERE nd.noise_level > mp.threshold_day 
        ORDER BY nd.measurement_time DESC 
        LIMIT 30
    `;
    
    db.all(sql, (err, exceedData) => {
        if (err) {
            console.error('查询超标数据失败:', err);
            callback();
            return;
        }
        
        console.log(`找到 ${exceedData.length} 条超标数据，开始生成告警...`);
        
        if (exceedData.length === 0) {
            // 如果没有自然超标的数据，手动创建一些告警数据用于演示
            console.log('没有超标数据，生成演示告警数据...');
            generateDemoAlerts(db, callback);
            return;
        }
        
        const insertAlert = db.prepare(`
            INSERT INTO alerts (point_id, noise_level, threshold_value, alert_time, status, handled_by, handled_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        let alertCount = 0;
        exceedData.forEach(data => {
            const status = Math.random() > 0.3 ? 'handled' : 'pending'; // 70%已处理，30%待处理
            const handled_by = status === 'handled' ? 2 + Math.floor(Math.random() * 3) : null; // Random operator (ID 2, 3, or 4)
            const handled_at = status === 'handled' ? new Date(data.measurement_time).toISOString() : null;

            insertAlert.run([
                data.point_id, 
                data.noise_level, 
                data.threshold_day, 
                data.measurement_time, 
                status,
                handled_by,
                handled_at
            ], (err) => {
                if (!err) alertCount++;
                
                if (alertCount === exceedData.length) {
                    insertAlert.finalize();
                    console.log(`告警数据生成完成，共生成 ${alertCount} 条告警记录`);
                    callback();
                }
            });
        });
    });
}

// 生成演示告警数据
function generateDemoAlerts(db, callback) {
    const now = new Date();
    const demoAlerts = [];
    
    // 生成最近3天的一些告警数据
    for (let day = 2; day >= 0; day--) {
        const alertDate = new Date(now);
        alertDate.setDate(alertDate.getDate() - day);
        
        // 每天生成3-5个告警
        const alertsPerDay = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < alertsPerDay; i++) {
            const alertTime = new Date(alertDate);
            alertTime.setHours(
                7 + Math.floor(Math.random() * 12), // 7-19点之间
                Math.floor(Math.random() * 60),
                0, 0
            );
            
            const pointId = 1 + Math.floor(Math.random() * 15); // 1-15号点位
            const thresholdValue = 55 + Math.floor(Math.random() * 15); // 55-70dB阈值
            const noiseLevel = thresholdValue + 2 + Math.random() * 8; // 超标2-10dB
            const status = Math.random() > 0.4 ? 'handled' : 'pending'; // 60%已处理
            const handled_by = status === 'handled' ? 2 + Math.floor(Math.random() * 3) : null;
            const handled_at = status === 'handled' ? alertTime.toISOString() : null;

            demoAlerts.push([
                pointId,
                parseFloat(noiseLevel.toFixed(1)),
                thresholdValue,
                alertTime.toISOString(),
                status,
                handled_by,
                handled_at
            ]);
        }
    }
    
    const insertAlert = db.prepare(`
        INSERT INTO alerts (point_id, noise_level, threshold_value, alert_time, status, handled_by, handled_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    let insertedCount = 0;
    demoAlerts.forEach(alert => {
        insertAlert.run(alert, (err) => {
            if (!err) insertedCount++;
            
            if (insertedCount === demoAlerts.length) {
                insertAlert.finalize();
                console.log(`演示告警数据生成完成，共生成 ${insertedCount} 条告警记录`);
                callback();
            }
        });
    });
}

// 完整的数据库初始化函数
async function initializeDatabase() {
    try {
        const db = createDatabase();
        
        await initializeTables(db);
        await createIndexes(db);
        await insertInitialData(db);
        
        console.log('数据库初始化完成');
        return db;
        
    } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error;
    }
}

module.exports = {
    createDatabase,
    initializeDatabase
};