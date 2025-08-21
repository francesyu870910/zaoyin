// 认证中间件
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: '请先登录'
        });
    }
    next();
}

// 管理员权限中间件
function requireAdmin(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: '请先登录'
        });
    }
    
    if (req.session.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: '权限不足'
        });
    }
    
    next();
}

module.exports = {
    requireAuth,
    requireAdmin
};