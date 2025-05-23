import fs, {createWriteStream, existsSync, mkdirSync} from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';
import http from 'http';
import {execSync, spawn} from 'child_process';
import {fileURLToPath} from 'url';
import {createGunzip} from 'zlib';
import {Extract} from 'unzipper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const chromiumConfig = {
    dir: path.join(projectRoot, '.chromium'),
    versionFile: path.join(projectRoot, '.chromium', 'version.json'),
    tempDir: path.join(projectRoot, '.chromium', 'temp'),
    executablePaths: {
        win32: 'chrome-win/chrome.exe',
        darwin: 'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
        linux: 'chrome-linux/chrome'
    },
    playwrightPaths: {
        win32: ['chromium-*/chrome-win/chrome.exe', 'chromium-win/chrome.exe'],
        darwin: ['chromium-*/chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chromium-mac/Chromium.app/Contents/MacOS/Chromium'],
        linux: ['chromium-*/chrome-linux/chrome', 'chromium-linux/chrome']
    },
    downloadMirrors: [
        'https://storage.googleapis.com/chromium-browser-snapshots',
        'https://npm.taobao.org/mirrors/chromium-browser-snapshots',
        'https://cdn.npmmirror.com/binaries/chromium-browser-snapshots'
    ],
    // 主CDN
    mainCdn: 'https://commondatastorage.googleapis.com/chromium-browser-snapshots'
};

// 状态追踪
const state = {
    isDownloading: false,
    downloadProgress: 0,
    lastError: null,
    currentMirror: null
};

/**
 * 确保目录存在
 * @param {string} dir - 目录路径
 */
function ensureDir(dir) {
    if (!existsSync(dir)) {
        mkdirSync(dir, {recursive: true});
    }
}

/**
 * 检查URL是否可访问
 * @param {string} url
 * @returns {Promise<boolean>}
 */
async function isUrlAccessible(url) {
    return new Promise((resolve) => {
        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.get(url, {timeout: 10000}, (res) => {
            if (res.statusCode === 200) {
                resolve(true);
            } else {
                resolve(false);
            }
            res.destroy();
        });

        req.on('error', () => {
            resolve(false);
        });

        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });

        setTimeout(() => {
            req.destroy();
            resolve(false);
        }, 5000);
    });
}

/**
 * 获取可用基础URL
 * @returns {Promise<string>}
 */
async function getAvailableBaseUrl() {
    if (await isUrlAccessible(`${chromiumConfig.mainCdn}/Win_x64/LAST_CHANGE`)) {
        return chromiumConfig.mainCdn;
    }
    for (const url of chromiumConfig.downloadMirrors) {
        if (await isUrlAccessible(`${url}/Win_x64/LAST_CHANGE`)) {
            console.log(`Using mirror: ${url}`);
            state.currentMirror = url;
            return url;
        }
    }
    throw new Error('Cannot access Chromium download mirrors, please check your network connection');
}

/**
 * 获取平台特定下载信息
 * @returns {Promise<{baseUrl: string, platformPath: string}>}
 */
async function getChromiumDownloadInfo() {
    const platform = os.platform();
    const arch = os.arch();

    const baseUrl = await getAvailableBaseUrl();

    let platformPath;
    if (platform === 'win32') {
        platformPath = arch === 'x64' ? 'Win_x64' : 'Win';
    } else if (platform === 'darwin') {
        platformPath = arch === 'arm64' ? 'Mac_Arm' : 'Mac';
    } else if (platform === 'linux') {
        platformPath = arch === 'x64' ? 'Linux_x64' : 'Linux';
    } else {
        throw new Error(`Unsupported platform: ${platform}`);
    }
    return {
        baseUrl,
        platformPath
    };
}

/**
 * 获取最新Chromium版本号
 * @param {string} baseUrl - 下载基础URL
 * @param {string} platformPath - 平台路径
 * @returns {Promise<string>} - 版本号
 */
async function getLatestChromiumVersion(baseUrl, platformPath) {
    return new Promise((resolve, reject) => {
        const url = `${baseUrl}/${platformPath}/LAST_CHANGE`;

        const req = https.get(url, {timeout: 15000}, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error(`Failed to get version, status code: ${res.statusCode}`));
            }

            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const version = data.trim();
                    if (!version || !/^\d+$/.test(version)) {
                        return reject(new Error(`Invalid version number: ${version}`));
                    }
                    resolve(version);
                } catch (error) {
                    reject(new Error(`Failed to parse version: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`Failed to get Chromium version: ${error.message}`));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Version retrieval timeout'));
        });
    });
}

/**
 * 检查磁盘空间
 * @param {string} directory - 目标目录
 * @param {number} requiredMB - 所需空间（MB）
 * @returns {Promise<boolean>}
 */
async function checkDiskSpace(directory, requiredMB) {
    try {
        const diskSpace = await getDiskSpace(directory);
        const availableMB = Math.floor(diskSpace.available / (1024 * 1024));
        const isEnoughSpace = availableMB > requiredMB;

        if (!isEnoughSpace) {
            console.error(`Insufficient disk space: Need ${requiredMB}MB, available ${availableMB}MB`);
        }

        return isEnoughSpace;
    } catch (error) {
        console.warn(`Failed to check disk space: ${error.message}`);
        return true;
    }
}

/**
 * 获取磁盘空间信息
 * @param {string} directory - 目标目录
 * @returns {Promise<{available: number, total: number}>} - 空间信息（字节）
 */
async function getDiskSpace(directory) {
    return new Promise((resolve, reject) => {
        try {
            if (os.platform() === 'win32') {
                const drive = directory.split(path.sep)[0] || 'C:';
                const output = execSync(`wmic logicaldisk where "DeviceID='${drive}'" get FreeSpace,Size /format:csv`).toString();
                const lines = output.trim().split('\n');
                if (lines.length >= 2) {
                    const parts = lines[1].split(',');
                    if (parts.length >= 3) {
                        resolve({
                            available: parseInt(parts[1], 10),
                            total: parseInt(parts[2], 10)
                        });
                        return;
                    }
                }
                resolve({available: 10 * 1024 * 1024 * 1024, total: 100 * 1024 * 1024 * 1024});
            } else {
                // Unix-like
                const output = execSync(`df -B1 "${directory}"`).toString();
                const lines = output.trim().split('\n');
                if (lines.length >= 2) {
                    const parts = lines[1].split(/\s+/);
                    if (parts.length >= 4) {
                        resolve({
                            available: parseInt(parts[3], 10),
                            total: parseInt(parts[1], 10)
                        });
                        return;
                    }
                }
                resolve({available: 10 * 1024 * 1024 * 1024, total: 100 * 1024 * 1024 * 1024});
            }
        } catch (error) {
            reject(new Error(`Failed to get disk space: ${error.message}`));
        }
    });
}

/**
 * 下载文件
 * @param {string} url - 下载URL
 * @param {string} destPath - 目标路径
 * @param {number} retries - 重试次数
 * @returns {Promise<string>} - 下载的文件路径
 */
async function downloadFile(url, destPath, retries = 3) {
    state.isDownloading = true;
    state.downloadProgress = 0;

    return new Promise((resolve, reject) => {
        console.log(`Downloading: ${url}`);
        console.log(`Download target: ${destPath}`);

        const tryDownload = (attempt = 0) => {
            if (attempt >= retries) {
                state.isDownloading = false;
                state.lastError = `Download failed after ${retries} attempts`;
                return reject(new Error(state.lastError));
            }

            const file = createWriteStream(destPath);
            const protocol = url.startsWith('https') ? https : http;

            const req = protocol.get(url, {timeout: 60000}, (res) => {
                if (res.statusCode === 302 || res.statusCode === 301) {
                    file.close();
                    console.log(`Redirecting to: ${res.headers.location}`);
                    return downloadFile(res.headers.location, destPath, retries - attempt)
                        .then(resolve)
                        .catch(reject);
                }

                if (res.statusCode !== 200) {
                    file.close();
                    fs.unlinkSync(destPath);

                    if (attempt < retries - 1) {
                        console.log(`Download failed, status code: ${res.statusCode}, retrying (${attempt + 1}/${retries})`);
                        setTimeout(() => tryDownload(attempt + 1), 2000 * Math.pow(2, attempt));
                    } else {
                        state.isDownloading = false;
                        state.lastError = `Download failed, status code: ${res.statusCode}`;
                        reject(new Error(state.lastError));
                    }
                    return;
                }

                const totalSize = parseInt(res.headers['content-length'], 10);
                let downloadedSize = 0;
                let lastReportedPercent = -1;

                res.on('data', (chunk) => {
                    downloadedSize += chunk.length;
                    if (totalSize) {
                        const percent = Math.round((downloadedSize / totalSize) * 100);
                        state.downloadProgress = percent;
                        if (percent % 5 === 0 && percent !== lastReportedPercent) {
                            console.log(`Download progress: ${percent}%`);
                            lastReportedPercent = percent;
                        }
                    }
                });

                res.pipe(file);

                file.on('finish', () => {
                    file.close();
                    console.log('Download complete!');
                    state.isDownloading = false;
                    state.downloadProgress = 100;
                    resolve(destPath);
                });

                file.on('error', (err) => {
                    file.close();
                    fs.unlinkSync(destPath);
                    if (attempt < retries - 1) {
                        console.log(`Download failed: ${err.message}, retrying (${attempt + 1}/${retries})`);
                        setTimeout(() => tryDownload(attempt + 1), 2000 * Math.pow(2, attempt));
                    } else {
                        state.isDownloading = false;
                        state.lastError = `File write error: ${err.message}`;
                        reject(err);
                    }
                });
            });

            req.on('error', (err) => {
                file.close();
                fs.unlinkSync(destPath);
                if (attempt < retries - 1) {
                    console.log(`Download error: ${err.message}, retrying (${attempt + 1}/${retries})`);
                    setTimeout(() => tryDownload(attempt + 1), 2000 * Math.pow(2, attempt));
                } else {
                    state.isDownloading = false;
                    state.lastError = `Network error: ${err.message}`;
                    reject(err);
                }
            });

            req.on('timeout', () => {
                req.destroy();
                file.close();
                fs.unlinkSync(destPath);
                if (attempt < retries - 1) {
                    console.log(`Download timeout, retrying (${attempt + 1}/${retries})`);
                    setTimeout(() => tryDownload(attempt + 1), 2000 * Math.pow(2, attempt));
                } else {
                    state.isDownloading = false;
                    state.lastError = 'Download timeout';
                    reject(new Error('Download timeout'));
                }
            });
        };

        tryDownload();
    });
}

/**
 * 计算文件哈希
 * @param {string} filePath - 文件路径
 * @returns {Promise<string>} - 哈希值
 */
async function calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);

        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', (error) => reject(error));
    });
}

/**
 * 解压ZIP文件
 * @param {string} zipPath - ZIP文件路径
 * @param {string} targetDir - 目标目录
 * @returns {Promise<void>}
 */
async function unzipFile(zipPath, targetDir) {
    return new Promise((resolve, reject) => {
        console.log(`解压：${zipPath} 到 ${targetDir}`);

        fs.createReadStream(zipPath)
            .pipe(Extract({path: targetDir}))
            .on('close', () => {
                console.log('Extraction complete');
                resolve();
            })
            .on('error', (err) => {
                console.error('Extraction failed:', err);
                reject(err);
            });
    });
}

/**
 * 解压TAR.GZ文件
 * @param {string} tarGzPath - TAR.GZ文件路径
 * @param {string} targetDir - 目标目录
 * @returns {Promise<void>}
 */
async function untarGzFile(tarGzPath, targetDir) {
    return new Promise((resolve, reject) => {
        console.log(`Extracting: ${tarGzPath} to ${targetDir}`);

        if (os.platform() === 'win32') {
            fs.createReadStream(tarGzPath)
                .pipe(createGunzip())
                .pipe(Extract({path: targetDir}))
                .on('close', () => {
                    console.log('Extraction complete');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('Extraction failed:', err);
                    reject(err);
                });
        } else {
            const tar = spawn('tar', ['-xzf', tarGzPath, '-C', targetDir]);

            tar.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`tar extraction failed, exit code: ${code}`));
                    return;
                }
                console.log('Extraction complete');
                resolve();
            });

            tar.on('error', (err) => {
                console.error('Extraction failed:', err);
                reject(err);
            });
        }
    });
}

/**
 * 使用Playwright安装Chromium
 * @returns {Promise<boolean>}
 */
async function installChromiumWithPlaywright() {
    console.log('Installing Chromium via Playwright...');
    return new Promise((resolve, reject) => {
        try {
            // 检查是否安装了playwright
            let playwrightInstalled = false;
            try {
                execSync('npm list -g playwright', {stdio: 'ignore'});
                playwrightInstalled = true;
            } catch (error) {
                try {
                    execSync('npm list playwright', {stdio: 'ignore'});
                    playwrightInstalled = true;
                } catch (innerError) {
                    console.log('Playwright not detected');
                }
            }

            if (!playwrightInstalled) {
                console.log('Installing playwright...');
                execSync('npm install playwright --no-save', {
                    stdio: 'inherit',
                    timeout: 180000
                });
            }

            ensureDir(chromiumConfig.dir);

            const env = {...process.env};
            env.PLAYWRIGHT_BROWSERS_PATH = chromiumConfig.dir;

            const installCmd = 'npx playwright install chromium';

            execSync(installCmd, {
                stdio: 'inherit',
                env: env,
                timeout: 300000
            });

            console.log('Chromium installation complete');
            resolve(true);
        } catch (error) {
            console.error('Failed to install Chromium:', error);
            reject(error);
        }
    });
}

/**
 * 查找Playwright安装的Chromium
 * @returns {string|null}
 */
function findPlaywrightChromium() {
    if (!existsSync(chromiumConfig.dir)) {
        console.log(`Chromium directory does not exist: ${chromiumConfig.dir}`);
        return null;
    }

    const platform = os.platform();
    const searchPaths = chromiumConfig.playwrightPaths[platform] || [];

    for (const pathPattern of searchPaths) {
        try {
            if (pathPattern.includes('*')) {
                // 扫描目录
                const baseDir = pathPattern.split('*/')[0];
                const fullBaseDir = path.join(chromiumConfig.dir, baseDir);
                const suffix = pathPattern.split('*/')[1];

                if (existsSync(fullBaseDir)) {
                    // 读取目录内容
                    const files = fs.readdirSync(fullBaseDir);
                    for (const file of files) {
                        const potentialPath = path.join(fullBaseDir, file, suffix);
                        if (existsSync(potentialPath)) {
                            return potentialPath;
                        }
                    }
                }
            } else {
                // 直接路径
                const fullPath = path.join(chromiumConfig.dir, pathPattern);
                if (existsSync(fullPath)) {
                    return fullPath;
                }
            }
        } catch (error) {
            console.error(`Error searching Chromium path (${pathPattern}):`, error.message);
        }
    }

    if (platform === 'win32') {
        try {
            const directories = fs.readdirSync(chromiumConfig.dir)
                .filter(item => {
                    try {
                        return item.startsWith('chromium-') &&
                            fs.statSync(path.join(chromiumConfig.dir, item)).isDirectory();
                    } catch (e) {
                        return false;
                    }
                });

            for (const dir of directories) {
                const chromePath = path.join(chromiumConfig.dir, dir, 'chrome-win', 'chrome.exe');
                if (existsSync(chromePath)) {
                    return chromePath;
                }
            }

            const directPath = path.join(chromiumConfig.dir, 'chrome-win', 'chrome.exe');
            if (existsSync(directPath)) {
                return directPath;
            }
        } catch (error) {
            console.error('Windows Chromium search error:', error.message);
        }
    }

    const stdPath = path.join(chromiumConfig.dir, chromiumConfig.executablePaths[platform]);
    if (existsSync(stdPath)) {
        return stdPath;
    }

    console.warn('No Chromium executable found');
    return null;
}

/**
 * 检查Chromium是否下载
 * @returns {boolean}
 */
export function isChromiumDownloaded() {
    if (!existsSync(chromiumConfig.dir)) {
        return false;
    }

    const executablePath = getChromiumExecutablePath();
    return executablePath !== null && fs.existsSync(executablePath);
}

/**
 * 获取下载状态
 * @returns {Object}
 */
export function getDownloadStatus() {
    return {...state};
}

/**
 * 获取Chromium可执行文件路径
 * @returns {string|null}
 */
export function getChromiumExecutablePath() {
    if (!existsSync(chromiumConfig.dir)) {
        return null;
    }
    if (existsSync(chromiumConfig.versionFile)) {
        try {
            const versionInfo = JSON.parse(fs.readFileSync(chromiumConfig.versionFile, 'utf8'));
            const executablePath = path.resolve(chromiumConfig.dir, versionInfo.executablePath);

            if (existsSync(executablePath)) {
                return executablePath;
            }
        } catch (error) {
            console.error('Failed to read version info:', error);
        }
    }

    // 查找Playwright安装的Chromium
    const playwrightChromium = findPlaywrightChromium();
    if (playwrightChromium && existsSync(playwrightChromium)) {
        return playwrightChromium;
    }

    const platform = os.platform();
    if (platform in chromiumConfig.executablePaths) {
        const executablePath = path.join(chromiumConfig.dir, chromiumConfig.executablePaths[platform]);
        if (existsSync(executablePath)) {
            return executablePath;
        }
    }

    return null;
}

/**
 * 直接下载Chromium
 * @param {boolean} forceDownload - 是否强制下载
 * @returns {Promise<string>}
 */
async function directDownloadChromium(forceDownload = false) {
    try {
        ensureDir(chromiumConfig.dir);
        ensureDir(chromiumConfig.tempDir);

        const {baseUrl, platformPath} = await getChromiumDownloadInfo();
        const version = await getLatestChromiumVersion(baseUrl, platformPath);

        console.log(`Latest Chromium version: ${version}`);

        if (!forceDownload && existsSync(chromiumConfig.versionFile)) {
            try {
                const versionInfo = JSON.parse(fs.readFileSync(chromiumConfig.versionFile, 'utf8'));
                if (versionInfo.version === version) {
                    const execPath = getChromiumExecutablePath();
                    if (execPath && existsSync(execPath)) {
                        console.log(`Already have the latest Chromium version: ${version}`);
                        return execPath;
                    }
                }
            } catch (error) {
                console.warn('Version check failed, continuing download:', error);
            }
        }

        const requiredSpaceMB = 500; // 500MB
        const hasEnoughSpace = await checkDiskSpace(chromiumConfig.dir, requiredSpaceMB);
        if (!hasEnoughSpace) {
            console.error(`Need at least ${requiredSpaceMB}MB of available space`);
        }

        const platform = os.platform();
        let fileName, extractFunc;

        if (platform === 'win32') {
            fileName = 'chrome-win.zip';
            extractFunc = unzipFile;
        } else if (platform === 'darwin') {
            fileName = 'chrome-mac.zip';
            extractFunc = unzipFile;
        } else if (platform === 'linux') {
            fileName = 'chrome-linux.tar.gz';
            extractFunc = untarGzFile;
        } else {
            console.error(`Unsupported platform: ${platform}`);
        }

        const downloadUrl = `${baseUrl}/${platformPath}/${version}/${fileName}`;
        const downloadPath = path.join(chromiumConfig.tempDir, fileName);

        // 下载文件
        await downloadFile(downloadUrl, downloadPath);

        // 解压文件
        await extractFunc(downloadPath, chromiumConfig.dir);

        // 在Linux上设置可执行权限
        if (platform === 'linux') {
            const chromePath = path.join(chromiumConfig.dir, chromiumConfig.executablePaths[platform]);
            try {
                fs.chmodSync(chromePath, 0o755);
            } catch (error) {
                console.warn(`Failed to set executable permissions: ${error.message}`);
            }
        }

        // 保存版本信息
        const versionInfo = {
            version,
            downloadDate: new Date().toISOString(),
            platform,
            executablePath: chromiumConfig.executablePaths[platform],
            mirror: state.currentMirror || baseUrl
        };

        fs.writeFileSync(chromiumConfig.versionFile, JSON.stringify(versionInfo, null, 2));

        // 清理下载文件
        if (existsSync(downloadPath)) {
            fs.unlinkSync(downloadPath);
        }

        console.log(`Chromium installation complete, version: ${version}`);
        return getChromiumExecutablePath();
    } catch (error) {
        console.error('Direct download of Chromium failed:', error);
        throw error;
    }
}

/**
 * 确保Chromium已安装
 * @param {boolean} forceDownload - 是否强制下载新版本
 * @returns {Promise<string>}
 */
export async function ensureChromium(forceDownload = false) {
    ensureDir(chromiumConfig.dir);
    if (!forceDownload && isChromiumDownloaded()) {
        const execPath = getChromiumExecutablePath();
        if (execPath) {
            try {
                const isRealChromium = await verifyIsRealChromium(execPath);
                if (isRealChromium) {
                    return execPath;
                } else {
                    console.log('Detected downloaded browser is not pure Chromium, redownloading');
                }
            } catch (e) {
                console.warn('Browser verification failed:', e.message);
                return execPath;
            }
        }
    }
    console.log('Chromium not installed or needs updating, starting download...');
    try {
        await installChromiumWithPlaywright();
        const execPath = getChromiumExecutablePath();
        if (execPath) {
            console.log(`Chromium installed successfully: ${execPath}`);

            // 保存版本信息
            const versionInfo = {
                version: 'playwright-managed',
                downloadDate: new Date().toISOString(),
                platform: os.platform(),
                executablePath: path.relative(chromiumConfig.dir, execPath)
            };

            fs.writeFileSync(chromiumConfig.versionFile, JSON.stringify(versionInfo, null, 2));
            return execPath;
        }
    } catch (playwrightError) {
        console.error('Failed to install Chromium via Playwright, trying direct download:', playwrightError);
    }

    // 直接下载
    try {
        return await directDownloadChromium(forceDownload);
    } catch (directDownloadError) {
        console.error('Direct download of Chromium failed:', directDownloadError);

        const existingPath = getChromiumExecutablePath();
        if (existingPath) {
            return existingPath;
        }
        throw new Error(`Unable to install Chromium: ${directDownloadError.message}`);
    }
}

async function verifyIsRealChromium(browserPath) {
    try {
        const output = execSync(`"${browserPath}" --version`, { timeout: 5000 }).toString().toLowerCase();
        return output.includes('chromium') && !output.includes('google chrome');
    } catch (error) {
        console.warn(`Error detecting browser type: ${error.message}`);
        return false;
    }
}