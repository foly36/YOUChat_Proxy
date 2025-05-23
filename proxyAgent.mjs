import {SocksProxyAgent} from 'socks-proxy-agent';
import HttpsProxyAgent from 'https-proxy-agent';
import {URL} from 'url';
import http from 'http';
import https from 'https';
import {applyGlobalTLSConfig, createRequestTLSOptions} from './utils/tlsConfig.mjs';

const tlsConfig = applyGlobalTLSConfig();

let globalProxyAgent = null;

/**
 * 获取代理URL
 * @returns {string|null}
 */
function getProxyUrl() {
    const proxyUrl = process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY;
    return proxyUrl ? proxyUrl.trim() : null;
}

/**
 * 解析代理URL
 * @param {string} proxyUrl
 * @returns {object|null}
 */
function parseProxyUrl(proxyUrl) {
    if (!proxyUrl) return null;

    try {
        let protocol, host, port, username, password;
        if (proxyUrl.startsWith('socks5://')) {
            protocol = 'socks5';

            // 移除协议前缀
            const urlWithoutProtocol = proxyUrl.substring(9);

            // 检查认证信息(@符号)
            const atIndex = urlWithoutProtocol.lastIndexOf('@');

            if (atIndex !== -1) {
                // 含认证: username:password@host:port
                const authPart = urlWithoutProtocol.substring(0, atIndex);
                const hostPart = urlWithoutProtocol.substring(atIndex + 1);

                // 解析认证
                const authDivider = authPart.indexOf(':');
                if (authDivider === -1) {
                    console.error('Authentication format error, should be username:password');
                }

                username = authPart.substring(0, authDivider);
                password = authPart.substring(authDivider + 1);

                // 解析主机
                const hostDivider = hostPart.indexOf(':');
                if (hostDivider === -1) {
                    console.error('Host format error, should be host:port');
                }

                host = hostPart.substring(0, hostDivider);
                port = hostPart.substring(hostDivider + 1);
            } else {
                // 无认证信息: host:port
                const hostDivider = urlWithoutProtocol.indexOf(':');
                if (hostDivider === -1) {
                    console.error('Host format error, should be host:port');
                }

                host = urlWithoutProtocol.substring(0, hostDivider);
                port = urlWithoutProtocol.substring(hostDivider + 1);
            }

            // 验证解析结果
            if (!host || !port) {
                console.error('Hostname and port must be provided');
            }
        } else {
            const url = new URL(proxyUrl);
            protocol = url.protocol.replace(':', '');
            host = url.hostname;
            port = url.port;
            username = url.username || null;
            password = url.password || null;
        }

        return {protocol, host, port, username, password};
    } catch (error) {
        const errorObj = {
            source: 'parseProxyUrl',
            message: `Invalid proxy URL format [${proxyUrl}]: ${error.message}`,
            originalError: error
        };
        console.error(errorObj.message);
    }
}

/**
 * 创建代理
 * @returns {Agent|null}
 */
function createProxyAgent() {
    const proxyUrl = getProxyUrl();
    if (!proxyUrl) {
        console.log('Proxy environment variable not set, will not use proxy.');
        return null;
    }

    try {
        const parsedProxy = parseProxyUrl(proxyUrl);

        if (!parsedProxy) {
            console.error('Failed to parse proxy URL');
            return null;
        }

        console.log(`Using proxy: ${proxyUrl} (${parsedProxy.protocol})`);

        // 获取随机TLS
        const tlsOptions = createRequestTLSOptions();

        if (parsedProxy.protocol === 'socks5') {
            console.log('Using SOCKS5 proxy with TLS 1.3');

            const socksConfig = {
                hostname: parsedProxy.host,
                port: parsedProxy.port,
                protocol: 'socks5:',
                tls: {
                    ...tlsOptions,
                    rejectUnauthorized: true // Verify server certificate
                }
            };

            if (parsedProxy.username && parsedProxy.password) {
                socksConfig.userId = parsedProxy.username;
                socksConfig.password = parsedProxy.password;
            }

            return new SocksProxyAgent(socksConfig);
        } else {
            console.log('Using HTTP/HTTPS proxy with TLS 1.3');
            return new HttpsProxyAgent.HttpsProxyAgent(proxyUrl, {
                ...tlsOptions,
                rejectUnauthorized: true
            });
        }
    } catch (error) {
        console.error(`Failed to create proxy agent: ${error.message}`);
        return null;
    }
}

/**
 * 设置全局代理
 */
export function setGlobalProxy() {
    const proxyUrl = getProxyUrl();
    if (proxyUrl) {
        try {
            globalProxyAgent = createProxyAgent();

            if (!globalProxyAgent) {
                return;
            }

            const originalHttpRequest = http.request;
            const originalHttpsRequest = https.request;

            http.request = function (options, callback) {
                if (typeof options === 'string') {
                    options = new URL(options);
                }
                options.agent = globalProxyAgent;
                return originalHttpRequest.call(this, options, callback);
            };

            https.request = function (options, callback) {
                if (typeof options === 'string') {
                    options = new URL(options);
                }

                // 获取新随机TLS
                const requestTlsConfig = createRequestTLSOptions();

                // 应用TLS配置
                options.minVersion = requestTlsConfig.minVersion;
                options.maxVersion = requestTlsConfig.maxVersion;
                options.ciphers = requestTlsConfig.ciphers;
                options.honorCipherOrder = requestTlsConfig.honorCipherOrder;
                options.secureOptions = requestTlsConfig.secureOptions;

                // 设置代理
                options.agent = globalProxyAgent;

                return originalHttpsRequest.call(this, options, callback);
            };

            console.log(`Global proxy set: ${proxyUrl} TLS 1.3`);
        } catch (error) {
            console.error(`Error setting global proxy: ${error.message}`);
        }
    } else {
        console.log('Proxy environment variable not set, using direct connection with TLS 1.3 security enabled');

        const originalHttpsRequest = https.request;

        https.request = function (options, callback) {
            if (typeof options === 'string') {
                options = new URL(options);
            }

            // 获取新随机TLS
            const requestTlsConfig = createRequestTLSOptions();

            // 应用TLS
            options.minVersion = requestTlsConfig.minVersion;
            options.maxVersion = requestTlsConfig.maxVersion;
            options.ciphers = requestTlsConfig.ciphers;
            options.honorCipherOrder = requestTlsConfig.honorCipherOrder;
            options.secureOptions = requestTlsConfig.secureOptions;

            return originalHttpsRequest.call(this, options, callback);
        };
    }
}

/**
 * 设置代理环境变量
 */
export function setProxyEnvironmentVariables() {
    const proxyUrl = getProxyUrl();
    if (proxyUrl) {
        process.env.HTTP_PROXY = proxyUrl;
        process.env.HTTPS_PROXY = proxyUrl;
        console.log(`Proxy environment variables set to: ${proxyUrl}`);
    }
}

// 全局代理
setGlobalProxy();

// 导出TLS
export {tlsConfig, applyGlobalTLSConfig};
