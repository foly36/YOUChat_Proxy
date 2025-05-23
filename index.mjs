import express from "express";
import {createEvent, getGitRevision} from "./utils/cookieUtils.mjs";
import YouProvider from "./provider.mjs";
import localtunnel from "localtunnel";
import ngrok from 'ngrok';
import {v4 as uuidv4} from "uuid";
import './proxyAgent.mjs';
import {storeImage} from './imageStorage.mjs';
import fetch from 'node-fetch';
import path from 'path';
import geoip from 'geoip-lite';
import RequestLogger from './requestLogger.mjs';
import tlsRotator from './utils/tlsRotator.mjs';
import {fetchWithRetry} from './utils/httpClient.mjs';
import modelManager from './modelManager.mjs';

const app = express();
const port = process.env.PORT || 8080;
const validApiKey = process.env.PASSWORD;

const modelMappping = {
    "claude-3-7-sonnet-latest": "claude_3_7_sonnet_thinking",
    "claude-3-7-sonnet-20250219": "claude_3_7_sonnet",
    "claude-3-5-sonnet-latest": "claude_3_5_sonnet",
    "claude-3-5-sonnet-20241022": "claude_3_5_sonnet",
    "claude-3-5-sonnet-20240620": "claude_3_5_sonnet",
    "claude-3-20240229": "claude_3_opus",
    "claude-3-opus-20240229": "claude_3_opus",
    "claude-3-sonnet-20240229": "claude_3_sonnet",
    "claude-3-haiku-20240307": "claude_3_haiku",
    "claude-2.1": "claude_2",
    "claude-2.0": "openai_o1",
    "gpt-4": "gpt_4",
    "gpt-4o": "gpt_4o",
    "gpt-4-turbo": "gpt_4_turbo",
    "openai-o1": "openai_o1",
    "o1-preview": "openai_o1",
};

// import config.mjs
let config;
try {
    const configModule = await import("./config.mjs");
    config = configModule.config;
} catch (e) {
    console.error(e);
    console.error("config.mjs 不存在或者有错误，请检查");
    process.exit(1);
}

const provider = new YouProvider(config);
await provider.init(config);

// 初始化 SessionManager
const sessionManager = provider.getSessionManager();

// 初始化 RequestLogger
const requestLogger = new RequestLogger();

// handle preflight request
app.use((req, res, next) => {
    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "*");
        res.setHeader("Access-Control-Allow-Headers", "*");
        res.setHeader("Access-Control-Max-Age", "86400");
        res.status(200).end();
    } else {
        next();
    }
});

// openai format model request
app.get("/v1/models", OpenAIApiKeyAuth, (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // 获取最新可用模型列表
    const availableModels = modelManager.getAvailableModels();

    const models = availableModels.map((model) => {
        return {
            id: model,
            object: "model",
            created: 1700000000,
            owned_by: "closeai",
            name: model,
        };
    });
    res.json({object: "list", data: models});
});
// handle openai format model request
app.post("/v1/chat/completions", OpenAIApiKeyAuth, (req, res) => {
    // 用于存储请求体
    req.rawBody = "";
    req.setEncoding("utf8");
    clientState.setClosed(false);

    // 接收数据
    req.on("data", function (chunk) {
        req.rawBody += chunk;
    });

    req.on("end", async () => {
        const jsonBody = parseRequestBody(req, res, 'openai');
        if (!jsonBody) return;

        // 规范化消息
        jsonBody.messages = await openaiNormalizeMessages(jsonBody.messages);

        console.log("message length: " + jsonBody.messages.length);

        // 尝试映射模型
        if (jsonBody.model && modelMappping[jsonBody.model]) {
            jsonBody.model = modelMappping[jsonBody.model];
        }

        const availableModels = modelManager.getAvailableModels();
        if (jsonBody.model && !availableModels.includes(jsonBody.model)) {
            res.json({error: {code: 404, message: "Invalid Model"}});
            return;
        }
        console.log("Using model " + jsonBody.model);

        // 设置会话管理
        const sessionManager = setupSession(res);

        try {
            // 获取客户端信息和会话
            const {selectedUsername, modeSwitched, browserInstance} =
                await getClientAndSessionInfo(req, jsonBody.model);

            // 设置会话信息
            sessionManager.setSession(selectedUsername, browserInstance.id);

            const {completion, cancel} = await provider.getCompletion({
                username: selectedUsername,
                messages: jsonBody.messages,
                browserInstance: browserInstance,
                stream: !!jsonBody.stream,
                proxyModel: jsonBody.model,
                useCustomMode: process.env.USE_CUSTOM_MODE === "true",
                modeSwitched: modeSwitched
            });

            // 设置完成对象
            sessionManager.setCompletion(completion, cancel);

            // 监听开始事件
            completion.on("start", (id) => {
                if (jsonBody.stream) {
                    // 发送消息开始
                    res.write(createEvent(":", "queue heartbeat 114514"));
                    res.write(
                        createEvent("data", {
                            id: id,
                            object: "chat.completion.chunk",
                            created: Math.floor(new Date().getTime() / 1000),
                            model: jsonBody.model,
                            system_fingerprint: "114514",
                            choices: [{
                                index: 0,
                                delta: {role: "assistant", content: ""},
                                logprobs: null,
                                finish_reason: null
                            }],
                        })
                    );
                }
            });

            // 监听完成事件
            completion.on("completion", (id, text) => {
                if (jsonBody.stream) {
                    // 发送消息增量
                    res.write(
                        createEvent("data", {
                            choices: [
                                {
                                    content_filter_results: {
                                        hate: {filtered: false, severity: "safe"},
                                        self_harm: {filtered: false, severity: "safe"},
                                        sexual: {filtered: false, severity: "safe"},
                                        violence: {filtered: false, severity: "safe"},
                                    },
                                    delta: {content: text},
                                    finish_reason: null,
                                    index: 0,
                                },
                            ],
                            created: Math.floor(new Date().getTime() / 1000),
                            id: id,
                            model: jsonBody.model,
                            object: "chat.completion.chunk",
                            system_fingerprint: "114514",
                        })
                    );
                } else {
                    // 只发送一次，发送最终响应
                    res.write(
                        JSON.stringify({
                            id: id,
                            object: "chat.completion",
                            created: Math.floor(new Date().getTime() / 1000),
                            model: jsonBody.model,
                            system_fingerprint: "114514",
                            choices: [
                                {
                                    index: 0,
                                    message: {
                                        role: "assistant",
                                        content: text,
                                    },
                                    logprobs: null,
                                    finish_reason: "stop",
                                },
                            ],
                            usage: {
                                prompt_tokens: 1,
                                completion_tokens: 1,
                                total_tokens: 1,
                            },
                        })
                    );
                    res.end();
                    sessionManager.releaseSession();
                }
            });

            // 监听结束事件
            completion.on("end", () => {
                if (jsonBody.stream) {
                    res.write(createEvent("data", "[DONE]"));
                    res.end();
                }
                sessionManager.releaseSession();
            });

            // 监听错误事件
            completion.on("error", (err) => {
                console.error("Completion error:", err);
                const errorMessage = "Error occurred: " + (err.message || "Unknown error");
                if (!res.headersSent) {
                    sendOpenAIErrorResponse(res, errorMessage, jsonBody, jsonBody.stream);
                }
                sessionManager.releaseSession();
            });

        } catch (error) {
            handleErrorResponse(res, error, jsonBody, jsonBody.stream, "openai");
            sessionManager.releaseSession();
        }
    });
});

// Helper function: Normalize messages
async function openaiNormalizeMessages(messages) {
    let normalizedMessages = [];
    let currentSystemMessage = "";

    for (let message of messages) {
        if (message.role === 'system') {
            if (currentSystemMessage) {
                currentSystemMessage += "\n" + message.content;
            } else {
                currentSystemMessage = message.content;
            }
        } else {
            if (currentSystemMessage) {
                normalizedMessages.push({role: 'system', content: currentSystemMessage});
                currentSystemMessage = "";
            }

            // 检查消息内容
            if (Array.isArray(message.content)) {
                const textContent = message.content
                    .filter(item => item.type === 'text')
                    .map(item => item.text)
                    .join('\n');

                // 处理图片内容，存储图片
                for (const item of message.content) {
                    if (item.type === 'image_url' && item.image_url?.url) {
                        // 获取媒体类型
                        const mediaType = await getMediaTypeFromUrl(item.image_url.url);
                        // 获取图片 base64
                        const base64Data = await fetchImageAsBase64(item.image_url.url);
                        if (base64Data) {
                            const {imageId} = storeImage(base64Data, mediaType);
                            console.log(`Image stored with ID: ${imageId}, Media Type: ${mediaType}`);
                        } else {
                            console.warn('Failed to store image due to missing data.');
                        }
                    }
                }

                normalizedMessages.push({role: message.role, content: textContent});
            } else if (typeof message.content === 'string') {
                normalizedMessages.push(message);
            } else {
                console.warn('未知的消息内容格式:', message.content);
                normalizedMessages.push(message);
            }
        }
    }

    if (currentSystemMessage) {
        normalizedMessages.push({role: 'system', content: currentSystemMessage});
    }

    return normalizedMessages;
}

// 图片 URL 获取媒体类型
async function getMediaTypeFromUrl(url) {
    try {
        const response = await fetch(url, {method: 'HEAD'});
        const contentType = response.headers.get('content-type');
        return contentType || guessMediaTypeFromUrl(url);
    } catch (error) {
        console.warn('无法获取媒体类型，尝试根据 URL 推断', error);
        return guessMediaTypeFromUrl(url);
    }
}

function guessMediaTypeFromUrl(url) {
    const ext = path.extname(url).toLowerCase();
    switch (ext) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.gif':
            return 'image/gif';
        default:
            return 'application/octet-stream';
    }
}

// 图片 URL 获取 base64
async function fetchImageAsBase64(url) {
    try {
        // 使用随机化HTTP
        const response = await fetchWithRetry(url, {
            method: 'GET',
            headers: {
                'Accept': 'image/*'
            }
        });

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return buffer.toString('base64');
    } catch (error) {
        console.error('Failed to fetch image data:', error);
        return null;
    }
}


// handle anthropic format model request
app.post("/v1/messages", AnthropicApiKeyAuth, (req, res) => {
    req.rawBody = "";
    req.setEncoding("utf8");
    clientState.setClosed(false);

    req.on("data", function (chunk) {
        req.rawBody += chunk;
    });

    req.on("end", async () => {
        const jsonBody = parseRequestBody(req, res, 'anthropic');
        if (!jsonBody) return;

        // 处理messages格式
        jsonBody.messages = anthropicNormalizeMessages(jsonBody.messages || []);

        // 处理system字段
        if (jsonBody.system) {
            let systemContent = '';
            if (typeof jsonBody.system === 'string') {
                systemContent = jsonBody.system;
            }
            // 处理system为数组
            else if (Array.isArray(jsonBody.system)) {
                systemContent = extractTextFromContentArray(jsonBody.system);
                // 处理system中图片
                processImageContent(jsonBody.system);
            }

            // 将系统消息添加到messages首位
            if (systemContent) {
                jsonBody.messages.unshift({role: "system", content: systemContent});
            }
        }

        console.log("message length:", jsonBody.messages.length);

        let proxyModel;
        if (process.env.AI_MODEL) {
            proxyModel = process.env.AI_MODEL;
        } else if (jsonBody.model && modelMappping[jsonBody.model]) {
            proxyModel = modelMappping[jsonBody.model];
        } else if (jsonBody.model) {
            proxyModel = jsonBody.model;
        } else {
            proxyModel = "claude_3_opus";
        }
        console.log(`Using model ${proxyModel}`);

        const availableModels = modelManager.getAvailableModels();
        if (proxyModel && !availableModels.includes(proxyModel)) {
            res.json({error: {code: 404, message: "Invalid Model"}});
            return;
        }

        // 设置会话管理
        const sessionManager = setupSession(res);

        try {
            // 获取客户端信息和会话
            const {selectedUsername, modeSwitched, browserInstance} =
                await getClientAndSessionInfo(req, jsonBody.model || proxyModel);

            // 设置会话信息
            sessionManager.setSession(selectedUsername, browserInstance.id);

            const {completion, cancel} = await provider.getCompletion({
                username: selectedUsername,
                messages: jsonBody.messages,
                browserInstance: browserInstance,
                stream: !!jsonBody.stream,
                proxyModel: proxyModel,
                useCustomMode: process.env.USE_CUSTOM_MODE === "true",
                modeSwitched: modeSwitched
            });

            // 设置完成对象
            sessionManager.setCompletion(completion, cancel);

            // 监听开始事件
            completion.on("start", (id) => {
                if (jsonBody.stream) {
                    // send message start
                    res.write(createEvent("message_start", {
                        type: "message_start",
                        message: {
                            id: `${id}`,
                            type: "message",
                            role: "assistant",
                            content: [],
                            model: proxyModel,
                            stop_reason: null,
                            stop_sequence: null,
                            usage: {input_tokens: 8, output_tokens: 1},
                        },
                    }));
                    res.write(createEvent("content_block_start", {
                        type: "content_block_start",
                        index: 0,
                        content_block: {type: "text", text: ""}
                    }));
                    res.write(createEvent("ping", {type: "ping"}));
                }
            });

            // 监听完成事件
            completion.on("completion", (id, text) => {
                if (jsonBody.stream) {
                    // send message delta
                    res.write(createEvent("content_block_delta", {
                        type: "content_block_delta",
                        index: 0,
                        delta: {type: "text_delta", text: text},
                    }));
                } else {
                    // 只会发一次，发送final response
                    res.write(JSON.stringify({
                        id: id,
                        content: [
                            {text: text},
                            {id: "string", name: "string", input: {}},
                        ],
                        model: proxyModel,
                        stop_reason: "end_turn",
                        stop_sequence: null,
                        usage: {input_tokens: 0, output_tokens: 0},
                    }));
                    res.end();
                    sessionManager.releaseSession();
                }
            });

            // 监听结束事件
            completion.on("end", () => {
                if (jsonBody.stream) {
                    res.write(createEvent("content_block_stop", {type: "content_block_stop", index: 0}));
                    res.write(createEvent("message_delta", {
                        type: "message_delta",
                        delta: {stop_reason: "end_turn", stop_sequence: null},
                        usage: {output_tokens: 12},
                    }));
                    res.write(createEvent("message_stop", {type: "message_stop"}));
                    res.end();
                }
                sessionManager.releaseSession();
            });

            // 监听错误事件
            completion.on("error", (err) => {
                console.error("Completion error:", err);
                // 向客户端返回错误信息
                const errorMessage = "Error occurred: " + (err.message || "Unknown error");
                if (!res.headersSent) {
                    sendAnthropicErrorResponse(res, errorMessage, jsonBody, jsonBody.stream);
                }
                sessionManager.releaseSession();
            });

        } catch (error) {
            handleErrorResponse(res, error, jsonBody, jsonBody.stream, "anthropic");
            sessionManager.releaseSession();
        }
    });
});

/**
 * 规范化Anthropic消息格式
 * @param {array} messages 消息数组
 * @returns {array} 处理后
 */
function anthropicNormalizeMessages(messages) {
    if (!Array.isArray(messages)) {
        console.warn('Messages is not an array:', messages);
        return [];
    }

    return messages.map(message => {
        if (typeof message.content === 'string') {
            return message;
        } else if (Array.isArray(message.content)) {
            // 提取文本内容
            const textContent = extractTextFromContentArray(message.content);

            // 处理图片
            processImageContent(message.content);

            return {...message, content: textContent};
        } else {
            console.warn('Unknown message content format:', message);
            // 尝试转换为字符串
            return {...message, content: String(message.content || '')};
        }
    });
}

/**
 * 从内容数组提取所有文本
 * @param {array|object} content
 * @returns {string} 合并后文本
 */
function extractTextFromContentArray(content) {
    // 处理空值
    if (!content) return '';

    if (typeof content === 'string') return content;

    // 处理文本
    if (typeof content === 'object' && content.type === 'text' && content.text) {
        return content.text;
    }

    // 处理数组
    if (Array.isArray(content)) {
        return content.map(item => extractTextFromContentArray(item))
            .filter(text => text) // 过滤空值
            .join('\n');
    }

    // 处理其他
    if (typeof content === 'object') {
        if (content.text && typeof content.text === 'string') {
            return content.text;
        }

        return Object.values(content)
            .map(value => extractTextFromContentArray(value))
            .filter(text => text)
            .join('\n');
    }

    // 其他情况
    return String(content || '');
}

/**
 * 处理内容中的图片
 * @param {array} contentArray
 */
function processImageContent(contentArray) {
    if (!Array.isArray(contentArray)) return;

    contentArray.forEach(item => {
        // 处理image类型
        if (item.type === 'image' && item.source?.type === 'base64') {
            const {imageId, mediaType} = storeImage(item.source.data, item.source.media_type);
            console.log(`Image stored with ID: ${imageId}, Media Type: ${mediaType}`);
        }

        // 处理image_url类型
        if (item.type === 'image_url' && item.image_url?.url) {
            (async () => {
                try {
                    const mediaType = await getMediaTypeFromUrl(item.image_url.url);
                    const base64Data = await fetchImageAsBase64(item.image_url.url);
                    if (base64Data) {
                        const {imageId} = storeImage(base64Data, mediaType);
                        console.log(`Image stored with ID: ${imageId}, Media Type: ${mediaType}`);
                    }
                } catch (error) {
                    console.error('Failed to process image from URL:', error);
                }
            })();
        }

        // 递归
        if (Array.isArray(item)) {
            processImageContent(item);
        }
    });
}

/**
 * 会话管理和释放
 * @param {object} res - Express响应对象
 * @returns {object} 会话管理
 */
function setupSession(res) {
    let selectedSession = null;
    let selectedBrowserId = null;
    let releaseSessionCalled = false;
    let completion = null;
    let cancel = null;
    let sessionStartTime = Date.now();

    // 获取会话
    const getSession = () => selectedSession;
    const getSessionDuration = () => {
        return selectedSession ? `${Math.round((Date.now() - sessionStartTime) / 1000)}秒` : '0秒';
    };
    const isReleased = () => releaseSessionCalled;

    const releaseSession = () => {
        try {
            // 避免重复释放
            if (selectedSession && selectedBrowserId && !isReleased()) {
                const sessionId = getSession();
                sessionManager.releaseSession(sessionId, selectedBrowserId);
                console.log(`释放会话 ${sessionId} 和浏览器实例 ${selectedBrowserId}, 持续时间: ${getSessionDuration()}`);
                releaseSessionCalled = true;
            }
        } catch (error) {
            console.error(`释放会话 ${getSession() || '未知'} 时出错: ${error.message}`);
        }
    };

    // 监听客户端关闭事件
    res.on("close", () => {
        const sessionId = getSession();
        console.log(` > [Client closed]`);
        clientState.setClosed(true);
        try {
            if (completion) {
                completion.removeAllListeners();
            }
            if (cancel) {
                cancel();
            }
        } catch (error) {
            console.error(`会话 ${sessionId || '未知'} 清理资源时出错: ${error.message}`);
        } finally {
            releaseSession();
        }
    });

    return {
        setSession: (username, browserId) => {
            if (isReleased()) {
                return;
            }
            selectedSession = username;
            selectedBrowserId = browserId;
            sessionStartTime = Date.now();
        },
        setCompletion: (comp, cancelFn) => {
            if (isReleased()) {
                return;
            }
            completion = comp;
            cancel = cancelFn;
        },
        releaseSession,
        getSession,
        getSessionDuration,
        isReleased // 用于外部状态检查
    };
}

/**
 * 获取客户端信息分配会话
 * @param {object} req - Express请求对象
 * @param {string} model - 模型名称
 * @returns {Promise<object>} 包含会话信息对象
 */
async function getClientAndSessionInfo(req, model) {
    // 获取IP
    const clientIpAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const geo = geoip.lookup(clientIpAddress) || {};
    const locationInfo = `${geo.country || 'Unknown'}-${geo.region || 'Unknown'}-${geo.city || 'Unknown'}`;
    const requestTime = new Date();

    // 锁定可用会话和浏览器实例
    const {
        selectedUsername,
        modeSwitched,
        browserInstance
    } = await sessionManager.getSessionByStrategy('round_robin');

    console.log(`Using session ${selectedUsername}`);

    // 记录
    await requestLogger.logRequest({
        time: requestTime,
        ip: clientIpAddress,
        location: locationInfo,
        model: model,
        session: selectedUsername
    });

    return {
        selectedUsername,
        modeSwitched,
        browserInstance
    };
}

/**
 * 处理错误响应
 * @param {object} res - Express响应对象
 * @param {Error} error - 错误对象
 * @param {object} jsonBody - 请求体JSON
 * @param {boolean} isStream - 是否流式
 * @param {string} apiType - API类型 ('openai' 或 'anthropic')
 */
function handleErrorResponse(res, error, jsonBody, isStream, apiType) {
    console.error("Request error:", error);
    const errorMessage = "Error occurred, please check the log.\n\n出现错误，请检查日志：<pre>" + (error.stack || error) + "</pre>";

    if (!res.headersSent) {
        if (apiType === "openai") {
            sendOpenAIErrorResponse(res, errorMessage, jsonBody, isStream);
        } else if (apiType === "anthropic") {
            sendAnthropicErrorResponse(res, errorMessage, jsonBody, isStream);
        }
    }
}

/**
 * OpenAI格式的错误响应
 * @param {object} res - Express响应对象
 * @param {string} errorMessage - 错误信息
 * @param {object} jsonBody - 请求体JSON
 * @param {boolean} isStream - 是否流式
 */
function sendOpenAIErrorResponse(res, errorMessage, jsonBody, isStream) {
    if (isStream) {
        res.write(
            createEvent("data", {
                choices: [
                    {
                        content_filter_results: {
                            hate: {filtered: false, severity: "safe"},
                            self_harm: {filtered: false, severity: "safe"},
                            sexual: {filtered: false, severity: "safe"},
                            violence: {filtered: false, severity: "safe"},
                        },
                        delta: {content: errorMessage},
                        finish_reason: null,
                        index: 0,
                    },
                ],
                created: Math.floor(new Date().getTime() / 1000),
                id: uuidv4(),
                model: jsonBody.model,
                object: "chat.completion.chunk",
                system_fingerprint: "114514",
            })
        );
        res.write(createEvent("data", "[DONE]"));
    } else {
        res.write(
            JSON.stringify({
                id: uuidv4(),
                object: "chat.completion",
                created: Math.floor(new Date().getTime() / 1000),
                model: jsonBody.model,
                system_fingerprint: "114514",
                choices: [
                    {
                        index: 0,
                        message: {
                            role: "assistant",
                            content: errorMessage,
                        },
                        logprobs: null,
                        finish_reason: "stop",
                    },
                ],
                usage: {
                    prompt_tokens: 1,
                    completion_tokens: 1,
                    total_tokens: 1,
                },
            })
        );
    }
    res.end();
}

/**
 * Anthropic格式错误响应
 * @param {object} res - Express响应对象
 * @param {string} errorMessage - 错误信息
 * @param {object} jsonBody - 请求体JSON
 * @param {boolean} isStream - 是否流式
 */
function sendAnthropicErrorResponse(res, errorMessage, jsonBody, isStream) {
    if (isStream) {
        res.write(createEvent("content_block_delta", {
            type: "content_block_delta",
            index: 0,
            delta: {type: "text_delta", text: errorMessage},
        }));
    } else {
        res.write(JSON.stringify({
            id: uuidv4(),
            content: [{text: errorMessage}, {id: "string", name: "string", input: {}}],
            model: jsonBody.model || "claude_3_opus",
            stop_reason: "error",
            stop_sequence: null,
            usage: {input_tokens: 0, output_tokens: 0},
        }));
    }
    res.end();
}

/**
 * 解析和验证请求体
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 * @param {string} apiType - API类型（'openai'或'anthropic'）
 * @returns {object|null} - 解析后JSON对象，出错返回null
 */
function parseRequestBody(req, res, apiType) {
    const apiName = apiType === 'openai' ? 'OpenAI' : 'Anthropic';
    console.log(`处理 ${apiName} 格式的请求`);

    // 设置通用响应头
    res.setHeader("Content-Type", "text/event-stream;charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // 检查请求体是否为空
    if (!req.rawBody || req.rawBody.trim() === '') {
        logRequestError(req, `${apiName} request body is empty`);
        sendErrorResponse(res, 400, "Request body cannot be empty", apiType);
        return null;
    }

    try {
        // 尝试解析JSON
        return JSON.parse(req.rawBody);
    } catch (error) {
        // 记录解析错误
        logJsonParseError(req, error, apiType);

        // Send error response
        sendErrorResponse(res, 400, "Invalid JSON format", apiType);
        return null;
    }
}

/**
 * 记录请求错误
 * @param {object} req - Express请求对象
 * @param {string} message - 错误消息
 */
function logRequestError(req, message) {
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    console.error({
        Timestamp: new Date().toLocaleString(),
        Message: message,
        IP_Address: clientIp,
        Path: req.path,
        Method: req.method,
        Headers: req.headers
    });
}

/**
 * 记录JSON解析错误
 * @param {object} req - Express请求对象
 * @param {Error} error - 错误对象
 * @param {string} apiType - API类型
 */
function logJsonParseError(req, error, apiType) {
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const truncatedBody = req.rawBody.length > 200 ?
        `${req.rawBody.substring(0, 200)}... (Total length: ${req.rawBody.length})` :
        req.rawBody;

    console.error(`JSON parsing error [${apiType}]:`, {
        Timestamp: new Date().toLocaleString(),
        IP_Address: clientIp,
        Error_Type: error.name,
        Error_Message: error.message,
        Request_Body_Summary: truncatedBody,
        Path: req.path
    });
}

/**
 * 发送格式化错误响应
 * @param {object} res - Express响应对象
 * @param {number} statusCode - HTTP状态码
 * @param {string} message - 错误消息
 * @param {string} apiType - API类型
 */
function sendErrorResponse(res, statusCode, message, apiType) {
    let errorResponse;

    if (apiType === 'openai') {
        errorResponse = {
            error: {
                code: statusCode,
                message: message,
                type: "invalid_request_error"
            }
        };
    } else {
        errorResponse = {
            error: {
                type: "invalid_request_error",
                message: message
            }
        };
    }

    res.status(statusCode).json(errorResponse);
}

// handle other
app.use((req, res, next) => {
    const {revision, branch} = getGitRevision();
    res.status(404).send("Not Found (YouChat_Proxy " + revision + "@" + branch + ")");
    console.log("收到了错误路径的请求，请检查您使用的API端点是否正确。")
});

const createLocaltunnel = async (port, subdomain) => {
    const tunnelOptions = {port};
    if (subdomain) {
        tunnelOptions.subdomain = subdomain;
    }

    try {
        const tunnel = await localtunnel(tunnelOptions);
        console.log(`隧道已成功创建，可通过以下URL访问: ${tunnel.url}/v1`);
        tunnel.on("close", () => console.log("已关闭隧道"));
        return tunnel;
    } catch (error) {
        console.error("创建localtunnel隧道失败:", error);
    }
};

/*
    * 创建ngrok隧道
    * @param {number} port - 本地端口
    * @param {string} authToken - ngrok的认证token
    * @param {string} customDomain - 自定义域名
    * @param {string} subdomain - 子域名
 */
const createNgrok = async (port, authToken, customDomain, subdomain) => {
    const ngrokOptions = {addr: port, authtoken: authToken};

    if (customDomain) {
        ngrokOptions.hostname = customDomain;
    } else if (subdomain) {
        ngrokOptions.subdomain = subdomain;
    }

    const originalHttpProxy = process.env.HTTP_PROXY;
    const originalHttpsProxy = process.env.HTTPS_PROXY;
    delete process.env.HTTP_PROXY;
    delete process.env.HTTPS_PROXY;

    try {
        const url = await ngrok.connect(ngrokOptions);
        console.log(`隧道已成功创建，可通过以下URL访问: ${url}/v1`);
        process.on('SIGTERM', async () => {
            await ngrok.kill();
            console.log("已关闭隧道");
        });
        return url;
    } catch (error) {
        console.error("创建ngrok隧道失败:", error);
    } finally {
        if (originalHttpProxy) process.env.HTTP_PROXY = originalHttpProxy;
        if (originalHttpsProxy) process.env.HTTPS_PROXY = originalHttpsProxy;
    }
};

const createTunnel = async (tunnelType, port) => {
    console.log(`创建${tunnelType}隧道中...`);
    if (tunnelType === "localtunnel") {
        return createLocaltunnel(port, process.env.SUBDOMAIN);
    } else if (tunnelType === "ngrok") {
        return createNgrok(port, process.env.NGROK_AUTH_TOKEN, process.env.NGROK_CUSTOM_DOMAIN, process.env.NGROK_SUBDOMAIN);
    }
};

app.listen(port, async () => {
    // 输出当前月份的请求统计信息
    provider.getLogger().printStatistics();
    console.log(`YouChat proxy listening on port ${port}`);
    // 启动TLS轮换服务
    tlsRotator.start();
    // 模型列表自动更新
    modelManager.startAutoRefresh(2 * 60 * 60 * 1000);

    if (!validApiKey) {
        console.log(`Proxy is currently running with no authentication`);
    }
    console.log(`Custom mode: ${process.env.USE_CUSTOM_MODE === "true" ? "enabled" : "disabled"}`);
    console.log(`Mode rotation: ${process.env.ENABLE_MODE_ROTATION === "true" ? "enabled" : "disabled"}`);

    if (process.env.ENABLE_TUNNEL === "true") {
        const tunnelType = process.env.TUNNEL_TYPE || "localtunnel";
        await createTunnel(tunnelType, port);
    }
    if (!global.gc) {
        console.warn('建议使用 --expose-gc 标志启动you代理以启用垃圾回收');
        console.warn('命令示例: node --expose-gc index.mjs');
    }
});

function AnthropicApiKeyAuth(req, res, next) {
    const reqApiKey = req.header("x-api-key");

    if (validApiKey && reqApiKey !== validApiKey) {
        // If Environment variable PASSWORD is set AND x-api-key header is not equal to it, return 401
        const clientIpAddress = req.headers["x-forwarded-for"] || req.ip;
        console.log(`Receviced Request from IP ${clientIpAddress} but got invalid password.`);
        return res.status(401).json({error: "Invalid Password"});
    }

    next();
}

function OpenAIApiKeyAuth(req, res, next) {
    const reqApiKey = req.header("Authorization");

    if (validApiKey && reqApiKey !== "Bearer " + validApiKey) {
        // If Environment variable PASSWORD is set AND Authorization header is not equal to it, return 401
        const clientIpAddress = req.headers["x-forwarded-for"] || req.ip;
        console.log(`Receviced Request from IP ${clientIpAddress} but got invalid password.`);
        return res.status(401).json({error: {code: 403, message: "Invalid Password"}});
    }

    next();
}

// Path: cookieUtils.mjs
class ClientState {
    #closed = false;

    setClosed(value) {
        this.#closed = Boolean(value);
    }

    isClosed() {
        return this.#closed;
    }
}

export const clientState = new ClientState();