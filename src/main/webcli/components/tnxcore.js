// tnxcore.js
/**
 * 基于原生JavaScript的扩展支持
 */

/**
 * 将指定对象中的所有字段拼凑成形如a=a1&b=b1的字符串
 * @param object 对象
 * @returns {string} 拼凑成的字符串
 */
Object.stringify = function(object) {
    let s = '';
    Object.keys(object).forEach(function(key) {
        const value = object[key];
        if (value instanceof Array) {
            value.forEach(function(v) {
                s += '&' + key + '=' + v;
            });
        } else {
            s += '&' + key + '=' + value;
        }
    });
    if (s.length > 0) {
        s = s.substr(1);
    }
    return s;
};

Function.around = function(target, around) {
    const _this = this;
    return function() {
        const args = [target];
        for (let i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        return around.apply(_this, args);
    }
};

const tnxcore = {
    base: {
        name: 'core',
        ref: {}
    },
    alert: function(title, message, callback) {
        if (message === undefined && callback === undefined) {
            message = title;
            title = undefined;
        } else if (typeof message === 'function') {
            callback = message;
            message = title;
            title = undefined;
        }
        const content = title ? (title + ':\n' + message) : message;
        alert(content);
        if (typeof callback === 'function') {
            callback();
        }
    },
    error: function(message, callback) {
        this.alert('错误', message, callback);
    },
    confirm: function(title, message, callback) {
        if (message === undefined && callback === undefined) {
            message = title;
            title = undefined;
        } else if (typeof message === 'function') {
            callback = message;
            message = title;
            title = undefined;
        }
        const yes = confirm(title + ':\n' + message);
        if (typeof callback === 'function') {
            callback(yes);
        }
    }
};

tnxcore.util = {
    /**
     * 从指定头信息集中获取指定头信息值
     * @param headers 头信息集
     * @param name 头信息名称
     * @returns {undefined|*} 头信息值
     */
    getHeader: function(headers, name) {
        if (headers && name) {
            return headers[name] || headers[name.toLowerCase()];
        }
        return undefined;
    }
}

tnxcore.app = {
    owner: tnxcore,
};

import axios from 'axios';

tnxcore.app.rpc = {
    owner: tnxcore.app,
    axios: axios,
    loginSuccessRedirectParameter: '_next',
    getBaseUrl: function() {
        return this.axios.defaults.baseURL;
    },
    /**
     * 从后端服务器加载配置
     * @param baseUrl 获取配置的后端服务器基础路径
     * @param callback 配置初始化后的回调函数
     */
    loadConfig: function(baseUrl, callback) {
        if (typeof baseUrl === 'function') {
            callback = baseUrl;
            baseUrl = undefined;
        }
        if (baseUrl) {
            this.axios.defaults.baseURL = baseUrl;
        }
        const _this = this;
        this.get('/api/meta/context', function(context) {
            _this.setConfig(context);
            if (typeof callback === 'function') {
                callback();
            }
        });
    },
    setConfig: function(config) {
        if (config.baseUrl) {
            this.axios.defaults.baseURL = config.baseUrl;
        }
        if (config.loginSuccessRedirectParameter) {
            this.loginSuccessRedirectParameter = config.loginSuccessRedirectParameter;
        }
        // 不以斜杠开头说明基本路径为跨域访问路径
        if (!this.axios.defaults.baseURL.startsWith('/')) {
            this.axios.defaults.withCredentials = true;
        }
        Object.assign(this.axios.defaults.headers.common, config.headers, {
            'X-Requested-With': 'XMLHttpRequest'
        });
        this.context = config.context || {}; // 其它站点的上下文根路径
    },
    get: function(url, params, callback, options) {
        if (typeof params === 'function' || typeof callback === 'object') {
            options = callback;
            callback = params;
            params = undefined;
        }
        if (typeof options === 'function') {
            options = {
                error: options
            };
        }
        this.request(url, Object.assign({}, options, {
            method: 'get',
            params: params,
            success: callback,
        }));
    },
    post: function(url, body, callback, options) {
        if (typeof body === 'function' || typeof callback === 'object') {
            options = callback;
            callback = body;
            body = undefined;
        }
        if (typeof options === 'function') {
            options = {
                error: options
            };
        }
        this.request(url, Object.assign({}, options, {
            method: 'post',
            body: body,
            success: callback,
        }));
    },
    request: function(url, options) {
        if (options.base) {
            const baseUrl = this.context[options.base];
            if (baseUrl) {
                url = baseUrl + url;
            }
        }
        const config = {
            referer: url,
            method: options.method,
            params: options.params,
            data: options.body,
        };
        if (config.params) {
            config.paramsSerializer = function(params) {
                return Object.stringify(params);
            };
        }
        if (typeof options.onUploadProgress === 'function') {
            config.onUploadProgress = function(event) {
                const ratio = (event.loaded / event.total) || 0;
                options.onUploadProgress.call(event, ratio);
            }
        }
        this._callRequest(url, config, options);
    },
    _callRequest: function(url, config, options) {
        const util = this.owner.owner.util;
        const _this = this;
        this.axios(url, config).then(function(response) {
            let redirectUrl = util.getHeader(response.headers, 'Redirect-To');
            if (redirectUrl) { // 指定了重定向地址，则执行重定向操作
                config.headers = config.headers || {};
                config.headers['Original-Request'] = options.method + ' ' + config.referer;
                config.method = 'GET'; // 重定向一定是GET请求
                _this._callRequest(redirectUrl, config, options);
            } else if (typeof options.success === 'function') {
                options.success(response.data);
            }
        }).catch(function(error) {
            const response = error.response;
            if (response) {
                switch (response.status) {
                    case 401: {
                        let loginUrl = util.getHeader(response.headers, 'Login-Url');
                        if (loginUrl) {
                            // 默认登录后跳转回当前页面
                            loginUrl += '&' + _this.loginSuccessRedirectParameter + '=' + window.location.href;
                            const originalRequest = util.getHeader(response.headers, 'Original-Request');
                            let originalMethod;
                            let originalUrl;
                            if (originalRequest) {
                                const array = originalRequest.split(' ');
                                originalMethod = array[0];
                                originalUrl = array[1];
                            }
                            if (_this.toLogin(loginUrl, originalUrl, originalMethod)) {
                                return;
                            }
                        }
                        break;
                    }
                    case 403: {
                        const errors = response.data.errors;
                        if (errors) {
                            if (typeof options.error === 'function') {
                                options.error(errors);
                            } else {
                                _this.error(errors);
                            }
                            return;
                        }
                        break;
                    }
                }
            }
            console.error(error.stack);
        });
    },
    /**
     * 打开登录表单的函数，由业务应用覆盖提供，以决定用何种方式打开登录表单页面。
     * 默认不做任何处理，直接返回false
     * @param loginFormUrl 登录表单URL
     * @param originalUrl 原始请求地址
     * @param originalMethod 原始请求方法
     * @returns {boolean} 是否已经正常打开登录表单
     */
    toLogin: function(loginFormUrl, originalUrl, originalMethod) {
        return false;
    },
    getErrorMessage: function(errors) {
        let message = '';
        if (errors instanceof Array) {
            for (let i = 0; i < errors.length; i++) {
                message += errors[i].message + '\n';
            }
        }
        return message.trim();
    },
    error: function(errors) {
        let message = this.getErrorMessage(errors);
        this.owner.owner.alert('错误', message);
    },
    metas: {},
    getMeta: function(url, callback) {
        const metas = this.metas;
        if (metas[url]) {
            if (typeof callback == 'function') {
                callback(metas[url]);
            }
        } else {
            this.get('/api/meta/method', {
                url: url
            }, function(meta) {
                metas[url] = meta;
                if (typeof callback == 'function') {
                    callback(meta);
                }
            });
        }
    },
}

export default tnxcore;
