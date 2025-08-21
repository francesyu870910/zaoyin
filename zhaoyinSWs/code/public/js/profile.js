document.addEventListener('DOMContentLoaded', () => {
    const usernameSpan = document.getElementById('profile-username');
    const nameSpan = document.getElementById('profile-name');
    const roleSpan = document.getElementById('profile-role');
    const passwordChangeForm = document.getElementById('password-change-form');
    const passwordChangeMessage = document.getElementById('password-change-message');

    // 获取当前用户信息
    api.get('/api/auth/profile') // 使用 /api/auth/profile 路由
        .then(response => {
            const user = response.user; // 响应数据结构是 response.user
            usernameSpan.textContent = user.username;
            nameSpan.textContent = user.name;
            roleSpan.textContent = user.role;
        })
        .catch(error => {
            console.error('获取用户信息失败:', error);
            usernameSpan.textContent = '无法加载';
            nameSpan.textContent = '无法加载';
            roleSpan.textContent = '无法加载';
        });

    // 修改密码
    passwordChangeForm.addEventListener('submit', (event) => {
        event.preventDefault();
        passwordChangeMessage.textContent = '';

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            passwordChangeMessage.textContent = '新密码和确认密码不匹配';
            passwordChangeMessage.style.color = 'red';
            return;
        }

        api.post('/api/users/change-password', { currentPassword, newPassword })
            .then(response => {
                passwordChangeMessage.textContent = response.message;
                passwordChangeMessage.style.color = 'green';
                passwordChangeForm.reset();
            })
            .catch(error => {
                passwordChangeMessage.textContent = error.message || '密码修改失败';
                passwordChangeMessage.style.color = 'red';
            });
    });
});
