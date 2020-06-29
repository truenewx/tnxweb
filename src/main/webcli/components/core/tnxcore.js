// tnxcore.js
/**
 * 基于原生JavaScript的扩展支持
 */

const tnxcore = {
    base: { // 标记是基于原生JavaScript的扩展
        name: 'core',
        type: {}
    },
    alert: function(title, message, callback) {
        if (message === undefined && callback === undefined) {
            message = title;
            title = undefined;
        } else if (typeof message == "function") {
            callback = message;
            message = title;
            title = undefined;
        }
        const content = title ? (title + ":\n" + message) : message;
        alert(content);
        if (typeof callback == "function") {
            callback();
        }
    },
    error: function(message, callback) {
        this.alert("错误", message, callback);
    },
    confirm: function(title, message, callback) {
        if (message === undefined && callback === undefined) {
            message = title;
            title = undefined;
        } else if (typeof message == "function") {
            callback = message;
            message = title;
            title = undefined;
        }
        const yes = confirm(title + ":\n" + message);
        if (typeof callback == "function") {
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
    name: 'tnx.app',
};

import axios from 'axios';

tnxcore.app.rpc = {
    owner: tnxcore.app,
    axios: axios,
    loginSuccessRedirectParameter: "_next",
    /**
     * 从后端服务器加载配置
     * @param baseUrl 获取配置的后端服务器基础路径
     * @param callback 配置初始化后的回调函数
     */
    loadConfig: function(baseUrl, callback) {
        this.axios.defaults.baseURL = baseUrl;
        const _this = this;
        this.get("/api/meta/context", function(context) {
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
        if (!this.axios.defaults.baseURL.startsWith("/")) {
            this.axios.defaults.withCredentials = true;
        }
        Object.assign(this.axios.defaults.headers.common, config.headers, {
            "X-Requested-With": "XMLHttpRequest"
        });
        this.context = config.context || {}; // 其它站点的上下文根路径
    },
    get: function(url, params, callback, options) {
        if (typeof params == "function" || typeof callback == "object") {
            options = callback;
            callback = params;
            params = undefined;
        }
        if (typeof options == "function") {
            options = {
                error: options
            };
        }
        this.request(url, Object.assign({}, options, {
            method: "get",
            params: params,
            success: callback,
        }));
    },
    post: function(url, body, callback, options) {
        if (typeof body == "function" || typeof callback == "object") {
            options = callback;
            callback = body;
            body = undefined;
        }
        if (typeof options == "function") {
            options = {
                error: options
            };
        }
        this.request(url, Object.assign({}, options, {
            method: "post",
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
        if (typeof options.onUploadProgress == "function") {
            config.onUploadProgress = function(event) {
                const ratio = (event.loaded / event.total) || 0;
                options.onUploadProgress.call(event, ratio);
            }
        }
        this.axiosRequest(url, config, options);
    },
    axiosRequest: function(url, config, options) {
        const _this = this;
        this.axios(url, config).then(function(response) {
            if (typeof options.success == "function") {
                options.success(response.data);
            }
        }).catch(function(error) {
            const response = error.response;
            if (response) {
                switch (response.status) {
                    case 401: {
                        const util = _this.owner.owner.util;
                        const redirectTo = util.getHeader(response.headers, "Redirect-To");
                        if (redirectTo) {
                            config.params = config.params || {};
                            config.params[_this.loginSuccessRedirectParameter] = config.referer;
                            _this.axiosRequest(redirectTo, config, options);
                            return;
                        } else {
                            let loginFormUrl = util.getHeader(response.headers, "Login-Form-Url");
                            if (loginFormUrl) { // 默认登录后跳转回当前页面
                                loginFormUrl += "&" + _this.loginSuccessRedirectParameter + "=" + window.location.href;
                            }
                            if (_this.toLoginForm(loginFormUrl)) {
                                return;
                            }
                        }
                        break;
                    }
                    case 403: {
                        const errors = response.data.errors;
                        if (errors) {
                            if (typeof options.error == "function") {
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
     * @returns {boolean} 是否已经正常打开登录表单
     */
    toLoginForm: function(loginFormUrl) {
        return false;
    },
    getErrorMessage: function(errors) {
        let message = "";
        if (errors instanceof Array) {
            for (let i = 0; i < errors.length; i++) {
                message += errors[i].message + "\n";
            }
        }
        return message.trim();
    },
    error: function(errors) {
        let message = this.getErrorMessage(errors);
        this.owner.owner.alert("错误", message);
    },
}

export default tnxcore;
