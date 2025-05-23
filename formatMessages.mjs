export function formatMessages(messages, proxyModel, randomFileName) {
    // 检查是否是 Claude 模型
    const isClaudeModel = proxyModel.toLowerCase().includes('claude');

    // 启用特殊前缀
    const USE_BACKSPACE_PREFIX = process.env.USE_BACKSPACE_PREFIX === 'true';

    // Clewd 处理
    const CLEWD_ENABLED = process.env.CLEWD_ENABLED === 'true';
    const hasClewdMarker = messages.some(message =>
        typeof message.content === 'string' && message.content.includes('[|CLEWD_TRUE|]')
    );
    if (CLEWD_ENABLED || hasClewdMarker) {
        messages = messages.map(message => {
            if (typeof message.content === 'string') {
                return {
                    ...message,
                    content: message.content.replace(/\[\|CLEWD_TRUE\|]/g, '')
                };
            }
            return message;
        });

        messages = clwdProcess(messages);
    }

    // 定义角色映射
    const roleFeatures = getRoleFeatures(messages, isClaudeModel, USE_BACKSPACE_PREFIX);

    // 清除第一条消息的 role
    messages = clearFirstMessageRole(messages);

    messages = removeCustomRoleDefinitions(messages);

    messages = convertRoles(messages, roleFeatures);

    // 替换 content 中的角色
    messages = replaceRolesInContent(messages, roleFeatures);

    messages = messages.map((message, index) => {
        let newMessage = {...message};
        if (typeof newMessage.content === 'string') {
            const hasFormatTag = newMessage.content.includes('</FORMAT LINE BREAK/>');

            let tempContent = newMessage.content.replace(/<\/FORMAT\s+LINE\s+BREAK\/>/g, '');

            if (hasFormatTag) {
                // 判断是否第一或最后一个内容
                const isFirstContent = index === 0;
                const isLastContent = index === messages.length - 1;

                tempContent = processSpecialLines(tempContent, isFirstContent, isLastContent);

                // 处理多个连续换行
                tempContent = tempContent.replace(/\n{3,}/g, '\n\n');
            }

            newMessage.content = tempContent;
        }
        return newMessage;
    });

    return messages;
}

/**
 * Clewd 处理
 * @param {Array} messages
 * @returns {Array}
 */
function clwdProcess(messages) {
    const prefixs = {
        'user': 'user', // 将messages内部"user"角色在显示时转换为"user"前缀
        'assistant': 'assistant', // 将messages内部"assistant"角色在显示时转换为"assistant"前缀
        'system': 'system', // 将messages内部"system"角色在显示时转换为"system"前缀
        'separator': '', // 使用空字符串作为消息分隔符
        'separator_system': '' // 为系统消息指定一个空分隔符
    };

    if (process.env.CLEWD_CONFIG) {
        try {
            const config = JSON.parse(process.env.CLEWD_CONFIG);
            Object.keys(prefixs).forEach(key => {
                if (config[key] !== undefined) prefixs[key] = config[key];
            });
        } catch (e) {
            console.warn("无法解析 CLEWD_CONFIG 变量:", e);
        }
    }

    // 处理消息
    return messages.map(message => {
        const newMessage = {...message};
        if (typeof newMessage.content !== 'string') return newMessage;

        newMessage.content = hyperProcess(newMessage.content, prefixs);

        return newMessage;
    });
}

/**
 * Clewd 逻辑
 * @param {string} content - 原始内容
 * @param {Object} prefixs - 前缀配置
 * @returns {string}
 */
function hyperProcess(content, prefixs) {
    // 跟踪日志和正则处理
    let regexLogs = '';

    // 正则处理
    let [processedContent, logs1] = hyperRegex(content, 1);
    regexLogs += logs1;

    // 检查合并禁用标志
    const mergeDisable = {
        all: processedContent.includes('<|Merge Disable|>'),
        system: processedContent.includes('<|Merge System Disable|>'),
        user: processedContent.includes('<|Merge Human Disable|>') || processedContent.includes('<|Merge User Disable|>'),
        assistant: processedContent.includes('<|Merge Assistant Disable|>')
    };

    // 处理系统角色转换（如果需要）
    if (!(mergeDisable.all || mergeDisable.system || mergeDisable.user)) {
        // 系统消息处理
        processedContent = processedContent.replace(
            new RegExp(`(\\n\\n|^\\s*)(?<!\\n\\n(${prefixs['user']}|${prefixs['assistant']}):.*?)${prefixs['system']}:\\s*`, 'gs'),
            '$1'
        ).replace(
            new RegExp(`(\\n\\n|^\\s*)${prefixs['system']}: *`, 'g'),
            `\n\n${prefixs['user']}: `
        );
    }

    // 合并内容
    processedContent = hyperMerge(processedContent, prefixs, mergeDisable);

    // 处理 <@N> 标记
    processedContent = handleSubInsertion(processedContent, prefixs);

    // 正则处理
    [processedContent, logs1] = hyperRegex(processedContent, 2);
    regexLogs += logs1;

    // 再次合并内容
    processedContent = hyperMerge(processedContent, prefixs, mergeDisable);

    // 正则处理
    [processedContent, logs1] = hyperRegex(processedContent, 3);
    regexLogs += logs1;

    // 最终清理
    processedContent = finalizeCleanup(processedContent);

    return processedContent;
}

/**
 * 正则处理
 * @param {string} content - 原始内容
 * @param {number} order - 正则处理
 * @returns {Array}
 */
function hyperRegex(content, order) {
    let logs = '';

    // 匹配 <regex order=?> 标签
    const patternRegex = new RegExp(
        `<regex(?: +order *= *(${order}))?>\\s*"\\/([^"]*?)\\/([gimsyu]*)"\\s*:\\s*"(.*?)"\\s*<\\/regex>`,
        'gm'
    );

    let match;
    while ((match = patternRegex.exec(content)) !== null) {
        const entire = match[0];
        const rawPattern = match[2];
        const rawFlags = match[3];
        let replacement = match[4];

        logs += `${entire}\n`;
        try {
            const regObj = new RegExp(rawPattern, rawFlags);
            replacement = JSON.parse(`"${replacement.replace(/\\?"/g, '\\"')}"`);
            content = content.replace(regObj, replacement);
        } catch (err) {
            console.warn(`Regex parse/replace error in block: ${entire}\n`, err);
        }
    }

    return [content, logs];
}

/**
 * 合并相同角色连续消息
 * @param {string} content - 原始内容
 * @param {Object} prefixs - 前缀配置
 * @param {Object} mergeDisable - 合并禁用标志
 * @returns {string}
 */
function hyperMerge(content, prefixs, mergeDisable) {
    if (mergeDisable.all) {
        return content; // 全局禁用合并
    }

    // 获取角色名称
    const sys = prefixs.system;
    const usr = prefixs.user;
    const ast = prefixs.assistant;

    // 合并 system 段落
    if (!mergeDisable.system) {
        const regSys = new RegExp(`(?:\\n\\n|^\\s*)${escapeRegExp(sys)}:\\s*(.*?)(?=\\n\\n(?:${escapeRegExp(usr)}|${escapeRegExp(ast)}|$))`, 'gs');
        content = content.replace(regSys, (_m, p1) => `\n\n${sys}: ${p1}`);
    }

    // 合并 user 段落
    if (!mergeDisable.user) {
        const regUsr = new RegExp(`(?:\\n\\n|^\\s*)${escapeRegExp(usr)}:\\s*(.*?)(?=\\n\\n(?:${escapeRegExp(ast)}|${escapeRegExp(sys)}|$))`, 'gs');
        content = content.replace(regUsr, (_m, p1) => `\n\n${usr}: ${p1}`);
    }

    // 合并 assistant 段落
    if (!mergeDisable.assistant) {
        const regAst = new RegExp(`(?:\\n\\n|^\\s*)${escapeRegExp(ast)}:\\s*(.*?)(?=\\n\\n(?:${escapeRegExp(usr)}|${escapeRegExp(sys)}|$))`, 'gs');
        content = content.replace(regAst, (_m, p1) => `\n\n${ast}: ${p1}`);
    }

    return content;
}

/**
 * 处理 <@N> 插入标记
 * @param {string} content - 原始内容
 * @param {Object} prefixs - 前缀配置
 * @returns {string}
 */
function handleSubInsertion(content, prefixs) {
    // 分割内容
    const splitContent = content.split(new RegExp(`\\n\\n(?=${prefixs.assistant}:|${prefixs.user}:|${prefixs.system}:)`, 'g'));

    // 处理 <@N> 标记
    let match;
    while ((match = /<@(\d+)>(.*?)<\/@\1>/gs.exec(content)) !== null) {
        const idx = splitContent.length - parseInt(match[1], 10) - 1;
        if (idx >= 0 && splitContent[idx]) {
            splitContent[idx] += `\n\n${match[2]}`;
        }
        content = content.replace(match[0], '');
    }

    // 重组内容
    return splitContent.join('\n\n').replace(/<@(\d+)>.*?<\/@\1>/gs, '');
}

/**
 * 最终清理
 * @param {string} content - 原始内容
 * @returns {string}
 */
function finalizeCleanup(content) {
    // 移除正则
    content = content.replace(/<regex( +order *= *\d)?>.*?<\/regex>/gm, '');

    // 统一换行符
    content = content.replace(/\r\n|\r/gm, '\n');

    // 处理特殊标记
    content = content
        .replace(/\s*<\|curtail\|>\s*/g, '\n')
        .replace(/\s*<\|join\|>\s*/g, '')
        .replace(/\s*<\|space\|>\s*/g, ' ')
        .replace(/<\|(\\.*?)\|>/g, (m, p1) => {
            try {
                return JSON.parse(`"${p1.replace(/\\?"/g, '\\"')}"`);
            } catch {
                return m; // 保留原始内容
            }
        });

    // 移除其他标记
    content = content.replace(/\s*<\|(?!padtxt).*?\|>\s*/g, '\n\n');

    // 清理多余空行
    return content.trim().replace(/(?<=\n)\n(?=\n)/g, '');
}

/**
 * 处理特殊行
 * @param {string} content
 * @param {boolean} isFirstContent - 是否是第一个
 * @param {boolean} isLastContent - 是否是最后一个
 * @returns {string}
 */
function processSpecialLines(content, isFirstContent, isLastContent) {
    if (!content) return content;

    // 按行分割
    const lines = content.split('\n');
    const totalLines = lines.length;
    // 标记需要保护的行
    const protectedLines = new Set();
    // 前10行不处理
    if (isFirstContent) {
        for (let i = 0; i < Math.min(10, totalLines); i++) {
            protectedLines.add(i);
        }
    }
    // 最后10行不处理
    if (isLastContent) {
        for (let i = totalLines - Math.min(10, totalLines); i < totalLines; i++) {
            protectedLines.add(i);
        }
    }
    // 跳过受保护的行
    for (let i = 0; i < lines.length; i++) {
        if (protectedLines.has(i)) {
            continue;
        }

        const line = lines[i];
        if (isOnlySpacesOrBackspaces(line)) {
            lines[i] = '';
        }
    }

    // 组合内容
    return lines.join('\n');
}

/**
 * 检查一行是否只包含空格或退格符(\u0008)
 * @param {string} line
 * @returns {boolean}
 */
function isOnlySpacesOrBackspaces(line) {
    if (line === '') return false;
    return /^[\s\u0008]+$/.test(line);
}

/**
 * 将首条消息role置空
 * @param {Array} messages - 消息数组
 * @returns {Array} 处理后的消息数组
 */
function clearFirstMessageRole(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
        return messages;
    }
    const processedMessages = messages.map(msg => ({...msg}));

    processedMessages[0] = {
        ...processedMessages[0],
        role: ''
    };

    return processedMessages;
}

// 获取角色特征
function getRoleFeatures(messages, isClaudeModel, useBackspacePrefix) {
    let prefix = useBackspacePrefix ? '\u0008' : '';
    let systemRole = `${prefix}${isClaudeModel ? 'System' : 'system'}`;
    let userRole = `${prefix}${isClaudeModel ? 'Human' : 'user'}`;
    let assistantRole = `${prefix}${isClaudeModel ? 'Assistant' : 'assistant'}`;

    // 匹配自定义角色
    const rolePattern = /\[\|(\w+)::(.*?)\|\]/g;
    let customRoles = {};
    messages.forEach(message => {
        let content = message.content;
        let match;
        while ((match = rolePattern.exec(content)) !== null) {
            const roleKey = match[1]; // 'system', 'user', 'assistant'
            customRoles[roleKey.toLowerCase()] = match[2];
        }
    });

    if (Object.keys(customRoles).length > 0) {
        prefix = '';

        if (customRoles['system']) {
            systemRole = customRoles['system'];
        }

        if (customRoles['user']) {
            userRole = customRoles['user'];
        }

        if (customRoles['assistant']) {
            assistantRole = customRoles['assistant'];
        }
    }

    return {
        systemRole,
        userRole,
        assistantRole,
        prefix
    };
}

// 移除 messages 自定义角色格式
function removeCustomRoleDefinitions(messages) {
    const rolePattern = /\[\|\w+::.*?\|]/g;

    return messages.map(message => {
        let newContent = message.content.replace(rolePattern, '');
        return {
            ...message,
            content: newContent
        };
    });
}

// 转换角色
function convertRoles(messages, roleFeatures) {
    const {systemRole, userRole, assistantRole} = roleFeatures;
    const roleMap = {
        'system': systemRole,
        'user': userRole,
        'human': userRole,
        'assistant': assistantRole
    };

    return messages.map(message => {
        let currentRole = message.role;

        if (currentRole.startsWith('\u0008')) {
            // 包含前缀不需要转换
            return message;
        } else {
            const roleKey = currentRole.toLowerCase();
            const newRole = roleMap[roleKey] || currentRole;
            return {...message, role: newRole};
        }
    });
}

// 替换 content 中的角色定义
function replaceRolesInContent(messages, roleFeatures) {
    // 避免重复添加
    const roleMap = {
        'System:': roleFeatures.systemRole.replace(roleFeatures.prefix, '') + ':',
        'system:': roleFeatures.systemRole.replace(roleFeatures.prefix, '') + ':',
        'Human:': roleFeatures.userRole.replace(roleFeatures.prefix, '') + ':',
        'human:': roleFeatures.userRole.replace(roleFeatures.prefix, '') + ':',
        'user:': roleFeatures.userRole.replace(roleFeatures.prefix, '') + ':',
        'Assistant:': roleFeatures.assistantRole.replace(roleFeatures.prefix, '') + ':',
        'assistant:': roleFeatures.assistantRole.replace(roleFeatures.prefix, '') + ':',
    };

    // 构建角色正则
    const escapedLabels = Object.keys(roleMap).map(label => escapeRegExp(label));
    const prefixPattern = roleFeatures.prefix ? escapeRegExp(roleFeatures.prefix) : '';

    const roleNamesPattern = new RegExp(`(\\n\\n)(${prefixPattern})?(${escapedLabels.join('|')})`, 'g');

    return messages.map(message => {
        let newContent = message.content;

        if (typeof newContent === 'string') {
            // 仅替换段落开头角色
            newContent = newContent.replace(roleNamesPattern, (match, p1, p2, p3) => {
                const newRoleLabel = roleMap[p3] || p3;
                const prefixToUse = p2 !== undefined ? p2 : roleFeatures.prefix;
                return p1 + (prefixToUse || '') + newRoleLabel;
            });
        } else {
            console.warn('message.content is not a string:', newContent);
            newContent = '';
        }

        return {
            ...message,
            content: newContent
        };
    });
}

/** 转义正则特殊字符 */
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}