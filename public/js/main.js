// 主应用JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状态
    checkAuthStatus();
    
    // 初始化用户信息
    loadUserInfo();
});

// 检查认证状态
async function checkAuthStatus() {
    try {
        const response = await api.get('/auth/profile');
        if (!response.success) {
            // 未登录，跳转到登录页
            window.location.href = '/login.html';
        }
    } catch (error) {
        // 认证失败，跳转到登录页
        window.location.href = '/login.html';
    }
}

// 加载用户信息
async function loadUserInfo() {
    try {
        const response = await api.get('/auth/profile');
        if (response.success) {
            document.getElementById('username').textContent = response.user.username;
        }
    } catch (error) {
        console.error('加载用户信息失败:', error);
    }
}

// 导航函数
function navigate(page) {
    if (window.router) {
        window.router.navigate(page);
    }
}

// 退出登录
async function logout() {
    try {
        await api.post('/auth/logout');
        window.location.href = '/login.html';
    } catch (error) {
        console.error('退出登录失败:', error);
        // 即使失败也跳转到登录页
        window.location.href = '/login.html';
    }
}

// 显示模态框
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

// 关闭模态框
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// 显示添加点位模态框
function showAddPointModal() {
    // 重置表单
    const form = document.getElementById('addPointForm');
    if (form) {
        form.reset();
        // 设置默认值
        form.querySelector('input[name="threshold_day"]').value = '55';
        form.querySelector('input[name="threshold_night"]').value = '45';
        form.querySelector('select[name="status"]').value = 'active';
    }
    showModal('addPointModal');
}

// 显示编辑点位模态框
function showEditPointModal(pointId) {
    editPoint(pointId);
}

// 显示提示信息
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (document.body.contains(alertDiv)) {
            document.body.removeChild(alertDiv);
        }
    }, 3000);
}

// 显示自定义确认对话框
function showConfirmDialog(title, message, details, onConfirm, onCancel, confirmText = '确定', cancelText = '取消') {
    // 创建模态框HTML
    const modalHtml = `
        <div id="confirmModal" class="modal" style="display: block;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                </div>
                <div class="modal-body">
                    <p><strong>${message}</strong></p>
                    ${details ? `<p style="color: #666; white-space: pre-line;">${details}</p>` : ''}
                </div>
                <div class="modal-footer" style="text-align: right; margin-top: 20px;">
                    <button type="button" class="btn" onclick="closeConfirmDialog()">${cancelText}</button>
                    <button type="button" class="btn btn-primary" onclick="confirmAction()" style="margin-left: 10px;">${confirmText}</button>
                </div>
            </div>
        </div>
    `;
    
    // 移除已存在的确认对话框
    const existingModal = document.getElementById('confirmModal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    // 添加新的确认对话框
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 保存回调函数到全局变量
    window.confirmCallback = onConfirm;
    window.cancelCallback = onCancel;
}

// 关闭确认对话框
function closeConfirmDialog() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        document.body.removeChild(modal);
    }
    
    // 执行取消回调
    if (window.cancelCallback) {
        window.cancelCallback();
        window.cancelCallback = null;
    }
    
    window.confirmCallback = null;
}

// 确认操作
function confirmAction() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        document.body.removeChild(modal);
    }
    
    // 执行确认回调
    if (window.confirmCallback) {
        window.confirmCallback();
        window.confirmCallback = null;
    }
    
    window.cancelCallback = null;
}

// 自动刷新定时器
let autoRefreshTimer = null;

// 刷新实时数据
async function refreshRealtimeData() {
    if (window.router && window.router.currentRoute === 'realtime') {
        await window.router.loadRealtimeData();
        showAlert('数据已刷新', 'success');
    }
}

// 开始自动刷新
function startAutoRefresh() {
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
    }
    
    autoRefreshTimer = setInterval(async () => {
        if (window.router && window.router.currentRoute === 'realtime') {
            await window.router.loadRealtimeData();
        }
    }, 30000); // 30秒刷新一次
    
    showAlert('已开启自动刷新（30秒间隔）', 'info');
}

// 停止自动刷新
function stopAutoRefresh() {
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
        autoRefreshTimer = null;
        showAlert('已停止自动刷新', 'warning');
    }
}

// 处理告警
async function handleAlert(alertId) {
    try {
        const response = await api.put(`/alerts/${alertId}/handle`);
        if (response.success) {
            showAlert('告警处理成功', 'success');
            if (window.router) {
                window.router.loadAlertsData();
            }
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// 编辑点位
async function editPoint(pointId) {
    try {
        // 获取点位详细信息
        const response = await api.get(`/points/${pointId}`);
        if (response.success) {
            const point = response.data;
            
            // 填充编辑表单
            const form = document.getElementById('editPointForm');
            if (form) {
                form.querySelector('input[name="id"]').value = point.id;
                form.querySelector('input[name="name"]').value = point.name;
                form.querySelector('input[name="location"]').value = point.location;
                form.querySelector('input[name="latitude"]').value = point.latitude;
                form.querySelector('input[name="longitude"]').value = point.longitude;
                form.querySelector('input[name="threshold_day"]').value = point.threshold_day;
                form.querySelector('input[name="threshold_night"]').value = point.threshold_night;
                form.querySelector('select[name="status"]').value = point.status;
                
                // 显示编辑模态框
                showModal('editPointModal');
            }
        }
    } catch (error) {
        showAlert('获取点位信息失败: ' + error.message, 'danger');
    }
}

// 删除点位
async function deletePoint(pointId) {
    // 先获取点位信息用于确认
    try {
        const pointResponse = await api.get(`/points/${pointId}`);
        if (pointResponse.success) {
            const point = pointResponse.data;
            
            // 使用自定义确认对话框
            showConfirmDialog(
                '确认删除',
                `确定要删除监测点位"${point.name}"吗？`,
                `位置：${point.location}\n\n删除后将无法恢复，相关的监测数据也会受到影响。`,
                async () => {
                    try {
                        const response = await api.delete(`/points/${pointId}`);
                        if (response.success) {
                            showAlert('监测点位删除成功', 'success');
                            if (window.router) {
                                window.router.loadPointsData();
                            }
                        }
                    } catch (error) {
                        showAlert('删除失败: ' + error.message, 'danger');
                    }
                }
            );
        }
    } catch (error) {
        showAlert('删除失败: ' + error.message, 'danger');
    }
}

// 导出历史数据
async function exportHistoryData() {
    try {
        const form = document.getElementById('historyForm');
        if (!form) {
            showAlert('请先进行历史查询', 'warning');
            return;
        }
        
        const formData = new FormData(form);
        const params = new URLSearchParams();
        
        for (let [key, value] of formData.entries()) {
            if (value) params.append(key, value);
        }
        
        const response = await api.get(`/data/history?${params.toString()}`);
        if (response.success && response.data.length > 0) {
            exportToCSV(response.data, 'noise_monitoring_data.csv');
            showAlert('数据导出成功', 'success');
        } else {
            showAlert('没有数据可导出', 'warning');
        }
    } catch (error) {
        showAlert('导出失败: ' + error.message, 'danger');
    }
}

// 导出为CSV格式
function exportToCSV(data, filename) {
    const headers = ['监测点', '噪声值(dB)', '监测时间', '数据类型'];
    const csvContent = [
        headers.join(','),
        ...data.map(row => [
            row.point_name,
            row.noise_level,
            new Date(row.measurement_time).toLocaleString(),
            row.data_type
        ].join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// 添加用户模态框
function showAddUserModal() {
    showAlert('用户管理功能开发中', 'info');
}

// 编辑用户
function editUser(userId) {
    showAlert('编辑用户功能开发中', 'info');
}

// 重置用户密码
function resetPassword(userId) {
    showConfirmDialog(
        '重置密码',
        '确定要重置该用户的密码吗？',
        '密码将重置为默认密码：123456\n用户下次登录时需要修改密码。',
        () => {
            // 这里应该调用重置密码的API
            showAlert('密码重置成功，新密码为：123456', 'success');
        }
    );
}

// 删除用户
function deleteUser(userId) {
    showConfirmDialog(
        '删除用户',
        '确定要删除该用户吗？',
        '删除后用户将无法登录系统，该操作不可恢复。',
        () => {
            // 这里应该调用删除用户的API
            showAlert('用户删除成功', 'success');
            // 重新加载用户列表
            if (window.router && window.router.loadUsersList) {
                window.router.loadUsersList();
            }
        }
    );
}

// 刷新地图
function refreshMap() {
    if (window.router && window.router.loadDashboardMap) {
        window.router.loadDashboardMap();
        showAlert('地图已刷新', 'success');
    }
}

// 显示点位信息
async function showPointInfo(pointId) {
    try {
        const response = await api.get(`/points/${pointId}`);
        if (response.success) {
            const point = response.data;
            showConfirmDialog(
                '监测点位信息',
                point.name,
                `位置：${point.location}\n坐标：${point.latitude}, ${point.longitude}\n日间阈值：${point.threshold_day}dB\n夜间阈值：${point.threshold_night}dB\n状态：${point.status === 'active' ? '在线' : '离线'}`,
                () => {
                    // 跳转到点位管理页面
                    navigate('points');
                },
                null,
                '查看详情',
                '关闭'
            );
        }
    } catch (error) {
        showAlert('获取点位信息失败', 'danger');
    }
}

// 下载报告
function downloadReport() {
    if (!window.currentReportData) {
        showAlert('请先生成报告', 'warning');
        return;
    }
    
    const reportData = window.currentReportData;
    const typeNames = {
        daily: '日报',
        weekly: '周报', 
        monthly: '月报',
        yearly: '年报'
    };
    
    // 生成HTML报告内容
    const reportHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>噪声监测${typeNames[reportData.type]}</title>
            <style>
                body { font-family: 'Microsoft YaHei', Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .summary { margin: 20px 0; }
                .stats { display: flex; justify-content: space-around; margin: 20px 0; }
                .stat-item { text-align: center; padding: 10px; border: 1px solid #ddd; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>智能噪声监测管理系统</h1>
                <h2>噪声监测${typeNames[reportData.type]}</h2>
                <p>报告日期: ${reportData.date}</p>
                <p>数据范围: ${reportData.dateRange.start} 至 ${reportData.dateRange.end}</p>
            </div>
            
            <div class="summary">
                <h3>数据概览</h3>
                <div class="stats">
                    ${reportData.stats.map(stat => `
                        <div class="stat-item">
                            <h4>监测点位 ${stat.point_id}</h4>
                            <p>数据量: ${stat.total_count}</p>
                            <p>平均值: ${parseFloat(stat.avg_level).toFixed(1)}dB</p>
                            <p>最大值: ${stat.max_level}dB</p>
                            <p>最小值: ${stat.min_level}dB</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="details">
                <h3>详细数据</h3>
                <table>
                    <thead>
                        <tr>
                            <th>监测点</th>
                            <th>噪声值(dB)</th>
                            <th>监测时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportData.history.slice(0, 50).map(item => `
                            <tr>
                                <td>${item.point_name}</td>
                                <td>${item.noise_level}</td>
                                <td>${new Date(item.measurement_time).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${reportData.history.length > 50 ? '<p>注: 仅显示前50条记录</p>' : ''}
            </div>
        </body>
        </html>
    `;
    
    // 创建并下载HTML文件
    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `噪声监测${typeNames[reportData.type]}_${reportData.date}.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('报告下载成功', 'success');
}

// 导出报告数据
function exportReportData() {
    if (!window.currentReportData) {
        showAlert('请先生成报告', 'warning');
        return;
    }
    
    const reportData = window.currentReportData;
    exportToCSV(reportData.history, `report_data_${reportData.date}.csv`);
    showAlert('报告数据导出成功', 'success');
}

// 打印报告
function printReport() {
    const reportContent = document.querySelector('.report-container');
    if (!reportContent) {
        showAlert('请先生成报告', 'warning');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>噪声监测报告</title>
            <style>
                body { font-family: 'Microsoft YaHei', Arial, sans-serif; margin: 20px; line-height: 1.6; }
                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
                .stat-card { border: 1px solid #ddd; padding: 15px; text-align: center; border-radius: 5px; }
                .stat-number { font-size: 24px; font-weight: bold; color: #3498db; }
                .stat-label { color: #666; margin-top: 5px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background-color: #f2f2f2; }
                .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                .badge-success { background: #27ae60; color: white; }
                .badge-warning { background: #f39c12; color: white; }
                .analysis-content { background: #f8f9fa; padding: 20px; border-radius: 5px; }
                @media print { .report-actions { display: none; } }
            </style>
        </head>
        <body>
            ${reportContent.innerHTML}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// 生成分析报告
async function generateAnalysisReport() {
    try {
        const form = document.getElementById('analysisForm');
        if (!form) {
            showAlert('请先配置分析参数', 'warning');
            return;
        }
        
        const formData = new FormData(form);
        const analysisType = formData.get('analysis_type');
        const timeGranularity = formData.get('time_granularity');
        const startDate = formData.get('start_date');
        const endDate = formData.get('end_date');
        
        if (!analysisType || !startDate || !endDate) {
            showAlert('请完整填写分析参数', 'warning');
            return;
        }
        
        // 获取分析数据
        const params = new URLSearchParams({
            start_date: startDate,
            end_date: endDate
        });
        
        const pointId = formData.get('point_id');
        if (pointId) params.append('point_id', pointId);
        
        const [statsResponse, historyResponse] = await Promise.all([
            api.get(`/data/statistics?${params.toString()}`),
            api.get(`/data/history?${params.toString()}`)
        ]);
        
        if (statsResponse.success && historyResponse.success) {
            // 生成分析报告HTML
            const reportHtml = generateAnalysisReportHTML({
                analysisType,
                timeGranularity,
                startDate,
                endDate,
                stats: statsResponse.data,
                history: historyResponse.data
            });
            
            // 下载报告
            const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `噪声数据分析报告_${startDate}_${endDate}.html`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showAlert('分析报告生成成功', 'success');
        }
        
    } catch (error) {
        showAlert('生成分析报告失败: ' + error.message, 'danger');
    }
}

// 生成分析报告HTML
function generateAnalysisReportHTML(data) {
    const typeNames = {
        trend: '趋势分析',
        comparison: '对比分析',
        distribution: '分布分析',
        correlation: '相关性分析'
    };
    
    const granularityNames = {
        hour: '小时',
        day: '天',
        week: '周',
        month: '月'
    };
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>噪声数据分析报告</title>
            <style>
                body { font-family: 'Microsoft YaHei', Arial, sans-serif; margin: 20px; line-height: 1.6; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2c3e50; padding-bottom: 20px; }
                .section { margin: 30px 0; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
                .stat-card { border: 1px solid #ddd; padding: 15px; text-align: center; border-radius: 5px; }
                .stat-number { font-size: 24px; font-weight: bold; color: #3498db; }
                .stat-label { color: #666; margin-top: 5px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background-color: #f2f2f2; }
                .analysis-summary { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>智能噪声监测管理系统</h1>
                <h2>数据分析报告</h2>
                <p><strong>分析类型：</strong>${typeNames[data.analysisType] || data.analysisType}</p>
                <p><strong>时间粒度：</strong>按${granularityNames[data.timeGranularity] || data.timeGranularity}</p>
                <p><strong>分析时间：</strong>${data.startDate} 至 ${data.endDate}</p>
                <p><strong>生成时间：</strong>${new Date().toLocaleString()}</p>
            </div>
            
            <div class="section">
                <h3>数据概览</h3>
                <div class="stats-grid">
                    ${data.stats.map(stat => `
                        <div class="stat-card">
                            <div class="stat-number">${stat.total_count}</div>
                            <div class="stat-label">监测点位 ${stat.point_id}<br>数据量</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${parseFloat(stat.avg_level).toFixed(1)}</div>
                            <div class="stat-label">平均噪声值<br>(dB)</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stat.max_level}</div>
                            <div class="stat-label">最大噪声值<br>(dB)</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stat.min_level}</div>
                            <div class="stat-label">最小噪声值<br>(dB)</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="section">
                <h3>分析结论</h3>
                <div class="analysis-summary">
                    <h4>主要发现：</h4>
                    <ul>
                        <li>监测期间共收集 ${data.history.length} 条有效数据</li>
                        <li>平均噪声水平为 ${data.stats.length > 0 ? (data.stats.reduce((sum, s) => sum + s.avg_level, 0) / data.stats.length).toFixed(1) : 0} dB</li>
                        <li>最高噪声值达到 ${Math.max(...data.stats.map(s => s.max_level))} dB</li>
                        <li>数据质量良好，覆盖 ${data.stats.length} 个监测点位</li>
                    </ul>
                    
                    <h4>建议措施：</h4>
                    <ul>
                        <li>对高噪声区域加强监管和治理</li>
                        <li>优化监测点位布局，提高监测覆盖率</li>
                        <li>建立预警机制，及时响应异常情况</li>
                        <li>定期开展噪声污染防治宣传教育</li>
                    </ul>
                </div>
            </div>
            
            <div class="section">
                <h3>详细数据</h3>
                <table>
                    <thead>
                        <tr>
                            <th>监测点</th>
                            <th>噪声值(dB)</th>
                            <th>监测时间</th>
                            <th>数据类型</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.history.slice(0, 100).map(item => `
                            <tr>
                                <td>${item.point_name || '监测点' + item.point_id}</td>
                                <td>${item.noise_level}</td>
                                <td>${new Date(item.measurement_time).toLocaleString()}</td>
                                <td>${item.data_type}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${data.history.length > 100 ? '<p><em>注: 仅显示前100条记录</em></p>' : ''}
            </div>
        </body>
        </html>
    `;
}



// 页面加载完成后初始化路由
window.addEventListener('load', function() {
    // 确保路由器已初始化
    if (!window.router) {
        window.router = router;
    }
});

// 点击模态框外部关闭
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});