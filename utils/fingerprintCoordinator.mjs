/**
 * 指纹协调器
 */
import {generateFingerprint} from './browserFingerprint.mjs';
import {getRandomizedHeaders} from './httpClient.mjs';
import crypto from 'crypto';

// 存储已分配指纹
const allocatedFingerprints = new Map();

/**
 * ID分配一致指纹
 * @param {string} instanceId - 实例标识
 * @param {Object} options - 指纹选项
 * @returns {Object} 指纹数据
 */
export function allocateFingerprint(instanceId, options = {}) {
    if (allocatedFingerprints.has(instanceId)) {
        return allocatedFingerprints.get(instanceId);
    }
    // 生成随机种子
    const seed = crypto.createHash('sha256')
        .update(`${instanceId}-${Date.now()}-${Math.random()}`)
        .digest('hex')
        .substring(0, 16);
    // 合并选项
    const fingerprintOptions = {
        ...options,
        seed,
        // 确保类型有效
        browserType: options.browserType || ['chrome', 'edge', 'firefox'][Math.floor(Math.random() * 3)]
    };

    // 生成指纹
    const fingerprint = generateFingerprint(fingerprintOptions);

    // 存储指纹
    allocatedFingerprints.set(instanceId, fingerprint);

    // 保持100个内
    if (allocatedFingerprints.size > 100) {
        const oldestKey = Array.from(allocatedFingerprints.keys())[0];
        allocatedFingerprints.delete(oldestKey);
    }

    return fingerprint;
}

/**
 * 获取指纹一致HTTP头
 * @param {Object} fingerprint - 浏览器指纹
 * @param {Object} customHeaders - 自定义头信息
 * @returns {Object} HTTP请求头
 */
export function getConsistentHttpHeaders(fingerprint, customHeaders = {}) {
    if (!fingerprint || typeof fingerprint !== 'object') {
        // 没有指纹时使用随机头部
        return getRandomizedHeaders(customHeaders);
    }

    // 基于指纹创建一致HTTP头
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
        else if (fingerprint.browserType === 'firefox') {
            headers['Sec-CH-UA'] = `"Firefox";v="${version}", "Not=A?Brand";v="99"`;
        }
    }

    // 合并随机HTTP头部确保关键头部一致
    const randomizedHeaders = getRandomizedHeaders();
    return {
        ...randomizedHeaders,
        ...headers,
        ...customHeaders
    };
}

/**
 * 更新指定实例指纹
 * @param {string} instanceId - 实例标识符
 * @param {Object} options - 指纹选项
 * @returns {Object} 新指纹
 */
export function rotateFingerprint(instanceId, options = {}) {
    // 移除旧指纹
    allocatedFingerprints.delete(instanceId);

    // 分配新指纹
    return allocateFingerprint(instanceId, options);
}

/**
 * 获取实例网络配置
 * @param {string} instanceId - 实例标识
 * @returns {Object} 网络配置
 */
export function getInstanceNetworkConfig(instanceId) {
    const fingerprint = allocatedFingerprints.get(instanceId) ||
        allocateFingerprint(instanceId);

    return {
        fingerprint,
        headers: getConsistentHttpHeaders(fingerprint),
        userAgent: fingerprint.userAgent,
        language: fingerprint.language,
        platform: fingerprint.platform,
        osInfo: fingerprint.osInfo
    };
}

export default {
    allocateFingerprint,
    getConsistentHttpHeaders,
    rotateFingerprint,
    getInstanceNetworkConfig
};