#!/bin/bash

set -e

# 要运行的 Node 脚本路径（你可以根据需要修改）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_SCRIPT="$SCRIPT_DIR/dist/main.js"

# 检查 Node.js 是否已安装
if ! command -v node &> /dev/null; then
  echo "Node.js 未安装，开始从国内源安装 Node.js..."

  # 使用 NVM 安装 Node（推荐，干净可靠）
  if ! command -v nvm &> /dev/null; then
    echo "NVM 未安装，使用国内源安装 NVM..."
    export NVM_DIR="$HOME/.nvm"
    mkdir -p "$NVM_DIR"

    # 安装 nvm（使用淘宝源）
    curl -o- https://npmmirror.com/mirrors/nvm/v0.39.7/install.sh | bash

    # 加载 nvm 环境变量
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  fi

  echo "使用淘宝镜像安装 Node.js 最新版本..."
  export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node
  nvm install node
  nvm use node
else
  echo "✔ Node.js 已安装，版本为：$(node -v)"
fi

# 运行你的 Node 程序
echo "🚀 正在运行 Node 脚本..."
node --expose-gc "$NODE_SCRIPT" "$@"
