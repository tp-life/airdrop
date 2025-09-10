@echo off
setlocal enabledelayedexpansion

REM 设置脚本路径
set SCRIPT_DIR=%~dp0
set NODE_SCRIPT=%SCRIPT_DIR%dist\main.js

REM 检查 node 是否安装
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js 未安装，开始安装...

    REM 设置安装目录
    set NODE_DIR=%SCRIPT_DIR%.nodejs

    REM 使用淘宝镜像下载 Node.js LTS 版本（Windows x64）
    echo 下载 Node.js 中...
    powershell -Command "Invoke-WebRequest -Uri https://npmmirror.com/mirrors/node/latest-v22.x/win-x64/node.exe -OutFile '%NODE_DIR%\node.exe'" >nul
    powershell -Command "Invoke-WebRequest -Uri https://npmmirror.com/mirrors/node/latest-v22.x/win-x64/node.lib -OutFile '%NODE_DIR%\node.lib'" >nul

    REM 设置 PATH
    set PATH=%NODE_DIR%;%PATH%
    echo Node.js 下载完成，已加入临时 PATH。
) else (
    echo Node.js 已安装，版本：node -v
)

REM 执行脚本
echo 正在运行脚本...
node --expose-gc %NODE_SCRIPT% %*
