// tnxcore.js
/**
 * 原生JavaScript的扩展支持
 */

// 基础工具方法
/**
 * 将指定对象中的所有字段拼凑成形如a=a1&b=b1的字符串
 * @param object 对象
 * @returns {string} 拼凑成的字符串
 */
Object.stringify = function(object) {
    let s = "";
    Object.keys(object).forEach(function(key) {
        let value = object[key];
        if (value instanceof Array) {
            value.forEach(function(v) {
                s += "&" + key + "=" + v;
            });
        } else {
            s += "&" + key + "=" + value;
        }
    });
    if (s.length > 0) {
        s = s.substr(1);
    }
    return s;
};

Function.around = function(target, around) {
    return function() {
        let args = [target];
        for (let i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        return around.apply(this, args);
    }
};

// Prototype
// 不要在Object.prototype中添加函数，否则vue会报错
Object.assign(String.prototype, {
    firstToLowerCase: function() {
        return this.substring(0, 1).toLowerCase() + this.substring(1);
    },
    firstToUpperCase: function() {
        return this.substring(0, 1).toUpperCase() + this.substring(1);
    },
    replaceAll: function(findText, replaceText) {
        let regex = new RegExp(findText, "g");
        return this.replace(regex, replaceText);
    }
});

String.prototype.startsWith = String.prototype.startsWith || function(searchString, position) {
    position = position > 0 ? position | 0 : 0;
    return this.substring(position, position + searchString.length) === searchString;
};

String.prototype.endsWith = String.prototype.endsWith || function(searchString, endPosition) {
    if (endPosition === undefined || endPosition > this.length) {
        endPosition = this.length;
    }
    return this.substring(endPosition - searchString.length, endPosition) === searchString;
};

Object.assign(Array.prototype, {
    contains: function(element) {
        for (let e of this) {
            if (e === element) {
                return true;
            }
        }
        return false;
    },
    containsIgnoreCase: function(element) {
        if (typeof element == "string") {
            for (let e of this) {
                if (typeof e == "string" && e.toLocaleLowerCase() === element.toLocaleLowerCase()) {
                    return true;
                }
            }
        }
        return false;
    }
});

Object.assign(Number.prototype, {
    toFixed: function(scale) {
        let p = Math.pow(10, scale);
        return Math.round(this * p) / p;
    }
});

Object.assign(Element.prototype, {
    prependChild: function(child) {
        if (this.hasChildNodes()) {
            this.insertBefore(child, this.firstChild);
        } else {
            this.appendChild(child);
        }
        return this;
    },
    /**
     * 获取不是指定标签的第一个子节点
     * @param tagName 标签名
     * @return ChildNode 不是指定标签的第一个子节点，没有则返回undefined
     */
    getFirstChildWithoutTagName: function(tagName) {
        let children = this.childNodes;
        for (let i = 0; i < children.length; i++) {
            if (children[i].tagName && children[i].tagName !== tagName.toUpperCase()) {
                return children[i];
            }
        }
        return undefined;
    }
});

let app_config = Object.assign({
    locale: "zh_CN",
    path: "",
    lib: "/tnxweb",
    min: "",
}, app_config);

const tnx = {
    locale: app_config.locale,
    context: app_config.lib,
    alert: function(title, message, callback) {
        if (message === undefined && callback === undefined) {
            message = title;
            title = undefined;
        } else if (typeof message == "function") {
            callback = message;
            message = title;
            title = undefined;
        }
        let content = title ? (title + ":\n" + message) : message;
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
        let yes = confirm(title + ":\n" + message);
        if (typeof callback == "function") {
            callback(yes);
        }
    }
};


import md5 from 'md5';

tnx.util = {
    owner: tnx,
    md5: md5,
    replaceTag: function(html, sourceTag, targetTag) {
        return html.replace(new RegExp("<" + sourceTag + " ", "i"), "<" + targetTag + " ")
        .replace(new RegExp("<" + sourceTag + ">", "i"), "<" + targetTag + ">")
        .replace(new RegExp("</" + sourceTag + ">", "i"), "</" + targetTag + ">")
    },
    bindResourceLoad: function(element, url, onLoad) {
        if (typeof onLoad == "function") {
            if (element.readyState) {
                element.onreadystatechange = function() {
                    if (element.readyState === "loaded" || element.readyState === "complete") {
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
        let link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        this.bindResourceLoad(link, url, callback);
        link.href = url;

        let node = container.getFirstChildWithoutTagName("link");
        if (node) {
            container.insertBefore(link, node);
        } else {
            container.appendChild(link);
        }
    },
    loadScript: function(url, container, callback) {
        let _this = this;
        if (typeof require == "function") {
            require([url], function(page) {
                callback(url);
                _this.initPage(page, container);
            });
        } else {
            let script = document.createElement("script");
            script.type = "text/javascript";
            this.bindResourceLoad(script, url, callback);
            script.src = url;
            container.appendChild(script);
        }
    },
    initPage: function(page, container) {
        if (typeof page == "function") {
            page(container);
        } else { // 如果页面js组件不是初始化方法，则必须包含onLoad()方法，没有则报错
            page.onLoad(container);
        }
    },
    createObjectUrl: function(file) {
        if (window.createObjectURL) {
            return window.createObjectURL(file);
        } else if (window.URL && window.URL.createObjectURL) {
            return window.URL.createObjectURL(file);
        } else if (window.webkitURL && window.webkitURL.createObjectURL) {
            return window.webkitURL.createObjectURL(file);
        }
        return undefined;
    },
    revokeObjectUrl: function(url) {
        if (window.revokeObjectURL) {
            window.revokeObjectURL(url);
        } else if (window.URL && window.URL.revokeObjectURL) {
            window.URL.revokeObjectURL(url);
        } else if (window.webkitURL && window.webkitURL.revokeObjectURL) {
            window.webkitURL.revokeObjectURL(url);
        }
    },
    getCapacityCaption: function(byteValue) {
        let unit = 1024;
        if (byteValue < unit) {
            return byteValue + "B";
        }
        let kB = byteValue / unit;
        if (kB < unit) {
            return kB.toFixed(3) + "KB";
        }
        let mB = kB / unit;
        return mB.toFixed(3) + "MB";
    },
    appendExtension: function(url, extension) {
        let index = url.indexOf("?");
        let queryString = "";
        if (index >= 0) {
            queryString = url.substr(index);
            url = url.substr(0, index);
        }
        index = url.lastIndexOf("/");
        if (index >= 0 && url.indexOf(".", index + 1) < 0) {
            if (!extension.startsWith(".")) {
                extension = "." + extension;
            }
            url += extension;
        }
        return url + queryString;
    }
};

tnx.app = {
    owner: tnx,
    context: app_config.path, // app_config不能使用context，否则会出现不明错误
    version: app_config.version,
    min: app_config.min,
    init: function(container, callback) {
        if (typeof container == "function") {
            callback = container;
            container = undefined;
        }
        let _this = this;
        this.loadLinks(container, function() {
            _this.loadScripts(container, function() {
                if (typeof callback == "function") {
                    callback.call();
                }
            });
        });
    },
    getAction: function(url) {
        let href = url || window.location.href;
        // 去掉参数
        let index = href.indexOf("?");
        if (index >= 0) {
            href = href.substr(0, index);
        }
        // 去掉锚点
        index = href.indexOf("#");
        if (index >= 0) {
            href = href.substr(0, index);
        }
        // 去掉协议
        if (href.startsWith("//")) {
            href = href.substr(2);
        } else {
            index = href.indexOf("://");
            if (index >= 0) {
                href = href.substr(index + 3);
            }
        }
        // 去掉域名和端口
        index = href.indexOf("/");
        if (index >= 0) {
            href = href.substr(index);
        }
        // 去掉contextPath
        if (this.context !== "" && this.context !== "/" && href.startsWith(this.context)) {
            href = href.substr(this.context.length);
        }
        // 去掉后缀
        index = href.lastIndexOf(".");
        if (index >= 0) {
            href = href.substr(0, index);
        }
        if (href.endsWith("/")) {
            href = href.substr(0, href.length - 1);
        }
        return href;
    },
    loadedResources: {}, // 保存加载中和加载完成的资源
    loadResources: function(resourceType, container, loadOneFunction, callback, recursive) {
        if (typeof container == "function") {
            recursive = callback;
            callback = loadOneFunction;
            loadOneFunction = container;
            container = undefined;
        }
        container = container || document.body;

        let _this = this;
        if (recursive !== false) {
            let children = container.querySelectorAll("[" + resourceType + "]");
            children.forEach(function(child) {
                _this.loadResources(resourceType, child, loadOneFunction, null, false);
            });
        }

        let empty = true;
        let resources = container.getAttribute(resourceType);
        if (resources) {
            resources = resources.split(",");
            resources.forEach(function(resource, i) {
                resource = resource.trim();
                let url = container.getAttribute("url");
                let action = _this.getAction(url);
                if (resource === "true" || resource === "default") {
                    resource = _this.context + _this.page.context + action + "." + resourceType;
                }
                if (resource.toLowerCase().endsWith("." + resourceType)) {
                    // 不包含协议的为相对路径，才需要做路径转换
                    if (resource.indexOf("://") < 0) {
                        if (resource.startsWith("/")) { //以斜杠开头的为相对于站点根路径的相对路径
                            resources[i] = _this.context + resource;
                        } else { // 否则为相对于当前目录的相对路径
                            let index = action.lastIndexOf("/");
                            if (index >= 0) {
                                action = action.substr(0, index);
                            }
                            resources[i] = _this.context + _this.page.context + action + "/" + resource;
                        }
                    }
                    if (_this.version) { // 脚本路径附加应用版本信息，以更新客户端缓存
                        resources[i] += "?v=" + _this.version;
                    }
                    _this.loadedResources[resource] = false;
                } else { // 无效的脚本文件置空
                    resources[i] = undefined;
                }
            });

            resources.forEach(function(resource) {
                if (resource) {
                    empty = false;
                    loadOneFunction.call(tnx.util, resource, container, function(url) {
                        _this.loadedResources[url] = true;
                        if (typeof callback == "function" && _this.isAllLoaded(resources)) {
                            callback.call(_this);
                        }
                    });
                }
            });
        }
        if (empty && typeof callback == "function") {
            callback.call(this);
        }
    },
    isAllLoaded: function(resources) {
        let _this = this;
        for (let i = 0; i < resources.length; i++) {
            let resource = resources[i];
            if (_this.loadedResources[resource] !== true) {
                return false;
            }
        }
        return true;
    },
    loadLinks: function(container, callback) {
        if (typeof container == "function") {
            callback = container;
            container = undefined;
        }
        this.loadResources("css", container, tnx.util.loadLink, callback);
    },
    loadScripts: function(container, callback) {
        if (typeof container == "function") {
            callback = container;
            container = undefined;
        }
        this.loadResources("js", container, tnx.util.loadScript, callback);
    },
    buildCsrfField: function(form) {
        let meta = document.querySelector("meta[name='csrf']");
        if (meta) {
            let name = meta.getAttribute("parameter");
            let value = meta.getAttribute("content");
            if (name && value) {
                let input = document.createElement("input");
                input.type = "hidden";
                input.name = name;
                input.value = value;
                form.appendChild(input);
            }
        }
    }
};

import axios from 'axios';

tnx.app.rpc = {
    owner: tnx.app,
    axios: axios,
    loginSuccessRedirectParameter: "_next",
    init: function(axios) {
        this.axios = axios;
        axios.defaults.baseURL = this.owner.context; // 默认用当前站点上下文作为基本路径
        let _this = this;
        this.get("/api/meta/context", function(context) {
            if (context.baseUrl) {
                axios.defaults.baseURL = context.baseUrl;
            }
            this.loginSuccessRedirectParameter = context.loginSuccessRedirectParameter;
            // 不以斜杠开头说明基本路径为跨域访问路径
            if (!axios.defaults.baseURL.startsWith("/")) {
                axios.defaults.withCredentials = true;
            }
            Object.assign(axios.defaults.headers.common, context.headers, {
                "X-Requested-With": "XMLHttpRequest"
            });
            _this.context = context.context || {}; // 其它站点的上下文根路径
        });
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
            let baseUrl = this.context[options.base];
            if (baseUrl) {
                url = baseUrl + url;
            }
        }
        let config = {
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
                let ratio = (event.loaded / event.total) || 0;
                options.onUploadProgress.call(event, ratio);
            }
        }
        this.axiosRequest(url, config, options);
    },
    axiosRequest: function(url, config, options) {
        let _this = this;
        this.axios(url, config).then(function(response) {
            if (response.headers.redirect) {
                config.params = config.params || {};
                config.params[_this.loginSuccessRedirectParameter] = config.referer;
                _this.axiosRequest(response.headers.redirect, config, options);
            } else if (typeof options.success == "function") {
                options.success(response.data);
            }
        }).catch(function(error) {
            let response = error.response;
            if (response) {
                switch (response.status) {
                    case 401: {
                        _this.toLoginForm();
                        return;
                    }
                    case 403: {
                        let errors = response.data.errors;
                        if (errors) {
                            if (typeof options.error == "function") {
                                options.error(errors);
                            } else {
                                _this.error(errors);
                            }
                        }
                        return;
                    }
                }
            }
            console.error(error.stack);
        });
    },
    toLoginForm: function() {
        console.info('toLoginForm');
    },
    getCsrfHeader: function() {
        let meta = document.querySelector("meta[name='csrf']");
        if (meta) {
            let name = meta.getAttribute("header");
            let value = meta.getAttribute("content");
            if (name && value) {
                let result = {};
                result[name] = value;
                return result;
            }
        }
        return undefined;
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
        tnx.alert("错误", message);
    },
    metas: {},
    getMeta: function(url, callback) {
        let _this = this;
        if (this[url]) {
            if (typeof callback == "function") {
                callback(this[url]);
            }
        } else {
            this.get("/api/meta/method", {
                url: url
            }, function(meta) {
                _this[url] = meta;
                if (typeof callback == "function") {
                    callback(meta);
                }
            });
        }
    }
};

tnx.app.page = {
    owner: tnx.app,
    context: "/pages",
    init: function() {
    }
};

export default tnx;
