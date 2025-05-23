import crypto from 'crypto';

// 操作系统
const osList = [
    {
        name: 'Windows',
        versions: ['10.0', '11.0'],
        platforms: ['Win32', 'Win64', 'x64']
    },
    {
        name: 'Macintosh',
        versions: ['Intel Mac OS X 10_15_7', 'Intel Mac OS X 11_6_0', 'Intel Mac OS X 12_3_1', 'Apple Mac OS X 13_2_1'],
        platforms: ['MacIntel']
    },
    {
        name: 'Linux',
        versions: ['x86_64', 'i686'],
        platforms: ['Linux x86_64', 'Linux i686']
    },
    {
        name: 'Android',
        versions: ['11', '12', '13', '14'],
        platforms: ['Android']
    },
    {
        name: 'iOS',
        versions: ['15_4', '16_2', '17_0'],
        platforms: ['iPhone', 'iPad']
    }
];

// 浏览器
const browserVersions = {
    'chrome': {
        name: 'Chrome',
        // 主版本.次版本.构建号.补丁号
        majorVersions: [120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134],
        minorVersions: [0, 1, 2, 3],
        buildVersions: [5000, 5500, 6000, 6500, 6700, 6800, 6900, 7000, 7100],
        patchVersions: [80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200],
        brandName: "Google Chrome",
        brandVersion: "1.0.0.0",
        fullVersion: "1.0.0.0",
    },
    'edge': {
        name: 'Edge',
        majorVersions: [120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134],
        minorVersions: [0, 1, 2, 3],
        buildVersions: [5000, 5500, 6000, 6500, 6700, 6800, 6900, 7000, 7100],
        patchVersions: [80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200],
        brandName: "Microsoft Edge",
        brandVersion: "1.0.0.0",
        fullVersion: "1.0.0.0",
    },
    'firefox': {
        name: 'Firefox',
        majorVersions: [120, 121, 122, 123, 124],
        minorVersions: [0, 1, 2],
        buildVersions: [],
        patchVersions: [],
        brandName: "Firefox",
        brandVersion: "1.0",
        fullVersion: "1.0",
    },
    'safari': {
        name: 'Safari',
        majorVersions: [15, 16, 17],
        minorVersions: [0, 1, 2, 3, 4, 5, 6],
        buildVersions: [],
        patchVersions: [],
        brandName: "Safari",
        brandVersion: "1.0.0",
        fullVersion: "1.0.0",
    },
    'opera': {
        name: 'Opera',
        majorVersions: [96, 97, 98, 99, 100, 101],
        minorVersions: [0, 1, 2, 3],
        buildVersions: [1000, 2000, 3000, 4000],
        patchVersions: [10, 20, 30, 40, 50],
        brandName: "Opera",
        brandVersion: "1.0.0.0",
        fullVersion: "1.0.0.0",
    }
};

// WebGL 供应商和渲染器映射表
const gpuInfo = {
    'NVIDIA': [
        'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (NVIDIA, NVIDIA GeForce RTX 2060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (NVIDIA, NVIDIA GeForce RTX 2070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (NVIDIA, NVIDIA GeForce RTX 3050 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (NVIDIA, NVIDIA GeForce RTX 3090 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)',
    ],
    'AMD': [
        'ANGLE (AMD, AMD Radeon RX 570 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (AMD, AMD Radeon RX 5500 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (AMD, AMD Radeon RX 5600 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (AMD, AMD Radeon RX 5700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (AMD, AMD Radeon RX 6600 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (AMD, AMD Radeon RX 6800 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (AMD, AMD Radeon RX 6900 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (AMD, AMD Radeon RX 7600 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (AMD, AMD Radeon RX 7700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (AMD, AMD Radeon RX 7800 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (AMD, AMD Radeon RX 7900 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
    ],
    'Intel': [
        'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (Intel, Intel(R) UHD Graphics 730 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (Intel, Intel(R) UHD Graphics 750 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (Intel, Intel(R) Iris(TM) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (Intel, Intel(R) Iris(TM) Plus Graphics 655 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (Intel, Intel(R) Arc(TM) A380 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
    ],
    'Apple': [
        'Apple M1',
        'Apple M1 Pro',
        'Apple M1 Max',
        'Apple M1 Ultra',
        'Apple M2',
        'Apple M2 Pro',
        'Apple M2 Max',
        'Apple M3',
        'Apple M3 Pro',
        'Apple M3 Max',
    ],
    'Mobile': [
        'Mali-G78 MP12',
        'Adreno 650',
        'Adreno 660',
        'Adreno 730',
        'Apple GPU (Metal)',
    ],
    // Firefox
    'NVIDIA-Firefox': [
        'NVIDIA GeForce GTX 1650',
        'NVIDIA GeForce RTX 2060',
        'NVIDIA GeForce RTX 2070',
        'NVIDIA GeForce RTX 3050',
        'NVIDIA GeForce RTX 3060',
        'NVIDIA GeForce RTX 3070',
        'NVIDIA GeForce RTX 3080',
        'NVIDIA GeForce RTX 3090',
        'NVIDIA GeForce RTX 4060',
        'NVIDIA GeForce RTX 4070',
        'NVIDIA GeForce RTX 4080',
        'NVIDIA GeForce RTX 4090',
        'NVIDIA GeForce GTX 1660 SUPER',
    ],
    'AMD-Firefox': [
        'AMD Radeon RX 570',
        'AMD Radeon RX 580',
        'AMD Radeon RX 5500 XT',
        'AMD Radeon RX 5600 XT',
        'AMD Radeon RX 5700 XT',
        'AMD Radeon RX 6600',
        'AMD Radeon RX 6700 XT',
        'AMD Radeon RX 6800 XT',
        'AMD Radeon RX 6900 XT',
        'AMD Radeon RX 7600',
        'AMD Radeon RX 7700 XT',
        'AMD Radeon RX 7800 XT',
        'AMD Radeon RX 7900 XT',
    ],
    'Intel-Firefox': [
        'Intel(R) UHD Graphics 620',
        'Intel(R) UHD Graphics 630',
        'Intel(R) UHD Graphics 730',
        'Intel(R) UHD Graphics 750',
        'Intel(R) Iris(TM) Xe Graphics',
        'Intel(R) Iris(TM) Plus Graphics 655',
        'Intel(R) Arc(TM) A380 Graphics',
    ]
};

// 设备名称列表
const deviceNames = [
    // Windows
    'DESKTOP-', 'LAPTOP-', 'PC-', 'WIN-', 'WORKSTATION-',
    // Mac
    'MacBook-Pro', 'MacBook-Air', 'iMac-Pro', 'Mac-mini', 'Mac-Studio',
    // 通用
    'DELL-', 'HP-', 'LENOVO-', 'ASUS-', 'ACER-', 'MSI-', 'ALIENWARE-', 'GIGABYTE-'
];

// 生成随机设备名称
function generateDeviceNameSuffix() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const length = Math.floor(Math.random() * 6) + 4; // 4-9位

    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
}

// MAC地址
const macPrefixes = [
    'E8-2A-EA', '00-1A-2B', 'AC-DE-48', 'B8-27-EB', 'DC-A6-32',
    '00-50-56', '00-0C-29', '00-05-69', '00-25-90', 'BC-5F-F4',
    '48-45-20', '6C-4B-90', '94-E9-79', '5C-F9-38', '64-BC-0C',
    'B4-2E-99', '8C-85-90', '34-97-F6', 'A4-83-E7', '78-7B-8A'
];

// 区域语言
const localeSettings = {
    'en-US': {
        languages: ['en-US', 'en'],
        timeZones: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles']
    },
    'en-GB': {
        languages: ['en-GB', 'en-US', 'en'],
        timeZones: ['Europe/London', 'Europe/Dublin']
    },
    'zh-CN': {
        languages: ['zh-CN', 'zh', 'en-US', 'en'],
        timeZones: ['Asia/Shanghai', 'Asia/Hong_Kong']
    },
    'zh-TW': {
        languages: ['zh-TW', 'zh', 'en-US', 'en'],
        timeZones: ['Asia/Taipei']
    },
    'ja-JP': {
        languages: ['ja-JP', 'ja', 'en-US', 'en'],
        timeZones: ['Asia/Tokyo']
    },
    'ko-KR': {
        languages: ['ko-KR', 'ko', 'en-US', 'en'],
        timeZones: ['Asia/Seoul']
    },
    'fr-FR': {
        languages: ['fr-FR', 'fr', 'en-US', 'en'],
        timeZones: ['Europe/Paris']
    },
    'de-DE': {
        languages: ['de-DE', 'de', 'en-US', 'en'],
        timeZones: ['Europe/Berlin']
    },
    'es-ES': {
        languages: ['es-ES', 'es', 'en-US', 'en'],
        timeZones: ['Europe/Madrid']
    },
    'ru-RU': {
        languages: ['ru-RU', 'ru', 'en-US', 'en'],
        timeZones: ['Europe/Moscow']
    },
    'pt-BR': {
        languages: ['pt-BR', 'pt', 'en-US', 'en'],
        timeZones: ['America/Sao_Paulo']
    },
    'nl-NL': {
        languages: ['nl-NL', 'nl', 'en-US', 'en'],
        timeZones: ['Europe/Amsterdam']
    },
    'it-IT': {
        languages: ['it-IT', 'it', 'en-US', 'en'],
        timeZones: ['Europe/Rome']
    },
    'pl-PL': {
        languages: ['pl-PL', 'pl', 'en-US', 'en'],
        timeZones: ['Europe/Warsaw']
    },
    'tr-TR': {
        languages: ['tr-TR', 'tr', 'en-US', 'en'],
        timeZones: ['Europe/Istanbul']
    }
};

// CPU核心
const computerSpecs = [
    {cores: 2, ram: [2, 4]},
    {cores: 4, ram: [4, 8, 16]},
    {cores: 6, ram: [8, 16, 32]},
    {cores: 8, ram: [8, 16, 32, 64]},
    {cores: 10, ram: [16, 32, 64]},
    {cores: 12, ram: [16, 32, 64, 128]},
    {cores: 16, ram: [32, 64, 128]},
    {cores: 24, ram: [32, 64, 128]},
    {cores: 32, ram: [64, 128, 256]}
];

// 插件
const browserPlugins = {
    'chrome': [
        {
            name: 'Chrome PDF Plugin',
            description: 'Portable Document Format',
            filename: 'internal-pdf-viewer',
            mimeTypes: ['application/pdf']
        },
        {
            name: 'Chrome PDF Viewer',
            description: '',
            filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
            mimeTypes: ['application/pdf']
        },
        {
            name: 'Native Client',
            description: '',
            filename: 'internal-nacl-plugin',
            mimeTypes: ['application/x-nacl', 'application/x-pnacl']
        }
    ],
    'edge': [
        {
            name: 'Microsoft Edge PDF Plugin',
            description: 'Portable Document Format',
            filename: 'internal-pdf-viewer',
            mimeTypes: ['application/pdf']
        },
        {
            name: 'Microsoft Edge PDF Viewer',
            description: '',
            filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
            mimeTypes: ['application/pdf']
        },
        {
            name: 'Native Client',
            description: '',
            filename: 'internal-nacl-plugin',
            mimeTypes: ['application/x-nacl', 'application/x-pnacl']
        }
    ],
    'firefox': [
        {
            name: 'Firefox PDF Viewer',
            description: 'PDF Viewer',
            filename: 'pdf.js',
            mimeTypes: ['application/pdf']
        },
        {
            name: 'WebKit built-in PDF',
            description: 'PDF Viewer',
            filename: 'internal-pdf-viewer',
            mimeTypes: ['application/pdf']
        }
    ],
    'safari': [
        {
            name: 'QuickTime Plugin',
            description: 'QuickTime Plug-in',
            filename: 'QuickTime Plugin.plugin',
            mimeTypes: ['video/quicktime']
        },
        {
            name: 'WebKit built-in PDF',
            description: 'PDF Viewer',
            filename: 'internal-pdf-viewer',
            mimeTypes: ['application/pdf']
        }
    ]
};

/**
 * 分布版本号
 * @param {string} browserType
 * @returns {Object}
 */
export function getRandomizedBrowserVersion(browserType = 'chrome') {
    const browserTypeNormalized = browserType.toLowerCase();

    let majorVersion;
    let minorVersion;
    let buildVersion;
    let patchVersion;

    switch (browserTypeNormalized) {
        case 'chrome':
        case 'edge':
            const chromeVersionWeights = [
                {version: 122, weight: 5},
                {version: 123, weight: 15},
                {version: 124, weight: 25},
                {version: 125, weight: 25},
                {version: 126, weight: 20},
                {version: 127, weight: 10},
                {version: 128, weight: 5},
                {version: 129, weight: 2},
                {version: 130, weight: 1},
                {version: 131, weight: 1}
            ];
            // 根据权重选择版本
            majorVersion = weightedRandomChoice(chromeVersionWeights);
            minorVersion = Math.random() > 0.9 ? Math.floor(Math.random() * 3) + 1 : 0;

            // 构建号: 5000-7999
            const buildMin = 5000;
            const buildMax = 7999;
            buildVersion = buildMin + Math.floor(Math.random() * (buildMax - buildMin + 1));

            // 补丁号: 50-199
            const patchMin = 50;
            const patchMax = 199;
            patchVersion = patchMin + Math.floor(Math.random() * (patchMax - patchMin + 1));
            break;

        case 'firefox':
            // Firefox: 115-122
            majorVersion = 115 + Math.floor(Math.random() * 8);
            minorVersion = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0;
            break;

        case 'safari':
            // Safari: 15-17
            majorVersion = 15 + Math.floor(Math.random() * 3);
            minorVersion = Math.floor(Math.random() * 7); // 0-6
            break;

        case 'opera':
            // Opera: 96-102
            majorVersion = 96 + Math.floor(Math.random() * 7);
            minorVersion = 0;
            buildVersion = 1000 + Math.floor(Math.random() * 4000);
            patchVersion = 10 + Math.floor(Math.random() * 50);
            break;

        default:
            majorVersion = 124 + Math.floor(Math.random() * 3);
            minorVersion = 0;
            buildVersion = 6000 + Math.floor(Math.random() * 1500);
            patchVersion = 100 + Math.floor(Math.random() * 100);
    }

    // 构建格式
    let fullVersion;
    if (browserTypeNormalized === 'chrome' || browserTypeNormalized === 'edge' || browserTypeNormalized === 'opera') {
        fullVersion = `${majorVersion}.${minorVersion}.${buildVersion}.${patchVersion}`;
    } else if (browserTypeNormalized === 'firefox') {
        fullVersion = `${majorVersion}.${minorVersion}`;
    } else if (browserTypeNormalized === 'safari') {
        fullVersion = `${majorVersion}.${minorVersion}`;
    } else {
        fullVersion = `${majorVersion}.${minorVersion}.0.0`;
    }

    return {
        majorVersion,
        minorVersion,
        buildVersion,
        patchVersion,
        fullVersion
    };
}

/**
 * 基于权重随机选择
 * @param {Array} items - 带权重的选项数组 [{version: x, weight: y}]
 * @returns {number} 版本
 */
function weightedRandomChoice(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of items) {
        if (random < item.weight) {
            return item.version;
        }
        random -= item.weight;
    }
    return items[items.length - 1].version;
}

/**
 * 随机整数
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * @param {Array} array - 选项数组
 * @returns {*} - 随机选择的项
 */
function randomChoice(array) {
    if (!Array.isArray(array) || array.length === 0) {
        return null;
    }
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * @param {number} percentChance - true概率百分比 (0-100)
 * @returns {boolean} - 随机布尔值
 */
function randomChance(percentChance) {
    return Math.random() * 100 < percentChance;
}

/**
 * @returns {string} - 随机种子
 */
function createRandomSeed() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * @param {string} seed - 种子字符串
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} - 伪随机数
 * @deprecated
 */
function seededRandom(seed, min, max) {
    const hash = crypto.createHash('sha256').update(seed).digest('hex');
    const decimal = parseInt(hash.substring(0, 8), 16) / 0xffffffff;
    return Math.floor(decimal * (max - min + 1)) + min;
}

/**
 * 随机MAC地址
 * @returns {string}
 */
function generateRandomMAC() {
    const prefix = randomChoice(macPrefixes);
    const bytes = [];
    for (let i = 0; i < 3; i++) {
        bytes.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase());
    }
    return `${prefix}-${bytes.join('-')}`;
}

/**
 * 详细版本号
 * @param {Object} browser - 浏览器
 * @returns {string} - 如 "133.0.6834.110"
 * @deprecated - Kept for API compatibility
 */
function generateRealisticVersion(browser) {
    // 处理无效浏览器对象
    if (!browser) {
        const majorVer = Math.floor(Math.random() * 14) + 120;
        const minorVer = 0;
        const buildVer = Math.floor(Math.random() * 2000) + 5000;
        const patchVer = Math.floor(Math.random() * 150) + 50;
        return `${majorVer}.${minorVer}.${buildVer}.${patchVer}`;
    }

    // 确保majorVersions存在
    if (!browser.majorVersions || browser.majorVersions.length === 0) {
        let defaultMajorVersions;
        if (browser.name === 'Chrome' || browser.name === 'Edge') {
            defaultMajorVersions = [120, 121, 122, 123, 124, 125];
        } else if (browser.name === 'Firefox') {
            defaultMajorVersions = [115, 116, 117, 118, 119];
        } else if (browser.name === 'Safari') {
            defaultMajorVersions = [15, 16, 17];
        } else {
            defaultMajorVersions = [120, 121, 122];
        }
        browser.majorVersions = defaultMajorVersions;
    }

    const majorVersion = safeRandomChoice(browser.majorVersions,
        Math.floor(Math.random() * 10) + 120); // 120-129

    const minorVersion = safeRandomChoice(browser.minorVersions || [0, 1, 2], 0);

    // Chrome/Edge 风格: 133.0.6834.110
    if (browser.name === 'Chrome' || browser.name === 'Edge' ||
        (browser.buildVersions && browser.buildVersions.length > 0 &&
            browser.patchVersions && browser.patchVersions.length > 0)) {

        const buildVersions = browser.buildVersions && browser.buildVersions.length > 0 ?
            browser.buildVersions : [5000, 5500, 6000, 6500, 6800, 7000];

        const patchVersions = browser.patchVersions && browser.patchVersions.length > 0 ?
            browser.patchVersions : [80, 90, 100, 110, 120, 130, 140, 150];

        const buildVersion = safeRandomChoice(buildVersions,
            Math.floor(Math.random() * 2000) + 5000);

        const patchVersion = safeRandomChoice(patchVersions,
            Math.floor(Math.random() * 100) + 50);

        return `${majorVersion}.${minorVersion}.${buildVersion}.${patchVersion}`;
    }
    // Firefox 风格: 123.0.1
    else if (browser.name === 'Firefox' ||
        (browser.minorVersions && browser.minorVersions.length > 0)) {
        return `${majorVersion}.${minorVersion}`;
    }
    // Safari 风格: 15.4
    else {
        return `${majorVersion}.${getRandomInt(0, 9)}`;
    }
}

/**
 * 安全版本随机选择
 * @param {Array} array 选项数组
 * @param {*} defaultValue
 * @returns {*}
 */
function safeRandomChoice(array, defaultValue) {
    if (!Array.isArray(array) || array.length === 0) {
        return defaultValue;
    }
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * 随机字符串
 * @param {number} length - 长度
 * @param {boolean} upperOnly - 是否仅大写
 * @returns {string}
 */
function getRandomString(length, upperOnly = false) {
    const chars = upperOnly
        ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 检测是否为Firefox
 * @param {string} userAgent
 * @returns {boolean}
 */
function isFirefoxBrowser(userAgent) {
    return userAgent.indexOf("Firefox") > -1;
}

/**
 * 随机用户代理
 * @param {string} browserType - 浏览器类型
 * @returns {string}
 */
function generateRealisticUserAgent(browserType = null) {
    let browserTypeName;
    if (browserType && typeof browserType === 'string') {
        browserTypeName = browserType.toLowerCase();
        if (!browserVersions[browserTypeName]) {
            console.warn(`Unsupported browser type: ${browserTypeName}, using random type`);
            browserTypeName = null;
        }
    }

    if (!browserTypeName) {
        const browserKeys = Object.keys(browserVersions);
        browserTypeName = browserKeys[Math.floor(Math.random() * browserKeys.length)];
    }

    // 获取配置
    const browser = browserVersions[browserTypeName];

    // 随机系统
    const os = randomChoice(osList);
    const osVersion = randomChoice(os.versions);
    const platform = randomChoice(os.platforms);

    // 随机版本号
    const versionInfo = getRandomizedBrowserVersion(browserTypeName);
    const version = versionInfo.fullVersion;

    // 主版本号
    const majorVersionPart = versionInfo.majorVersion;

    let userAgent;

    if (browser.name === 'Chrome' || browser.name === 'Edge') {
        if (os.name === 'Windows') {
            userAgent = `Mozilla/5.0 (Windows NT ${osVersion}; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`;
            if (browser.name === 'Edge') {
                userAgent += ` Edg/${majorVersionPart}.0.${getRandomInt(1000, 2000)}.${getRandomInt(10, 200)}`;
            }
        } else if (os.name === 'Macintosh') {
            userAgent = `Mozilla/5.0 (${os.name}; ${osVersion}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`;
            if (browser.name === 'Edge') {
                userAgent += ` Edg/${majorVersionPart}.0.${getRandomInt(1000, 2000)}.${getRandomInt(10, 200)}`;
            }
        } else if (os.name === 'Linux') {
            userAgent = `Mozilla/5.0 (X11; Linux ${osVersion}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`;
            if (browser.name === 'Edge') {
                userAgent += ` Edg/${majorVersionPart}.0.${getRandomInt(1000, 2000)}.${getRandomInt(10, 200)}`;
            }
        } else if (os.name === 'Android') {
            userAgent = `Mozilla/5.0 (Linux; Android ${osVersion}; SM-${getRandomString(3, true)}${getRandomInt(10, 99)}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Mobile Safari/537.36`;
            if (browser.name === 'Edge') {
                userAgent += ` EdgA/${majorVersionPart}.0.${getRandomInt(1000, 2000)}.${getRandomInt(10, 200)}`;
            }
        }
    } else if (browser.name === 'Firefox') {
        if (os.name === 'Windows') {
            userAgent = `Mozilla/5.0 (Windows NT ${osVersion}; Win64; x64; rv:${majorVersionPart}.0) Gecko/20100101 Firefox/${version}`;
        } else if (os.name === 'Macintosh') {
            userAgent = `Mozilla/5.0 (Macintosh; ${osVersion}; rv:${majorVersionPart}.0) Gecko/20100101 Firefox/${version}`;
        } else if (os.name === 'Linux') {
            userAgent = `Mozilla/5.0 (X11; Linux ${osVersion}; rv:${majorVersionPart}.0) Gecko/20100101 Firefox/${version}`;
        } else if (os.name === 'Android') {
            userAgent = `Mozilla/5.0 (Android ${osVersion}; Mobile; rv:${majorVersionPart}.0) Gecko/20100101 Firefox/${version}`;
        }
    } else if (browser.name === 'Safari') {
        if (os.name === 'Macintosh') {
            const webkitVersion = (parseInt(majorVersionPart) + 500) + `.${getRandomInt(1, 36)}.${getRandomInt(1, 15)}`;
            userAgent = `Mozilla/5.0 (Macintosh; ${osVersion}) AppleWebKit/${webkitVersion} (KHTML, like Gecko) Version/${version} Safari/${webkitVersion}`;
        } else if (os.name === 'iOS') {
            const webkitVersion = (parseInt(majorVersionPart) + 500) + `.${getRandomInt(1, 36)}.${getRandomInt(1, 15)}`;
            const device = randomChance(70) ? 'iPhone' : 'iPad';
            userAgent = `Mozilla/5.0 (${device}; CPU OS ${osVersion.replace(/_/g, '_')} like Mac OS X) AppleWebKit/${webkitVersion} (KHTML, like Gecko) Version/${version} Mobile/15E148 Safari/${webkitVersion}`;
        }
    } else if (browser.name === 'Opera') {
        if (os.name === 'Windows') {
            userAgent = `Mozilla/5.0 (Windows NT ${osVersion}; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36 OPR/${majorVersionPart}.0.${getRandomInt(2000, 5000)}.${getRandomInt(10, 200)}`;
        } else if (os.name === 'Macintosh') {
            userAgent = `Mozilla/5.0 (Macintosh; ${osVersion}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36 OPR/${majorVersionPart}.0.${getRandomInt(2000, 5000)}.${getRandomInt(10, 200)}`;
        } else if (os.name === 'Linux') {
            userAgent = `Mozilla/5.0 (X11; Linux ${osVersion}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36 OPR/${majorVersionPart}.0.${getRandomInt(2000, 5000)}.${getRandomInt(10, 200)}`;
        }
    }

    if (!userAgent || userAgent.includes('Chrome/100.0.0.0')) {
        // 如果生成失败，提供合理当前Chrome
        const fallbackVersion = `${124 + Math.floor(Math.random() * 2)}.0.${6500 + Math.floor(Math.random() * 300)}.${120 + Math.floor(Math.random() * 50)}`;
        userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fallbackVersion} Safari/537.36`;
    }

    return userAgent;
}

/**
 * 从代理确定操作系统
 * @param {string} userAgent
 * @returns {Object}
 */
function determineOsInfo(userAgent) {
    let name, version, archType;

    if (userAgent.includes('Windows')) {
        name = 'Windows';
        if (userAgent.includes('Windows NT 10.0')) {
            version = '10';
        } else if (userAgent.includes('Windows NT 11.0')) {
            version = '11';
        } else {
            version = '10'; // 默认Windows 10
        }
        archType = userAgent.includes('Win64') || userAgent.includes('x64') ? 'x64' : 'x86';
    } else if (userAgent.includes('Mac OS X') || userAgent.includes('Macintosh')) {
        name = 'Mac OS';
        const macOSMatch = userAgent.match(/Mac OS X ([0-9_]+)/) ||
            userAgent.match(/Macintosh; Intel Mac OS X ([0-9_]+)/);
        version = macOSMatch ? macOSMatch[1].replace(/_/g, '.') : '10.15';
        archType = userAgent.includes('Intel') ? 'x64' : 'arm64';
    } else if (userAgent.includes('Linux')) {
        name = 'Linux';
        version = userAgent.match(/Linux ([^;)]+)/) ? userAgent.match(/Linux ([^;)]+)/)[1] : 'x86_64';
        archType = userAgent.includes('x86_64') ? 'x64' : 'x86';
    } else if (userAgent.includes('Android')) {
        name = 'Android';
        const androidMatch = userAgent.match(/Android ([0-9.]+)/);
        version = androidMatch ? androidMatch[1] : '11';
        archType = 'arm64';
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        name = 'iOS';
        const iosMatch = userAgent.match(/OS ([0-9_]+)/);
        version = iosMatch ? iosMatch[1].replace(/_/g, '.') : '15.0';
        archType = 'arm64';
    } else {
        name = 'Unknown';
        version = 'Unknown';
        archType = 'Unknown';
    }

    return {name, version, archType};
}

/**
 * 从代理提取浏览器版本
 * @param {string} userAgent
 * @returns {Object}
 */
function getBrowserVersionFromUA(userAgent) {
    let name, version, fullVersion;

    if (userAgent.includes('Firefox/')) {
        name = 'Firefox';
        const match = userAgent.match(/Firefox\/([0-9.]+)/);
        fullVersion = match ? match[1] : '100.0';
    } else if (userAgent.includes('Edg/')) {
        name = 'Edge';
        const match = userAgent.match(/Edg\/([0-9.]+)/);
        fullVersion = match ? match[1] : '100.0.0.0';
    } else if (userAgent.includes('OPR/') || userAgent.includes('Opera/')) {
        name = 'Opera';
        const match = userAgent.match(/OPR\/([0-9.]+)/) || userAgent.match(/Opera\/([0-9.]+)/);
        fullVersion = match ? match[1] : '100.0.0.0';
    } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
        name = 'Safari';
        const match = userAgent.match(/Version\/([0-9.]+)/);
        fullVersion = match ? match[1] : '15.0';
    } else if (userAgent.includes('Chrome/')) {
        name = 'Chrome';
        const match = userAgent.match(/Chrome\/([0-9.]+)/);
        fullVersion = match ? match[1] : '100.0.0.0';
    } else {
        name = 'Unknown';
        fullVersion = '1.0.0';
    }

    version = fullVersion.split('.')[0]; // 主版本号

    return {name, version, fullVersion};
}

/**
 * 一致浏览器指纹
 * @param {Object} options
 * @returns {Object}
 */
export function generateFingerprint(options = {}) {
    const seed = options.seed || createRandomSeed();

    let browserType = options.browserType || null;
    if (browserType && typeof browserType === 'string') {
        browserType = browserType.toLowerCase();
        if (!browserVersions[browserType]) {
            console.warn(`Unsupported browser type: ${browserType}, a random browser type will be used`);
            browserType = null;
        }
    }

    if (!browserType) {
        const browserKeys = Object.keys(browserVersions);
        browserType = browserKeys[Math.floor(Math.random() * browserKeys.length)];
    }

    // 生成用户代理
    const userAgent = options.userAgent || generateRealisticUserAgent(browserType);

    // 检测浏览器类型
    const isFirefox = isFirefoxBrowser(userAgent);

    // 选择地区/语言
    const locale = options.locale || randomChoice(Object.keys(localeSettings));
    const localeData = localeSettings[locale];

    // 计算机规格
    const computerSpec = options.computerSpec || randomChoice(computerSpecs);

    // 选择GPU信息
    let gpuVendor, gpuRenderer;
    if (isFirefox) {
        // Firefox
        gpuVendor = options.gpuVendor || randomChoice(['NVIDIA-Firefox', 'AMD-Firefox', 'Intel-Firefox']);
        const vendorName = gpuVendor.split('-')[0]; // 提取供应商名称
        gpuRenderer = options.gpuRenderer || randomChoice(gpuInfo[gpuVendor] || [`${vendorName} Graphics Card`]);
    } else {
        // 其他浏览器
        gpuVendor = options.gpuVendor || randomChoice(['NVIDIA', 'AMD', 'Intel', 'Apple']);
        gpuRenderer = options.gpuRenderer || randomChoice(gpuInfo[gpuVendor] || ['']);
    }

    // 设备名称
    const deviceNameBase = options.deviceNameBase || randomChoice(deviceNames);
    const deviceName = options.deviceName ||
        (deviceNameBase.endsWith('-') ?
            `${deviceNameBase}${generateDeviceNameSuffix()}` :
            deviceNameBase);

    const effectivePlatform = options.platform || (() => {
        if (userAgent.includes('Windows')) {
            return 'Win32';
        } else if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) {
            return 'MacIntel';
        } else if (userAgent.includes('Linux')) {
            return 'Linux x86_64';
        } else if (userAgent.includes('Android')) {
            return 'Android';
        } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
            return userAgent.includes('iPad') ? 'iPad' : 'iPhone';
        } else {
            return 'Win32'; // 默认
        }
    })();

    // 插件列表
    let plugins;
    if (options.plugins) {
        plugins = options.plugins;
    } else if (browserType && browserPlugins[browserType]) {
        plugins = browserPlugins[browserType];
    } else {
        // 默认插件
        plugins = isFirefox ? browserPlugins['firefox'] : browserPlugins['chrome'];
    }

    // 创建指纹
    return {
        seed,
        userAgent,
        browserType,
        platform: effectivePlatform,
        osInfo: determineOsInfo(userAgent),
        isFirefox: isFirefox, // Firefox标记

        webRTC: options.webRTC !== undefined ? options.webRTC : false,
        timezone: options.timezone || randomChoice(localeData.timeZones || ['UTC']),
        geolocation: options.geolocation || 'prompt',

        // 语言和区域设置
        language: options.language || locale,
        languages: options.languages || localeData.languages || [locale, 'en-US'],

        // 指纹保护
        canvas: options.canvas || 'noise',
        webGL: options.webGL || 'noise',
        audioContext: options.audioContext || 'noise',
        mediaDevices: options.mediaDevices || 'noise',

        // 硬件信息
        webGLMetadata: {
            vendor: isFirefox ? gpuVendor.split('-')[0] : `Google Inc. (${gpuVendor})`,
            renderer: gpuRenderer,
            vendorUnmasked: isFirefox ? gpuVendor.split('-')[0] : gpuVendor,
            rendererUnmasked: gpuRenderer
        },

        // 系统资源
        cpu: {
            cores: Number(options.cpuCores || computerSpec.cores),
            architecture: options.cpuArchitecture || 'x86-64'
        },
        ram: options.ram || randomChoice(computerSpec.ram),
        deviceName: deviceName,
        macAddress: options.macAddress || generateRandomMAC(),

        // 其他设置
        doNotTrack: options.doNotTrack !== undefined ? options.doNotTrack : randomChoice([null, '0', '1']),
        hardwareAcceleration: options.hardwareAcceleration || 'default',
        plugins: plugins,
        screenOrientation: options.screenOrientation || 'landscape-primary',

        // 版本信息
        browserVersion: getBrowserVersionFromUA(userAgent),

        noiseLevel: options.noiseLevel || 'medium',
        consistencyLevel: options.consistencyLevel || 'high',

        touchSupport: options.touchSupport !== undefined
            ? options.touchSupport
            : (userAgent.includes('Mobile') || userAgent.includes('Android') || effectivePlatform === 'iPhone' || effectivePlatform === 'iPad'),
        maxTouchPoints: options.maxTouchPoints || (userAgent.includes('Mobile') ? getRandomInt(1, 5) : 0),
        pdfViewerEnabled: options.pdfViewerEnabled !== undefined ? options.pdfViewerEnabled : true
    };
}

/**
 * 指纹应用到浏览器页面
 * @param {Object} page - Puppeteer页面对象
 * @param {Object} fingerprint - 指纹对象
 * @returns {Promise<boolean>}
 */
export async function applyFingerprint(page, fingerprint) {
    try {
        // 设置用户代理
        await page.setUserAgent(fingerprint.userAgent);

        // 设置语言和时区
        await page.setExtraHTTPHeaders({
            'Accept-Language': fingerprint.languages.join(',')
        });

        await page.emulateTimezone(fingerprint.timezone);

        await page.evaluateOnNewDocument((fp) => {
            const isFirefoxBrowser = function () {
                return navigator.userAgent.indexOf("Firefox") > -1;
            };

            const deepClone = (obj) => {
                if (obj === null || typeof obj !== 'object') return obj;
                if (obj instanceof Date) return new Date(obj);
                if (obj instanceof RegExp) return new RegExp(obj);
                if (obj instanceof Array) {
                    return obj.reduce((arr, item, i) => {
                        arr[i] = deepClone(item);
                        return arr;
                    }, []);
                }

                if (obj instanceof Object) {
                    return Object.keys(obj).reduce((newObj, key) => {
                        newObj[key] = deepClone(obj[key]);
                        return newObj;
                    }, {});
                }
            };

            try {
                // 检查当前浏览器类型
                const isFirefox = fp.isFirefox || navigator.userAgent.indexOf("Firefox") > -1;

                const navigatorProperties = {
                    platform: fp.platform,
                    userAgent: fp.userAgent,
                    language: fp.language,
                    languages: [...fp.languages],
                    hardwareConcurrency: Number(fp.cpu.cores),
                    // 仅在非Firefox浏览器设置deviceMemory
                    ...(isFirefox ? {} : {deviceMemory: fp.ram}),
                    doNotTrack: fp.doNotTrack,
                    maxTouchPoints: fp.maxTouchPoints || 0,
                    vendor: isFirefox ? '' : (fp.browserVersion.name === 'Chrome' || fp.browserVersion.name === 'Edge' ? 'Google Inc.' : ''),
                    appName: 'Netscape',
                    appCodeName: 'Mozilla',
                    webdriver: false
                };

                // 保存原始navigator
                const originalNavigator = window.navigator;
                const properties = Object.getOwnPropertyDescriptors(window.navigator);

                const navigatorObj = {};

                for (const key in properties) {
                    if (navigatorProperties.hasOwnProperty(key)) {
                        Object.defineProperty(navigatorObj, key, {
                            value: navigatorProperties[key],
                            writable: false,
                            enumerable: true,
                            configurable: false
                        });
                    } else if (properties[key].configurable) {
                        Object.defineProperty(navigatorObj, key, {
                            get: function () {
                                try {
                                    return originalNavigator[key];
                                } catch (e) {
                                    return properties[key].value;
                                }
                            },
                            enumerable: properties[key].enumerable,
                            configurable: false
                        });
                    } else {
                        if (properties[key].writable) {
                            navigatorObj[key] = originalNavigator[key];
                        } else {
                            Object.defineProperty(navigatorObj, key, {
                                value: originalNavigator[key],
                                writable: properties[key].writable,
                                enumerable: properties[key].enumerable,
                                configurable: properties[key].configurable
                            });
                        }
                    }
                }

                // 创建navigator
                const navigatorProxy = new Proxy(navigatorObj, {
                    has: (target, key) => key in target || key in originalNavigator,
                    get: (target, key) => {
                        if (key === 'platform') return fp.platform;
                        if (key === 'language') return fp.language;
                        if (key === 'languages') return [...fp.languages];
                        if (key === 'hardwareConcurrency') return Number(fp.cpu.cores);
                        // 仅在非Firefox浏览器设置deviceMemory
                        if (key === 'deviceMemory' && !isFirefox) return fp.ram;
                        if (key === 'doNotTrack') return fp.doNotTrack;
                        if (key === 'webdriver') return false;

                        // 其他属性
                        if (key in target) {
                            return target[key];
                        }
                        return originalNavigator[key];
                    },
                    set: (target, key, value) => {
                        // 阻止修改关键属性
                        if ([
                            'platform', 'userAgent', 'language', 'languages',
                            'hardwareConcurrency', 'deviceMemory', 'doNotTrack'
                        ].includes(key)) {
                            return false;
                        }
                        target[key] = value;
                        return true;
                    }
                });

                Object.defineProperty(window, 'navigator', {
                    value: navigatorProxy,
                    writable: false,
                    configurable: false,
                    enumerable: true
                });

                // 手动验证
                console.debug('[Fingerprint] Verification:', {
                    platform: window.navigator.platform === fp.platform,
                    language: window.navigator.language === fp.language,
                    languages: JSON.stringify(window.navigator.languages) === JSON.stringify(fp.languages),
                    hardwareConcurrency: window.navigator.hardwareConcurrency === Number(fp.cpu.cores)
                });
            } catch (e) {
                console.error('[Fingerprint] Error applying navigator properties:', e);
            }

            // UserAgent Data API
            if ('userAgentData' in window.navigator) {
                try {
                    // 检查当前浏览器类型
                    const isFirefox = fp.isFirefox || navigator.userAgent.indexOf("Firefox") > -1;

                    // 仅在非Firefox版本应用userAgentData
                    if (!isFirefox) {
                        const brandsList = [];
                        if (fp.browserType === 'chrome') {
                            brandsList.push({brand: "Chromium", version: fp.browserVersion.version});
                            brandsList.push({brand: "Google Chrome", version: fp.browserVersion.version});
                            brandsList.push({brand: "Not;A=Brand", version: "99.0.0.0"});
                        } else if (fp.browserType === 'edge') {
                            brandsList.push({brand: "Microsoft Edge", version: fp.browserVersion.version});
                            brandsList.push({brand: "Chromium", version: fp.browserVersion.version});
                            brandsList.push({brand: "Not;A=Brand", version: "99.0.0.0"});
                        } else if (fp.browserType === 'firefox') {
                            brandsList.push({brand: "Firefox", version: fp.browserVersion.version});
                            brandsList.push({brand: "Not;A=Brand", version: "99.0.0.0"});
                        }

                        const platformVersion = [fp.osInfo.version, 0, 0, 0];

                        const uaData = {
                            brands: brandsList,
                            mobile: fp.userAgent.includes('Mobile'),
                            platform: fp.osInfo.name,
                            architecture: fp.cpu.architecture,
                            bitness: "64",
                            model: "",
                            platformVersion: platformVersion.join('.'),
                            getHighEntropyValues: function (hints) {
                                return Promise.resolve(
                                    hints.reduce((result, hint) => {
                                        switch (hint) {
                                            case 'architecture':
                                                result.architecture = fp.cpu.architecture;
                                                break;
                                            case 'bitness':
                                                result.bitness = "64";
                                                break;
                                            case 'brands':
                                                result.brands = deepClone(brandsList);
                                                break;
                                            case 'mobile':
                                                result.mobile = fp.userAgent.includes('Mobile');
                                                break;
                                            case 'model':
                                                result.model = "";
                                                break;
                                            case 'platform':
                                                result.platform = fp.osInfo.name;
                                                break;
                                            case 'platformVersion':
                                                result.platformVersion = platformVersion.join('.');
                                                break;
                                            case 'uaFullVersion':
                                                result.uaFullVersion = fp.browserVersion.fullVersion;
                                                break;
                                            case 'fullVersionList':
                                                result.fullVersionList = deepClone(brandsList);
                                                break;
                                        }
                                        return result;
                                    }, {})
                                );
                            },
                            toJSON: function () {
                                return {
                                    brands: this.brands,
                                    mobile: this.mobile,
                                    platform: this.platform
                                };
                            }
                        };

                        // 覆盖userAgentData
                        Object.defineProperty(window.navigator, 'userAgentData', {
                            value: uaData,
                            writable: false,
                            enumerable: true,
                            configurable: false
                        });
                    } else if (isFirefox && fp.browserType === 'firefox' && parseInt(fp.browserVersion.version) >= 118) {
                        // Firefox 118+ userAgentData实现
                        try {
                            const uaDataMinimal = {
                                brands: [{brand: "Firefox", version: fp.browserVersion.version}],
                                mobile: fp.userAgent.includes('Mobile'),
                                platform: fp.osInfo.name,
                                getHighEntropyValues: function () {
                                    return Promise.resolve({
                                        brands: [{brand: "Firefox", version: fp.browserVersion.version}],
                                        mobile: fp.userAgent.includes('Mobile'),
                                        platform: fp.osInfo.name,
                                        architecture: fp.cpu.architecture,
                                        bitness: "64"
                                    });
                                }
                            };

                            // 覆盖Firefox的userAgentData
                            if (!('userAgentData' in window.navigator)) {
                                try {
                                    Object.defineProperty(window.navigator, 'userAgentData', {
                                        value: uaDataMinimal,
                                        writable: false,
                                        enumerable: true,
                                        configurable: false
                                    });
                                } catch (e) {
                                    console.warn('[Fingerprint] Cannot add userAgentData to Firefox:', e);
                                }
                            }
                        } catch (e) {
                            console.error('[Fingerprint] Error applying Firefox userAgentData:', e);
                        }
                    }
                } catch (e) {
                    console.error('[Fingerprint] Error applying userAgentData:', e);
                }
            }

            if (fp.webRTC === false) {
                try {
                    // WebRTC IP
                    const origRTCPeerConnection = window.RTCPeerConnection ||
                        window.webkitRTCPeerConnection ||
                        window.mozRTCPeerConnection;

                    if (origRTCPeerConnection) {
                        window.RTCPeerConnection = class CustomRTCPeerConnection extends origRTCPeerConnection {
                            constructor(configuration) {
                                if (configuration && configuration.iceServers) {
                                    configuration = {...configuration, iceServers: []};
                                }
                                super(configuration);
                            }

                            createOffer(...args) {
                                return super.createOffer(...args)
                                    .then(offer => {
                                        if (offer && offer.sdp) {
                                            offer.sdp = offer.sdp.replace(/IP4 \d+\.\d+\.\d+\.\d+/g, 'IP4 0.0.0.0');
                                        }
                                        return offer;
                                    });
                            }

                            createAnswer(...args) {
                                return super.createAnswer(...args)
                                    .then(answer => {
                                        if (answer && answer.sdp) {
                                            answer.sdp = answer.sdp.replace(/IP4 \d+\.\d+\.\d+\.\d+/g, 'IP4 0.0.0.0');
                                        }
                                        return answer;
                                    });
                            }
                        };

                        window.webkitRTCPeerConnection = window.RTCPeerConnection;
                        window.mozRTCPeerConnection = window.RTCPeerConnection;
                    }

                    // 阻止媒体设备
                    if (navigator.mediaDevices) {
                        const origMediaDevices = navigator.mediaDevices;
                        const safeMediaDevices = {
                            enumerateDevices: () => Promise.resolve([]),
                            getSupportedConstraints: () => ({}),
                            getUserMedia: () => Promise.reject(new Error('Permission denied')),
                            getDisplayMedia: () => Promise.reject(new Error('Permission denied'))
                        };

                        for (const key in origMediaDevices) {
                            if (!(key in safeMediaDevices)) {
                                safeMediaDevices[key] = origMediaDevices[key];
                            }
                        }

                        Object.defineProperty(window.navigator, 'mediaDevices', {
                            value: safeMediaDevices,
                            writable: false,
                            enumerable: true,
                            configurable: false
                        });
                    }
                } catch (e) {
                    console.error('[Fingerprint] Error applying WebRTC protection:', e);
                }
            }

            if (fp.canvas === 'noise' || fp.canvas === 'block') {
                try {
                    const originalGetContext = HTMLCanvasElement.prototype.getContext;
                    const isFirefox = fp.isFirefox || navigator.userAgent.indexOf("Firefox") > -1;

                    HTMLCanvasElement.prototype.getContext = function (type, attributes) {
                        if (fp.canvas === 'block' && (type === '2d' || type.includes('webgl'))) {
                            return null;
                        }

                        const context = originalGetContext.call(this, type, attributes);
                        if (!context) return null;

                        // 2D Canvas
                        if (type === '2d') {
                            const origGetImageData = context.getImageData;
                            const origToDataURL = this.toDataURL;
                            const origToBlob = this.toBlob;

                            // 添加噪声
                            const addNoise = (data) => {
                                const noise = Math.floor(Math.random() * 5) / 255;
                                for (let i = 0; i < data.data.length; i += 4) {
                                    if (data.data[i + 3] > 0) {
                                        if (Math.random() > 0.5) {
                                            data.data[i] = Math.max(0, Math.min(255, data.data[i] - noise));
                                            data.data[i + 1] = Math.max(0, Math.min(255, data.data[i + 1] + noise));
                                        } else {
                                            data.data[i + 2] = Math.max(0, Math.min(255, data.data[i + 2] + noise));
                                            data.data[i + 3] = Math.max(0, Math.min(255, data.data[i + 3] - noise));
                                        }
                                    }
                                }
                                return data;
                            };

                            context.getImageData = function (sx, sy, sw, sh) {
                                const imageData = origGetImageData.call(this, sx, sy, sw, sh);
                                return addNoise(imageData);
                            };

                            this.toDataURL = function (...args) {
                                const dataURL = origToDataURL.apply(this, args);
                                if (!dataURL) return dataURL;

                                const lastCommaIndex = dataURL.lastIndexOf(',');
                                if (lastCommaIndex !== -1) {
                                    const prefix = dataURL.substring(0, lastCommaIndex + 1);
                                    const data = dataURL.substring(lastCommaIndex + 1);

                                    const randomPos = Math.floor(Math.random() * (data.length - 10)) + 5;
                                    const newData = data.substring(0, randomPos) +
                                        String.fromCharCode(data.charCodeAt(randomPos) + (Math.random() > 0.5 ? 1 : -1)) +
                                        data.substring(randomPos + 1);

                                    return prefix + newData;
                                }
                                return dataURL;
                            };

                            this.toBlob = function (callback, ...args) {
                                origToBlob.call(this, (blob) => {
                                    if (!blob) {
                                        callback(blob);
                                        return;
                                    }

                                    const reader = new FileReader();
                                    reader.readAsDataURL(blob);
                                    reader.onloadend = function () {
                                        const dataURL = reader.result;
                                        const lastCommaIndex = dataURL.lastIndexOf(',');

                                        if (lastCommaIndex !== -1) {
                                            const prefix = dataURL.substring(0, lastCommaIndex + 1);
                                            const data = dataURL.substring(lastCommaIndex + 1);

                                            const randomPos = Math.floor(Math.random() * (data.length - 10)) + 5;
                                            const newData = data.substring(0, randomPos) +
                                                String.fromCharCode(data.charCodeAt(randomPos) + (Math.random() > 0.5 ? 1 : -1)) +
                                                data.substring(randomPos + 1);

                                            const newDataURL = prefix + newData;

                                            const byteString = atob(newDataURL.split(',')[1]);
                                            const mimeString = newDataURL.split(',')[0].split(':')[1].split(';')[0];
                                            const ab = new ArrayBuffer(byteString.length);
                                            const ia = new Uint8Array(ab);

                                            for (let i = 0; i < byteString.length; i++) {
                                                ia[i] = byteString.charCodeAt(i);
                                            }

                                            callback(new Blob([ab], {type: mimeString}));
                                            return;
                                        }
                                        callback(blob);
                                    };
                                }, ...args);
                            };
                        } else if (type.includes('webgl')) {
                            const origGetParameter = context.getParameter;

                            context.getParameter = function (parameter) {
                                // 检查Firefox处理WebGL常量
                                if (isFirefox) {
                                    try {
                                        const ext = this.getExtension('WEBGL_debug_renderer_info');
                                        if (ext) {
                                            if (parameter === ext.UNMASKED_VENDOR_WEBGL) {
                                                return fp.webGLMetadata.vendorUnmasked || 'Mozilla';
                                            }
                                            if (parameter === ext.UNMASKED_RENDERER_WEBGL) {
                                                return fp.webGLMetadata.rendererUnmasked || 'Firefox';
                                            }
                                        }
                                    } catch (e) {
                                        // Firefox可能不支持某些扩展
                                    }
                                } else {
                                    // UNMASKED_VENDOR_WEBGL
                                    if (parameter === 37445) {
                                        return fp.webGLMetadata.vendorUnmasked || 'Google Inc.';
                                    }
                                    // UNMASKED_RENDERER_WEBGL
                                    if (parameter === 37446) {
                                        return fp.webGLMetadata.rendererUnmasked || 'Google SwiftShader';
                                    }
                                }

                                return origGetParameter.call(this, parameter);
                            };
                        }

                        return context;
                    };
                } catch (e) {
                    console.error('[Fingerprint] Error applying Canvas protection:', e);
                }
            }

            if (fp.audioContext === 'noise') {
                try {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    const isFirefox = fp.isFirefox || navigator.userAgent.indexOf("Firefox") > -1;

                    if (AudioContext) {
                        const origAudioContext = AudioContext;

                        window.AudioContext = window.webkitAudioContext = function (...args) {
                            const ctx = new origAudioContext(...args);

                            const origCreateAnalyser = ctx.createAnalyser;
                            ctx.createAnalyser = function (...analyserArgs) {
                                const analyser = origCreateAnalyser.apply(this, analyserArgs);

                                // 通用部分
                                const origGetFloatFrequencyData = analyser.getFloatFrequencyData;
                                analyser.getFloatFrequencyData = function (array) {
                                    origGetFloatFrequencyData.call(this, array);

                                    const noise = 0.0001;
                                    for (let i = 0; i < array.length; i++) {
                                        array[i] += (Math.random() * 2 - 1) * noise;
                                    }
                                };

                                const origGetByteFrequencyData = analyser.getByteFrequencyData;
                                analyser.getByteFrequencyData = function (array) {
                                    origGetByteFrequencyData.call(this, array);

                                    const noise = 1;
                                    for (let i = 0; i < array.length; i++) {
                                        array[i] = Math.max(0, Math.min(255, array[i] + (Math.random() * 2 - 1) * noise));
                                    }
                                };

                                return analyser;
                            };

                            // Firefox处理
                            if (isFirefox) {
                                if (ctx.createScriptProcessor) {
                                    const origCreateScriptProcessor = ctx.createScriptProcessor;
                                    ctx.createScriptProcessor = function (...args) {
                                        const processor = origCreateScriptProcessor.apply(this, args);

                                        const origOnAudioProcess = processor.onaudioprocess;
                                        if (origOnAudioProcess) {
                                            processor.onaudioprocess = function (event) {
                                                // 添加噪音
                                                const output = event.outputBuffer;
                                                for (let channel = 0; channel < output.numberOfChannels; channel++) {
                                                    const buffer = output.getChannelData(channel);
                                                    for (let i = 0; i < buffer.length; i++) {
                                                        // 轻微噪音
                                                        buffer[i] += (Math.random() * 2 - 1) * 0.0001;
                                                    }
                                                }
                                                return origOnAudioProcess.call(this, event);
                                            };
                                        }

                                        return processor;
                                    };
                                }
                            } else {
                                // 非Firefox浏览器
                                const origCreateOscillator = ctx.createOscillator;
                                ctx.createOscillator = function () {
                                    const oscillator = origCreateOscillator.call(this);
                                    const origFrequency = oscillator.frequency.value;
                                    oscillator.frequency.value = origFrequency + (Math.random() * 0.1 - 0.05);
                                    return oscillator;
                                };
                            }

                            return ctx;
                        };
                    }
                } catch (e) {
                    console.error('[Fingerprint] Error applying Audio Fingerprint protection:', e);
                }
            }

            try {
                const isFirefox = fp.isFirefox || navigator.userAgent.indexOf("Firefox") > -1;

                // 创建自定义插件
                const mimeTypeArray = [];
                const pluginArray = [];

                // 选择适当浏览器插件结构
                let pluginsToUse;

                if (fp.plugins && Array.isArray(fp.plugins)) {
                    pluginsToUse = fp.plugins;
                } else if (fp.browserType && browserPlugins[fp.browserType.toLowerCase()]) {
                    pluginsToUse = browserPlugins[fp.browserType.toLowerCase()];
                } else if (isFirefox) {
                    // Firefox默认插件
                    pluginsToUse = browserPlugins['firefox'];
                } else {
                    pluginsToUse = browserPlugins['chrome'];
                }

                pluginsToUse.forEach((plugin) => {
                    if (!plugin || !plugin.name) return;

                    const mimeTypes = {};
                    let mimeTypeCount = 0;

                    if (plugin.mimeTypes && Array.isArray(plugin.mimeTypes)) {
                        plugin.mimeTypes.forEach((type) => {
                            const mimeType = {
                                type,
                                description: plugin.description || '',
                                suffixes: plugin.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
                                enabledPlugin: null
                            };

                            mimeTypes[mimeTypeCount] = mimeType;
                            mimeTypes[type] = mimeType;
                            mimeTypeCount++;

                            mimeTypeArray.push(mimeType);
                        });
                    }

                    // 创建插件对象
                    const pluginObj = {
                        name: plugin.name,
                        filename: plugin.filename || '',
                        description: plugin.description || '',
                        length: mimeTypeCount,
                        item: function (index) {
                            return this[index];
                        },
                        namedItem: function (name) {
                            return this[name];
                        }
                    };

                    // 扩展插件添加mime
                    for (let i = 0; i < mimeTypeCount; i++) {
                        pluginObj[i] = mimeTypes[i];
                    }

                    // 设置mime类型enabledPlugin引用
                    Object.values(mimeTypes).forEach(mime => {
                        mime.enabledPlugin = pluginObj;
                    });

                    pluginArray.push(pluginObj);
                });

                const pluginsObj = {
                    length: pluginArray.length,
                    item: function (index) {
                        return this[index];
                    },
                    namedItem: function (name) {
                        return this[name] || null;
                    },
                    refresh: function () {
                    }
                };

                for (let i = 0; i < pluginArray.length; i++) {
                    const plugin = pluginArray[i];
                    pluginsObj[i] = plugin;
                    pluginsObj[plugin.name] = plugin;
                }

                const mimeTypesObj = {
                    length: mimeTypeArray.length,
                    item: function (index) {
                        return this[index];
                    },
                    namedItem: function (name) {
                        return this[name] || null;
                    }
                };

                // 附加mime类型到mimeTypes
                for (let i = 0; i < mimeTypeArray.length; i++) {
                    const mimeType = mimeTypeArray[i];
                    mimeTypesObj[i] = mimeType;
                    mimeTypesObj[mimeType.type] = mimeType;
                }

                // Firefox调整
                if (isFirefox) {
                    Object.defineProperty(pluginsObj, 'refresh', {
                        value: function () {
                        },
                        writable: false,
                        enumerable: false,
                        configurable: false
                    });
                }

                // plugins和mimeTypes附加到navigator
                Object.defineProperty(window.navigator, 'plugins', {
                    value: pluginsObj,
                    writable: false,
                    enumerable: true,
                    configurable: false
                });

                Object.defineProperty(window.navigator, 'mimeTypes', {
                    value: mimeTypesObj,
                    writable: false,
                    enumerable: true,
                    configurable: false
                });
            } catch (e) {
                console.error('[Fingerprint] Error applying plugin emulation:', e);
            }

            try {
                // 删除自动化标记
                delete window.__nightmare;
                delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
                delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
                delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
                delete window.__PUPPETEER_EXTRA_PLUGIN_STEALTH_VERSION;

                const originalToString = Function.prototype.toString;
                Function.prototype.toString = function () {
                    if (this === Function.prototype.toString) {
                        return originalToString.call(this);
                    }

                    const fnName = this.name;
                    if (fnName === 'getParameter' ||
                        fnName === 'getChannelData' ||
                        fnName === 'toDataURL' ||
                        fnName === 'toBlob' ||
                        fnName === 'getImageData') {
                        return "function " + fnName + "() { [native code] }";
                    }

                    return originalToString.call(this);
                };

                // 修改权限API
                if (navigator.permissions) {
                    const originalQuery = navigator.permissions.query;
                    navigator.permissions.query = function (parameters) {
                        return new Promise((resolve, reject) => {
                            // 自动化检测通常会查询这些权限
                            if (parameters &&
                                (parameters.name === 'notifications' ||
                                    parameters.name === 'clipboard-read' ||
                                    parameters.name === 'clipboard-write')) {
                                resolve({state: "prompt", onchange: null});
                            } else {
                                try {
                                    originalQuery.call(this, parameters).then(resolve, reject);
                                } catch (e) {
                                    reject(e);
                                }
                            }
                        });
                    };
                }
            } catch (e) {
                console.error('[Fingerprint] Error applying automation detection countermeasures:', e);
            }

            // 添加PDF支持
            if (fp.pdfViewerEnabled) {
                try {
                    for (const mimeType of ['application/pdf', 'text/pdf']) {
                        const pdfMime = {
                            type: mimeType,
                            suffixes: 'pdf',
                            description: 'Portable Document Format'
                        };

                        if (window.navigator.mimeTypes &&
                            typeof window.navigator.mimeTypes === 'object') {
                            const mimeTypesObj = window.navigator.mimeTypes;
                            const index = mimeTypesObj.length || 0;

                            pdfMime.enabledPlugin = window.navigator.plugins &&
                                window.navigator.plugins[0];

                            try {
                                mimeTypesObj[index] = pdfMime;
                                mimeTypesObj[mimeType] = pdfMime;
                                mimeTypesObj.length = (mimeTypesObj.length || 0) + 1;
                            } catch (e) {
                            }
                        }
                    }
                } catch (e) {
                    console.error('[Fingerprint] Error adding PDF support:', e);
                }
            }

            // Firefox特定DOM rect修复
            if (isFirefox) {
                try {
                    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
                    Element.prototype.getBoundingClientRect = function () {
                        const rect = originalGetBoundingClientRect.call(this);

                        // 添加微小噪音
                        if (rect) {
                            const noise = 0.0001;
                            return new Proxy(rect, {
                                get: function (target, prop) {
                                    if (prop === 'x' || prop === 'y' ||
                                        prop === 'width' || prop === 'height' ||
                                        prop === 'top' || prop === 'left' ||
                                        prop === 'right' || prop === 'bottom') {
                                        // 添加微小随机噪音
                                        return target[prop] + (Math.random() * 2 - 1) * noise;
                                    }
                                    return target[prop];
                                }
                            });
                        }
                        return rect;
                    };
                } catch (e) {
                    console.error('[Fingerprint] Error applying Firefox rect noise:', e);
                }
            }

            window._fingerprintId = fp.seed;

            // 发送完成
            const event = new CustomEvent('fingerprintApplied', {
                detail: {
                    success: true,
                    fingerprintId: fp.seed,
                    timestamp: Date.now()
                }
            });
            document.dispatchEvent(event);
        }, fingerprint);

        // 执行验证
        const verification = await page.evaluate((fp) => {
            const isFirefox = fp.isFirefox || navigator.userAgent.indexOf("Firefox") > -1;

            const results = {
                userAgent: navigator.userAgent === fp.userAgent,
                platform: navigator.platform === fp.platform,
                language: navigator.language === fp.language,
                hardwareConcurrency: Number(navigator.hardwareConcurrency) === Number(fp.cpu.cores),
                doNotTrack: navigator.doNotTrack === fp.doNotTrack,
                languages: Array.isArray(navigator.languages) &&
                    navigator.languages.length === fp.languages.length &&
                    navigator.languages.every((lang, i) => lang === fp.languages[i]),
                webglVendor: true
            };
            // 检查WebGL
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl');
                if (gl) {
                    if (isFirefox) {
                        try {
                            const ext = gl.getExtension('WEBGL_debug_renderer_info');
                            if (ext) {
                                const vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
                                results.webglVendor = vendor.includes(fp.webGLMetadata.vendorUnmasked);
                            }
                        } catch (e) {
                            results.webglVendor = true;
                        }
                    } else {
                        results.webglVendor = gl.getParameter(gl.getParameter(37445)).includes(fp.webGLMetadata.vendorUnmasked);
                    }
                }
            } catch (e) {
            }

            return {
                success: Object.values(results).every(v => v === true),
                details: results,
                actual: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    language: navigator.language,
                    hardwareConcurrency: navigator.hardwareConcurrency,
                    languages: Array.from(navigator.languages || []),
                    // Firefox特有信息
                    isFirefox: isFirefox,
                    deviceMemory: navigator.deviceMemory
                },
                expected: {
                    userAgent: fp.userAgent,
                    platform: fp.platform,
                    language: fp.language,
                    hardwareConcurrency: fp.cpu.cores,
                    languages: fp.languages
                }
            };
        }, fingerprint);

        if (!verification.success) {
            // console.warn('指纹验证警告:', verification.details);
            await page.evaluate((fp) => {
                try {
                    const isFirefox = fp.isFirefox || navigator.userAgent.indexOf("Firefox") > -1;
                    const nav = {};
                    for (const key in navigator) {
                        try {
                            nav[key] = navigator[key];
                        } catch (e) {
                        }
                    }
                    // 强制设置关键值
                    nav.platform = fp.platform;
                    nav.language = fp.language;
                    nav.languages = [...fp.languages];
                    nav.hardwareConcurrency = Number(fp.cpu.cores);

                    // 仅在非Firefox设置deviceMemory
                    if (!isFirefox) {
                        nav.deviceMemory = fp.ram;
                    }
                    nav.userAgent = fp.userAgent;
                    // 尝试替换navigator
                    try {
                        Object.defineProperty(window, 'navigator', {
                            value: nav,
                            writable: false,
                            configurable: false
                        });
                    } catch (e) {
                        console.error('Cannot replace navigator directly, error:', e);
                    }
                } catch (e) {
                    console.error('Error fixing navigator properties:', e);
                }
            }, fingerprint);
        }
        console.log(`Custom browser fingerprint: ${fingerprint.userAgent}`);
        return true;
    } catch (error) {
        console.error('Error applying browser fingerprint:', error);
        return false;
    }
}

/**
 * 为特定浏览器创建并应用指纹
 * @param {Object} page - Puppeteer
 * @param {string|Object} options - 浏览器或完整配置
 * @returns {Promise<Object>} - 应用指纹
 */
export async function setupBrowserFingerprint(page, options = {}) {
    try {
        if (typeof options === 'string') {
            options = {browserType: options};
        }

        // 检查是否为Firefox
        let isFirefox = false;
        if (options.browserType && options.browserType.toLowerCase() === 'firefox') {
            isFirefox = true;
            options.isFirefox = true;
        } else if (options.userAgent && options.userAgent.includes('Firefox')) {
            isFirefox = true;
            options.isFirefox = true;
        }

        // 生成完整的指纹
        const fingerprint = generateFingerprint(options);

        if (isFirefox) {
            // Firefox不支持deviceMemory
            delete fingerprint.deviceMemory;

            if (fingerprint.webGLMetadata) {
                const vendorKey = fingerprint.webGLMetadata.vendorUnmasked;
                if (vendorKey && !vendorKey.includes('-Firefox') &&
                    ['NVIDIA', 'AMD', 'Intel'].includes(vendorKey)) {
                    fingerprint.webGLMetadata.vendorUnmasked = `${vendorKey}-Firefox`;
                }
            }
        }

        // 应用指纹
        const success = await applyFingerprint(page, fingerprint);

        // 验证指纹应用
        if (success) {
            try {
                const appliedUserAgent = await page.evaluate(() => navigator.userAgent);
                if (appliedUserAgent !== fingerprint.userAgent) {
                    console.warn('User agent not applied correctly:', {
                        expected: fingerprint.userAgent,
                        applied: appliedUserAgent
                    });
                }

                // 验证CPU核心数
                const hardwareConcurrency = await page.evaluate(() => navigator.hardwareConcurrency);
                if (Number(hardwareConcurrency) !== Number(fingerprint.cpu.cores)) {
                    console.warn('CPU cores not applied correctly:', {
                        expected: fingerprint.cpu.cores,
                        applied: hardwareConcurrency,
                        expectedType: typeof fingerprint.cpu.cores,
                        appliedType: typeof hardwareConcurrency
                    });
                }

                // 验证WebGL
                if (fingerprint.webGL !== 'block') {
                    const webglVendor = await page.evaluate(() => {
                        try {
                            const canvas = document.createElement('canvas');
                            const gl = canvas.getContext('webgl');
                            if (!gl) return null;

                            // 检测Firefox
                            const isFirefox = navigator.userAgent.indexOf("Firefox") > -1;
                            if (isFirefox) {
                                const ext = gl.getExtension('WEBGL_debug_renderer_info');
                                return ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : null;
                            } else {
                                return gl.getParameter(gl.getParameter(37445));
                            }
                        } catch (e) {
                            return null;
                        }
                    });

                    // 检查WebGL
                    if (webglVendor) {
                        const expectedVendor = isFirefox
                            ? fingerprint.webGLMetadata.vendorUnmasked.split('-')[0]
                            : fingerprint.webGLMetadata.vendorUnmasked;

                        if (!webglVendor.includes(expectedVendor)) {
                            console.warn('WebGL vendor information not applied correctly:', {
                                expected: expectedVendor,
                                applied: webglVendor
                            });
                        }
                    }
                }
            } catch (verifyError) {
                console.warn('Error verifying fingerprint:', verifyError);
            }
        }

        return fingerprint;
    } catch (error) {
        console.error('Error setting up browser fingerprint:', error);
        throw error;
    }
}
