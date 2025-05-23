import {registerCookieField} from './cookieRegistry.mjs';

/**
 * 环境变量加载配置
 * @param {Object} config - 配置对象
 */
export function initCookieConfig(config = {}) {
    if (process.env.COOKIE_DOMAIN) {
        updateCookieDomain(process.env.COOKIE_DOMAIN);
    }
}

/**
 * 更新所有 Cookie
 * @param {string} domain - 新域名
 */
export function updateCookieDomain(domain) {
    // 动态修改
    registerCookieField('jwtSession', {
        cookieName: "stytch_session",
        domain,
        mirror: "ydc_stytch_session",
        httpOnly: false,
        secure: true,
        sameSite: "Lax"
    });
    registerCookieField('jwtToken', {
        cookieName: "stytch_session_jwt",
        domain,
        mirror: "ydc_stytch_session_jwt",
        httpOnly: false,
        secure: true,
        sameSite: "Lax"
    });
    registerCookieField('ds', {cookieName: "DS", domain, httpOnly: false, secure: true, sameSite: "Lax"});
    registerCookieField('dsr', {cookieName: "DSR", domain, httpOnly: false, secure: true, sameSite: "Lax"});
    registerCookieField('you_subscription', {
        cookieName: "you_subscription",
        domain,
        httpOnly: false,
        secure: true,
        sameSite: "Lax"
    });
    registerCookieField('youpro_subscription', {
        cookieName: "youpro_subscription",
        domain,
        httpOnly: false,
        secure: true,
        sameSite: "Lax"
    });
    registerCookieField('uuid_guest', {
        cookieName: "uuid_guest",
        domain,
        httpOnly: false,
        secure: true,
        sameSite: "Lax",
        dynamic: true,
        generator: "uuid"
    });
    registerCookieField('uuid_guest_backup', {
        cookieName: "uuid_guest_backup",
        domain,
        httpOnly: false,
        secure: true,
        sameSite: "Lax",
        dynamic: true,
        generator: "uuid"
    });
    registerCookieField('safesearch_guest', {
        cookieName: "safesearch_guest",
        domain,
        httpOnly: false,
        secure: true,
        sameSite: "Lax",
        defaultValue: "Moderate"
    });
    registerCookieField('ai_model', {
        cookieName: "ai_model",
        domain,
        httpOnly: false,
        secure: true,
        sameSite: "Lax",
        defaultValue: "gpt_4o"
    });
    registerCookieField('total_query_count', {
        cookieName: "total_query_count",
        domain,
        httpOnly: false,
        secure: true,
        sameSite: "Lax",
        defaultValue: "0"
    });
    registerCookieField('cf_clearance', {
        cookieName: "cf_clearance",
        domain,
        httpOnly: false,
        secure: true,
        sameSite: "Lax",
        maxAge: 86400 // 24小时
    });
    registerCookieField('daily_query_date', {
        cookieName: "daily_query_date",
        domain,
        httpOnly: false,
        secure: true,
        sameSite: "Lax",
        defaultValue: new Date().toDateString() // 当天日期
    });
    registerCookieField('has_dismissed_teams_welcome', {
        cookieName: "has_dismissed_teams_welcome",
        domain,
        httpOnly: false,
        secure: true,
        sameSite: "Lax",
        defaultValue: "false"
    });
    registerCookieField('youchat_personalization', {
        cookieName: "youchat_personalization",
        domain,
        httpOnly: false,
        secure: true,
        sameSite: "Lax",
        defaultValue: "true"
    });
    registerCookieField('youchat_smart_learn', {
        cookieName: "youchat_smart_learn",
        domain,
        httpOnly: false,
        secure: true,
        sameSite: "Lax",
        defaultValue: "true"
    });
    registerCookieField('daily_query_count', {
        cookieName: "daily_query_count",
        domain,
        httpOnly: false,
        secure: true,
        sameSite: "Lax",
        defaultValue: "0"
    });
    registerCookieField('has_dismissed_lms_certification_nudge', {
        cookieName: "has_dismissed_lms_certification_nudge",
        domain,
        httpOnly: false,
        secure: true,
        sameSite: "Lax",
        defaultValue: "true"
    });
}

/**
 * 注册新Cookie
 * @param {string} fieldName - 内部字段名
 * @param {string} cookieName - 浏览器 Cookie 名称
 * @param {Object} options
 */
export function registerNewCookieField(fieldName, cookieName, options = {}) {
    const config = {
        cookieName,
        domain: options.domain || "you.com",
        mirror: options.mirror || null,
        httpOnly: options.httpOnly || false,
        secure: options.secure !== undefined ? options.secure : true,
        sameSite: options.sameSite || "Lax",
        dynamic: options.dynamic || false,
        generator: options.generator || null,
        defaultValue: options.defaultValue || null
    };

    registerCookieField(fieldName, config);
}
