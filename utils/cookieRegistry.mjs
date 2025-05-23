class CookieRegistry {
    constructor() {
        this.registry = {
            jwtSession: {
                cookieName: "stytch_session",
                domain: "you.com",
                mirror: "ydc_stytch_session", // 镜像名称
                httpOnly: false,
                secure: true,
                sameSite: "Lax"
            },
            jwtToken: {
                cookieName: "stytch_session_jwt",
                domain: "you.com",
                mirror: "ydc_stytch_session_jwt",
                httpOnly: false,
                secure: true,
                sameSite: "Lax"
            },
            ds: {
                cookieName: "DS",
                domain: "you.com",
                httpOnly: false,
                secure: true,
                sameSite: "Lax"
            },
            dsr: {
                cookieName: "DSR",
                domain: "you.com",
                httpOnly: false,
                secure: true,
                sameSite: "Lax"
            },
            you_subscription: {
                cookieName: "you_subscription",
                domain: "you.com",
                httpOnly: false,
                secure: true,
                sameSite: "Lax"
            },
            youpro_subscription: {
                cookieName: "youpro_subscription",
                domain: "you.com",
                httpOnly: false,
                secure: true,
                sameSite: "Lax"
            },
            uuid_guest: {
                cookieName: "uuid_guest",
                domain: "you.com",
                httpOnly: false,
                secure: true,
                sameSite: "Lax",
                dynamic: true, // 标记动态生成
                generator: "uuid" // 生成器类型
            },
            uuid_guest_backup: {
                cookieName: "uuid_guest_backup",
                domain: "you.com",
                httpOnly: false,
                secure: true,
                sameSite: "Lax",
                dynamic: true, // 标记动态生成
                generator: "uuid" // 生成器类型
            },
            safesearch_guest: {
                cookieName: "safesearch_guest",
                domain: "you.com",
                httpOnly: false,
                secure: true,
                sameSite: "Lax",
                defaultValue: "Moderate" // 默认值
            },
            ai_model: {
                cookieName: "ai_model",
                domain: "you.com",
                httpOnly: false,
                secure: true,
                sameSite: "Lax",
                defaultValue: "gpt_4o" // 默认值
            },
            total_query_count: {
                cookieName: "total_query_count",
                domain: "you.com",
                httpOnly: false,
                secure: true,
                sameSite: "Lax",
                defaultValue: "0"
            },
            cf_clearance: {
                cookieName: "cf_clearance",
                domain: "you.com",
                httpOnly: false,
                secure: true,
                sameSite: "Lax",
                maxAge: 86400 // 24小时
            },
            daily_query_date: {
                cookieName: "daily_query_date",
                domain: "you.com",
                httpOnly: false,
                secure: true,
                sameSite: "Lax",
                defaultValue: new Date().toDateString() // 当天日期
            },
            has_dismissed_teams_welcome: {
                cookieName: "has_dismissed_teams_welcome",
                domain: "you.com",
                httpOnly: false,
                secure: true,
                sameSite: "Lax",
                defaultValue: "false"
            },
            youchat_personalization: {
                cookieName: "youchat_personalization",
                domain: "you.com",
                httpOnly: false,
                secure: true,
                sameSite: "Lax",
                defaultValue: "true"
            },
            youchat_smart_learn: {
                cookieName: "youchat_smart_learn",
                domain: "you.com",
                httpOnly: false,
                secure: true,
                sameSite: "Lax",
                defaultValue: "true"
            },
            daily_query_count: {
                cookieName: "daily_query_count",
                domain: "you.com",
                httpOnly: false,
                secure: true,
                sameSite: "Lax",
                defaultValue: "0"
            },
            has_dismissed_lms_certification_nudge: {
                cookieName: "has_dismissed_lms_certification_nudge",
                domain: "you.com",
                httpOnly: false,
                secure: true,
                sameSite: "Lax",
                defaultValue: "true"
            }
        };

        // 映射
        this.fieldNameMap = {};
        for (const [key, config] of Object.entries(this.registry)) {
            this.fieldNameMap[config.cookieName] = key;
            if (config.mirror) {
                this.fieldNameMap[config.mirror] = key;
            }
        }
    }

    /**
     * 获取所有字段
     * @returns {string[]}
     */
    getFieldNames() {
        return Object.keys(this.registry);
    }

    /**
     * 获取内部字段
     * @param {string} cookieName
     * @returns {string|null}
     */
    getFieldNameFromCookieName(cookieName) {
        return this.fieldNameMap[cookieName] || null;
    }

    /**
     * 获取配置
     * @param {string} fieldName
     * @returns {Object|null}
     */
    getFieldConfig(fieldName) {
        return this.registry[fieldName] || null;
    }

    /**
     * 注册新字段
     * @param {string} fieldName
     * @param {Object} config
     */
    registerField(fieldName, config) {
        this.registry[fieldName] = config;
        this.fieldNameMap[config.cookieName] = fieldName;
        if (config.mirror) {
            this.fieldNameMap[config.mirror] = fieldName;
        }
    }

    /**
     * 验证字段是否有效
     * @param {Object} cookieFields
     * @returns {boolean}
     */
    isValidSession(cookieFields) {
        const hasOldSession = cookieFields.jwtSession && cookieFields.jwtToken;
        const hasNewSession = cookieFields.ds;
        return hasOldSession || hasNewSession;
    }

    /**
     * 获取字段默认值
     * @param {string} fieldName
     * @returns {string|null}
     */
    getFieldDefaultValue(fieldName) {
        const config = this.registry[fieldName];
        return config?.defaultValue || null;
    }

    /**
     * 是否动态生成
     * @param {string} fieldName
     * @returns {boolean}
     */
    isDynamicField(fieldName) {
        return this.registry[fieldName]?.dynamic === true;
    }

    /**
     * 字段生成器类型
     * @param {string} fieldName
     * @returns {string|null}
     */
    getFieldGenerator(fieldName) {
        return this.registry[fieldName]?.generator || null;
    }
}

export const cookieRegistry = new CookieRegistry();

/**
 * 注册新字段(便捷)
 * @param {string} fieldName
 * @param {Object} config
 */
export function registerCookieField(fieldName, config) {
    cookieRegistry.registerField(fieldName, config);
}
