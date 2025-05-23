#!/bin/bash

# 设置 https_proxy 代理，可以使用本地的socks5或http(s)代理
# 使用 HTTP 代理：export https_proxy=http://127.0.0.1:7890
# 带认证的SOCKS5代理
# export https_proxy="socks5://username:password@127.0.0.1:1080"
# 不带认证的SOCKS5代理
# export https_proxy="socks5://127.0.0.1:1080"
# HTTP代理
# export https_proxy="http://username:password@127.0.0.1:8080"
export http_proxy=
export https_proxy=

# 安装依赖包
npm install

# 设置代理的网站：you、perplexity、happyapi
export ACTIVE_PROVIDER=you

# 设置指定浏览器,可以是 'Chromium', 'chrome', 'edge' 或 'auto'
export BROWSER_TYPE=auto

# 设置是否自动下载Chromium
export AUTO_DOWNLOAD_CHROMIUM=false

# 设置是否启用手动登录
export USE_MANUAL_LOGIN=false

# 设置是否隐藏浏览器 (设置浏览器实例较大时，建议设置为true) (只有在`USE_MANUAL_LOGIN=false`时才有效)
export HEADLESS_BROWSER=true

# 是否开启Cookie持久模式 (非手动登录下多cookie需要增加浏览器实例数量)
export COOKIE_PERSISTENCE_MODE=false

# 设置启动浏览器实例数量(非并发场景下，建议设置1)
export BROWSER_INSTANCE_COUNT=1

# -----防特征开始-----
# TLS轮换间隔（小时）
export TLS_ROTATION_INTERVAL=2
# 是否随机TLS轮换间隔
export TLS_RANDOMIZE_INTERVAL=true
# 是否启用指纹轮换
export ENABLE_FINGERPRINT_ROTATION=true
# 指纹轮换间隔（小时）
export FINGERPRINT_ROTATION_INTERVAL=6
# 是否开启模拟访问历史(降低特征,会增加请求延迟)
export ENABLE_FAKE_HISTORY=false
# 强制多账号模式 (开启Cookie持久模式时失效)
export FORCE_MULTI_SESSION_MODE=true
# 读取config.mjs, cookie模式使用随机UUID
export FORCE_REGEN_UUID=true
# 设置强制固定第一句话
export FORCE_FILE_UPLOAD_QUERY=false
# 是否启用隐身模式
export INCOGNITO_MODE=true
# ---------------------------------------------------
# 控制是否在开头插入乱码
export ENABLE_GARBLED_START=false
# 设置开头插入乱码最小长度
export GARBLED_START_MIN_LENGTH=1000
# 设置开头插入乱码最大长度
export GARBLED_START_MAX_LENGTH=5000
# 设置结尾插入乱码固定长度
export GARBLED_END_LENGTH=500
# 控制是否在结尾插入乱码
export ENABLE_GARBLED_END=false
# ---------------------------------------------------
# -----防特征结束-----

# -----内存自动清理监控配置-----
# 检查间隔时间(单位: 分钟)
export MEMORY_CHECK_INTERVAL=60
# 内存清理阈值, 根据设置并发适当调整(单位: MB)
export HEAP_WARNING_THRESHOLD=8192
# 设置达到指定内存阈值自动清理
export AUTO_GC_ON_HIGH_MEMORY=false

# -----健康检查配置-----
# 是否启用浏览器自动健康检查(浏览器意外关闭/异常时自动重启)
export ENABLE_HEALTH_CHECK=false
# 健康检查间隔(分钟)
export HEALTH_CHECK_INTERVAL=10
# 请求前执行健康检查
export HEALTH_CHECK_BEFORE_LOCK=true

# 设置自动获取模型列表哈希值
# 获取方法: you.com页面, 按f12，切换'网络(network)', 任意选择一个模型发送请求，在第4列(文件 file)
# 找到类似: `_next/data/`开头: `_next/data/0eae4547518d0f954439be9efdaae87c915b8921/en-US/search.json?q...`网址 (可以用搜索筛选)
# 将`0eae4547518d0f954439be9efdaae87c915b8921`填入`YOU_BUILD_HASH`，注意不要有空格。
export YOU_BUILD_HASH=

# 设置开启<think>内置思考传输
export ENABLE_THINKING_CHAIN=true

# 设置会话自动释放时间(单位:秒) (0=禁用自动释放)
export SESSION_LOCK_TIMEOUT=180

# 设置是否启用并发限制
export ENABLE_DETECTION=true

# 设置是否启用自动Cookie更新 (USE_MANUAL_LOGIN=false时有效)
export ENABLE_AUTO_COOKIE_UPDATE=false

# 是否跳过账户验证 (启用时，`ALLOW_NON_PRO`设置无效，可用于账号量多情况)
export SKIP_ACCOUNT_VALIDATION=false

# 开启请求次数上限(默认限制3次请求) (用于免费账户)
export ENABLE_REQUEST_LIMIT=false

# 是否允许非Pro账户
export ALLOW_NON_PRO=false

# 设置自定义终止符(用于处理输出停不下来情况，留空则不启用，使用双引号包裹)
export CUSTOM_END_MARKER="<CHAR_turn>"

# 设置是否启用延迟发送请求，如果设置false卡发送请求尝试打开它
export ENABLE_DELAY_LOGIC=false

# 设置是否启用隧道访问
export ENABLE_TUNNEL=false

# 设置隧道类型 (localtunnel 或 ngrok)
export TUNNEL_TYPE=ngrok

# 设置localtunnel子域名(留空则为随机域名)
export SUBDOMAIN=

# 设置 ngrok AUTH TOKEN
# 这是 ngrok 账户的身份验证令牌。可以在 ngrok 仪表板的 "Auth" 部分找到它。
# 免费账户和付费账户都需要设置此项。
# ngrok网站: https://dashboard.ngrok.com
export NGROK_AUTH_TOKEN=

# 设置 ngrok 自定义域名
# 这允许使用自己的域名而不是 ngrok 的随机子域名。
# 注意：此功能仅适用于 ngrok 付费账户。
# 使用此功能前，请确保已在 ngrok 仪表板中添加并验证了该域名。
# 格式示例：your-custom-domain.com
# 如果使用免费账户或不想使用自定义域名，请将此项留空。
export NGROK_CUSTOM_DOMAIN=
export NGROK_SUBDOMAIN=

# 设置 PASSWORD API密码
export PASSWORD=

# 设置 PORT 端口
export PORT=8080

# 设置AI模型(Claude系列模型直接在酒馆中选择即可使用，修改`AI_MODEL`环境变量可以切换Claude以外的模型，支持的模型名字如下 (请参考官网获取最新模型))
export AI_MODEL=

# 自定义会话模式
export USE_CUSTOM_MODE=false

# 启用模式轮换
# 只有当 USE_CUSTOM_MODE 和 ENABLE_MODE_ROTATION 都设置为 true 时，才会启用模式轮换功能。
# 可以在自定义模式和默认模式之间动态切换
export ENABLE_MODE_ROTATION=false

# 设置伪造真role (如果启用，必须使用txt格式上传)
export USE_BACKSPACE_PREFIX=false

# 设置上传文件格式 docx | txt | json
export UPLOAD_FILE_FORMAT=docx

# 设置是否启用 CLEWD 后处理
export CLEWD_ENABLED=false

# 运行 Node.js 应用程序
node --expose-gc index.mjs

read -p "Press Enter to exit..."