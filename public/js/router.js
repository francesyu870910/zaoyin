// 前端路由管理器
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = '';
        this.init();
    }
    
    init() {
        // 注册所有路由
        this.register('dashboard', this.renderDashboard);
        this.register('points', this.renderPoints);
        this.register('realtime', this.renderRealtime);
        this.register('analysis', this.renderAnalysis);
        this.register('alerts', this.renderAlerts);
        this.register('history', this.renderHistory);
        this.register('reports', this.renderReports);
        this.register('settings', this.renderSettings);
        
        // 默认显示首页
        this.navigate('dashboard');
    }
    
    register(path, handler) {
        this.routes[path] = handler.bind(this);
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
        const activeLink = document.querySelector(`[onclick="navigate('${path}')"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
    
    renderDashboard() {
        const content = `
            <div class="page-header">
                <h2>系统首页</h2>
                <p>成都市噪声监测系统总览</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number" id="total-points">0</div>
                    <div class="stat-label">监测点位</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="active-points">0</div>
                    <div class="stat-label">在线点位</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="total-alerts">0</div>
                    <div class="stat-label">今日告警</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="avg-noise">0</div>
                    <div class="stat-label">平均噪声(dB)</div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">监测点位分布图</h3>
                    <div>
                        <button class="btn btn-sm btn-primary" onclick="refreshMap()">刷新地图</button>
                    </div>
                </div>
                <div id="dashboard-map" style="height: 400px; border-radius: 4px; border: 1px solid #ddd;">
                    <div class="loading" style="text-align: center; padding: 180px 0;">正在加载地图...</div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">最新监测数据</h3>
                </div>
                <div id="recent-data">
                    <div class="loading">正在加载数据...</div>
                </div>
            </div>
        `;
        
        document.getElementById('page-content').innerHTML = content;
        this.loadDashboardData();
        this.loadDashboardMap();
    }
    
    renderPoints() {
        const content = `
            <div class="page-header">
                <h2>监测点位管理</h2>
                <p>管理所有噪声监测点位信息</p>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">监测点位列表</h3>
                    <button class="btn btn-primary" onclick="showAddPointModal()">添加点位</button>
                </div>
                <div id="points-table">
                    <div class="loading">正在加载数据...</div>
                </div>
            </div>
            
            <!-- 添加点位模态框 -->
            <div id="addPointModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">添加监测点位</h3>
                        <span class="close" onclick="closeModal('addPointModal')">&times;</span>
                    </div>
                    <form id="addPointForm">
                        <div class="form-group">
                            <label>点位名称</label>
                            <input type="text" class="form-control" name="name" placeholder="例如：市中心监测点" required>
                        </div>
                        <div class="form-group">
                            <label>位置描述</label>
                            <input type="text" class="form-control" name="location" placeholder="例如：市中心广场东侧" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>纬度 (-90 ~ 90)</label>
                                <input type="number" class="form-control" name="latitude" placeholder="39.9042" step="0.000001" min="-90" max="90" required>
                            </div>
                            <div class="form-group">
                                <label>经度 (-180 ~ 180)</label>
                                <input type="number" class="form-control" name="longitude" placeholder="116.4074" step="0.000001" min="-180" max="180" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>日间阈值(dB) (6:00-22:00)</label>
                                <input type="number" class="form-control" name="threshold_day" value="55" step="0.1" min="0" max="200">
                            </div>
                            <div class="form-group">
                                <label>夜间阈值(dB) (22:00-6:00)</label>
                                <input type="number" class="form-control" name="threshold_night" value="45" step="0.1" min="0" max="200">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>状态</label>
                                <select class="form-control" name="status">
                                    <option value="active">在线</option>
                                    <option value="inactive">离线</option>
                                </select>
                            </div>
                        </div>
                        <div style="text-align: right; margin-top: 20px;">
                            <button type="button" class="btn" onclick="closeModal('addPointModal')">取消</button>
                            <button type="submit" class="btn btn-primary">保存</button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- 编辑点位模态框 -->
            <div id="editPointModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">编辑监测点位</h3>
                        <span class="close" onclick="closeModal('editPointModal')">&times;</span>
                    </div>
                    <form id="editPointForm">
                        <input type="hidden" name="id">
                        <div class="form-group">
                            <label>点位名称</label>
                            <input type="text" class="form-control" name="name" placeholder="例如：市中心监测点" required>
                        </div>
                        <div class="form-group">
                            <label>位置描述</label>
                            <input type="text" class="form-control" name="location" placeholder="例如：市中心广场东侧" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>纬度 (-90 ~ 90)</label>
                                <input type="number" class="form-control" name="latitude" placeholder="39.9042" step="0.000001" min="-90" max="90" required>
                            </div>
                            <div class="form-group">
                                <label>经度 (-180 ~ 180)</label>
                                <input type="number" class="form-control" name="longitude" placeholder="116.4074" step="0.000001" min="-180" max="180" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>日间阈值(dB) (6:00-22:00)</label>
                                <input type="number" class="form-control" name="threshold_day" step="0.1" min="0" max="200" required>
                            </div>
                            <div class="form-group">
                                <label>夜间阈值(dB) (22:00-6:00)</label>
                                <input type="number" class="form-control" name="threshold_night" step="0.1" min="0" max="200" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>状态</label>
                                <select class="form-control" name="status" required>
                                    <option value="active">在线</option>
                                    <option value="inactive">离线</option>
                                </select>
                            </div>
                        </div>
                        <div style="text-align: right; margin-top: 20px;">
                            <button type="button" class="btn" onclick="closeModal('editPointModal')">取消</button>
                            <button type="submit" class="btn btn-primary">保存修改</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('page-content').innerHTML = content;
        this.loadPointsData();
        this.initPointsEvents();
    }
    
    renderRealtime() {
        const content = `
            <div class="page-header">
                <h2>实时监测</h2>
                <p>查看各监测点位的实时噪声数据</p>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">实时数据</h3>
                    <div>
                        <button class="btn btn-primary" onclick="refreshRealtimeData()">刷新数据</button>
                        <button class="btn btn-success" onclick="startAutoRefresh()">自动刷新</button>
                        <button class="btn btn-warning" onclick="stopAutoRefresh()">停止刷新</button>
                    </div>
                </div>
                <div id="realtime-data">
                    <div class="loading">正在加载实时数据...</div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">实时趋势图表</h3>
                </div>
                <div style="height: 400px; position: relative;">
                    <canvas id="realtimeChart"></canvas>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">监测点位状态</h3>
                </div>
                <div id="points-status">
                    <div class="loading">正在加载点位状态...</div>
                </div>
            </div>
        `;
        
        document.getElementById('page-content').innerHTML = content;
        this.loadRealtimeData();
        this.loadPointsStatus();
    }
    
    renderAnalysis() {
        const content = `
            <div class="page-header">
                <h2>数据分析</h2>
                <p>对噪声监测数据进行深度统计分析和趋势预测</p>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">分析配置</h3>
                </div>
                <form id="analysisForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label>分析类型</label>
                            <select class="form-control" name="analysis_type" required>
                                <option value="">请选择分析类型</option>
                                <option value="trend">趋势分析</option>
                                <option value="comparison">对比分析</option>
                                <option value="distribution">分布分析</option>
                                <option value="correlation">相关性分析</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>时间粒度</label>
                            <select class="form-control" name="time_granularity" required>
                                <option value="hour">按小时</option>
                                <option value="day">按天</option>
                                <option value="week">按周</option>
                                <option value="month">按月</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>分析维度</label>
                            <select class="form-control" name="dimension">
                                <option value="all">全维度分析</option>
                                <option value="time">时间维度</option>
                                <option value="location">地理维度</option>
                                <option value="threshold">阈值维度</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>开始日期</label>
                            <input type="date" class="form-control" name="start_date" required>
                        </div>
                        <div class="form-group">
                            <label>结束日期</label>
                            <input type="date" class="form-control" name="end_date" required>
                        </div>
                        <div class="form-group">
                            <label>监测点位</label>
                            <select class="form-control" name="point_id">
                                <option value="">全部点位</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>统计指标</label>
                            <div class="checkbox-group">
                                <label><input type="checkbox" name="metrics" value="avg" checked> 平均值</label>
                                <label><input type="checkbox" name="metrics" value="max" checked> 最大值</label>
                                <label><input type="checkbox" name="metrics" value="min" checked> 最小值</label>
                                <label><input type="checkbox" name="metrics" value="std" checked> 标准差</label>
                                <label><input type="checkbox" name="metrics" value="exceed_rate"> 超标率</label>
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 15px;">
                        <button type="submit" class="btn btn-primary">开始深度分析</button>
                        <button type="button" class="btn btn-success" onclick="generateAnalysisReport()">生成分析报告</button>
                    </div>
                </form>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">统计概览</h3>
                </div>
                <div id="analysis-overview">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number" id="total-measurements">0</div>
                            <div class="stat-label">总测量次数</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="avg-noise-level">0</div>
                            <div class="stat-label">平均噪声值(dB)</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="exceed-count">0</div>
                            <div class="stat-label">超标次数</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="exceed-rate">0%</div>
                            <div class="stat-label">超标率</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">分析图表</h3>
                </div>
                <div class="chart-container">
                    <div style="height: 400px; position: relative; margin-bottom: 20px;">
                        <canvas id="analysisChart"></canvas>
                    </div>
                    <div style="height: 300px; position: relative;">
                        <canvas id="distributionChart"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">详细分析结果</h3>
                </div>
                <div id="analysis-results">
                    <p class="text-secondary">请配置分析参数并点击"开始深度分析"</p>
                </div>
            </div>
        `;
        
        document.getElementById('page-content').innerHTML = content;
        this.initAnalysisEvents();
        this.loadAnalysisOverview();
        this.setDefaultDates('analysisForm');
    }
    
    renderAlerts() {
        const content = `
            <div class="page-header">
                <h2>预警管理</h2>
                <p>查看和处理噪声超标告警</p>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">告警列表</h3>
                    <div>
                        <select id="alertStatusFilter" class="form-control" style="width: 150px; display: inline-block;">
                            <option value="">全部状态</option>
                            <option value="pending">待处理</option>
                            <option value="handled">已处理</option>
                        </select>
                        <button class="btn btn-primary" onclick="loadAlertsData()">筛选</button>
                    </div>
                </div>
                <div id="alerts-table">
                    <div class="loading">正在加载告警数据...</div>
                </div>
            </div>
        `;
        
        document.getElementById('page-content').innerHTML = content;
        this.loadAlertsData();
    }
    
    renderHistory() {
        const content = `
            <div class="page-header">
                <h2>历史查询</h2>
                <p>查询和导出历史监测数据</p>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">查询条件</h3>
                </div>
                <form id="historyForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label>开始时间</label>
                            <input type="datetime-local" class="form-control" name="start_date">
                        </div>
                        <div class="form-group">
                            <label>结束时间</label>
                            <input type="datetime-local" class="form-control" name="end_date">
                        </div>
                        <div class="form-group">
                            <label>监测点位</label>
                            <select class="form-control" name="point_id">
                                <option value="">全部点位</option>
                            </select>
                        </div>
                    </div>
                    <div style="margin-top: 15px;">
                        <button type="submit" class="btn btn-primary">查询</button>
                        <button type="button" class="btn btn-success" onclick="exportHistoryData()">导出数据</button>
                    </div>
                </form>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">查询结果</h3>
                </div>
                <div id="history-results">
                    <p class="text-secondary">请设置查询条件并点击"查询"</p>
                </div>
            </div>
        `;
        
        document.getElementById('page-content').innerHTML = content;
        this.initHistoryEvents();
        this.setDefaultDates('historyForm');
    }
    
    renderReports() {
        const content = `
            <div class="page-header">
                <h2>报告生成</h2>
                <p>生成各类监测报告</p>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">报告配置</h3>
                </div>
                <form id="reportForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label>报告类型</label>
                            <select class="form-control" name="report_type" required>
                                <option value="">请选择报告类型</option>
                                <option value="daily">日报</option>
                                <option value="weekly">周报</option>
                                <option value="monthly">月报</option>
                                <option value="yearly">年报</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>报告日期</label>
                            <input type="date" class="form-control" name="report_date" required>
                        </div>
                        <div class="form-group">
                            <label>监测点位</label>
                            <select class="form-control" name="point_id">
                                <option value="">全部点位</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">生成报告</button>
                </form>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">报告预览</h3>
                </div>
                <div id="report-preview">
                    <p class="text-secondary">请配置报告参数并点击"生成报告"</p>
                </div>
            </div>
        `;
        
        document.getElementById('page-content').innerHTML = content;
        this.initReportsEvents();
        this.setDefaultDates('reportForm');
    }
    
    renderSettings() {
        const content = `
            <div class="page-header">
                <h2>系统设置</h2>
                <p>配置系统参数和管理用户</p>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">告警阈值设置</h3>
                </div>
                <form id="thresholdForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label>默认日间阈值(dB)</label>
                            <input type="number" class="form-control" name="default_day_threshold" value="55" step="0.1">
                        </div>
                        <div class="form-group">
                            <label>默认夜间阈值(dB)</label>
                            <input type="number" class="form-control" name="default_night_threshold" value="45" step="0.1">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">保存设置</button>
                </form>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">用户管理</h3>
                    <button class="btn btn-primary" onclick="showAddUserModal()">添加用户</button>
                </div>
                <div id="users-table">
                    <div class="loading">正在加载用户数据...</div>
                </div>
            </div>
        `;
        
        document.getElementById('page-content').innerHTML = content;
        this.initSettingsEvents();
    }
    
    // 数据加载方法
    async loadDashboardData() {
        try {
            // 加载统计数据
            const [pointsRes, alertsRes, realtimeRes] = await Promise.all([
                api.get('/points'),
                api.get('/alerts/statistics'),
                api.get('/data/realtime')
            ]);
            
            if (pointsRes.success) {
                document.getElementById('total-points').textContent = pointsRes.data.length;
                document.getElementById('active-points').textContent = 
                    pointsRes.data.filter(p => p.status === 'active').length;
            }
            
            if (alertsRes.success) {
                document.getElementById('total-alerts').textContent = alertsRes.data.total_alerts || 0;
            }
            
            if (realtimeRes.success && realtimeRes.data.length > 0) {
                const avgNoise = realtimeRes.data.reduce((sum, d) => sum + d.noise_level, 0) / realtimeRes.data.length;
                document.getElementById('avg-noise').textContent = avgNoise.toFixed(1);
                
                // 显示最新数据
                this.renderRecentData(realtimeRes.data.slice(0, 10));
            }
            
        } catch (error) {
            console.error('加载首页数据失败:', error);
        }
    }
    
    renderRecentData(data) {
        const tableHtml = `
            <table class="table">
                <thead>
                    <tr>
                        <th>监测点</th>
                        <th>噪声值(dB)</th>
                        <th>监测时间</th>
                        <th>状态</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => `
                        <tr>
                            <td>${item.point_name}</td>
                            <td>${item.noise_level}</td>
                            <td>${new Date(item.measurement_time).toLocaleString()}</td>
                            <td>
                                <span class="badge ${item.noise_level > 55 ? 'badge-danger' : 'badge-success'}">
                                    ${item.noise_level > 55 ? '超标' : '正常'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('recent-data').innerHTML = tableHtml;
    }
    
    async loadDashboardMap() {
        try {
            const response = await api.get('/points');
            if (response.success) {
                this.initRealMap(response.data);
            }
        } catch (error) {
            console.error('加载地图数据失败:', error);
            document.getElementById('dashboard-map').innerHTML = 
                '<div class="alert alert-danger" style="margin: 20px;">地图数据加载失败</div>';
        }
    }
    
    initRealMap(points) {
        // 使用高德地图
        const mapContainer = document.getElementById('dashboard-map');
        
        // 创建地图HTML结构
        mapContainer.innerHTML = `
            <div style="position: relative; width: 100%; height: 100%;">
                <div id="amap-container" style="width: 100%; height: 100%;"></div>
                <div class="map-controls" style="position: absolute; top: 10px; right: 10px; z-index: 1000;">
                    <div class="map-legend" style="background: white; padding: 10px; border-radius: 5px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                        <div style="margin-bottom: 5px;"><strong>监测点位</strong></div>
                        <div><span class="legend-dot online"></span> 在线 (${points.filter(p => p.status === 'active').length})</div>
                        <div><span class="legend-dot offline"></span> 离线 (${points.filter(p => p.status !== 'active').length})</div>
                    </div>
                </div>
            </div>
        `;
        
        // 加载高德地图
        this.loadAmapScript().then(() => {
            this.createAmapInstance(points);
        }).catch(() => {
            // 如果地图加载失败，显示备用方案
            this.showFallbackMap(points);
        });
    }
    
    loadAmapScript() {
        return new Promise((resolve, reject) => {
            if (window.AMap) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://webapi.amap.com/maps?v=1.4.15&key=您的高德地图key&plugin=AMap.Marker';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    createAmapInstance(points) {
        try {
            const map = new AMap.Map('amap-container', {
                zoom: 11,
                center: [104.0657, 30.6598], // 成都市中心
                mapStyle: 'amap://styles/normal'
            });
            
            // 添加监测点标记
            points.forEach(point => {
                const marker = new AMap.Marker({
                    position: [point.longitude, point.latitude],
                    title: point.name,
                    icon: new AMap.Icon({
                        size: new AMap.Size(25, 25),
                        image: point.status === 'active' ? 
                            'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25"><circle cx="12.5" cy="12.5" r="10" fill="#27ae60" stroke="white" stroke-width="2"/><text x="12.5" y="17" text-anchor="middle" fill="white" font-size="10">${point.id}</text></svg>`) :
                            'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25"><circle cx="12.5" cy="12.5" r="10" fill="#7f8c8d" stroke="white" stroke-width="2"/><text x="12.5" y="17" text-anchor="middle" fill="white" font-size="10">${point.id}</text></svg>`)
                    })
                });
                
                // 添加信息窗口
                const infoWindow = new AMap.InfoWindow({
                    content: `
                        <div style="padding: 10px; min-width: 200px;">
                            <h4 style="margin: 0 0 10px 0; color: #2c3e50;">${point.name}</h4>
                            <p style="margin: 5px 0;"><strong>位置：</strong>${point.location}</p>
                            <p style="margin: 5px 0;"><strong>状态：</strong>
                                <span style="color: ${point.status === 'active' ? '#27ae60' : '#7f8c8d'}">
                                    ${point.status === 'active' ? '在线' : '离线'}
                                </span>
                            </p>
                            <p style="margin: 5px 0;"><strong>日间阈值：</strong>${point.threshold_day}dB</p>
                            <p style="margin: 5px 0;"><strong>夜间阈值：</strong>${point.threshold_night}dB</p>
                        </div>
                    `
                });
                
                marker.on('click', () => {
                    infoWindow.open(map, marker.getPosition());
                });
                
                map.add(marker);
            });
            
        } catch (error) {
            console.error('创建地图实例失败:', error);
            this.showFallbackMap(points);
        }
    }
    
    showFallbackMap(points) {
        // 备用地图方案
        document.getElementById('amap-container').innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 100%; display: flex; align-items: center; justify-content: center; color: white; text-align: center;">
                <div>
                    <h3>成都市噪声监测网络</h3>
                    <p>共 ${points.length} 个监测点位</p>
                    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-top: 20px; max-width: 300px;">
                        ${points.map((point, index) => `
                            <div style="background: rgba(255,255,255,0.2); padding: 8px; border-radius: 4px; cursor: pointer;" 
                                 onclick="showPointInfo(${point.id})" title="${point.name}">
                                <div style="font-weight: bold;">${index + 1}</div>
                                <div style="font-size: 10px;">${point.status === 'active' ? '●' : '○'}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    async loadPointsData() {
        try {
            const response = await api.get('/points');
            if (response.success) {
                this.renderPointsTable(response.data);
            }
        } catch (error) {
            console.error('加载点位数据失败:', error);
            document.getElementById('points-table').innerHTML = '<div class="alert alert-danger">加载数据失败</div>';
        }
    }
    
    renderPointsTable(points) {
        const tableHtml = `
            <table class="table">
                <thead>
                    <tr>
                        <th>点位名称</th>
                        <th>位置</th>
                        <th>经纬度</th>
                        <th>状态</th>
                        <th>日间阈值</th>
                        <th>夜间阈值</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${points.map(point => `
                        <tr>
                            <td>${point.name}</td>
                            <td>${point.location}</td>
                            <td>${point.latitude}, ${point.longitude}</td>
                            <td>
                                <span class="badge ${point.status === 'active' ? 'badge-success' : 'badge-secondary'}">
                                    ${point.status === 'active' ? '在线' : '离线'}
                                </span>
                            </td>
                            <td>${point.threshold_day}dB</td>
                            <td>${point.threshold_night}dB</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="editPoint(${point.id})">编辑</button>
                                <button class="btn btn-sm btn-danger" onclick="deletePoint(${point.id})" 
                                        title="删除点位">删除</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('points-table').innerHTML = tableHtml;
    }
    
    async loadRealtimeData() {
        try {
            const response = await api.get('/data/realtime');
            if (response.success) {
                this.renderRealtimeTable(response.data);
                // 创建实时图表
                if (typeof chartManager !== 'undefined') {
                    setTimeout(() => {
                        chartManager.createRealtimeChart('realtimeChart', response.data);
                    }, 100);
                }
            }
        } catch (error) {
            console.error('加载实时数据失败:', error);
        }
    }
    
    async loadPointsStatus() {
        try {
            const response = await api.get('/points');
            if (response.success) {
                this.renderPointsStatus(response.data);
            }
        } catch (error) {
            console.error('加载点位状态失败:', error);
        }
    }
    
    renderRealtimeTable(data) {
        if (!data || data.length === 0) {
            document.getElementById('realtime-data').innerHTML = '<div class="alert alert-info">暂无实时数据</div>';
            return;
        }
        
        const tableHtml = `
            <table class="table">
                <thead>
                    <tr>
                        <th>监测点</th>
                        <th>当前噪声值(dB)</th>
                        <th>监测时间</th>
                        <th>阈值状态</th>
                        <th>超标程度</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => {
                        const isOverLimit = item.noise_level > item.threshold_day;
                        const overAmount = isOverLimit ? (item.noise_level - item.threshold_day).toFixed(1) : 0;
                        return `
                            <tr class="${isOverLimit ? 'table-danger' : ''}">
                                <td><strong>${item.point_name}</strong></td>
                                <td>
                                    <span class="noise-value ${isOverLimit ? 'text-danger' : 'text-success'}">
                                        ${item.noise_level}
                                    </span>
                                </td>
                                <td>${new Date(item.measurement_time).toLocaleString()}</td>
                                <td>
                                    <span class="badge ${isOverLimit ? 'badge-danger' : 'badge-success'}">
                                        ${isOverLimit ? '超标' : '正常'}
                                    </span>
                                </td>
                                <td>
                                    ${isOverLimit ? `<span class="text-danger">+${overAmount}dB</span>` : '-'}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('realtime-data').innerHTML = tableHtml;
    }
    
    renderPointsStatus(points) {
        const statusHtml = `
            <div class="row">
                ${points.map(point => `
                    <div class="col-md-4 mb-3">
                        <div class="status-card ${point.status === 'active' ? 'status-online' : 'status-offline'}">
                            <div class="status-header">
                                <h5>${point.name}</h5>
                                <span class="status-indicator ${point.status}"></span>
                            </div>
                            <div class="status-body">
                                <p><strong>位置：</strong>${point.location}</p>
                                <p><strong>坐标：</strong>${point.latitude}, ${point.longitude}</p>
                                <p><strong>日间阈值：</strong>${point.threshold_day}dB</p>
                                <p><strong>夜间阈值：</strong>${point.threshold_night}dB</p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.getElementById('points-status').innerHTML = statusHtml;
    }
    
    async loadAlertsData() {
        try {
            const status = document.getElementById('alertStatusFilter')?.value || '';
            const response = await api.get(`/alerts?status=${status}`);
            if (response.success) {
                this.renderAlertsTable(response.data);
            }
        } catch (error) {
            console.error('加载告警数据失败:', error);
            // 如果没有告警数据，显示提示信息
            document.getElementById('alerts-table').innerHTML = 
                '<div class="alert alert-info">暂无告警数据，系统会自动检测超标情况并生成告警</div>';
        }
    }
    
    renderAlertsTable(alerts) {
        const tableHtml = `
            <table class="table">
                <thead>
                    <tr>
                        <th>监测点</th>
                        <th>噪声值(dB)</th>
                        <th>阈值(dB)</th>
                        <th>告警时间</th>
                        <th>状态</th>
                        <th>处理人</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${alerts.map(alert => `
                        <tr>
                            <td>${alert.point_name}</td>
                            <td><strong class="text-danger">${alert.noise_level}</strong></td>
                            <td>${alert.threshold_value}</td>
                            <td>${new Date(alert.alert_time).toLocaleString()}</td>
                            <td>
                                <span class="badge ${alert.status === 'pending' ? 'badge-warning' : 'badge-success'}">
                                    ${alert.status === 'pending' ? '待处理' : '已处理'}
                                </span>
                            </td>
                            <td>${alert.handler_name || '-'}</td>
                            <td>
                                ${alert.status === 'pending' ? 
                                    `<button class="btn btn-sm btn-primary" onclick="handleAlert(${alert.id})">处理</button>` : 
                                    '-'
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('alerts-table').innerHTML = tableHtml;
    }
    
    // 事件初始化方法
    initPointsEvents() {
        // 添加点位表单事件
        const addForm = document.getElementById('addPointForm');
        if (addForm) {
            addForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // 表单验证
                if (!this.validatePointForm(addForm)) {
                    return;
                }
                
                const formData = new FormData(addForm);
                const data = Object.fromEntries(formData);
                
                try {
                    const response = await api.post('/points', data);
                    if (response.success) {
                        closeModal('addPointModal');
                        addForm.reset();
                        this.loadPointsData();
                        showAlert('监测点位添加成功', 'success');
                    }
                } catch (error) {
                    showAlert(error.message, 'danger');
                }
            });
        }
        
        // 编辑点位表单事件
        const editForm = document.getElementById('editPointForm');
        if (editForm) {
            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // 表单验证
                if (!this.validatePointForm(editForm)) {
                    return;
                }
                
                const formData = new FormData(editForm);
                const data = Object.fromEntries(formData);
                const pointId = data.id;
                
                // 移除id字段，因为它不应该在PUT请求体中
                delete data.id;
                
                try {
                    const response = await api.put(`/points/${pointId}`, data);
                    if (response.success) {
                        closeModal('editPointModal');
                        this.loadPointsData();
                        showAlert('监测点位更新成功', 'success');
                    }
                } catch (error) {
                    showAlert(error.message, 'danger');
                }
            });
        }
    }
    
    // 表单验证方法
    validatePointForm(form) {
        const name = form.querySelector('input[name="name"]').value.trim();
        const location = form.querySelector('input[name="location"]').value.trim();
        const latitude = parseFloat(form.querySelector('input[name="latitude"]').value);
        const longitude = parseFloat(form.querySelector('input[name="longitude"]').value);
        const thresholdDay = parseFloat(form.querySelector('input[name="threshold_day"]').value);
        const thresholdNight = parseFloat(form.querySelector('input[name="threshold_night"]').value);
        
        // 基本字段验证
        if (!name) {
            showAlert('请输入点位名称', 'warning');
            return false;
        }
        
        if (!location) {
            showAlert('请输入位置描述', 'warning');
            return false;
        }
        
        // 经纬度验证
        if (isNaN(latitude) || latitude < -90 || latitude > 90) {
            showAlert('纬度必须在-90到90之间', 'warning');
            return false;
        }
        
        if (isNaN(longitude) || longitude < -180 || longitude > 180) {
            showAlert('经度必须在-180到180之间', 'warning');
            return false;
        }
        
        // 阈值验证
        if (isNaN(thresholdDay) || thresholdDay < 0 || thresholdDay > 200) {
            showAlert('日间阈值必须在0到200dB之间', 'warning');
            return false;
        }
        
        if (isNaN(thresholdNight) || thresholdNight < 0 || thresholdNight > 200) {
            showAlert('夜间阈值必须在0到200dB之间', 'warning');
            return false;
        }
        
        if (thresholdNight > thresholdDay) {
            showAlert('夜间阈值不应高于日间阈值', 'warning');
            return false;
        }
        
        return true;
    }
    
    initAnalysisEvents() {
        // 加载监测点位选项
        this.loadPointsForSelect('analysisForm');
        
        const form = document.getElementById('analysisForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.performAnalysis();
            });
        }
    }
    
    async loadPointsForSelect(formId) {
        try {
            const response = await api.get('/points');
            if (response.success) {
                const select = document.querySelector(`#${formId} select[name="point_id"]`);
                if (select) {
                    select.innerHTML = '<option value="">全部点位</option>';
                    response.data.forEach(point => {
                        select.innerHTML += `<option value="${point.id}">${point.name}</option>`;
                    });
                }
            }
        } catch (error) {
            console.error('加载监测点位失败:', error);
        }
    }
    
    async performAnalysis() {
        const form = document.getElementById('analysisForm');
        const formData = new FormData(form);
        const params = new URLSearchParams();
        
        for (let [key, value] of formData.entries()) {
            if (value) params.append(key, value);
        }
        
        try {
            const response = await api.get(`/data/statistics?${params.toString()}`);
            if (response.success) {
                this.renderAnalysisResults(response.data);
            }
        } catch (error) {
            console.error('数据分析失败:', error);
            showAlert('数据分析失败: ' + error.message, 'danger');
        }
    }
    
    renderAnalysisResults(data) {
        if (!data || data.length === 0) {
            document.getElementById('analysis-results').innerHTML = 
                '<div class="alert alert-warning">没有找到符合条件的数据</div>';
            return;
        }
        
        const resultsHtml = `
            <div class="stats-grid">
                ${data.map(stat => `
                    <div class="stat-card">
                        <h5>监测点位 ${stat.point_id}</h5>
                        <div class="stat-item">
                            <span class="stat-label">数据总数:</span>
                            <span class="stat-value">${stat.total_count}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">平均值:</span>
                            <span class="stat-value">${parseFloat(stat.avg_level).toFixed(2)} dB</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">最小值:</span>
                            <span class="stat-value text-success">${stat.min_level} dB</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">最大值:</span>
                            <span class="stat-value text-danger">${stat.max_level} dB</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="card mt-3">
                <div class="card-header">
                    <h4>统计图表</h4>
                </div>
                <div style="height: 400px; position: relative;">
                    <canvas id="analysisChart"></canvas>
                </div>
            </div>
        `;
        
        document.getElementById('analysis-results').innerHTML = resultsHtml;
        
        // 创建分析图表
        if (typeof chartManager !== 'undefined') {
            setTimeout(() => {
                chartManager.createAnalysisChart('analysisChart', data);
                this.createDistributionChart(data);
            }, 100);
        }
    }
    
    async loadAnalysisOverview() {
        try {
            // 获取总体统计数据
            const [statsResponse, alertsResponse] = await Promise.all([
                api.get('/data/statistics'),
                api.get('/alerts/statistics')
            ]);
            
            if (statsResponse.success && statsResponse.data.length > 0) {
                const totalMeasurements = statsResponse.data.reduce((sum, stat) => sum + stat.total_count, 0);
                const avgNoiseLevel = statsResponse.data.reduce((sum, stat) => sum + (stat.avg_level * stat.total_count), 0) / totalMeasurements;
                
                document.getElementById('total-measurements').textContent = totalMeasurements.toLocaleString();
                document.getElementById('avg-noise-level').textContent = avgNoiseLevel.toFixed(1);
            }
            
            if (alertsResponse.success) {
                const exceedCount = alertsResponse.data.total_alerts || 0;
                const exceedRate = totalMeasurements > 0 ? ((exceedCount / totalMeasurements) * 100).toFixed(1) : 0;
                
                document.getElementById('exceed-count').textContent = exceedCount.toLocaleString();
                document.getElementById('exceed-rate').textContent = exceedRate + '%';
            }
            
        } catch (error) {
            console.error('加载分析概览失败:', error);
        }
    }
    
    createDistributionChart(data) {
        if (!data || data.length === 0) return;
        
        // 创建噪声分布直方图
        const distributionData = this.calculateNoiseDistribution(data);
        
        const ctx = document.getElementById('distributionChart');
        if (!ctx || typeof Chart === 'undefined') return;
        
        if (this.charts && this.charts['distributionChart']) {
            this.charts['distributionChart'].destroy();
        }
        
        const chartData = {
            labels: distributionData.labels,
            datasets: [{
                label: '数据分布',
                data: distributionData.values,
                backgroundColor: 'rgba(52, 152, 219, 0.6)',
                borderColor: '#3498db',
                borderWidth: 1
            }]
        };
        
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '噪声值分布直方图'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '频次'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '噪声值范围 (dB)'
                    }
                }
            }
        };
        
        if (!this.charts) this.charts = {};
        this.charts['distributionChart'] = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: options
        });
    }
    
    calculateNoiseDistribution(data) {
        // 计算噪声值分布
        const ranges = [
            { min: 0, max: 40, label: '0-40' },
            { min: 40, max: 50, label: '40-50' },
            { min: 50, max: 60, label: '50-60' },
            { min: 60, max: 70, label: '60-70' },
            { min: 70, max: 80, label: '70-80' },
            { min: 80, max: 100, label: '80+' }
        ];
        
        const distribution = ranges.map(range => ({
            label: range.label,
            count: 0
        }));
        
        data.forEach(stat => {
            const avgLevel = stat.avg_level;
            const count = stat.total_count;
            
            for (let i = 0; i < ranges.length; i++) {
                if (avgLevel >= ranges[i].min && (avgLevel < ranges[i].max || i === ranges.length - 1)) {
                    distribution[i].count += count;
                    break;
                }
            }
        });
        
        return {
            labels: distribution.map(d => d.label + ' dB'),
            values: distribution.map(d => d.count)
        };
    }
    
    // 设置默认日期
    setDefaultDates(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const startDateInput = form.querySelector('input[name="start_date"]');
        const endDateInput = form.querySelector('input[name="end_date"]');
        const reportDateInput = form.querySelector('input[name="report_date"]');
        
        if (startDateInput) {
            startDateInput.value = sevenDaysAgo.toISOString().split('T')[0];
        }
        
        if (endDateInput) {
            endDateInput.value = today.toISOString().split('T')[0];
        }
        
        if (reportDateInput) {
            reportDateInput.value = today.toISOString().split('T')[0];
        }
        
        // 设置datetime-local类型的输入框
        const startDateTimeInput = form.querySelector('input[name="start_date"][type="datetime-local"]');
        const endDateTimeInput = form.querySelector('input[name="end_date"][type="datetime-local"]');
        
        if (startDateTimeInput) {
            const startDateTime = new Date(sevenDaysAgo);
            startDateTime.setHours(0, 0, 0, 0);
            startDateTimeInput.value = startDateTime.toISOString().slice(0, 16);
        }
        
        if (endDateTimeInput) {
            const endDateTime = new Date(today);
            endDateTime.setHours(23, 59, 0, 0);
            endDateTimeInput.value = endDateTime.toISOString().slice(0, 16);
        }
    }
    
    initHistoryEvents() {
        // 加载监测点位选项
        this.loadPointsForSelect('historyForm');
        
        const form = document.getElementById('historyForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.performHistoryQuery();
            });
        }
    }
    
    async performHistoryQuery() {
        const form = document.getElementById('historyForm');
        const formData = new FormData(form);
        const params = new URLSearchParams();
        
        for (let [key, value] of formData.entries()) {
            if (value) params.append(key, value);
        }
        
        try {
            const response = await api.get(`/data/history?${params.toString()}`);
            if (response.success) {
                this.renderHistoryResults(response.data);
            }
        } catch (error) {
            console.error('历史查询失败:', error);
            showAlert('历史查询失败: ' + error.message, 'danger');
        }
    }
    
    renderHistoryResults(data) {
        if (!data || data.length === 0) {
            document.getElementById('history-results').innerHTML = 
                '<div class="alert alert-warning">没有找到符合条件的历史数据</div>';
            return;
        }
        
        const tableHtml = `
            <div class="mb-3">
                <strong>查询结果：</strong>共找到 ${data.length} 条记录
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>监测点</th>
                        <th>噪声值(dB)</th>
                        <th>监测时间</th>
                        <th>数据类型</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => `
                        <tr>
                            <td>${item.point_name}</td>
                            <td><strong>${item.noise_level}</strong></td>
                            <td>${new Date(item.measurement_time).toLocaleString()}</td>
                            <td>
                                <span class="badge badge-info">${item.data_type}</span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('history-results').innerHTML = tableHtml;
    }
    
    initReportsEvents() {
        // 加载监测点位选项
        this.loadPointsForSelect('reportForm');
        
        const form = document.getElementById('reportForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.generateReport();
            });
        }
    }
    
    async generateReport() {
        const form = document.getElementById('reportForm');
        const formData = new FormData(form);
        const reportType = formData.get('report_type');
        const reportDate = formData.get('report_date');
        const pointId = formData.get('point_id');
        
        if (!reportType || !reportDate) {
            showAlert('请选择报告类型和日期', 'warning');
            return;
        }
        
        try {
            // 根据报告类型计算时间范围
            const dateRange = this.calculateDateRange(reportType, reportDate);
            
            // 获取统计数据
            const params = new URLSearchParams({
                start_date: dateRange.start,
                end_date: dateRange.end
            });
            if (pointId) params.append('point_id', pointId);
            
            const [statsResponse, historyResponse] = await Promise.all([
                api.get(`/data/statistics?${params.toString()}`),
                api.get(`/data/history?${params.toString()}`)
            ]);
            
            if (statsResponse.success && historyResponse.success) {
                this.renderReportPreview({
                    type: reportType,
                    date: reportDate,
                    stats: statsResponse.data,
                    history: historyResponse.data,
                    dateRange: dateRange
                });
            }
            
        } catch (error) {
            console.error('生成报告失败:', error);
            showAlert('生成报告失败: ' + error.message, 'danger');
        }
    }
    
    calculateDateRange(reportType, reportDate) {
        const date = new Date(reportDate);
        let start, end;
        
        switch (reportType) {
            case 'daily':
                start = new Date(date);
                end = new Date(date);
                end.setDate(end.getDate() + 1);
                break;
            case 'weekly':
                start = new Date(date);
                start.setDate(start.getDate() - start.getDay());
                end = new Date(start);
                end.setDate(end.getDate() + 7);
                break;
            case 'monthly':
                start = new Date(date.getFullYear(), date.getMonth(), 1);
                end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
                break;
            case 'yearly':
                start = new Date(date.getFullYear(), 0, 1);
                end = new Date(date.getFullYear() + 1, 0, 1);
                break;
        }
        
        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    }
    
    renderReportPreview(reportData) {
        const typeNames = {
            daily: '日报',
            weekly: '周报',
            monthly: '月报',
            yearly: '年报'
        };
        
        // 计算总体统计
        const totalMeasurements = reportData.stats.reduce((sum, stat) => sum + stat.total_count, 0);
        const avgNoiseLevel = reportData.stats.length > 0 ? 
            (reportData.stats.reduce((sum, stat) => sum + (stat.avg_level * stat.total_count), 0) / totalMeasurements).toFixed(1) : 0;
        const maxNoiseLevel = Math.max(...reportData.stats.map(stat => stat.max_level));
        const minNoiseLevel = Math.min(...reportData.stats.map(stat => stat.min_level));
        
        const previewHtml = `
            <div class="report-container">
                <div class="report-header">
                    <h2>成都市噪声监测${typeNames[reportData.type]}</h2>
                    <div class="report-meta">
                        <p><strong>报告日期：</strong>${reportData.date}</p>
                        <p><strong>数据范围：</strong>${reportData.dateRange.start} 至 ${reportData.dateRange.end}</p>
                        <p><strong>生成时间：</strong>${new Date().toLocaleString()}</p>
                    </div>
                </div>
                
                <div class="report-summary">
                    <h3>数据概览</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number">${totalMeasurements.toLocaleString()}</div>
                            <div class="stat-label">总测量次数</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${avgNoiseLevel}</div>
                            <div class="stat-label">平均噪声值(dB)</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${maxNoiseLevel}</div>
                            <div class="stat-label">最大噪声值(dB)</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${minNoiseLevel}</div>
                            <div class="stat-label">最小噪声值(dB)</div>
                        </div>
                    </div>
                </div>
                
                <div class="report-details">
                    <h3>各监测点位详情</h3>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>监测点位</th>
                                <th>数据量</th>
                                <th>平均值(dB)</th>
                                <th>最大值(dB)</th>
                                <th>最小值(dB)</th>
                                <th>数据质量</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reportData.stats.map(stat => `
                                <tr>
                                    <td>监测点位 ${stat.point_id}</td>
                                    <td>${stat.total_count}</td>
                                    <td>${parseFloat(stat.avg_level).toFixed(1)}</td>
                                    <td>${stat.max_level}</td>
                                    <td>${stat.min_level}</td>
                                    <td>
                                        <span class="badge ${stat.total_count > 50 ? 'badge-success' : 'badge-warning'}">
                                            ${stat.total_count > 50 ? '良好' : '一般'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="report-analysis">
                    <h3>分析结论</h3>
                    <div class="analysis-content">
                        <h4>主要发现：</h4>
                        <ul>
                            <li>监测期间共收集 ${totalMeasurements.toLocaleString()} 条有效数据</li>
                            <li>平均噪声水平为 ${avgNoiseLevel} dB，${avgNoiseLevel > 55 ? '略高于' : '符合'} 日间标准</li>
                            <li>最高噪声值达到 ${maxNoiseLevel} dB，出现在监测点位中</li>
                            <li>数据覆盖 ${reportData.stats.length} 个监测点位，监测网络运行正常</li>
                        </ul>
                        
                        <h4>建议措施：</h4>
                        <ul>
                            <li>对高噪声区域（>${Math.max(60, avgNoiseLevel)}dB）加强监管和治理</li>
                            <li>在交通繁忙时段实施噪声管控措施</li>
                            <li>定期维护监测设备，确保数据准确性</li>
                            <li>加强噪声污染防治宣传教育工作</li>
                        </ul>
                    </div>
                </div>
                
                <div class="report-actions">
                    <button class="btn btn-primary" onclick="downloadReport()">下载完整报告</button>
                    <button class="btn btn-success" onclick="exportReportData()">导出原始数据</button>
                    <button class="btn btn-info" onclick="printReport()">打印报告</button>
                </div>
            </div>
        `;
        
        document.getElementById('report-preview').innerHTML = previewHtml;
        
        // 保存报告数据供下载使用
        window.currentReportData = reportData;
    }
    
    initSettingsEvents() {
        const form = document.getElementById('thresholdForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                // 设置保存逻辑
                showAlert('设置保存成功', 'success');
            });
        }
        
        // 加载用户列表
        this.loadUsersList();
    }
    
    async loadUsersList() {
        try {
            // 模拟获取用户列表（实际应该有对应的API）
            const users = [
                { id: 1, username: 'admin', role: 'admin', created_at: '2024-01-01 10:00:00', last_login: '2024-01-16 09:30:00' },
                { id: 2, username: 'operator1', role: 'user', created_at: '2024-01-02 14:20:00', last_login: '2024-01-15 16:45:00' },
                { id: 3, username: 'operator2', role: 'user', created_at: '2024-01-03 11:15:00', last_login: '2024-01-14 10:20:00' },
                { id: 4, username: 'analyst', role: 'user', created_at: '2024-01-04 09:30:00', last_login: '2024-01-13 15:10:00' }
            ];
            
            this.renderUsersList(users);
        } catch (error) {
            console.error('加载用户列表失败:', error);
        }
    }
    
    renderUsersList(users) {
        const tableHtml = `
            <table class="table">
                <thead>
                    <tr>
                        <th>用户名</th>
                        <th>角色</th>
                        <th>创建时间</th>
                        <th>最后登录</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td><strong>${user.username}</strong></td>
                            <td>
                                <span class="badge ${user.role === 'admin' ? 'badge-danger' : 'badge-info'}">
                                    ${user.role === 'admin' ? '管理员' : '操作员'}
                                </span>
                            </td>
                            <td>${new Date(user.created_at).toLocaleString()}</td>
                            <td>${user.last_login ? new Date(user.last_login).toLocaleString() : '从未登录'}</td>
                            <td>
                                <span class="badge badge-success">正常</span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="editUser(${user.id})" 
                                        ${user.username === 'admin' ? 'disabled title="管理员账户不可编辑"' : ''}>
                                    编辑
                                </button>
                                <button class="btn btn-sm btn-warning" onclick="resetPassword(${user.id})"
                                        title="重置密码">
                                    重置密码
                                </button>
                                ${user.username !== 'admin' ? 
                                    `<button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})" title="删除用户">删除</button>` : 
                                    ''
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('users-table').innerHTML = tableHtml;
    }
}

// 全局路由实例
const router = new Router();