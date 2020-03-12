// tnx.js，原生JavaScript的扩展支持，兼容ES5

// 基础工具方法
if (typeof Object.assign != "function") {
    /**
     * 合并对象，将参数列表中的非首个参数对象中的属性依次合并到首个参数对象中
     * @return 合并的目标对象，即参数列表中的首个参数对象
     */
    Object.assign = function() {
        var length = arguments.length;
        if (length == 0) {
            return undefined;
        }
        var target = arguments[0] || {};
        if (typeof target != "object" && typeof target != "function") {
            target = {};
        }
        if (length == 1) {
            return target;
        }
        for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            for (var key in source) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
}

Function.around = function(target, around) {
    return function() {
        var args = [target];
        for (var i = 0; i < arguments.length; i++) {
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
        var regex = new RegExp(findText, "g");
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
        var children = this.childNodes;
        for (var i = 0; i < children.length; i++) {
            if (children[i].tagName && children[i].tagName != tagName.toUpperCase()) {
                return children[i];
            }
        }
        return undefined;
    }
});

app_config = Object.assign({
    locale: "zh_CN",
    path: "",
    lib: "/tnxweb",
    min: "",
}, app_config);

var tnx = {
    version: "3.0",
    encoding: "UTF-8",
    locale: app_config.locale,
    context: app_config.lib,
};

tnx.util = {
    owner: tnx,
    bindResourceLoad: function(element, url, onLoad) {
        if (typeof onLoad == "function") {
            if (element.readyState) {
                element.onreadystatechange = function() {
                    if (element.readyState == "loaded" || element.readyState == "complete") {
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
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        this.bindResourceLoad(link, url, callback);
        link.href = url;

        var node = container.getFirstChildWithoutTagName("link");
        if (node) {
            container.insertBefore(link, node);
        } else {
            container.appendChild(link);
        }
    },
    loadScript: function(url, container, callback) {
        var _this = this;
        if (typeof require == "function") {
            require([url], function(page) {
                callback(url);
                _this.initPage(page, container);
            });
        } else {
            var script = document.createElement("script");
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
    }
};

tnx.app = {
    owner: tnx,
    context: app_config.path,
    version: app_config.version,
    min: app_config.min,
    rpc: {
        owner: tnx.app,
    },
    init: function(options) {
        options = options || {};
        if (options.context) {
            this.context = options.context;
        }
        if (options.version) {
            this.version = options.version;
        }
        if (options.page) {
            if (options.page.context) {
                this.page.context = options.page.context;
            }
        }
        var _this = this;
        this.loadLinks(function() {
            _this.loadScripts(function() {
                if (typeof options.onLoad == "function") {
                    options.onLoad.call();
                }
            });
        });
    },
    getAction: function(url) {
        var href = url || window.location.href;
        // 去掉参数
        var index = href.indexOf("?");
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
        if (this.context != "" && this.context != "/" && href.startsWith(this.context)) {
            href = href.substr(this.context.length);
        }
        // 去掉后缀
        index = href.lastIndexOf(".");
        if (index >= 0) {
            href = href.substr(0, index);
        }
        return href;
    },
    loadedResources: {}, // 保存加载中和加载完成的资源
    loadResources: function(resourceType, container, loadOneFunction, callback) {
        if (typeof container == "function") {
            callback = loadOneFunction;
            loadOneFunction = container;
            container = undefined;
        }
        container = container || document.body;

        var resources = container.getAttribute(resourceType);
        if (resources) {
            resources = resources.split(",");
            var _this = this;
            resources.forEach(function(resource, i) {
                resource = resource.trim();
                if (resource == "true" || resource == "default") {
                    var action = _this.getAction();
                    if (!action.endsWith("/")) {
                        resource = action + "." + resourceType;
                        if (resource.startsWith("/")) {
                            resource = resource.substr(1);
                        }
                    }
                }
                if (resource.toLowerCase().endsWith("." + resourceType)) {
                    if (!resource.startsWith("/")) {
                        resources[i] = _this.context + _this.page.context + "/" + resource;
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
                    loadOneFunction.call(tnx.util, resource, container, function(url) {
                        _this.loadedResources[url] = true;
                        if (typeof callback == "function" && _this.isAllLoaded(resources)) {
                            callback.call(_this);
                        }
                    });
                }
            });
        }
    },
    isAllLoaded: function(resources) {
        var _this = this;
        for (var i = 0; i < resources.length; i++) {
            var resource = resources[i];
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
        var meta = document.querySelector("meta[name='csrf']");
        if (meta) {
            var name = meta.getAttribute("parameter");
            var value = meta.getAttribute("content");
            if (name && value) {
                var input = document.createElement("input");
                input.type = "hidden";
                input.name = name;
                input.value = value;
                form.appendChild(input);
            }
        }
    },
    alert: function(title, message, callback) {
        if (message == undefined && callback == undefined) {
            message = title;
            title = undefined;
        } else if (typeof message == "function") {
            callback = message;
            message = title;
            title = undefined;
        }
        alert(title + ":\n" + message);
        if (typeof callback == "function") {
            callback();
        }
    },
    confirm: function(title, message, callback) {
        if (message == undefined && callback == undefined) {
            message = title;
            title = undefined;
        } else if (typeof message == "function") {
            callback = message;
            message = title;
            title = undefined;
        }
        var yes = confirm(title + ":\n" + message);
        callback(yes);
    }
};

Object.assign(tnx.app.rpc, {
    get: function(url, params, resolve, reject) {
        return this.request("get", url, params, resolve, reject);
    },
    post: function(url, params, resolve, reject) {
        return this.request("post", url, params, resolve, reject);
    },
    request: function(method, url, params, resolve, reject) {
        if (typeof params == "function") {
            reject = resolve;
            resolve = params;
            params = undefined;
        }
        if (url.startsWith("/")) { // 相对URL需添加上下文路径
            url = tnx.app.context + url;
        }
        var config = {
            method: method,
            url: url,
            headers: {},
        };
        params = params || {};
        if (method == "post") { // POST请求
            config.data = params; // 默认使用Body传递参数
            if (Object.keys(params).length <= 3) { // 参数个数不超过3个时，同时通过URL传递参数
                config.params = params;
            }
            Object.assign(config.headers, this.getCsrfHeader()); // 加入csrf抵御配置
        } else { // 其它请求均视为GET请求
            config.params = params; // 一律使用URL传递参数
        }

        var _this = this;
        this.axios(config).then(function(response) {
            resolve(response.data);
        }).catch(function(error) {
            var errors = error.response.data.errors;
            if (errors) {
                if (typeof reject == "function") {
                    reject(errors);
                } else {
                    _this.error(errors);
                }
            } else {
                console.error(error.stack);
            }
        });
    },
    getCsrfHeader: function() {
        var meta = document.querySelector("meta[name='csrf']");
        if (meta) {
            var name = meta.getAttribute("header");
            var value = meta.getAttribute("content");
            if (name && value) {
                var result = {};
                result[name] = value;
                return result;
            }
        }
        return undefined;
    },
    getErrorMessage: function(errors) {
        var message = "";
        if (errors instanceof Array) {
            for (var i = 0; i < errors.length; i++) {
                message += errors[i].message + "\n";
            }
        }
        return message.trim();
    },
    error: function(errors) {
        var message = this.getErrorMessage(errors);
        tnx.app.alert("错误", message);
    }
});

tnx.app.page = {
    owner: tnx.app,
    context: "/pages",
    init: function(options) {
    }
};

if (typeof define == "function" && define.amd) {
    define([tnx.context + "/core/vendor/md5-2.1/md5.js", tnx.context + "/core/vendor/axios-0.19.0/axios.js"], function(md5, axios) {
        tnx.util.md5 = md5;
        tnx.app.rpc.axios = axios;
        return tnx;
    });
}
