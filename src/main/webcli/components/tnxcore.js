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

// 不要在Object.prototype中添加函数，否则vue会报错
Object.assign(String.prototype, {
    firstToLowerCase: function() {
        return this.substring(0, 1).toLowerCase() + this.substring(1);
    },
    firstToUpperCase: function() {
        return this.substring(0, 1).toUpperCase() + this.substring(1);
    },
    replaceAll: function(findText, replaceText) {
        const regex = new RegExp(findText, 'g');
        return this.replace(regex, replaceText);
    }
});

Object.assign(Number.prototype, {
    /**
     * 获取当前数值四舍五入到指定精度后的结果
     * @param scale 精度，即小数点后的位数
     * @returns {number} 四舍五入后的结果数值
     */
    toFixed: function(scale) {
        const p = Math.pow(10, scale);
        return Math.round(this * p) / p;
    }
});

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

import md5 from 'md5';
import axios from 'axios';

const util = tnxcore.util = {
    owner: tnxcore,
    md5: md5,
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
    },
    getMetaContent: function(name) {
        const meta = document.querySelector('meta[name="' + name + '"]');
        if (meta) {
            return meta.getAttribute('content');
        }
        return undefined;
    },
    bindResourceLoad: function(element, url, onLoad) {
        if (typeof onLoad === 'function') {
            if (element.readyState) {
                element.onreadystatechange = function() {
                    if (element.readyState === 'loaded' || element.readyState === 'complete') {
                        element.onreadystatechange = null;
                        onLoad(url);
                    }
                }
            } else {
                element.onload = function() {
                    onLoad(url);
                }
            }
        }
    },
    loadLink: function(url, container, callback) {
        const link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        this.bindResourceLoad(link, url, callback);
        link.href = url;

        const node = container.getFirstChildWithoutTagName('link');
        if (node) {
            container.insertBefore(link, node);
        } else {
            container.appendChild(link);
        }
    },
    loadScript: function(url, container, callback) {
        const _this = this;
        if (typeof require === 'function') {
            require([url], function(page) {
                callback(url);
                _this.initPage(page, container);
            });
        } else {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            this.bindResourceLoad(script, url, callback);
            script.src = url;
            container.appendChild(script);
        }
    },
    initPage: function(page, container) {
        if (typeof page === 'function') {
            page(container);
        } else { // 如果页面js组件不是初始化方法，则必须包含onLoad()方法，没有则报错
            page.onLoad(container);
        }
    },
}

const app = tnxcore.app = {
    owner: tnxcore,
    context: '',
    version: undefined,
    init: function(container, callback) {
        // 初始化app环境
        const context = util.getMetaContent('app.context');
        if (context) {
            app.context = context;
        }
        app.version = util.getMetaContent('app.version');

        if (typeof container === 'function') {
            callback = container;
            container = undefined;
        }
        const _this = this;
        this.loadLinks(container, function() {
            _this.loadScripts(container, function() {
                if (typeof callback === 'function') {
                    callback.call();
                }
            });
        });
    },
    getAction: function(url) {
        let href = url || window.location.href;
        // 去掉参数
        let index = href.indexOf('?');
        if (index >= 0) {
            href = href.substr(0, index);
        }
        // 去掉锚点
        index = href.indexOf('#');
        if (index >= 0) {
            href = href.substr(0, index);
        }
        // 去掉协议
        if (href.startsWith('//')) {
            href = href.substr(2);
        } else {
            index = href.indexOf('://');
            if (index >= 0) {
                href = href.substr(index + 3);
            }
        }
        // 去掉域名和端口
        index = href.indexOf('/');
        if (index >= 0) {
            href = href.substr(index);
        }
        // 去掉contextPath
        if (this.context !== '' && this.context !== '/' && href.startsWith(this.context)) {
            href = href.substr(this.context.length);
        }
        // 去掉后缀
        index = href.lastIndexOf('.');
        if (index >= 0) {
            href = href.substr(0, index);
        }
        if (href.endsWith('/')) {
            href = href.substr(0, href.length - 1);
        }
        return href;
    },
    loadedResources: {}, // 保存加载中和加载完成的资源
    loadResources: function(resourceType, container, loadOneFunction, callback, recursive) {
        if (typeof container === 'function') {
            recursive = callback;
            callback = loadOneFunction;
            loadOneFunction = container;
            container = undefined;
        }
        container = container || document.body;

        const _this = this;
        if (recursive !== false) {
            const children = container.querySelectorAll('[' + resourceType + ']');
            children.forEach(function(child) {
                _this.loadResources(resourceType, child, loadOneFunction, null, false);
            });
        }

        let empty = true;
        let resources = container.getAttribute(resourceType);
        if (resources) {
            resources = resources.split(',');
            resources.forEach(function(resource, i) {
                resource = resource.trim();
                const url = container.getAttribute('url');
                let action = _this.getAction(url);
                if (resource === 'true' || resource === 'default') {
                    resource = _this.context + _this.page.context + action + '.' + resourceType;
                }
                if (resource.toLowerCase().endsWith('.' + resourceType)) {
                    // 不包含协议的为相对路径，才需要做路径转换
                    if (resource.indexOf('://') < 0) {
                        if (resource.startsWith('/')) { //以斜杠开头的为相对于站点根路径的相对路径
                            resources[i] = _this.context + resource;
                        } else { // 否则为相对于当前目录的相对路径
                            const index = action.lastIndexOf('/');
                            if (index >= 0) {
                                action = action.substr(0, index);
                            }
                            resources[i] = _this.context + _this.page.context + action + '/' + resource;
                        }
                    }
                    if (_this.version) { // 脚本路径附加应用版本信息，以更新客户端缓存
                        resources[i] += '?v=' + _this.version;
                    }
                    _this.loadedResources[resource] = false;
                } else { // 无效的脚本文件置空
                    resources[i] = undefined;
                }
            });

            resources.forEach(function(resource) {
                if (resource) {
                    empty = false;
                    loadOneFunction.call(util, resource, container, function(url) {
                        _this.loadedResources[url] = true;
                        if (typeof callback === 'function' && _this.isAllLoaded(resources)) {
                            callback.call(_this);
                        }
                    });
                }
            });
        }
        if (empty && typeof callback === 'function') {
            callback.call(this);
        }
    },
    isAllLoaded: function(resources) {
        const _this = this;
        for (let i = 0; i < resources.length; i++) {
            const resource = resources[i];
            if (_this.loadedResources[resource] !== true) {
                return false;
            }
        }
        return true;
    },
    loadLinks: function(container, callback) {
        if (typeof container === 'function') {
            callback = container;
            container = undefined;
        }
        this.loadResources('css', container, util.loadLink, callback);
    },
    loadScripts: function(container, callback) {
        if (typeof container === 'function') {
            callback = container;
            container = undefined;
        }
        this.loadResources('js', container, util.loadScript, callback);
    },
    buildCsrfField: function(form) {
        const meta = document.querySelector('meta[name="csrf"]');
        if (meta) {
            const name = meta.getAttribute('parameter');
            const value = meta.getAttribute('content');
            if (name && value) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = name;
                input.value = value;
                form.appendChild(input);
            }
        }
    },
};

app.rpc = {
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
        this.owner.owner.alert('错误', message);
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
    metas: {},
    getMeta: function(url, callback) {
        const metas = this.metas;
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
}

app.page = {
    owner: app,
    context: "/pages",
};

export default tnxcore;
