import os from 'os';
import fs from 'fs';
import path from 'path';
import {execSync} from 'child_process';
import {ensureChromium, isChromiumDownloaded, getChromiumExecutablePath} from './chromiumDownloader.mjs';

/**
 * @param {string} preferredBrowser - 浏览器类型: 'auto', 'chromium', 'chrome', 'edge'
 * @param {Object} options - 配置选项
 * @returns {Promise<string>}
 */
export async function detectBrowser(preferredBrowser = 'auto', options = {}) {
    const browserOptions = {
        autoDownloadChromium: true,
        forceDownload: false,
        ...options
    };

    const platform = os.platform();
    let browsers = {
        'chromium': null,
        'chrome': null,
        'edge': null
    };

    try {
        if (browserOptions.autoDownloadChromium) {
            if (isChromiumDownloaded() && !browserOptions.forceDownload) {
                const chromiumPath = getChromiumExecutablePath();
                if (chromiumPath && typeof chromiumPath === 'string' && fs.existsSync(chromiumPath)) {
                    browsers.chromium = chromiumPath;
                    console.log(`找到Chromium: ${browsers.chromium}`);
                }
            }

            if (!browsers.chromium && (preferredBrowser === 'chromium' || preferredBrowser === 'auto')) {
                try {
                    const chromiumPath = await ensureChromium(browserOptions.forceDownload);
                    if (chromiumPath && typeof chromiumPath === 'string' && fs.existsSync(chromiumPath)) {
                        browsers.chromium = chromiumPath;
                    } else {
                        console.warn(`Chromium路径无效: ${chromiumPath}`);
                    }
                } catch (downloadError) {
                    console.warn(`Chromium下载失败: ${downloadError.message}`);
                }
            }
        }
    } catch (error) {
        console.warn(`Chromium准备失败，尝试其他浏览器: ${error.message}`);
    }

    if (platform === 'win32') {
        browsers.chrome = findWindowsBrowser('Chrome');
        browsers.edge = findWindowsBrowser('Edge');
    } else if (platform === 'darwin') {
        browsers.chrome = findMacOSBrowser('Google Chrome');
        browsers.edge = findMacOSBrowser('Microsoft Edge');
    } else if (platform === 'linux') {
        browsers.chrome = findLinuxBrowser('google-chrome');

        // Arch下AUR安装的chrome为google-chrome-stable
        if (!browsers.chrome) {
            browsers.chrome = findLinuxBrowser('google-chrome-stable');
        }

        browsers.edge = findLinuxBrowser('microsoft-edge');
    }
    // 根据优先级选择浏览器
    let selectedPath = null;

    if (preferredBrowser === 'auto' || preferredBrowser === undefined) {
        // 自动模式: Chromium > Chrome > Edge
        if (browsers.chromium && typeof browsers.chromium === 'string') {
            console.log('使用Chromium浏览器');
            selectedPath = browsers.chromium;
        } else if (browsers.chrome) {
            console.log('使用Chrome浏览器');
            selectedPath = browsers.chrome;
        } else if (browsers.edge) {
            console.log('使用Edge浏览器');
            selectedPath = browsers.edge;
        }
    } else if (preferredBrowser in browsers && browsers[preferredBrowser]) {
        const browserNames = {
            'chromium': 'Chromium',
            'chrome': 'Chrome',
            'edge': 'Edge'
        };
        console.log(`使用${browserNames[preferredBrowser]}浏览器`);
        selectedPath = browsers[preferredBrowser];
    }

    if (!selectedPath) {
        let errorMessage = '未找到可用浏览器';

        if (preferredBrowser !== 'auto' && preferredBrowser in browsers) {
            errorMessage = `未找到指定${preferredBrowser}浏览器`;

            if (preferredBrowser === 'chromium' && browserOptions.autoDownloadChromium) {
                errorMessage += '，下载失败';
            }
        } else {
            errorMessage = '未找到Chromium、Chrome或Edge浏览器，请确保已安装其中之一';

            if (browserOptions.autoDownloadChromium) {
                errorMessage += '，Chromium下载失败';
            }
        }

        console.error(errorMessage);

        throw new Error(errorMessage);
    }

    // 返回路径
    return selectedPath;
}

/**
 * 验证浏览器类型
 * @param {string} browserPath
 * @returns {Promise<{type: string, version: string}>}
 */
export async function verifyBrowserType(browserPath) {
    try {
        const output = execSync(`"${browserPath}" --version`, { timeout: 5000 }).toString().toLowerCase();
        let type = 'unknown';
        let version = '';
        // 提取版本号
        const versionMatch = output.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (versionMatch) {
            version = versionMatch[1];
        }
        // 确定浏览器类型
        if (output.includes('chromium')) {
            type = 'chromium';
        } else if (output.includes('google chrome')) {
            type = 'chrome';
        } else if (output.includes('microsoft edge')) {
            type = 'edge';
        }
        return { type, version };
    } catch (error) {
        console.warn(`验证浏览器类型失败: ${error.message}`);
        return { type: 'unknown', version: '0.0.0.0' };
    }
}

function findWindowsBrowser(browserName) {
    const regKeys = {
        'Chrome': ['chrome.exe', 'Google\\Chrome'],
        'Edge': ['msedge.exe', 'Microsoft\\Edge']
    };
    const [exeName, folderName] = regKeys[browserName];

    const regQuery = (key) => {
        try {
            return execSync(`reg query "${key}" /ve`).toString().trim().split('\r\n').pop().split('    ').pop();
        } catch (error) {
            return null;
        }
    };

    let browserPath = regQuery(`HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\${exeName}`) ||
        regQuery(`HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\${exeName}`);

    if (browserPath && fs.existsSync(browserPath)) {
        return browserPath;
    }

    const commonPaths = [
        `C:\\Program Files\\${browserName}\\Application\\${exeName}`,
        `C:\\Program Files (x86)\\${browserName}\\Application\\${exeName}`,
        `C:\\Program Files (x86)\\Microsoft\\${browserName}\\Application\\${exeName}`,
        `${process.env.LOCALAPPDATA}\\${browserName}\\Application\\${exeName}`,
        `${process.env.USERPROFILE}\\AppData\\Local\\${browserName}\\Application\\${exeName}`,
    ];

    const foundPath = commonPaths.find(path => fs.existsSync(path));
    if (foundPath) {
        return foundPath;
    }

    const userAppDataPath = process.env.LOCALAPPDATA || `${process.env.USERPROFILE}\\AppData\\Local`;
    const appDataPath = path.join(userAppDataPath, folderName, 'Application');

    if (fs.existsSync(appDataPath)) {
        const files = fs.readdirSync(appDataPath);
        const exePath = files.find(file => file.toLowerCase() === exeName.toLowerCase());
        if (exePath) {
            return path.join(appDataPath, exePath);
        }
    }

    return null;
}

function findMacOSBrowser(browserName) {
    const paths = [
        `/Applications/${browserName}.app/Contents/MacOS/${browserName}`,
        `${os.homedir()}/Applications/${browserName}.app/Contents/MacOS/${browserName}`,
    ];

    for (const path of paths) {
        if (fs.existsSync(path)) {
            return path;
        }
    }

    return null;
}

function findLinuxBrowser(browserName) {
    try {
        return execSync(`which ${browserName}`).toString().trim();
    } catch (error) {
        return null;
    }
}
