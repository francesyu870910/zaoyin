#!/bin/bash

echo "正在启动智能噪声监测管理系统..."
echo

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未检测到Node.js，请先安装Node.js"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖包..."
    npm install
    if [ $? -ne 0 ]; then
        echo "依赖安装失败，请检查网络连接"
        exit 1
    fi
fi

echo "启动服务器..."
echo
echo "系统将在浏览器中自动打开"
echo "访问地址: http://localhost:3000"
echo "默认账户: admin / admin123"
echo
echo "按 Ctrl+C 停止服务器"
echo

# 启动服务器
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000 &
elif command -v open &> /dev/null; then
    open http://localhost:3000 &
fi

node app.js