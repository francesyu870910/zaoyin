// API客户端类
class ApiClient {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    }
    
    get(endpoint) {
        return this.request(endpoint);
    }
    
    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    }
    
    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    }
    
    delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

// 全局API客户端实例
const api = new ApiClient();