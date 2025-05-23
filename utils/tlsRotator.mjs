import {applyGlobalTLSConfig} from './tlsConfig.mjs';
import {EventEmitter} from 'events';

class TLSRotator extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            // 2小时刷新
            rotationInterval: parseInt(process.env.TLS_ROTATION_INTERVAL || '2', 10) * 60 * 60 * 1000,
            // 随机变动
            randomizeInterval: process.env.TLS_RANDOMIZE_INTERVAL !== 'false',
            ...options
        };

        this.lastRotation = Date.now();
        this.timer = null;
        this.currentConfig = null;
    }

    /**
     * 启动TLS配置轮换
     * @returns {boolean}
     */
    start() {
        if (this.timer) {
            return false;
        }
        this.rotate();

        this.scheduleNextRotation();
        return true;
    }

    /**
     * 停止TLS配置轮换
     * @returns {boolean}
     */
    stop() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
            return true;
        }
        return false;
    }

    /**
     * 立即轮换TLS
     * @returns {Object}
     */
    rotate() {
        this.currentConfig = applyGlobalTLSConfig();
        this.lastRotation = Date.now();
        this.emit('rotation', this.currentConfig);
        return this.currentConfig;
    }

    /**
     * 安排下一次
     * @private
     */
    scheduleNextRotation() {
        if (this.timer) {
            clearTimeout(this.timer);
        }

        let nextInterval = this.options.rotationInterval;

        if (this.options.randomizeInterval) {
            // -20分钟至+40分钟的随机变动
            const randomOffset = (Math.random() * 60 - 20) * 60 * 1000;
            nextInterval += randomOffset;
        }

        nextInterval = Math.max(nextInterval, 30 * 60 * 1000);

        this.timer = setTimeout(() => {
            this.rotate();
            this.scheduleNextRotation();
        }, nextInterval);
    }

    /**
     * 获取当前状态
     * @returns {Object}
     */
    getStatus() {
        return {
            active: !!this.timer,
            lastRotation: new Date(this.lastRotation).toLocaleString(),
            nextRotation: this.timer ?
                new Date(Date.now() + this._getTimeRemaining()).toLocaleString() : null,
            currentConfig: this.currentConfig ? this.currentConfig._id : null
        };
    }

    /**
     * 获取下次轮换剩余时间(毫秒)
     * @private
     * @returns {number}
     */
    _getTimeRemaining() {
        if (!this.timer) return 0;
        const elapsed = Date.now() - this.lastRotation;
        let baseInterval = this.options.rotationInterval;
        if (this.options.randomizeInterval) {
            baseInterval += 15 * 60 * 1000; // +15分钟平均偏移
        }

        return Math.max(0, baseInterval - elapsed);
    }
}

// 创建单例
const tlsRotator = new TLSRotator();

export default tlsRotator;