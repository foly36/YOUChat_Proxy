@echo off

REM 设置 https_proxy 代理，可以使用本地的socks5或http(s)代理
REM 使用 HTTP 代理：export https_proxy=http://127.0.0.1:7890
REM 带认证的SOCKS5代理
REM export https_proxy="socks5://username:password@127.0.0.1:1080"
REM 不带认证的SOCKS5代理
REM export https_proxy="socks5://127.0.0.1:1080"
REM HTTP代理
REM export https_proxy="http://username:password@127.0.0.1:8080"
set http_proxy=
set https_proxy=

REM 安装依赖包
call npm install

REM 设置代理的网站：you、perplexity、happyapi
set ACTIVE_PROVIDER=you

REM 设置指定浏览器,可以是 'Chromium', 'chrome', 'edge' 或 'auto'
set BROWSER_TYPE=auto

REM 设置是否自动下载Chromium
set AUTO_DOWNLOAD_CHROMIUM=false

REM 设置是否启用手动登录
set USE_MANUAL_LOGIN=false

REM 设置是否隐藏浏览器 (设置浏览器实例较大时，建议设置为true) (只有在`USE_MANUAL_LOGIN=false`时才有效)
set HEADLESS_BROWSER=true

REM 是否开启Cookie持久模式 (非手动登录下多cookie需要增加浏览器实例数量)
set COOKIE_PERSISTENCE_MODE=false

REM 设置启动浏览器实例数量(非并发场景下，建议设置1)
set BROWSER_INSTANCE_COUNT=1

REM -----防特征开始-----
REM TLS轮换间隔（小时）
set TLS_ROTATION_INTERVAL=2
REM 是否随机TLS轮换间隔
set TLS_RANDOMIZE_INTERVAL=true
REM 是否启用指纹轮换
set ENABLE_FINGERPRINT_ROTATION=true
REM 指纹轮换间隔（小时）
set FINGERPRINT_ROTATION_INTERVAL=6
REM 是否开启模拟访问历史(降低特征,会增加请求延迟)
set ENABLE_FAKE_HISTORY=false
REM 强制多账号模式 (开启Cookie持久模式时失效)
set FORCE_MULTI_SESSION_MODE=true
REM 读取config.mjs, cookie模式使用随机UUID
set FORCE_REGEN_UUID=true
REM 设置强制固定第一句话
set FORCE_FILE_UPLOAD_QUERY=false
REM 是否启用隐身模式
set INCOGNITO_MODE=true
REM ---------------------------------------------------
REM 控制是否在开头插入乱码
set ENABLE_GARBLED_START=false
REM 设置开头插入乱码最小长度
set GARBLED_START_MIN_LENGTH=1000
REM 设置开头插入乱码最大长度
set GARBLED_START_MAX_LENGTH=5000
REM 设置结尾插入乱码固定长度
set GARBLED_END_LENGTH=500
REM 控制是否在结尾插入乱码
set ENABLE_GARBLED_END=false
REM ---------------------------------------------------
REM -----防特征结束-----

REM -----内存自动清理监控配置-----
REM 检查间隔时间(单位: 分钟)
set MEMORY_CHECK_INTERVAL=60
REM 内存清理阈值, 根据设置并发适当调整(单位: MB)
set HEAP_WARNING_THRESHOLD=8192
REM 设置达到指定内存阈值自动清理
set AUTO_GC_ON_HIGH_MEMORY=false

REM -----健康检查配置-----
REM 是否启用浏览器自动健康检查(浏览器意外关闭/异常时自动重启)
set ENABLE_HEALTH_CHECK=false
REM 健康检查间隔(分钟)
set HEALTH_CHECK_INTERVAL=10
REM 请求前执行健康检查
set HEALTH_CHECK_BEFORE_LOCK=true

REM 设置自动获取模型列表哈希值
REM 获取方法: you.com页面, 按f12，切换'网络(network)', 任意选择一个模型发送请求，在第4列(文件 file)
REM 找到类似: `_next/data/`开头: `_next/data/0eae4547518d0f954439be9efdaae87c915b8921/en-US/search.json?q...`网址 (可以用搜索筛选)
REM 将`0eae4547518d0f954439be9efdaae87c915b8921`填入`YOU_BUILD_HASH`，注意不要有空格。
set YOU_BUILD_HASH=

REM 设置开启<think>内置思考传输
set ENABLE_THINKING_CHAIN=true

REM 设置会话自动释放时间(单位:秒) (0=禁用自动释放)
set SESSION_LOCK_TIMEOUT=180

REM 设置是否启用并发限制
set ENABLE_DETECTION=true

REM 设置是否启用自动Cookie更新 (USE_MANUAL_LOGIN=false时有效)
set ENABLE_AUTO_COOKIE_UPDATE=false

REM 是否跳过账户验证 (启用时，`ALLOW_NON_PRO`设置无效，可用于账号量多情况)
set SKIP_ACCOUNT_VALIDATION=false

REM 开启请求次数上限(默认限制3次请求) (用于免费账户)
set ENABLE_REQUEST_LIMIT=false

REM 是否允许非Pro账户
set ALLOW_NON_PRO=false

REM 设置自定义终止符(用于处理输出停不下来情况，留空则不启用，使用双引号包裹)
set CUSTOM_END_MARKER="<CHAR_turn>"

REM 设置是否启用延迟发送请求，如果设置false卡发送请求尝试打开它
set ENABLE_DELAY_LOGIC=false

REM 设置是否启用隧道访问
set ENABLE_TUNNEL=false

REM 设置隧道类型 (localtunnel 或 ngrok)
set TUNNEL_TYPE=ngrok

REM 设置localtunnel子域名(留空则为随机域名)
set SUBDOMAIN=

REM 设置 ngrok AUTH TOKEN
REM 这是 ngrok 账户的身份验证令牌。可以在 ngrok 仪表板的 "Auth" 部分找到它。
REM 免费账户和付费账户都需要设置此项。
REM ngrok网站: https://dashboard.ngrok.com
set NGROK_AUTH_TOKEN=

REM 设置 ngrok 自定义域名
REM 这允许使用自己的域名而不是 ngrok 的随机子域名。
REM 注意：此功能仅适用于 ngrok 付费账户。
REM 使用此功能前，请确保已在 ngrok 仪表板中添加并验证了该域名。
REM 格式示例：your-custom-domain.com
REM 如果使用免费账户或不想使用自定义域名，请将此项留空。
set NGROK_CUSTOM_DOMAIN=
set NGROK_SUBDOMAIN=

REM 设置 PASSWORD API密码
set PASSWORD=

REM 设置 PORT 端口
set PORT=8080

REM 设置AI模型(Claude系列模型直接在酒馆中选择即可使用，修改`AI_MODEL`环境变量可以切换Claude以外的模型，支持的模型名字如下 (请参考官网获取最新模型))
set AI_MODEL=

REM 自定义会话模式
set USE_CUSTOM_MODE=false

REM 启用模式轮换
REM 只有当 USE_CUSTOM_MODE 和 ENABLE_MODE_ROTATION 都设置为 true 时，才会启用模式轮换功能。
REM 可以在自定义模式和默认模式之间动态切换
set ENABLE_MODE_ROTATION=false

REM 设置伪造真role (如果启用，必须使用txt格式上传)
set USE_BACKSPACE_PREFIX=false

REM 设置上传文件格式 docx | txt | json
set UPLOAD_FILE_FORMAT=docx

REM 设置是否启用 CLEWD 后处理
set CLEWD_ENABLED=false

REM 运行 Node.js 应用程序
node --expose-gc index.mjs

REM 暂停脚本执行,等待用户按任意键退出
pause
