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
Object.prototype.extend = function() {
    var args = [this].concat(arguments);
    return extend(args);
}

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

tnx = {
    version: "3.0",
    encoding: "UTF-8",
    locale: "zh_CN",
    context: "/tnxweb",
};

tnx.util = {}

tnx.app = {
    context: "",
    init: function(appContext, pageContext) {
        if (appContext) {
            this.context = appContext;
        }
        this.page.app = this;
        if (pageContext) {
            this.page.context = pageContext;
        }
        this.loadScripts();
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
    loadScripts: function(container) {
        container = container || document.body;
        var scripts = container.getAttribute("js");
        if (scripts) {
            scripts = scripts.split(",");
            var _this = this;
            scripts.forEach(function(script, i) {
                script = script.trim();
                if (script == "true" || script == "default") {
                    var action = _this.getAction();
                    if (!action.endsWith("/")) {
                        script = action + ".js";
                        if (script.startsWith("/")) {
                            script = script.substr(1);
                        }
                    }
                }
                if (script.toLowerCase().endsWith(".js")) {
                    if (!script.startsWith("/")) {
                        scripts[i] = _this.context + _this.page.context + "/" + script;
                    }
                    if (_this.version) { // 脚本路径附加应用版本信息，以更新客户端缓存
                        scripts[i] += "?v=" + _this.version;
                    }
                } else { // 无效的脚本文件置空
                    scripts[i] = undefined;
                }
            });

            scripts.forEach(function(script) {
                if (script) {
                    _this.loadScript(script, container);
                }
            });
        }
    },
    loadScript: function(url, container, callback) {
        if (callback == undefined && typeof (container) == "function") {
            callback = container;
            container = undefined;
        }
        container = container || document.body;
        var script = document.createElement("script");
        script.type = "text/javascript";
        if (typeof (callback) == "function") {
            if (script.readyState) {
                script.onreadystatechange = function() {
                    if (script.readyState == "loaded" || script.readyState == "complete") {
                        script.onreadystatechange = null;
                        callback(url);
                    }
                }
            } else {
                script.onload = function() {
                    callback(url);
                }
            }
        }
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

