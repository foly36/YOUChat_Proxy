import tls from 'tls';
import crypto from 'crypto';

const TLS_1_3_CIPHERS = [
    'TLS_AES_128_GCM_SHA256',
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256'
];

// 签名
const SUPPORTED_SIGNATURE_ALGORITHMS = [
    'rsa_pss_rsae_sha256',
    'ecdsa_secp256r1_sha256',
    'rsa_pkcs1_sha256',
    'ecdsa_secp384r1_sha384',
    'rsa_pss_rsae_sha384',
    'rsa_pkcs1_sha384',
    'rsa_pss_rsae_sha512',
    'rsa_pkcs1_sha512'
];

// 椭圆曲线
const SUPPORTED_CURVES = [
    'x25519',
    'secp256r1',
    'secp384r1',
    'secp521r1'
];

// 区分唯一ID
const INSTANCE_ID = crypto.randomBytes(4).toString('hex');

/**
 * 随机排序数组
 * @param {Array} array - 输入数组
 * @returns {Array}
 */
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * 随机字节
 * @param {number} length
 * @returns {Buffer} - 缓冲
 */
function getRandomBytes(length) {
    return crypto.randomBytes(length);
}

/**
 * 随机TLS
 * @returns {Object}
 */
export function getRandomizedTLSConfig() {
    // 随机排序
    const shuffledCiphers = shuffleArray(TLS_1_3_CIPHERS);

    // 随机会话ID
    const sessionIdContext = getRandomBytes(32).toString('hex');

    const tlsConfig = {
        minVersion: 'TLSv1.3',
        maxVersion: 'TLSv1.3',

        // 随机排序密码套件
        ciphers: shuffledCiphers.join(':'),

        // 随机会话
        sessionIdContext,

        secureOptions: crypto.constants.SSL_OP_NO_SSLv2 |
            crypto.constants.SSL_OP_NO_SSLv3 |
            crypto.constants.SSL_OP_NO_TLSv1 |
            crypto.constants.SSL_OP_NO_TLSv1_1 |
            crypto.constants.SSL_OP_NO_TLSv1_2 |
            crypto.constants.SSL_OP_NO_COMPRESSION,

        // 随机协议
        honorCipherOrder: Math.random() > 0.5,

        // 会话缓存随机化
        sessionTimeout: Math.floor(Math.random() * 3600) + 3600, // 1-2小时

        // 随机TLS会话票证行为
        ticketKeys: getRandomBytes(48)
    };

    // 随机签名顺序
    if (Math.random() > 0.3) {
        tlsConfig.sigalgs = shuffleArray(SUPPORTED_SIGNATURE_ALGORITHMS).join(':');
    }

    // 随机曲线顺序
    if (Math.random() > 0.3) {
        tlsConfig.curves = shuffleArray(SUPPORTED_CURVES).join(':');
    }

    tlsConfig._id = crypto.createHash('md5').update(JSON.stringify({
        ciphers: tlsConfig.ciphers,
        instance: INSTANCE_ID,
        timestamp: Date.now(),
        random: Math.random().toString()
    })).digest('hex').substring(0, 8);

    return tlsConfig;
}

/**
 * 应用TLS
 * @param {Object} config
 * @returns {Object}
 */
export function applyGlobalTLSConfig(config = null) {
    const tlsConfig = config || getRandomizedTLSConfig();

    tls.DEFAULT_MIN_VERSION = 'TLSv1.3';
    tls.DEFAULT_MAX_VERSION = 'TLSv1.3';
    // console.log(`应用TLS 1.3配置 [${tlsConfig._id}]，密码套件顺序: ${tlsConfig.ciphers}`);
    return tlsConfig;
}

/**
 * HTTPS创建随机TLS
 * @returns {Object}
 */
export function createRequestTLSOptions() {
    const tlsConfig = getRandomizedTLSConfig();

    return {
        minVersion: tlsConfig.minVersion,
        maxVersion: tlsConfig.maxVersion,
        ciphers: tlsConfig.ciphers,
        sigalgs: tlsConfig.sigalgs,
        curves: tlsConfig.curves,
        secureOptions: tlsConfig.secureOptions,
        honorCipherOrder: tlsConfig.honorCipherOrder,
        sessionTimeout: tlsConfig.sessionTimeout
    };
}

/**
 * 获取TLS安全信息
 * @returns {Object}
 */
export function getTLSInfo() {
    return {
        version: 'TLS 1.3 Only',
        cipherCount: TLS_1_3_CIPHERS.length,
        randomization: {
            cipherOrder: true,
            signatureAlgorithms: true,
            curves: true,
            sessionParams: true
        },
        securityLevel: 'High (TLS 1.3 exclusive)'
    };
}

export default {
    getRandomizedTLSConfig,
    applyGlobalTLSConfig,
    createRequestTLSOptions,
    getTLSInfo
};