@echo off
echo 正在启动智能噪声监测管理系统...
echo.

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未检测到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查是否已安装依赖
if not exist node_modules (
    echo 正在安装依赖包...
    npm install
    if %errorlevel% neq 0 (
        echo 依赖安装失败，请检查网络连接
        pause
        exit /b 1
    )
)

echo 启动服务器...
echo.
echo 系统将在浏览器中自动打开
echo 访问地址: http://localhost:3001
echo 默认账户: admin / admin123
echo.
echo 按 Ctrl+C 停止服务器
echo.

REM 启动服务器
start http://localhost:3001
node app.js

pause