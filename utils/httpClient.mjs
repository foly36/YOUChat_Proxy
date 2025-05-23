import https from 'https';
import {createRequestTLSOptions} from './tlsConfig.mjs';
import fetch from 'node-fetch';
import crypto from 'crypto';

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0'
];

const ACCEPT_TYPES = [
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
];

// 随机选择
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * 随机化HTTP请求头
 * @param {Object} customHeaders
 * @returns {Object}
 */
export function getRandomizedHeaders(customHeaders = {}) {
    // 随机选择用户代理
    const userAgent = randomChoice(USER_AGENTS);
    // 生成Sec-CH-UA
    let secCHUA;
    let secCHUAPlatform = `"Windows"`;

    if (userAgent.includes('Firefox/')) {
        const versionMatch = userAgent.match(/Firefox\/(\d+)/);
        const version = versionMatch ? versionMatch[1] : '120';
        secCHUA = `"Firefox";v="${version}"`;
        // Firefox在macOS
        if (userAgent.includes('Macintosh')) {
            secCHUAPlatform = `"macOS"`;
        }
    } else if (userAgent.includes('Edg/')) {
        // Edge
        const versionMatch = userAgent.match(/Edg\/(\d+)/);
        const version = versionMatch ? versionMatch[1] : '120';
        secCHUA = `"Microsoft Edge";v="${version}", "Chromium";v="${version}", "Not=A?Brand";v="99"`;
    } else if (userAgent.includes('Chrome/')) {
        // Chrome
        const versionMatch = userAgent.match(/Chrome\/(\d+)/);
        const version = versionMatch ? versionMatch[1] : '120';
        secCHUA = `"Chromium";v="${version}", "Google Chrome";v="${version}", "Not=A?Brand";v="99"`;
    } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
        // Safari
        const versionMatch = userAgent.match(/Version\/(\d+)/);
        const version = versionMatch ? versionMatch[1] : '17';
        secCHUA = `"Safari";v="${version}"`;
        secCHUAPlatform = `"macOS"`;
    } else {
        secCHUA = `"Chromium";v="${Math.floor(Math.random() * 10) + 120}", "Google Chrome";v="${Math.floor(Math.random() * 10) + 120}"`;
    }
    const isMobile = userAgent.includes('Mobile') || userAgent.includes('Android');

    // 设置平台
    let platformVersion = `"${Math.floor(Math.random() * 5) + 10}.0.0"`;
    if (userAgent.includes('Mac OS X')) {
        // 提取macOS
        const macOSMatch = userAgent.match(/Mac OS X (\d+_\d+(_\d+)?)/);
        if (macOSMatch) {
            platformVersion = `"${macOSMatch[1].replace(/_/g, '.')}"`;
        } else {
            platformVersion = `"10.15.7"`;
        }
    } else if (userAgent.includes('Android')) {
        const androidMatch = userAgent.match(/Android (\d+)/);
        platformVersion = androidMatch ? `"${androidMatch[1]}.0.0"` : `"11.0.0"`;
    }

    const headers = {
        'User-Agent': userAgent,
        'Accept': randomChoice(ACCEPT_TYPES),
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': Math.random() > 0.5 ? 'no-cache' : 'max-age=0',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Connection': Math.random() > 0.2 ? 'keep-alive' : 'close',
        'Accept-Encoding': Math.random() > 0.5 ? 'gzip, deflate, br' : 'gzip, deflate',
        'Sec-CH-UA-Platform-Version': platformVersion,
        'Sec-CH-UA-Platform': secCHUAPlatform,
        'Sec-CH-UA': secCHUA,
        'Sec-CH-UA-Mobile': isMobile ? '?1' : '?0'
    };

    // 合并
    return {...headers, ...customHeaders};
}

/**
 * 创建TLS随机HTTPS代理
 * @returns {Object}
 */
export function createRandomizedHttpsAgent() {
    // 获取随机化TLS
    const tlsOptions = createRequestTLSOptions();

    // 创建代理
    return new https.Agent({
        ...tlsOptions,
        keepAlive: Math.random() > 0.3, // 70%几率启用keepAlive
        timeout: Math.floor(Math.random() * 5000) + 5000, // 5-10秒超时
        maxSockets: Math.floor(Math.random() * 5) + 5, // 5-10最大并发
        rejectUnauthorized: true
    });
}

/**
 * 创建唯一标识符
 * @returns {String}
 */
export function generateClientId() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * 发送随机HTTP请求
 * @param {String} url - 请求URL
 * @param {Object} options - 请求选项
 * @returns {Promise<Object>} 响应
 */
export async function randomizedFetch(url, options = {}) {
    // 随机化代理
    const agent = options.agent || createRandomizedHttpsAgent();

    // 生成随机头部
    const randomHeaders = getRandomizedHeaders(options.headers || {});

    // 唯一ID
    randomHeaders['X-Client-ID'] = options.clientId || generateClientId();

    const startTime = Date.now();

    try {
        if (options.randomDelay !== false) {
            const delay = Math.floor(Math.random() * 200); // 0-200ms延迟
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // 发送请求
        const response = await fetch(url, {
            ...options,
            headers: randomHeaders,
            agent,
            // 随机化请求超时
            timeout: options.timeout || (10000 + Math.floor(Math.random() * 5000))
        });

        // 记录请求执行时间
        const duration = Date.now() - startTime;
        if (options.debug) {
            console.log(`请求: ${url} - 状态码: ${response.status} - 耗时: ${duration}ms`);
        }

        return response;
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`请求失败 [${duration}ms]: ${url}`, error);
        throw error;
    }
}

/**
 * 随机化请求
 * @param {String} url - 请求URL
 * @param {Object} options - 请求选项
 * @param {Number} retries - 最大重试次数
 * @returns {Promise<Object>} 响应
 */
export async function fetchWithRetry(url, options = {}, retries = 1) {
    let lastError;
    const clientId = generateClientId(); // 重试保持相同ID

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            if (attempt > 0) {
                const delay = Math.min(2 ** attempt * 300, 5000); // 指数退避，5秒
                await new Promise(resolve => setTimeout(resolve, delay));
                console.log(`重试 ${attempt}/${retries}: ${url}`);
            }

            return await randomizedFetch(url, {...options, clientId});
        } catch (error) {
            lastError = error;

            if (error.code === 'ECONNRESET' ||
                error.code === 'ETIMEDOUT' ||
                error.code === 'ECONNREFUSED' ||
                (error.response && error.response.status >= 500)) {
                continue;
            }

            throw error;
        }
    }
    throw lastError;
}

/**
 * 指定域名
 * @param {String} domain - 目标域名
 * @returns {Function}
 */
export function createDomainClient(domain) {
    // 创建持久ID和代理
    const clientId = generateClientId();
    const agent = createRandomizedHttpsAgent();

    return async function (path, options = {}) {
        const url = new URL(path, domain).toString();
        return await randomizedFetch(url, {
            ...options,
            clientId,
            agent
        });
    };
}

/**
 * 初始化全局HTTP
 * @param {Object} globalOptions
 */
export function initializeHttpClient(globalOptions = {}) {
    // 应用TLS配置
    if (globalOptions.applyGlobalTLS !== false) {
        const {applyGlobalTLSConfig} = require('./tlsConfig.mjs');
        applyGlobalTLSConfig();
    }

    // 替换全局fetch
    if (globalOptions.replaceGlobalFetch === true && typeof global.fetch === 'function') {
        global.fetch = async function (url, options) {
            return await randomizedFetch(url, options);
        };
    }

    return {
        fetch: randomizedFetch,
        fetchWithRetry,
        createDomainClient,
        getRandomizedHeaders,
        createRandomizedHttpsAgent,
        generateClientId
    };
}

export default {
    fetch: randomizedFetch,
    fetchWithRetry,
    createDomainClient,
    getRandomizedHeaders,
    createRandomizedHttpsAgent,
    initializeHttpClient
};