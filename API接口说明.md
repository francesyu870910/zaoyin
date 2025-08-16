# API接口说明

## 数据上传接口

### 上传监测数据

**接口地址：** `POST /api/data`

**请求参数：**
```json
{
    "point_id": 1,
    "noise_level": 65.5,
    "data_type": "realtime"
}
```

**参数说明：**
- `point_id`: 监测点位ID（必填）
- `noise_level`: 噪声值，单位dB（必填）
- `data_type`: 数据类型，默认为"realtime"（可选）

**响应示例：**
```json
{
    "success": true,
    "message": "监测数据添加成功",
    "data": {
        "id": 123
    }
}
```

### 批量上传数据

可以通过循环调用上述接口实现批量数据上传。

**示例代码（JavaScript）：**
```javascript
// 批量上传数据
async function uploadBatchData(pointId, dataArray) {
    for (const noiseLevel of dataArray) {
        try {
            const response = await fetch('/api/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    point_id: pointId,
                    noise_level: noiseLevel,
                    data_type: 'realtime'
                })
            });
            
            const result = await response.json();
            console.log('上传成功:', result);
        } catch (error) {
            console.error('上传失败:', error);
        }
    }
}

// 使用示例
const testData = [45.2, 52.1, 48.7, 55.3, 49.8];
uploadBatchData(1, testData);
```

## 监测点位管理

### 添加监测点位

**接口地址：** `POST /api/points`

**请求参数：**
```json
{
    "name": "测试监测点",
    "location": "测试位置",
    "latitude": 39.9042,
    "longitude": 116.4074,
    "threshold_day": 55.0,
    "threshold_night": 45.0
}
```

### 获取监测点位列表

**接口地址：** `GET /api/points`

**响应示例：**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "测试监测点",
            "location": "测试位置",
            "latitude": 39.9042,
            "longitude": 116.4074,
            "status": "active",
            "threshold_day": 55.0,
            "threshold_night": 45.0,
            "created_at": "2024-01-01 10:00:00"
        }
    ]
}
```

## 数据查询接口

### 获取实时数据

**接口地址：** `GET /api/data/realtime`

### 获取历史数据

**接口地址：** `GET /api/data/history`

**查询参数：**
- `point_id`: 监测点位ID（可选）
- `start_date`: 开始日期（可选）
- `end_date`: 结束日期（可选）
- `page`: 页码，默认1（可选）
- `limit`: 每页数量，默认100（可选）

### 获取统计数据

**接口地址：** `GET /api/data/statistics`

**查询参数：**
- `point_id`: 监测点位ID（可选）
- `start_date`: 开始日期（可选）
- `end_date`: 结束日期（可选）

## 告警管理

### 获取告警列表

**接口地址：** `GET /api/alerts`

**查询参数：**
- `status`: 告警状态，pending/handled（可选）
- `page`: 页码（可选）
- `limit`: 每页数量（可选）

### 处理告警

**接口地址：** `PUT /api/alerts/{id}/handle`

## 用户认证

### 用户登录

**接口地址：** `POST /api/auth/login`

**请求参数：**
```json
{
    "username": "admin",
    "password": "admin123"
}
```

### 获取用户信息

**接口地址：** `GET /api/auth/profile`

### 用户退出

**接口地址：** `POST /api/auth/logout`

## 使用建议

1. **首次使用**：先通过界面添加监测点位
2. **数据上传**：使用API接口上传实际监测数据
3. **数据查看**：通过界面查看实时数据和历史数据
4. **告警管理**：系统会自动检测超标数据并生成告警

## 错误处理

所有API接口都会返回统一格式的响应：

**成功响应：**
```json
{
    "success": true,
    "data": {},
    "message": "操作成功"
}
```

**错误响应：**
```json
{
    "success": false,
    "message": "错误信息"
}
```

常见HTTP状态码：
- 200: 成功
- 400: 请求参数错误
- 401: 未登录或登录过期
- 403: 权限不足
- 404: 资源不存在
- 500: 服务器内部错误