import {generateFingerprint} from './browserFingerprint.mjs';
import crypto from 'crypto';

// 浏览器指纹缓存
const usedFingerprints = new Map();

// 获取两个之间相似度 (0-1)
function stringSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;

    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;

    let match = 0;
    const minLength = Math.min(str1.length, str2.length);

    for (let i = 0; i < minLength; i++) {
        if (str1[i] === str2[i]) match++;
    }

    return match / maxLength;
}

/**
 * 生成指纹
 */
function getFingerprintHash(fingerprint) {
    const key = fingerprint.userAgent + '|' +
        fingerprint.platform + '|' +
        fingerprint.language + '|' +
        fingerprint.webGLMetadata.renderer;

    return crypto.createHash('md5').update(key).digest('hex');
}

/**
 * 检查指纹
 * @param {Object} newFingerprint - 新指纹
 * @returns {boolean} 相似度
 */
function isSimilarFingerprintExists(newFingerprint) {
    const newHash = getFingerprintHash(newFingerprint);

    for (const [Hash, fp] of usedFingerprints.entries()) {
        // 检查
        if (stringSimilarity(newFingerprint.userAgent, fp.userAgent) > 0.9) {
            return true;
        }

        if (newFingerprint.platform === fp.platform &&
            newFingerprint.language === fp.language &&
            newFingerprint.webGLMetadata.renderer === fp.webGLMetadata.renderer) {
            return true;
        }
    }

    return false;
}

/**
 * 生成唯一指纹
 * @param {Object} options
 * @returns {Object}
 */
export function generateUniqueFingerprint(options = {}) {
    let fingerprint;
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    do {
        const modifiedOptions = {
            ...options,
            seed: crypto.randomBytes(16).toString('hex'),
            noiseLevel: options.noiseLevel || ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
        };

        // 随机选择浏览器类型
        if (!modifiedOptions.browserType) {
            const browserTypes = ['chrome', 'edge', 'firefox', 'safari'];
            modifiedOptions.browserType = browserTypes[Math.floor(Math.random() * browserTypes.length)];
        }

        fingerprint = generateFingerprint(modifiedOptions);
        fingerprint.doNotTrack = Math.random() > 0.7 ? "1" : Math.random() > 0.5 ? "0" : null;
        fingerprint.webGL = Math.random() > 0.8 ? 'block' : Math.random() > 0.5 ? 'noise' : 'allow';
        fingerprint.audioContext = Math.random() > 0.7 ? 'noise' : 'allow';
        fingerprint.mediaDevices = Math.random() > 0.6 ? 'noise' : 'allow';

        attempts++;
    } while (isSimilarFingerprintExists(fingerprint) && attempts < MAX_ATTEMPTS);

    // 缓存已使用指纹
    const hash = getFingerprintHash(fingerprint);
    usedFingerprints.set(hash, fingerprint);

    if (usedFingerprints.size > 100) {
        const firstKey = usedFingerprints.keys().next().value;
        usedFingerprints.delete(firstKey);
    }

    return fingerprint;
}

/**
 * 随机版本号
 * @returns {Object}
 */
export function getRandomizedBrowserVersion(browserType = 'chrome') {
    let browserInfo = {
        majorVersions: [],
        minorVersions: [0, 1, 2],
        buildVersions: [],
        patchVersions: []
    };

    switch (browserType.toLowerCase()) {
        case 'chrome':
        case 'edge':
            // Chrome/Edge通常版本在90-130之间
            const baseVersion = Math.floor(Math.random() * 15) + 120; // 120-134
            browserInfo.majorVersions = [baseVersion];
            browserInfo.buildVersions = [
                Math.floor(Math.random() * 2000) + 5000
            ];
            browserInfo.patchVersions = [
                Math.floor(Math.random() * 100) + 100
            ];
            break;

        case 'firefox':
            // 115-124
            browserInfo.majorVersions = [
                Math.floor(Math.random() * 10) + 115
            ];
            break;

        case 'safari':
            // 15-17
            browserInfo.majorVersions = [
                Math.floor(Math.random() * 3) + 15
            ];
            browserInfo.minorVersions = [
                Math.floor(Math.random() * 7)
            ];
            break;
    }

    return browserInfo;
}

export default {
    generateUniqueFingerprint,
    getRandomizedBrowserVersion
};