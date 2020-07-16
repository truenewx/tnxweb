// tnxcore-app-rpc.js
import util from "./tnxcore-util";
import axios from "axios";

export default {
    loginSuccessRedirectParameter: '_next',
    context: {},
    getBaseUrl: function() {
        return axios.defaults.baseURL;
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
            axios.defaults.baseURL = baseUrl;
        }
        const _this = this;
        this.get('/api/meta/context', function(context) {
            _this.setConfig(context);
            if (typeof callback === 'function') {
                callback(context);
            }
        });
    },
    setConfig: function(config) {
        if (config.baseUrl) {
            axios.defaults.baseURL = config.baseUrl;
        }
        if (config.loginSuccessRedirectParameter) {
            this.loginSuccessRedirectParameter = config.loginSuccessRedirectParameter;
        }
        if (config.context) { // 其它站点的上下文根路径
            this.context = config.context;
        }
        // 不以斜杠开头说明基本路径为跨域访问路径
        if (!axios.defaults.baseURL.startsWith('/')) {
            axios.defaults.withCredentials = true;
        }
        // 声明为AJAX请求
        Object.assign(axios.defaults.headers.common, config.headers, {
            'X-Requested-With': 'XMLHttpRequest'
        });
    },
    get: function(url, params, callback, options) {
        if (typeof params === 'function' || (callback && typeof callback === 'object')) {
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
        if (typeof body === 'function' || (callback && typeof callback === 'object')) {
            options = callback;
            callback = body;
            body = undefined;
        }
        if (typeof options === 'function') {
            options = {
                error: options
            };
        }
        options = Object.assign({}, options, {
            method: 'post',
            body: body,
            success: callback,
        });
        this.request(url, options);
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
        this._request(url, config, options);
    },
    _request: function(url, config, options) {
        const _this = this;
        axios(url, config).then(function(response) {
            if (_this._redirectRequest(response, config, options)) { // 执行了重定向跳转，则不作后续处理
                return;
            }
            if (typeof options.success === 'function') {
                options.success(response.data);
            }
        }).catch(function(error) {
            const response = error.response;
            if (response) {
                if (_this._isIgnored(options, response.status)) {
                    return;
                }
                if (_this._redirectRequest(response, config, options)) { // 执行了重定向跳转，则不作后续处理
                    return;
                }
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
                            // 原始地址是登录验证地址或登出地址，视为框架特有请求，无需应用做个性化处理
                            if (originalUrl === _this._ensureLoginedUrl || originalUrl.endsWith('/logout')) {
                                originalUrl = undefined;
                                originalMethod = undefined;
                            }
                            if (_this.toLogin(loginUrl, originalUrl, originalMethod)) {
                                return;
                            }
                        }
                        break;
                    }
                    case 400: {
                        let errors = response.data.errors;
                        if (errors) { // 字段格式异常
                            errors.forEach(error => {
                                error.message = error.field + error.defaultMessage;
                            });
                            // 转换错误消息之后，与403错误做相同处理
                            if (_this._handleErrors(errors, options)) {
                                return;
                            }
                        }
                        break;
                    }
                    case 403: {
                        if (_this._handleErrors(response.data.errors, options)) {
                            return;
                        }
                        break;
                    }
                }
            }
            console.error(error.stack);
        });
    },
    _redirectRequest: function(response, config, options) {
        let redirectUrl = util.getHeader(response.headers, 'Redirect-To');
        if (redirectUrl) { // 指定了重定向地址，则执行重定向操作
            if (this._isIgnored(options, 'Redirect-To')) {
                return true;
            }
            config.headers = config.headers || {};
            config.headers['Original-Request'] = options.method + ' ' + config.referer;
            config.method = 'GET'; // 重定向一定是GET请求
            this._request(redirectUrl, config, options);
            return true;
        }
        return false;
    },
    _isIgnored: function(options, type) {
        if (options && options.ignored) {
            if (options.ignored instanceof Array) {
                return options.ignored.contains(type);
            } else {
                return options.ignored === type;
            }
        }
        return false;
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
    _handleErrors: function(errors, options) {
        if (errors) {
            if (options && typeof options.error === 'function') {
                options.error(errors);
            } else {
                this.error(errors);
            }
            return true;
        }
        return false;
    },
    error: function(errors) {
        const message = this.getErrorMessage(errors);
        if (this.owner && this.owner.owner && typeof this.owner.owner.alert === 'function') {
            this.owner.owner.alert(message, '错误');
        } else {
            alert(message);
        }
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
    _ensureLoginedUrl: '/authentication/validate',
    ensureLogined: function(callback) {
        this.get(this._ensureLoginedUrl, callback);
    },
    _metas: {},
    getMeta: function(url, callback) {
        const metas = this._metas;
        if (metas[url]) {
            if (typeof callback === 'function') {
                callback(metas[url]);
            }
        } else {
            this.get('/api/meta/method', {
                url: url
            }, function(meta) {
                metas[url] = meta;
                if (typeof callback === 'function') {
                    callback(meta);
                }
            });
        }
    },
};