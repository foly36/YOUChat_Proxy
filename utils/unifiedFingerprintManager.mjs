import {generateFingerprint} from './browserFingerprint.mjs';
import {getRandomizedHeaders} from './httpClient.mjs';
import {applyGlobalTLSConfig, createRequestTLSOptions} from './tlsConfig.mjs';
import tlsRotator from './tlsRotator.mjs';
import crypto from 'crypto';

/**
 * 统一指纹管理器
 */
class UnifiedFingerprintManager {
    constructor() {
        // 存储浏览器和HTTP请求
        this.browserFingerprints = new Map();
        this.httpFingerprints = new Map();

        // 配置
        this.options = {
            enableTLSProtection: true,
            enableFingerprintRotation: process.env.ENABLE_FINGERPRINT_ROTATION !== 'false',
            fingerprintRotationInterval: parseInt(process.env.FINGERPRINT_ROTATION_INTERVAL || '24', 10) * 3600000,
            preventFingerprintCollosion: true,
            strictConsistency: true
        };
        // 上次轮换时间
        this.lastFingerprintRotation = Date.now();
        // 初始化TLS
        if (this.options.enableTLSProtection) {
            this.tlsConfig = applyGlobalTLSConfig();
            if (process.env.ENABLE_TLS_ROTATION !== 'false') {
                tlsRotator.start();
            }
        }
        // 指纹碰撞检测
        this.fingerprintHashes = new Set();
    }

    /**
     * 检索指纹
     * @param {string} instanceId - 实例ID
     * @param {Object} options
     * @returns {Object}
     */
    getInstanceFingerprint(instanceId, options = {}) {
        if (this.shouldRotateFingerprints()) {
            this.rotateAllFingerprints();
        }
        if (this.browserFingerprints.has(instanceId)) {
            const fingerprint = this.browserFingerprints.get(instanceId);

            const fingerprintAge = Date.now() - (fingerprint._created || 0);
            const maxAge = options.maxAge || this.options.fingerprintRotationInterval;

            if (fingerprintAge > maxAge) {
                return this.createFingerprint(instanceId, options);
            }

            return fingerprint;
        }

        return this.createFingerprint(instanceId, options);
    }

    /**
     * 创建唯一指纹
     * @param {string} instanceId - 实例ID
     * @param {Object} options
     * @returns {Object}
     */
    createFingerprint(instanceId, options = {}) {
        const seed = crypto.createHash('sha256')
            .update(`${instanceId}-${Date.now()}-${Math.random()}`)
            .digest('hex');

        const browserType = options.browserType || ['chrome', 'edge'][Math.floor(Math.random() * 2)];

        const fingerprintOptions = {
            ...options,
            browserType,
            seed,
            _created: Date.now()
        };

        let fingerprint = generateFingerprint(fingerprintOptions);

        // 避免指纹重复
        if (this.options.preventFingerprintCollosion) {
            let attempts = 0;
            const MAX_ATTEMPTS = 5;

            while (this.isFingerPrintCollision(fingerprint) && attempts < MAX_ATTEMPTS) {
                fingerprintOptions.seed = crypto.randomBytes(16).toString('hex');
                fingerprint = generateFingerprint(fingerprintOptions);
                attempts++;
            }

            if (attempts >= MAX_ATTEMPTS) {
                console.warn(`警告: 无法在${MAX_ATTEMPTS}次尝试内创建唯一指纹`);
            }
        }

        // 生成HTTP请求指纹
        const httpFingerprint = this.deriveHttpFingerprint(fingerprint);

        // 存储
        this.browserFingerprints.set(instanceId, fingerprint);
        this.httpFingerprints.set(instanceId, httpFingerprint);

        // 添加指纹哈希
        if (this.options.preventFingerprintCollosion) {
            this.fingerprintHashes.add(this.getFingerprintHash(fingerprint));
        }

        return fingerprint;
    }

    /**
     * 从浏览器指纹派生HTTP请求指纹
     * @param {Object} fingerprint - 浏览器指纹
     * @returns {Object} - HTTP请求指纹
     */
    deriveHttpFingerprint(fingerprint) {
        const headers = {
            'User-Agent': fingerprint.userAgent,
            'Accept-Language': fingerprint.languages.join(','),
            'Sec-CH-UA-Platform': `"${fingerprint.osInfo?.name || fingerprint.platform}"`,
            'Sec-CH-UA-Mobile': fingerprint.touchSupport ? '?1' : '?0'
        };
        // 添加Sec-CH-UA头
        if (fingerprint.browserVersion && fingerprint.browserVersion.name) {
            const version = fingerprint.browserVersion.version || '1';
            if (fingerprint.browserType === 'chrome') {
                headers['Sec-CH-UA'] = `"Google Chrome";v="${version}", "Chromium";v="${version}", "Not=A?Brand";v="99"`;
            } else if (fingerprint.browserType === 'edge') {
                headers['Sec-CH-UA'] = `"Microsoft Edge";v="${version}", "Chromium";v="${version}", "Not=A?Brand";v="99"`;
            }
        }
        // 构建HTTP
        return {
            headers,
            userAgent: fingerprint.userAgent,
            acceptLanguage: fingerprint.languages.join(','),
            cookies: [], // 可动态管理的cookie存储
            localStorage: {},
            sessionStorage: {},
            timezone: fingerprint.timezone,
            screenSize: {
                width: 1280,
                height: 800,
                availWidth: 1280,
                availHeight: 750,
                colorDepth: 24,
                pixelDepth: 24
            },
            _created: fingerprint._created,
            _parentFingerprintId: fingerprint.seed
        };
    }

    /**
     * 获取实例关联HTTP请求头
     * @param {string} instanceId - 实例ID
     * @param {Object} customHeaders - 自定义头
     * @returns {Object} - HTTP请求头
     */
    getInstanceHeaders(instanceId, customHeaders = {}) {
        if (!this.httpFingerprints.has(instanceId)) {
            const browserFingerprint = this.getInstanceFingerprint(instanceId);
            this.httpFingerprints.set(instanceId, this.deriveHttpFingerprint(browserFingerprint));
        }

        const httpFingerprint = this.httpFingerprints.get(instanceId);

        // 合并随机HTTP头
        const randomizedHeaders = getRandomizedHeaders();
        return {
            ...randomizedHeaders,
            ...httpFingerprint.headers,
            ...customHeaders
        };
    }

    /**
     * 为HTTP请求创建TLS
     * @param {string} instanceId - 实例ID
     * @returns {Object}
     */
    getTlsOptions(instanceId) {
        if (this.browserFingerprints.has(instanceId) &&
            this.browserFingerprints.get(instanceId).tlsConfig) {
            // 复用浏览器TLS
            return this.browserFingerprints.get(instanceId).tlsConfig;
        }
        return createRequestTLSOptions();
    }

    /**
     * 检查指纹是否存在（碰撞检测）
     * @param {Object} fingerprint - 指纹
     * @returns {boolean}
     */
    isFingerPrintCollision(fingerprint) {
        if (!this.options.preventFingerprintCollosion) {
            return false;
        }
        const hash = this.getFingerprintHash(fingerprint);
        return this.fingerprintHashes.has(hash);
    }

    /**
     * 获取指纹哈希
     * @param {Object} fingerprint - 指纹
     * @returns {string}
     */
    getFingerprintHash(fingerprint) {
        const key = fingerprint.userAgent + '|' +
            fingerprint.platform + '|' +
            fingerprint.language + '|' +
            fingerprint.webGLMetadata.renderer;

        return crypto.createHash('md5').update(key).digest('hex');
    }

    /**
     * 检查是否轮换
     * @returns {boolean}
     */
    shouldRotateFingerprints() {
        if (!this.options.enableFingerprintRotation) {
            return false;
        }

        const now = Date.now();
        const elapsed = now - this.lastFingerprintRotation;

        return elapsed >= this.options.fingerprintRotationInterval;
    }

    /**
     * 轮换所有指纹
     */
    rotateAllFingerprints() {
        this.browserFingerprints.clear();
        this.httpFingerprints.clear();
        this.fingerprintHashes.clear();
        this.lastFingerprintRotation = Date.now();
    }

    /**
     * 轮换特定实例
     * @param {string} instanceId - 实例ID
     * @param {Object} options
     * @returns {Object}
     */
    rotateInstanceFingerprint(instanceId, options = {}) {
        this.browserFingerprints.delete(instanceId);
        this.httpFingerprints.delete(instanceId);

        if (this.options.preventFingerprintCollosion && this.browserFingerprints.has(instanceId)) {
            const oldFingerprint = this.browserFingerprints.get(instanceId);
            const oldHash = this.getFingerprintHash(oldFingerprint);
            this.fingerprintHashes.delete(oldHash);
        }

        return this.createFingerprint(instanceId, options);
    }

    /**
     * 网络配置
     * @param {string} instanceId - 实例ID
     * @returns {Object}
     */
    getInstanceNetworkConfig(instanceId) {
        const browserFingerprint = this.getInstanceFingerprint(instanceId);
        let httpFingerprint = this.httpFingerprints.get(instanceId);

        if (!httpFingerprint) {
            httpFingerprint = this.deriveHttpFingerprint(browserFingerprint);
            this.httpFingerprints.set(instanceId, httpFingerprint);
        }

        return {
            browserFingerprint,
            httpFingerprint,
            headers: this.getInstanceHeaders(instanceId),
            tlsOptions: this.getTlsOptions(instanceId),
            userAgent: browserFingerprint.userAgent,
            language: browserFingerprint.language,
            platform: browserFingerprint.platform,
            osInfo: browserFingerprint.osInfo
        };
    }

    /**
     * 获取统一指纹管理状态
     * @returns {Object} - 状态信息
     */
    getStatus() {
        return {
            browserFingerprintCount: this.browserFingerprints.size,
            httpFingerprintCount: this.httpFingerprints.size,
            lastRotation: new Date(this.lastFingerprintRotation).toLocaleString(),
            nextRotation: new Date(this.lastFingerprintRotation +
                this.options.fingerprintRotationInterval).toLocaleString(),
            tlsStatus: tlsRotator.getStatus(),
            collisionPreventionEnabled: this.options.preventFingerprintCollosion
        };
    }

    /**
     * 创建fetch请求
     * @param {string} url - 请求URL
     * @param {string} instanceId - 实例ID
     * @param {Object} options
     * @returns {Promise<Response>} - 响应
     */
    async fetch(url, instanceId, options = {}) {
        const {fetch} = await import('./httpClient.mjs');

        // 获取网络配置
        const networkConfig = this.getInstanceNetworkConfig(instanceId);
        const requestOptions = {
            ...options,
            headers: {
                ...networkConfig.headers,
                ...(options.headers || {})
            },
            agent: options.agent || networkConfig.tlsOptions
        };

        return fetch(url, requestOptions);
    }
}

const unifiedFingerprintManager = new UnifiedFingerprintManager();

export default unifiedFingerprintManager;