// 基础工具方法
/**
 * 扩展对象，将参数列表中的非首个参数对象中的属性依次赋值到首个参数对象中
 * @return 首个参数对象（被扩展后的）
 */
function extend() {
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
}

/**
 * 设定命名空间
 * @param namespace 以.分隔的命名空间名称
 */
function namespace(namespace) {
    var names = namespace.split(".");
    var space = undefined;
    // 判断第一级对象是否已存在，若不存在则初始化为{}
    eval("if(typeof " + names[0] + " === 'undefined'){" + names[0] + " = {};}");
    // 取得第一级对象的引用
    eval("space = " + names[0] + ";");
    // 创建剩余级次的对象
    for (var i = 1; i < names.length; i++) {
        var name = names[i];
        space[name] = space[name] || {};
        space = space[name];
    }
}

// Prototype
extend(Object.prototype, {
    extend: function() {
        var args = [this].concat(arguments);
        return extend(args);
    }
});

extend(String.prototype, {
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

extend(Element.prototype, {
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

tnx = {
    version: "3.0",
    encoding: "UTF-8",
    locale: "zh_CN",
    context: "/tnxweb",
};

tnx.util = {}

tnx.app = {
    context: "",
    version: undefined,
    init: function(options) {
        options = options || {};
        if (options.context) {
            this.context = options.context;
        }
        this.version = options.version;
        if (options.page) {
            if (options.page.context) {
                this.page.context = options.page.context;
            }
        }
        var _this = this;
        this.loadLinks(function() {
            _this.loadScripts(function() {
                if (typeof (options.onLoad) == "function") {
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
        if (typeof (container) == "function") {
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
                    loadOneFunction.call(_this, resource, container, function(url) {
                        _this.loadedResources[url] = true;
                        if (typeof (callback) == "function" && _this.isAllLoaded(resources)) {
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
    bindResourceLoad: function(element, url, onLoad) {
        if (typeof (onLoad) == "function") {
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
    loadLinks: function(container, callback) {
        if (typeof (container) == "function") {
            callback = container;
            container = undefined;
        }
        this.loadResources("css", container, this.loadLink, callback);
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
    loadScripts: function(container, callback) {
        if (typeof (container) == "function") {
            callback = container;
            container = undefined;
        }
        this.loadResources("js", container, this.loadScript, callback);
    },
    loadScript: function(url, container, callback) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        this.bindResourceLoad(script, url, callback);
        script.src = url;

        container.appendChild(script);
    }
};

tnx.app.page = {
    app: tnx.app,
    context: "/pages",
    init: function(options) {
    }
};

