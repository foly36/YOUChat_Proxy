import crypto from 'crypto';
import fingerprintManager from './fingerprintManager.mjs';
import {setupBrowserFingerprint} from './browserFingerprint.mjs';
import {createRequestTLSOptions} from './tlsConfig.mjs';
import {optimizeBrowserDisplay} from './browserDisplayFixer.mjs';
import {launchEdgeBrowser} from './edgeLauncher.mjs';

const isHeadless = process.env.HEADLESS_BROWSER === 'true' && process.env.USE_MANUAL_LOGIN !== 'true';
const MAX_RETRIES = parseInt(process.env.BROWSER_LAUNCH_RETRIES || '3', 10);

/**
 * 浏览器工厂
 */
class BrowserFactory {
    constructor() {
        this.initialized = false;
        this.initializing = false;
        this.puppeteerModule = null;
        this.connect = null;
        this.initPromise = null;
        this.initError = null;
        this.lastInitAttempt = 0;
    }

    async ensureInitialized() {
        if (this.initialized) return;

        const now = Date.now();
        if (this.initError && now - this.lastInitAttempt < 5000) {
            throw this.initError;
        }

        return this.initialize();
    }

    /**
     * 初始化
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) return;
        if (this.initializing) {
            return this.initPromise;
        }
        this.initializing = true;
        this.lastInitAttempt = Date.now();

        this.initPromise = (async () => {
            try {
                // 动态导入puppeteer模块
                if (isHeadless === false) {
                    // 使用real-browser
                    const puppeteerRealBrowser = await import('puppeteer-real-browser');
                    this.puppeteerModule = puppeteerRealBrowser;
                    this.connect = puppeteerRealBrowser.connect;
                } else {
                    // 使用puppeteer-core
                    this.puppeteerModule = await import('puppeteer-core');
                }

                this.initialized = true;
                this.initializing = false;
                this.initError = null;
            } catch (error) {
                this.initializing = false;
                this.initError = error;
                console.error('Factory initialization failed:', error);
                throw error;
            }
        })();

        return this.initPromise;
    }

    /**
     * 检查
     * @private
     */
    _checkInitialized() {
        if (!this.initialized) {
            throw new Error('Browser factory has not been initialized yet');
        }
    }

    /**
     * 创建实例
     * @param {String} browserId 浏览器ID
     * @param {String} userDataDir 目录
     * @param {String} browserPath 可执行文件路径
     * @param {Number} retryCount 当前重试次数
     * @returns {Promise<Object>} 实例
     */
    async createBrowser(browserId, userDataDir, browserPath, retryCount = 0) {
        await this.ensureInitialized();
        if (retryCount >= MAX_RETRIES) {
            throw new Error(`Failed to create browser instance, maximum retries reached (${MAX_RETRIES})`);
        }

        // 输入验证
        if (!browserId || typeof browserId !== 'string') {
            throw new Error(`Invalid browserId: ${browserId}`);
        }

        if (!userDataDir || typeof userDataDir !== 'string') {
            throw new Error(`Invalid userDataDir: ${userDataDir}`);
        }

        if (!browserPath || typeof browserPath !== 'string') {
            throw new Error(`Invalid browserPath: ${browserPath}`);
        }

        // 检测Edge
        const isEdge = browserPath.toLowerCase().includes('msedge') ||
            process.env.BROWSER_TYPE === 'edge';

        let browser, page;

        try {
            // 获取指纹和TLS
            const browserType = isEdge ? 'edge' : 'chrome';
            const fingerprint = fingerprintManager.getInstanceFingerprint(browserId, {
                browserType,
                noiseLevel: ['medium', 'high'][Math.floor(Math.random() * 2)],
                consistencyLevel: 'high'
            });

            // 获取TLS
            const tlsConfig = createRequestTLSOptions();
            console.log(`Browser instance ${browserId} applying TLS config [${tlsConfig.ciphers.substring(0, 20)}...]`);

            if (isEdge) {
                try {
                    const debugPort = 9222 + parseInt(browserId.replace('browser_', ''), 10);
                    const result = await launchEdgeBrowser(userDataDir, browserPath, debugPort);
                    browser = result.browser;
                    page = result.page;
                    console.log(`Edge browser launched successfully (browserId=${browserId})`);
                } catch (error) {
                    console.error(`Native Edge launch failed:`, error);
                    console.log(`Falling back to standard browser launch...`);
                }
            }
            if (!browser) {
                if (isHeadless === false) {
                    // 使用puppeteer-real-browser
                    const response = await this.connect({
                        headless: 'auto',
                        turnstile: true,
                        customConfig: this._getBrowserLaunchConfig(userDataDir, browserPath)
                    });
                    browser = response.browser;
                    page = response.page;
                } else {
                    // 使用puppeteer-core
                    browser = await this.puppeteerModule.launch({
                        headless: isHeadless,
                        executablePath: browserPath,
                        userDataDir: userDataDir,
                        ...this._getBrowserLaunchConfig(userDataDir, browserPath)
                    });
                    page = await browser.newPage();
                }
            }

            browser.on('disconnected', () => {
                console.warn(`Browser instance ${browserId} disconnected`);
            });
            try {
                console.log(`Applying browser fingerprint for ${browserId}...`);
                await setupBrowserFingerprint(page, fingerprint);
            } catch (error) {
                console.error(`Error applying fingerprint:`, error);
            }
            // 优化显示
            await this._optimizeDisplay(page, isHeadless);
            // 生成指纹ID
            const fingerprintId = fingerprint.seed?.substring(0, 8) ||
                crypto.createHash('md5').update(fingerprint.userAgent).digest('hex').substring(0, 8);

            console.log(`Browser instance ${browserId} initialized successfully [ID: ${fingerprintId}]`);

            return {
                id: browserId,
                browser,
                page,
                locked: false,
                isEdgeBrowser: isEdge,
                fingerprint,
                fingerprintId,
                tlsConfig,
                lastFingerprintUpdate: Date.now(),
                userDataDir,
                browserPath
            };
        } catch (error) {
            console.error(`Failed to create browser instance ${browserId} (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);
            try {
                if (page && !page.isClosed()) {
                    await page.close().catch(() => {});
                }
                if (browser) {
                    await browser.close().catch(() => {});
                }
            } catch (cleanupError) {
                console.error(`Error cleaning up resources:`, cleanupError);
            }

            const delay = Math.floor(Math.random() * 1000) + 1000 * (retryCount + 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.createBrowser(browserId, userDataDir, browserPath, retryCount + 1);
        }
    }

    /**
     * 获取启动配置
     * @private
     * @param {String} userDataDir
     * @param {String} browserPath
     * @returns {Object}
     */
    _getBrowserLaunchConfig(userDataDir, browserPath) {
        return {
            userDataDir,
            executablePath: browserPath,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--window-size=1280,850',
                '--force-device-scale-factor=1',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-site-isolation-trials',
                '--disable-web-security',
                '--disable-blink-features=AutomationControlled',
                '--disable-component-update',
                isHeadless ? '--disable-gpu' : '',
                isHeadless ? '--disable-dev-shm-usage' : '',
            ].filter(Boolean),
            ignoreDefaultArgs: ['--enable-automation'],
        };
    }

    /**
     * 优化显示
     * @private
     * @param {Object} page
     * @param {Boolean} isHeadless
     */
    async _optimizeDisplay(page, isHeadless) {
        try {
            await optimizeBrowserDisplay(page, {
                width: 1280,
                height: 850,
                deviceScaleFactor: 1,
                cssScale: 1,
                fixHighDpi: true,
                isHeadless
            });
        } catch (error) {
            console.warn(`Display optimization failed:`, error);
        }
    }

    /**
     * 更新指纹
     * @param {Object} browserInstance
     * @returns {Promise<Object>}
     */
    async updateBrowserFingerprint(browserInstance) {
        this._checkInitialized();
        if (!browserInstance || !browserInstance.page) {
            console.warn(`Cannot update fingerprint: Invalid browser instance`);
            return browserInstance;
        }

        try {
            // 获取新指纹
            const newFingerprint = fingerprintManager.rotateInstanceFingerprint(browserInstance.id, {
                browserType: browserInstance.isEdgeBrowser ? 'edge' : 'chrome'
            });

            await setupBrowserFingerprint(browserInstance.page, newFingerprint);
            // 更新实例
            browserInstance.fingerprint = newFingerprint;
            browserInstance.lastFingerprintUpdate = Date.now();
            browserInstance.fingerprintId = newFingerprint.seed?.substring(0, 8) ||
                crypto.createHash('md5').update(newFingerprint.userAgent).digest('hex').substring(0, 8);

            console.log(`Browser instance ${browserInstance.id} fingerprint updated [ID: ${browserInstance.fingerprintId}]`);
        } catch (error) {
            console.error(`Failed to update fingerprint:`, error);
        }
        return browserInstance;
    }

    /**
     * 关闭浏览器并清理
     * @param {Object} instance - 浏览器实例
     * @param {boolean} restart - 是否重启
     * @returns {Promise<Object|null>}
     */
    async closeBrowserInstance(instance, restart = false) {
        if (!instance || !instance.browser) {
            return restart ? this.createBrowser(instance.id, instance.userDataDir, instance.browserPath) : null;
        }

        let newInstance = null;
        try {
            const {id, userDataDir, browserPath} = instance;
            if (instance.page && !instance.page.isClosed()) {
                await instance.page.close().catch(err => console.error(`Error closing page: ${err.message}`));
            }
            await instance.browser.close().catch(err => console.error(`Error closing browser: ${err.message}`));
            console.log(`Browser instance ${id} closed`);

            if (restart && id && userDataDir && browserPath) {
                await new Promise(r => setTimeout(r, 1000));
                newInstance = await this.createBrowser(id, userDataDir, browserPath);
                console.log(`Browser instance ${id} restarted`);
            }
        } catch (error) {
            console.error(`Error closing/restarting browser instance:`, error);
        }

        return newInstance;
    }

    /**
     * 关闭所有浏览器
     * @param {Array} instances 实例数组
     * @param {boolean} restart 是否重启
     * @returns {Promise<Array>}
     */
    async closeAllBrowsers(instances, restart = false) {
        if (!instances || !Array.isArray(instances) || instances.length === 0) {
            return [];
        }
        // 并行关闭
        const promises = instances.map(instance => this.closeBrowserInstance(instance, restart));
        const results = await Promise.allSettled(promises);

        if (global.gc) {
            global.gc();
        }
        if (restart) {
            return results
                .filter(r => r.status === 'fulfilled' && r.value)
                .map(r => r.value);
        }
        return [];
    }

    /**
     * 重启特定浏览器
     * @param {Object} instance
     * @returns {Promise<Object>}
     */
    async restartBrowser(instance) {
        if (!instance || !instance.id) {
            throw new Error('Invalid browser instance');
        }
        return await this.closeBrowserInstance(instance, true);
    }
}

const browserFactoryInstance = new BrowserFactory();

export default browserFactoryInstance;