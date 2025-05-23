import * as docx from "docx";
import cookie from "cookie";
import fs from "fs";
import {execSync} from "child_process";
import {cookieRegistry} from "./cookieRegistry.mjs";
import {v4 as uuidv4} from "uuid";

function getGitRevision() {
    // get git revision and branch
    try {
        const revision = execSync("git rev-parse --short HEAD", {stdio: "pipe"}).toString().trim();
        const branch = execSync("git rev-parse --abbrev-ref HEAD", {stdio: "pipe"}).toString().trim();
        return {revision, branch};
    } catch (e) {
        return {revision: "unknown", branch: "unknown"};
    }
}

// 创建目录
function createDirectoryIfNotExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, {recursive: true});
    }
}

/**
 * 生成动态值
 * @param {string} generatorType - 生成器类型
 * @param {Object} options - 选项
 * @returns {string}
 */
function generateDynamicValue(generatorType, options = {}) {
    switch (generatorType) {
        case 'uuid':
            return uuidv4();
        case 'timestamp':
            return Date.now().toString();
        case 'date':
            const date = new Date();
            return options.format === 'short'
                ? `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
                : date.toISOString();
        default:
            return '';
    }
}

/**
 * 获取Cookie
 * @param {Object} config
 * @param {string} fieldName
 * @returns {string|null}
 */
function getValueFromConfig(config, fieldName) {
    if (!config || !config.cookies) {
        return null;
    }
    const fieldConfig = cookieRegistry.getFieldConfig(fieldName);
    if (fieldConfig && config.cookies[fieldConfig.cookieName]) {
        return config.cookies[fieldConfig.cookieName];
    }

    return null;
}

/**
 * 提取对象
 * @param {string} cookieString
 * @returns {Object}
 */
function extractCookie(cookieString) {
    const cookieObject = {};

    cookieRegistry.getFieldNames().forEach(fieldName => {
        cookieObject[fieldName] = null;
    });

    // 解析 cookie
    let cookies = cookie.parse(cookieString);

    // 填充
    for (const [cookieName, value] of Object.entries(cookies)) {
        const fieldName = cookieRegistry.getFieldNameFromCookieName(cookieName);
        if (fieldName) {
            cookieObject[fieldName] = value;
        }
    }

    return cookieObject;
}

/**
 * 应用默认值
 * @param {Object} cookieObj 原始Cookie
 * @param {Object} config 配置对象
 * @param {Object} options
 * @returns {Object}
 */
function prepareCookieObject(cookieObj, config = {}, options = {}) {
    const result = {...cookieObj};
    const fieldNames = cookieRegistry.getFieldNames();
    // 应用默认值
    fieldNames.forEach(fieldName => {
        if (result[fieldName] === null || result[fieldName] === undefined) {
            const configValue = getValueFromConfig(config, fieldName);
            if (configValue !== null) {
                result[fieldName] = configValue;
                return;
            }
            // 动态生成
            if (cookieRegistry.isDynamicField(fieldName)) {
                const generator = cookieRegistry.getFieldGenerator(fieldName);
                result[fieldName] = generateDynamicValue(generator);
                return;
            }
            // 默认值
            const defaultValue = cookieRegistry.getFieldDefaultValue(fieldName);
            if (defaultValue !== null) {
                result[fieldName] = defaultValue;
            }
        }
    });

    // ai_model处理
    if (options.currentModel) {
        result.ai_model = options.currentModel;
    }

    return result;
}

/**
 * cookie 数组
 * @param {Object|...String} cookieObjOrParams
 * @param {Object} config - 配置对象
 * @param {Object} options - 选项
 * @returns {Array} puppeteer的page.setCookie
 */
function getSessionCookie(cookieObjOrParams, config = {}, options = {}) {
    let cookieObj;

    if (arguments.length > 1 && typeof arguments[1] !== 'object') {
        const fieldNames = cookieRegistry.getFieldNames();
        cookieObj = {};
        fieldNames.forEach((fieldName, index) => {
            if (index < arguments.length && arguments[index] !== undefined) {
                cookieObj[fieldName] = arguments[index];
            }
        });
        config = {};
        options = {};
    } else {
        const fieldNames = cookieRegistry.getFieldNames();
        cookieObj = {};
        for (const fieldName of fieldNames) {
            if (cookieObjOrParams && cookieObjOrParams[fieldName] !== undefined) {
                // 确保字符串
                cookieObj[fieldName] = String(cookieObjOrParams[fieldName]);
            }
        }
    }

    // 如果指定forceRegenUUID，强制重新生成UUID
    if (options.forceRegenUUID) {
        for (const fieldName of cookieRegistry.getFieldNames()) {
            if (cookieRegistry.getFieldGenerator(fieldName) === 'uuid') {
                cookieObj[fieldName] = uuidv4();
            }
        }
    }

    // 应用默认值、配置值和动态生成值
    cookieObj = prepareCookieObject(cookieObj, config, options);

    let sessionCookie = [];

    for (const fieldName of cookieRegistry.getFieldNames()) {
        if (!cookieObj[fieldName]) continue;

        const fieldConfig = cookieRegistry.getFieldConfig(fieldName);
        if (!fieldConfig) continue;

        // 计算过期时间
        const expires = fieldConfig.maxAge
            ? Math.floor(Date.now() / 1000) + fieldConfig.maxAge
            : 1800000000;

        // 主 cookie
        sessionCookie.push({
            name: fieldConfig.cookieName,
            value: cookieObj[fieldName],
            domain: fieldConfig.domain,
            path: "/",
            expires: expires,
            httpOnly: fieldConfig.httpOnly,
            secure: fieldConfig.secure,
            sameSite: fieldConfig.sameSite,
        });

        // 镜像 cookie
        if (fieldConfig.mirror) {
            sessionCookie.push({
                name: fieldConfig.mirror,
                value: cookieObj[fieldName],
                domain: fieldConfig.domain,
                path: "/",
                expires: expires,
                httpOnly: true,
                secure: fieldConfig.secure,
                sameSite: fieldConfig.sameSite,
            });
        }
    }

    // 添加隐身模式 cookie（如果启用）
    if (process.env.INCOGNITO_MODE === "true") {
        sessionCookie.push({
            name: "incognito",
            value: "true",
            domain: "you.com",
            path: "/",
            expires: 1800000000,
            secure: true,
        });
    }
    return sessionCookie;
}

/**
 * 提取cookie
 * @param {Object} session
 * @returns {Object}
 */
function extractCookieFields(session) {
    if (!session) return {};

    const fieldNames = cookieRegistry.getFieldNames();
    const cookieFields = {};

    for (const fieldName of fieldNames) {
        if (session[fieldName] !== undefined) {
            cookieFields[fieldName] = String(session[fieldName]);
        }
    }

    return cookieFields;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function createDocx(content) {
    let paragraphs = [];
    content.split("\n").forEach((line) => {
        paragraphs.push(
            new docx.Paragraph({
                children: [new docx.TextRun(line)],
            })
        );
    });
    let doc = new docx.Document({
        sections: [
            {
                properties: {},
                children: paragraphs,
            },
        ],
    });
    return docx.Packer.toBuffer(doc).then((buffer) => buffer);
}

// eventStream util
function createEvent(event, data) {
    // if data is object, stringify it
    if (typeof data === "object") {
        data = JSON.stringify(data);
    }
    return `event: ${event}\ndata: ${data}\n\n`;
}

function extractPerplexityCookie(cookieString) {
    const cookies = cookie.parse(cookieString);
    return {
        sessionToken: cookies['__Secure-next-auth.session-token'],
        isIncognito: cookies['pplx.is-incognito'] === 'true'
    };
}

function getPerplexitySessionCookie(extractedCookie) {
    let sessionCookie = [];

    if (extractedCookie.sessionToken) {
        sessionCookie.push({
            name: "__Secure-next-auth.session-token",
            value: extractedCookie.sessionToken,
            domain: "www.perplexity.ai",
            path: "/",
            expires: 1800000000,
            httpOnly: true,
            secure: true,
            sameSite: "Lax",
        });
    }

    // 添加无痕模式 cookie (如果启用)
    if (process.env.INCOGNITO_MODE === "true") {
        sessionCookie.push({
            name: "pplx.is-incognito",
            value: "true",
            domain: "www.perplexity.ai",
            path: "/",
            expires: 1800000000,
            httpOnly: false,
            secure: true,
            sameSite: "Lax",
        });
    }

    return sessionCookie;
}

export {
    createEvent,
    createDirectoryIfNotExists,
    sleep,
    extractCookie,
    getSessionCookie,
    createDocx,
    getGitRevision,
    extractPerplexityCookie,
    getPerplexitySessionCookie,
    extractCookieFields,
    prepareCookieObject
};
