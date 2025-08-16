// 图表管理类
class ChartManager {
    constructor() {
        this.charts = {};
        this.loadChartJS();
    }
    
    // 动态加载Chart.js库
    loadChartJS() {
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => {
                console.log('Chart.js 加载完成');
            };
            document.head.appendChild(script);
        }
    }
    
    // 创建实时数据折线图
    createRealtimeChart(canvasId, data = []) {
        const ctx = document.getElementById(canvasId);
        if (!ctx || typeof Chart === 'undefined') return null;
        
        // 如果图表已存在，先销毁
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }
        
        const chartData = {
            labels: data.map(item => new Date(item.measurement_time).toLocaleTimeString()),
            datasets: [{
                label: '噪声值 (dB)',
                data: data.map(item => item.noise_level),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        };
        
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '实时噪声监测数据'
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '分贝 (dB)'
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '时间'
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                }
            },
            elements: {
                point: {
                    radius: 4,
                    hoverRadius: 6
                }
            }
        };
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: options
        });
        
        return this.charts[canvasId];
    }
    
    // 创建统计分析柱状图
    createAnalysisChart(canvasId, data = []) {
        const ctx = document.getElementById(canvasId);
        if (!ctx || typeof Chart === 'undefined') return null;
        
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }
        
        const chartData = {
            labels: data.map(item => item.point_name || `点位${item.point_id}`),
            datasets: [{
                label: '平均噪声值',
                data: data.map(item => item.avg_level),
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 1
            }, {
                label: '最大噪声值',
                data: data.map(item => item.max_level),
                backgroundColor: '#e74c3c',
                borderColor: '#c0392b',
                borderWidth: 1
            }]
        };
        
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '监测点位噪声统计分析'
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
            type: 'bar',
            data: chartData,
            options: options
        });
        
        return this.charts[canvasId];
    }
    
    // 创建告警趋势图
    createAlertTrendChart(canvasId, data = []) {
        const ctx = document.getElementById(canvasId);
        if (!ctx || typeof Chart === 'undefined') return null;
        
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }
        
        const chartData = {
            labels: data.map(item => item.date),
            datasets: [{
                label: '告警数量',
                data: data.map(item => item.alert_count),
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderWidth: 2,
                fill: true
            }]
        };
        
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '告警趋势分析'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '告警数量'
                    }
                }
            }
        };
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: options
        });
        
        return this.charts[canvasId];
    }
    
    // 更新图表数据
    updateChart(canvasId, newData) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].data = newData;
            this.charts[canvasId].update();
        }
    }
    
    // 销毁图表
    destroyChart(canvasId) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
            delete this.charts[canvasId];
        }
    }
    
    // 销毁所有图表
    destroyAllCharts() {
        Object.keys(this.charts).forEach(canvasId => {
            this.destroyChart(canvasId);
        });
    }
}

// 全局图表管理器实例
const chartManager = new ChartManager();