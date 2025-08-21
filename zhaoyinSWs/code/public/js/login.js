// 登录页面JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    
    // 检查是否已登录
    checkLoginStatus();
    
    // 登录表单提交
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            showError('请输入用户名和密码');
            return;
        }
        
        try {
            setLoading(true);
            hideError();
            
            const response = await api.post('/auth/login', {
                username: username,
                password: password
            });
            
            if (response.success) {
                // 登录成功，跳转到主页面
                window.location.href = '/';
            } else {
                showError(response.message || '登录失败');
            }
            
        } catch (error) {
            showError(error.message || '登录失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    });
    
    // 显示错误信息
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
    
    // 隐藏错误信息
    function hideError() {
        errorMessage.style.display = 'none';
    }
    
    // 设置加载状态
    function setLoading(loading) {
        if (loading) {
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            submitBtn.textContent = '登录中...';
        } else {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.textContent = '登录';
        }
    }
    
    // 检查登录状态
    async function checkLoginStatus() {
        try {
            const response = await api.get('/auth/profile');
            if (response.success) {
                // 已登录，跳转到主页面
                window.location.href = '/';
            }
        } catch (error) {
            // 未登录，继续显示登录页面
        }
    }
    
    // 回车键登录
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });
});