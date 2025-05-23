/**
 * 集成管理指纹和TLS
 */
import {generateFingerprint, getRandomizedBrowserVersion} from './browserFingerprint.mjs';
import {applyGlobalTLSConfig} from './tlsConfig.mjs';
import tlsRotator from './tlsRotator.mjs';
import {getConsistentHttpHeaders} from './fingerprintCoordinator.mjs';
import crypto from 'crypto';

class FingerprintManager {
    constructor(options = {}) {
        this.options = {
            enableTLSProtection: true,
            enableFingerprintRotation: true,
            fingerprintRotationInterval: parseInt(process.env.FINGERPRINT_ROTATION_INTERVAL || '24', 10) * 3600000,
            ...options
        };

        // 存储浏览器指纹
        this.instanceFingerprints = new Map();

        // 上次指纹轮换时间
        this.lastFingerprintRotation = Date.now();

        // 初始化TLS
        if (this.options.enableTLSProtection) {
            this.tlsConfig = applyGlobalTLSConfig();
            if (this.options.enableTLSRotation !== false) {
                tlsRotator.start();
            }
        }
    }

    /**
     * 创建或检索指纹
     * @param {string} instanceId - 浏览器实例ID
     * @param {Object} options - 指纹选项
     * @returns {Object} 指纹对象
     */
    getInstanceFingerprint(instanceId, options = {}) {
        // 检查轮换
        if (this.shouldRotateFingerprints()) {
            this.rotateAllFingerprints();
        }

        // 查找指纹
        if (this.instanceFingerprints.has(instanceId)) {
            const fingerprint = this.instanceFingerprints.get(instanceId);

            const fingerAge = Date.now() - (fingerprint._created || 0);
            const maxAge = options.maxAge || this.options.fingerprintRotationInterval;

            if (fingerAge > maxAge) {
                return this.createFingerprint(instanceId, options);
            }

            return fingerprint;
        }

        // 创建新指纹
        return this.createFingerprint(instanceId, options);
    }

    /**
     * 创建新指纹
     * @param {string} instanceId - 浏览器实例ID
     * @param {Object} options - 指纹选项
     * @returns {Object} 新指纹对象
     */
    createFingerprint(instanceId, options = {}) {
        const seed = crypto.createHash('sha256')
            .update(`${instanceId}-${Date.now()}-${Math.random()}`)
            .digest('hex');

        const browserType = options.browserType ||
            ['chrome', 'edge', 'firefox'][Math.floor(Math.random() * 3)];

        const browserVersionInfo = getRandomizedBrowserVersion(browserType);

        const fingerprintOptions = {
            ...options,
            browserType,
            seed,
            _created: Date.now()
        };

        // 生成指纹
        const fingerprint = generateFingerprint(fingerprintOptions);

        // 存储指纹
        this.instanceFingerprints.set(instanceId, fingerprint);

        return fingerprint;
    }

    /**
     * 获取指纹一致HTTP头
     * @param {string} instanceId - 浏览器实例ID
     * @param {Object} customHeaders - 自定义头
     * @returns {Object} HTTP头
     */
    getInstanceHeaders(instanceId, customHeaders = {}) {
        const fingerprint = this.getInstanceFingerprint(instanceId);
        return getConsistentHttpHeaders(fingerprint, customHeaders);
    }

    /**
     * 检查轮换所有指纹
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
        this.instanceFingerprints.clear();
        this.lastFingerprintRotation = Date.now();
        // console.log(`已轮换所有浏览器指纹: ${new Date().toLocaleString()}`);
    }

    /**
     * 轮换特定实例的指纹
     * @param {string} instanceId - 浏览器实例ID
     * @param {Object} options - 指纹选项
     * @returns {Object} 新指纹
     */
    rotateInstanceFingerprint(instanceId, options = {}) {
        this.instanceFingerprints.delete(instanceId);
        return this.createFingerprint(instanceId, options);
    }

    /**
     * 获取指纹和TLS状态
     * @returns {Object}
     */
    getStatus() {
        return {
            fingerprintCount: this.instanceFingerprints.size,
            lastRotation: new Date(this.lastFingerprintRotation).toLocaleString(),
            nextRotation: new Date(this.lastFingerprintRotation +
                this.options.fingerprintRotationInterval).toLocaleString(),
            tlsStatus: tlsRotator.getStatus()
        };
    }
}

const fingerprintManager = new FingerprintManager();

export default fingerprintManager;