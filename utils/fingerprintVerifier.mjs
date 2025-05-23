/**
 * 测试指纹
 * @param {Object} page - Puppeteer
 * @returns {Promise<Object>}
 */
export async function testFingerprintConsistency(page) {
    try {
        const fp1 = await collectFingerprint(page);
        await page.reload();
        await page.waitForTimeout(1000);
        const fp2 = await collectFingerprint(page);
        const comparison = compareFingerprints(fp1, fp2);
        return {
            consistent: comparison.match,
            details: comparison.details,
            firstFingerprint: fp1,
            secondFingerprint: fp2
        };
    } catch (error) {
        console.error('指纹一致性测试失败:', error);
        return {
            consistent: false,
            error: error.message
        };
    }
}

/**
 * 收集页面指纹
 * @param {Object} page - Puppeteer页面
 * @returns {Promise<Object>} 指纹
 */
async function collectFingerprint(page) {
    return await page.evaluate(() => {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            languages: Array.from(navigator.languages || []),
            language: navigator.language,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory,
            doNotTrack: navigator.doNotTrack,
            maxTouchPoints: navigator.maxTouchPoints,
            webgl: (() => {
                try {
                    const canvas = document.createElement('canvas');
                    const gl = canvas.getContext('webgl');
                    if (!gl) return null;

                    const basicInfo = {
                        vendor: gl.getParameter(gl.VENDOR),
                        renderer: gl.getParameter(gl.RENDERER)
                    };

                    try {
                        // Firefox
                        const ext = gl.getExtension('WEBGL_debug_renderer_info');
                        if (ext) {
                            return {
                                ...basicInfo,
                                unmaskedVendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL),
                                unmaskedRenderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
                            };
                        } else {
                            return {
                                ...basicInfo,
                                unmaskedVendor: gl.getParameter(gl.getParameter(0x9245)),
                                unmaskedRenderer: gl.getParameter(gl.getParameter(0x9246))
                            };
                        }
                    } catch (e) {
                        return basicInfo;
                    }
                } catch (e) {
                    return null;
                }
            })(),
            canvas: (() => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = 200;
                    canvas.height = 50;
                    const ctx = canvas.getContext('2d');
                    ctx.textBaseline = "top";
                    ctx.font = "14px Arial";
                    ctx.fillStyle = "rgba(100, 200, 150, 0.8)";
                    ctx.fillText("Canvas Fingerprint Test", 10, 10);
                    ctx.fillStyle = "rgba(200, 100, 250, 0.5)";
                    ctx.fillText("Testing...", 10, 30);
                    return canvas.toDataURL();
                } catch (e) {
                    return null;
                }
            })(),
            plugins: (() => {
                if (!navigator.plugins) return [];
                return Array.from(navigator.plugins).map(p => ({
                    name: p.name,
                    filename: p.filename,
                    description: p.description
                }));
            })(),
            screenInfo: {
                width: window.screen.width,
                height: window.screen.height,
                availWidth: window.screen.availWidth,
                availHeight: window.screen.availHeight,
                colorDepth: window.screen.colorDepth,
                pixelDepth: window.screen.pixelDepth
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            userAgentData: navigator.userAgentData ? {
                platform: navigator.userAgentData.platform,
                mobile: navigator.userAgentData.mobile,
                brands: Array.from(navigator.userAgentData.brands || [])
            } : null
        };
    });
}

/**
 * 比较
 * @param {Object} fp1
 * @param {Object} fp2
 * @returns {Object}
 */
function compareFingerprints(fp1, fp2) {
    const details = {};
    let matchCount = 0;
    let totalChecks = 0;

    const basicProps = ['userAgent', 'platform', 'language', 'hardwareConcurrency',
        'deviceMemory', 'doNotTrack', 'maxTouchPoints', 'timezone'];
    basicProps.forEach(prop => {
        totalChecks++;
        details[prop] = {
            match: fp1[prop] === fp2[prop],
            value1: fp1[prop],
            value2: fp2[prop]
        };
        if (details[prop].match) matchCount++;
    });

    const arrayProps = ['languages'];
    arrayProps.forEach(prop => {
        totalChecks++;
        details[prop] = {
            match: Array.isArray(fp1[prop]) && Array.isArray(fp2[prop]) &&
                fp1[prop].length === fp2[prop].length &&
                fp1[prop].every((v, i) => v === fp2[prop][i]),
            value1: fp1[prop],
            value2: fp2[prop]
        };
        if (details[prop].match) matchCount++;
    });

    if (fp1.canvas && fp2.canvas) {
        totalChecks++;
        const canvasMatch = fp1.canvas === fp2.canvas;
        details.canvas = {
            match: !canvasMatch,
            protection: !canvasMatch ? 'Working' : 'Not Working',
            value1: fp1.canvas.substring(0, 50) + '...',
            value2: fp2.canvas.substring(0, 50) + '...'
        };
        if (!canvasMatch) matchCount++;
    }
    if (fp1.webgl && fp2.webgl) {
        totalChecks++;
        details.webgl = {
            match: fp1.webgl.unmaskedVendor === fp2.webgl.unmaskedVendor &&
                fp1.webgl.unmaskedRenderer === fp2.webgl.unmaskedRenderer,
            value1: {
                vendor: fp1.webgl.vendor,
                renderer: fp1.webgl.renderer,
                unmaskedVendor: fp1.webgl.unmaskedVendor,
                unmaskedRenderer: fp1.webgl.unmaskedRenderer
            },
            value2: {
                vendor: fp2.webgl.vendor,
                renderer: fp2.webgl.renderer,
                unmaskedVendor: fp2.webgl.unmaskedVendor,
                unmaskedRenderer: fp2.webgl.unmaskedRenderer
            }
        };
        if (details.webgl.match) matchCount++;
    }
    const matchPercentage = totalChecks > 0 ? (matchCount / totalChecks) * 100 : 0;

    return {
        match: matchPercentage >= 90, // 至少90%匹配
        matchPercentage,
        details
    };
}

/**
 * 测试Canvas
 * @param {Object} page - Puppeteer页面
 * @returns {Promise<Object>}
 */
export async function testCanvasFingerprint(page) {
    try {
        const results = await page.evaluate(() => {
            const drawCanvas = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 200;
                canvas.height = 50;
                const ctx = canvas.getContext('2d');
                ctx.textBaseline = "top";
                ctx.font = "14px Arial";
                ctx.fillStyle = "#FF6600";
                ctx.fillRect(0, 0, 150, 10);
                ctx.fillStyle = "#006600";
                ctx.fillText("Canvas Test: " + new Date().toISOString(), 2, 15);
                ctx.fillStyle = "#0066FF";
                ctx.fillText("Protection Check", 2, 30);
                ctx.strokeStyle = "#000";
                ctx.strokeRect(0, 0, 200, 50);

                return canvas.toDataURL();
            };
            const samples = [];
            for (let i = 0; i < 5; i++) {
                samples.push(drawCanvas());
            }

            return samples;
        });
        // 分析结果
        const allEqual = results.every(r => r === results[0]);
        const differentCount = new Set(results).size;

        return {
            protected: !allEqual,
            differentCount,
            samples: results.map(s => s.substring(0, 50) + '...')
        };
    } catch (error) {
        console.error('Canvas指纹测试失败:', error);
        return {
            protected: false,
            error: error.message
        };
    }
}

/**
 * 测试WebRTC保护
 * @param {Object} page - Puppeteer页面
 * @returns {Promise<Object>}
 */
export async function testWebRTCProtection(page) {
    try {
        return await page.evaluate(() => {
            return new Promise(resolve => {
                // 设置超时
                const timeout = setTimeout(() => {
                    resolve({
                        protected: true,
                        reason: 'No WebRTC or collection prevented'
                    });
                }, 5000);

                let ips = [];
                try {
                    if (!window.RTCPeerConnection) {
                        clearTimeout(timeout);
                        return resolve({
                            protected: true,
                            reason: 'WebRTC not available'
                        });
                    }

                    const pc = new RTCPeerConnection({
                        iceServers: [{urls: 'stun:stun.l.google.com:19302'}]
                    });

                    pc.createDataChannel('');

                    pc.onicecandidate = (e) => {
                        if (!e.candidate) return;

                        // 提取IP地址
                        const match = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(e.candidate.candidate);
                        if (match) {
                            const ip = match[1];
                            if (!ips.includes(ip)) ips.push(ip);
                        }
                    };

                    pc.onsignalingstatechange = () => {
                        if (pc.signalingState === 'closed') {
                            clearTimeout(timeout);
                            resolve({
                                protected: ips.length === 0 || (ips.length === 1 && ips[0] === '0.0.0.0'),
                                collectedIPs: ips
                            });
                        }
                    };
                    // 创建offer
                    pc.createOffer()
                        .then(offer => pc.setLocalDescription(offer))
                        .catch(() => {
                            clearTimeout(timeout);
                            resolve({
                                protected: true,
                                reason: 'WebRTC offer creation prevented'
                            });
                        });
                    setTimeout(() => {
                        clearTimeout(timeout);
                        pc.close();
                        resolve({
                            protected: ips.length === 0 || (ips.length === 1 && ips[0] === '0.0.0.0'),
                            collectedIPs: ips
                        });
                    }, 3000);

                } catch (error) {
                    clearTimeout(timeout);
                    resolve({
                        protected: true,
                        reason: `WebRTC error prevented access: ${error.message}`
                    });
                }
            });
        });
    } catch (error) {
        console.error('WebRTC保护测试失败:', error);
        return {
            protected: false,
            error: error.message
        };
    }
}

/**
 * 运行完整指纹保护测试
 * @param {Object} page - Puppeteer页面
 * @returns {Promise<Object>}
 */
export async function runFingerprintProtectionTests(page) {
    console.log('指纹保护测试...');

    const results = {
        timestamp: new Date().toISOString(),
        tests: {}
    };

    try {
        console.log('测试指纹一致性...');
        results.tests.consistency = await testFingerprintConsistency(page);
        console.log('测试Canvas指纹保护...');
        results.tests.canvas = await testCanvasFingerprint(page);
        console.log('测试WebRTC保护...');
        results.tests.webrtc = await testWebRTCProtection(page);
        let passedTests = 0;
        let totalTests = 0;

        if (results.tests.consistency) {
            totalTests++;
            if (results.tests.consistency.consistent) passedTests++;
        }

        if (results.tests.canvas) {
            totalTests++;
            if (results.tests.canvas.protected) passedTests++;
        }

        if (results.tests.webrtc) {
            totalTests++;
            if (results.tests.webrtc.protected) passedTests++;
        }

        results.score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        results.passed = passedTests === totalTests;

        console.log(`指纹保护测试完成: ${results.score}%`);

        return results;
    } catch (error) {
        console.error('指纹保护测试失败:', error);
        return {
            timestamp: new Date().toISOString(),
            error: error.message,
            score: 0,
            passed: false
        };
    }
}

/**
 * 诊断浏览器容器化问题
 * @param {Object} page - Puppeteer页面
 * @returns {Promise<Object>}
 */
export async function diagnoseBrowserContainerization(page) {
    try {
        return await page.evaluate(() => {
            const results = {};

            results.automationMarkers = {
                webdriver: navigator.webdriver === true,
                puppeteer: window._PUPPETEER_ !== undefined,
                selenium: window.callSelenium !== undefined || window._selenium !== undefined,
                nightmare: window.__nightmare !== undefined,
                cdcProps: !!window.cdc_adoQpoasnfa76pfcZLmcfl_Array,
                chromeDriverEvalAsync: !!window.chromeDriverEvalAsync
            };

            results.chromeProperties = {
                app: window.chrome && typeof window.chrome.app === 'object',
                runtime: window.chrome && typeof window.chrome.runtime === 'object',
                webstore: window.chrome && typeof window.chrome.webstore === 'object',
                loadTimes: window.chrome && typeof window.chrome.loadTimes === 'function',
                csi: window.chrome && typeof window.chrome.csi === 'function'
            };

            // 权限API测试
            const permissionsTest = async () => {
                try {
                    if (!navigator.permissions) return {available: false};

                    const queryPrototypeCheck = Object.getOwnPropertyDescriptor(
                        Navigator.prototype, 'permissions'
                    ) !== undefined;

                    const notifications = await navigator.permissions.query({name: 'notifications'});

                    return {
                        available: true,
                        likely_spoofed: !queryPrototypeCheck,
                        notificationsState: notifications.state
                    };
                } catch (e) {
                    return {available: false, error: e.message};
                }
            };

            // 插件枚举测试
            results.plugins = {
                count: navigator.plugins ? navigator.plugins.length : 0,
                names: navigator.plugins ?
                    Array.from(navigator.plugins).map(p => p.name) : [],
                emptyArray: navigator.plugins &&
                    navigator.plugins.length === 0
            };

            return {
                results,
                permissionsPromise: permissionsTest()
            };
        });
    } catch (error) {
        console.error('浏览器容器化诊断失败:', error);
        return {
            error: error.message
        };
    }
}

export default {
    testFingerprintConsistency,
    testCanvasFingerprint,
    testWebRTCProtection,
    runFingerprintProtectionTests,
    diagnoseBrowserContainerization
};