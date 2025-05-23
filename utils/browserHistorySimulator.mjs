/**
 * 延时
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 历史记录
 */
class BrowserHistorySimulator {
    /**
     * @param {Object} options 配置
     * @param {string[]} [options.sites] 网站列表
     * @param {number} [options.minVisits] 最少访问
     * @param {number} [options.maxVisits] 最多访问
     * @param {number} [options.visitTimeout] 超时(毫秒)
     * @param {number} [options.visitDelay] 间隔(毫秒)
     * @param {number} [options.errorDelay] 出错延迟(毫秒)
     * @param {boolean} [options.verbose] 输出日志
     * @param {boolean} [options.avoidRepeats] 避免重复访问
     * @param {boolean} [options.useCategories] 使用分类浏览
     */
    constructor(options = {}) {
        const defaultSites = {
            search: [
                "https://www.google.com/",
                "https://www.bing.com/",
                "https://duckduckgo.com/",
                "https://www.yahoo.com/",
                "https://www.yandex.com/",
                "https://www.ecosia.org/"
            ],
            social: [
                "https://www.reddit.com/",
                "https://x.com/",
                "https://www.instagram.com/",
                "https://www.linkedin.com/",
                "https://www.quora.com/",
                "https://www.pinterest.com/"
            ],
            news: [
                "https://www.bbc.com/",
                "https://www.theguardian.com/",
                "https://www.reuters.com/",
                "https://www.nytimes.com/",
                "https://www.bloomberg.com/",
                "https://www.aljazeera.com/",
                "https://apnews.com/",
                "https://www.economist.com/"
            ],
            tech: [
                "https://github.com/",
                "https://stackoverflow.com/",
                "https://news.ycombinator.com/",
                "https://techcrunch.com/",
                "https://www.wired.com/",
                "https://arstechnica.com/",
                "https://www.theverge.com/",
                "https://dev.to/"
            ],
            reference: [
                "https://www.wikipedia.org/",
                "https://archive.org/",
                "https://www.wolframalpha.com/",
                "https://www.britannica.com/",
                "https://www.merriam-webster.com/",
                "https://dictionary.cambridge.org/"
            ],
            education: [
                "https://www.coursera.org/",
                "https://www.edx.org/",
                "https://www.khanacademy.org/",
                "https://www.udemy.com/",
                "https://www.ted.com/",
                "https://ocw.mit.edu/",
                "https://www.codecademy.com/"
            ],
            shopping: [
                "https://www.amazon.com/",
                "https://www.ebay.com/",
                "https://www.etsy.com/",
                "https://www.bestbuy.com/",
                "https://www.target.com/",
                "https://www.ikea.com/",
                "https://www.walmart.com/"
            ],
            entertainment: [
                "https://www.youtube.com/",
                "https://www.twitch.tv/",
                "https://www.netflix.com/",
                "https://open.spotify.com/",
                "https://www.imdb.com/",
                "https://www.goodreads.com/",
                "https://www.rottentomatoes.com/"
            ],
            travel: [
                "https://www.booking.com/",
                "https://www.tripadvisor.com/",
                "https://www.expedia.com/",
                "https://www.airbnb.com/",
                "https://www.kayak.com/",
                "https://www.lonelyplanet.com/"
            ],
            finance: [
                "https://finance.yahoo.com/",
                "https://www.cnbc.com/",
                "https://www.marketwatch.com/",
                "https://www.investopedia.com/",
                "https://www.ft.com/",
                "https://www.wsj.com/"
            ],
            misc: [
                "https://www.weather.com/",
                "https://www.allrecipes.com/",
                "https://www.healthline.com/",
                "https://www.nationalgeographic.com/",
                "https://translate.google.com/",
                "https://www.webmd.com/",
                "https://openai.com/",
                "https://www.who.int/"
            ]
        };
        const allSites = [];
        for (const category in defaultSites) {
            for (const site of defaultSites[category]) {
                allSites.push({
                    url: site,
                    category: category
                });
            }
        }
        // 初始化
        this.sitesByCategory = options.sitesByCategory || defaultSites;
        this.sites = options.sites || allSites.map(site => site.url);
        this.siteData = options.siteData || allSites;
        this.minVisits = options.minVisits || 1;
        this.maxVisits = options.maxVisits || 2;
        this.visitTimeout = options.visitTimeout || 15000;
        this.visitDelay = options.visitDelay || 1500;
        this.errorDelay = options.errorDelay || 500;
        this.verbose = options.verbose || false;
        this.avoidRepeats = options.avoidRepeats !== undefined ? options.avoidRepeats : true;
        this.useCategories = options.useCategories !== undefined ? options.useCategories : false;
        this.sessionData = new Map(); // 追踪访问记录
    }

    /**
     * 随机访问
     * @returns {number}
     */
    getRandomVisitCount() {
        return Math.floor(Math.random() * (this.maxVisits - this.minVisits + 1)) + this.minVisits;
    }

    /**
     * 随机网站
     * @param {string} sessionId
     * @returns {string}
     */
    getRandomSite(sessionId) {
        if (!this.avoidRepeats || !sessionId) {
            return this.sites[Math.floor(Math.random() * this.sites.length)];
        }
        if (!this.sessionData.has(sessionId)) {
            this.sessionData.set(sessionId, {
                visitedSites: new Set(),
                lastCategory: null,
                categoryVisitCount: {}
            });
        }
        const sessionInfo = this.sessionData.get(sessionId);
        if (sessionInfo.visitedSites.size >= this.sites.length) {
            sessionInfo.visitedSites.clear();
        }

        if (this.useCategories && sessionInfo.lastCategory && Math.random() < 0.7) {
            // 70%概率继续浏览同一类别
            return this._getRandomSiteFromCategory(sessionInfo.lastCategory, sessionInfo.visitedSites, sessionId);
        }

        const availableSites = this.sites.filter(site => !sessionInfo.visitedSites.has(site));
        if (availableSites.length === 0) {
            sessionInfo.visitedSites.clear();
            return this.sites[Math.floor(Math.random() * this.sites.length)];
        }

        return availableSites[Math.floor(Math.random() * availableSites.length)];
    }

    /**
     * 从指定分类中获取随机网站
     * @param {string} category - 分类名称
     * @param {Set<string>} visitedSites
     * @param {string} sessionId - 会话ID
     * @returns {string}
     * @private
     */
    _getRandomSiteFromCategory(category, visitedSites, sessionId) {
        if (!this.sitesByCategory[category]) {
            return this.getRandomSite(sessionId);
        }

        const sitesInCategory = this.sitesByCategory[category];
        const availableSites = sitesInCategory.filter(site => !visitedSites.has(site));

        if (availableSites.length === 0) {
            const categories = Object.keys(this.sitesByCategory).filter(cat => {
                return cat !== category && this.sitesByCategory[cat] && this.sitesByCategory[cat].length > 0;
            });

            if (categories.length === 0) {
                return this.getRandomSite(sessionId);
            }

            const newCategory = categories[Math.floor(Math.random() * categories.length)];
            return this._getRandomSiteFromCategory(newCategory, visitedSites, sessionId);
        }

        return availableSites[Math.floor(Math.random() * availableSites.length)];
    }

    /**
     * 更新站点访问
     * @param {string} sessionId 会话标识
     * @param {string} site 访问的网站
     * @private
     */
    _recordVisit(sessionId, site) {
        if (!sessionId || !this.avoidRepeats) return;

        const sessionInfo = this.sessionData.get(sessionId);
        if (!sessionInfo) return;

        // 记录访问
        sessionInfo.visitedSites.add(site);

        // 更新分类信息
        if (this.useCategories) {
            const siteData = this.siteData.find(s => s.url === site);
            if (siteData && siteData.category) {
                sessionInfo.lastCategory = siteData.category;
                sessionInfo.categoryVisitCount[siteData.category] =
                    (sessionInfo.categoryVisitCount[siteData.category] || 0) + 1;
            }
        }
    }

    /**
     * 清除会话
     * @param {string} sessionId
     */
    clearSessionData(sessionId) {
        if (sessionId) {
            this.sessionData.delete(sessionId);
        } else {
            this.sessionData.clear();
        }
    }

    /**
     * 模拟浏览历史
     * @param {Object} page - 浏览器页面
     * @param {string} username - 用户标识
     * @param {Object} options
     * @param {number} [options.visits] 指定访问次数，覆盖随机
     * @param {boolean} [options.resetHistory] 是否重置访问历史
     * @returns {Promise<boolean>}
     */
    async simulateHistory(page, username = '', options = {}) {
        if (process.env.ENABLE_FAKE_HISTORY !== 'true') {
            return true;
        }

        const sessionId = username || `session_${Math.random().toString(36).substring(2, 10)}`;

        if (options.resetHistory) {
            this.clearSessionData(sessionId);
        }

        const visits = options.visits !== undefined ? options.visits : this.getRandomVisitCount();
        console.log(`[${sessionId}] Simulating ${visits} website visits...`);

        let allSuccessful = true;
        let successfulVisits = 0;

        for (let i = 0; i < visits; i++) {
            const site = this.getRandomSite(sessionId);
            try {
                if (page.isClosed()) {
                    console.error(`[${sessionId}] Page closed before visiting ${site}`);
                    break;
                }
                await page.goto(site, {
                    waitUntil: 'networkidle2',
                    timeout: this.visitTimeout
                });

                this._recordVisit(sessionId, site);
                successfulVisits++;

                console.log(`[${sessionId}] Successfully visited: ${site}`);

                if (!page.isClosed() && Math.random() > 0.5) {
                    await this._performRandomInteraction(page);
                }

                await sleep(this.visitDelay);

            } catch (error) {
                console.error(`[${sessionId}] Error visiting ${site}: ${error.message}`);

                if (page.isClosed() ||
                    error.message.includes("Target closed") ||
                    error.message.includes("Page closed") ||
                    error.message.includes("detached Frame") ||
                    error.message.includes("Execution context was destroyed")) {
                    console.error(`Page closed/detached or context destroyed during history simulation: ${error.message}`);
                    break;
                } else {
                    allSuccessful = false;
                    await sleep(this.errorDelay);
                }
            }
        }
        await sleep(3000);
        console.log(`[${sessionId}] History simulation finished: ${successfulVisits}/${visits} successful`);
        return allSuccessful;
    }

    /**
     * 随机页面
     * @param {Object} page
     * @returns {Promise<void>}
     * @private
     */
    async _performRandomInteraction(page) {
        try {
            const interaction = Math.floor(Math.random() * 5);

            switch (interaction) {
                case 0: // 滚动
                    await page.evaluate(() => {
                        window.scrollTo({
                            top: Math.random() * document.body.scrollHeight * 0.7,
                            behavior: 'smooth'
                        });
                    });
                    await sleep(800 + Math.random() * 1000);
                    break;

                case 1: // 随机点击
                    await page.evaluate(() => {
                        const links = Array.from(document.querySelectorAll('a'));
                        if (links.length > 0) {
                            const randomLink = links[Math.floor(Math.random() * links.length)];
                            const hoverEvent = new MouseEvent('mouseover', {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            });
                            randomLink.dispatchEvent(hoverEvent);
                        }
                    });
                    await sleep(500 + Math.random() * 500);
                    break;

                case 2: // 复杂滚动
                    await page.evaluate(() => {
                        window.scrollTo({
                            top: document.body.scrollHeight * 0.3,
                            behavior: 'smooth'
                        });
                        setTimeout(() => {
                            window.scrollTo({
                                top: document.body.scrollHeight * 0.6,
                                behavior: 'smooth'
                            });
                        }, 800);
                    });
                    await sleep(2000);
                    break;

                case 3: // 改变窗口
                    const width = 1100 + Math.floor(Math.random() * 300);
                    const height = 700 + Math.floor(Math.random() * 300);
                    await page.setViewport({width, height});
                    await sleep(800);
                    break;

                case 4: // 随机选中
                    await page.evaluate(() => {
                        const textElements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, span, div'))
                            .filter(el => el.textContent.trim().length > 20);

                        if (textElements.length > 0) {
                            const randomElement = textElements[Math.floor(Math.random() * textElements.length)];
                            const selection = window.getSelection();
                            const range = document.createRange();

                            const text = randomElement.textContent;
                            const start = Math.floor(Math.random() * (text.length / 2));
                            const end = start + Math.floor(Math.random() * (text.length - start - 1)) + 1;

                            try {
                                if (randomElement.firstChild) {
                                    range.setStart(randomElement.firstChild, start);
                                    range.setEnd(randomElement.firstChild, end);
                                    selection.removeAllRanges();
                                    selection.addRange(range);
                                }
                            } catch (e) {
                            }
                        }
                    });
                    await sleep(1200);
                    break;
            }
        } catch (error) {
            console.log(`Random interaction failed: ${error.message}`);
        }
    }

    /**
     * 统计信息
     * @param {string} sessionId
     * @returns {Object|null}
     */
    getSessionStats(sessionId) {
        if (!sessionId || !this.sessionData.has(sessionId)) {
            return null;
        }

        const sessionInfo = this.sessionData.get(sessionId);
        return {
            totalVisitedSites: sessionInfo.visitedSites.size,
            visitedSites: Array.from(sessionInfo.visitedSites),
            lastCategory: sessionInfo.lastCategory,
            categoryStats: sessionInfo.categoryVisitCount
        };
    }
}

export const browserHistorySimulator = new BrowserHistorySimulator();
export {BrowserHistorySimulator};

/**
 * 自定义配置
 * @param {Object} options 配置
 * @returns {BrowserHistorySimulator} 实例
 */
export function createHistorySimulator(options = {}) {
    return new BrowserHistorySimulator(options);
}