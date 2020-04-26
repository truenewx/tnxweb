// tnxbs.js
require.config({
    paths: {
        // 在BootStrap之前声明jquery的路径，以确保BootStrap正常加载
        "jquery": app_config.lib + "/jq/vendor/jquery-3.4.1/jquery" + app_config.min,
        "tnxjq": app_config.lib + "/jq/tnx/js/tnxjq",
        "popper": app_config.lib + "/bs/vendor/popper-1.16.0/js/popper.min",
        "bootstrap": app_config.lib + "/bs/vendor/bootstrap-4.4.1/js/bootstrap" + app_config.min,
    },
    map: {
        "*": {
            "popper.js": "popper"
        }
    }
});

define(["tnxjq", "bootstrap"], function(tnxjq) {
    $.extend(tnxjq, {
        templates: {
            dialog: '<div class="modal fade" tabindex="-1" role="dialog">\n' +
                '  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" role="document">\n' +
                '    <div class="modal-content">\n' +
                '      <div class="modal-header">\n' +
                '        <h5 class="modal-title">${title}</h5>\n' +
                '        <button type="button" class="close" data-dismiss="modal">\n' +
                '          <span>&times;</span>\n' +
                '        </button>\n' +
                '      </div>\n' +
                '      <div class="modal-body">${content}</div>\n' +
                '      <div class="modal-footer"></div>\n' +
                '    </div>\n' +
                '  </div>\n' +
                '</div>',
            toast: '<div class="modal modal-toast" tabindex="-1" role="dialog">\n' +
                '  <div class="modal-dialog modal-dialog-centered" role="document">\n' +
                '    <div class="modal-content">\n' +
                '      <div><i class="far fa-check-circle"></i></div>\n' +
                '      <div class="mt-3">${content}</div>\n' +
                '    </div>\n' +
                '  </div>\n' +
                '</div>',
            loading: '<div class="modal modal-loading" tabindex="-1" role="dialog">\n' +
                '  <div class="modal-dialog modal-dialog-centered" role="document">\n' +
                '    <div class="modal-content">\n' +
                '      <div class="spinner-border text-light" role="status"></div>' +
                '      <div class="mt-3">${content}</div>\n' +
                '    </div>\n' +
                '  </div>\n' +
                '</div>',
        },
        dialog: function(title, content, buttons, options) {
            var modalObject = $(this.templates.dialog);
            $(".modal-title", modalObject).html(title);
            $(".modal-body", modalObject).html(content);
            $("body").append(modalObject);
            modalObject.close = function() {
                modalObject.modal("hide");
            };
            // 处理标题
            if (typeof title == "string") {
                $(".modal-title", modalObject).text(title);
            } else if (title instanceof jQuery) {
                title.replaceAll($(".modal-title", modalObject));
                title.addClass(".modal-title");
            } else {
                $(".modal-header", modalObject).remove();
            }
            // 处理按钮
            var focusBtnObj = undefined;
            var footerObj = modalObject.find(".modal-footer");
            if ($.isArray(buttons)) { // buttons必须为数组形式，否则不会生成按钮
                footerObj.html(""); // 先清空可能已有的按钮
                $.each(buttons, function(index, button) {
                    if (button) {
                        var btnObj = $("<button></button>");
                        btnObj.attr("type", "button");
                        btnObj.text(button.text);
                        btnObj.addClass("btn");
                        btnObj.addClass(button["class"]);
                        if (button.style) {
                            btnObj.attr("style", button.style);
                        }
                        if (button.click) {
                            btnObj.click(function() {
                                button.click.call(modalObject);
                            });
                        } else {
                            btnObj.click(function() {
                                modalObject.close();
                            });
                        }
                        if (button.focus === true) {
                            focusBtnObj = btnObj;
                        }
                        btnObj.appendTo(footerObj);
                    }
                });
            } else {
                footerObj.remove();
            }

            options = options || {};
            // 处理宽度
            if (options.width) {
                $(".modal-dialog", modalObject).addClass("modal-" + options.width);
            }
            var events = options.events;
            // 注册事件
            modalObject.on("shown.bs.modal", function() { // shown事件特殊处理
                if (focusBtnObj) {
                    focusBtnObj.focus();
                }
                if (events && typeof events.shown == "function") {
                    events.shown.call(modalObject);
                }
                modalObject.off("shown.bs.modal");
            });
            modalObject.on("hidden.bs.modal", function() { // hidden事件特殊处理
                if (events && typeof events.hidden == "function") {
                    events.hidden.call(modalObject);
                }
                modalObject.remove(); // 对话框关闭后清除对话框DOM元素
            });
            if (events) {
                if (typeof events.close == "function") {
                    var btnClose = $(".close", modalObject);
                    btnClose.click(function() {
                        events.close.call(modalObject);
                    });
                } else if (typeof events.show == "function") {
                    modalObject.on("show.bs.modal", function() {
                        events.show.call(modalObject);
                    });
                } else if (typeof events.hide == "function") {
                    modalObject.on("hide.bs.modal", function() {
                        events.hide.call(modalObject);
                    });
                }
            }
            modalObject.modal($.extend({
                backdrop: "static"
            }, options));
            var zIndex = tnx.util.minTopZIndex(20);
            modalObject.css("zIndex", zIndex);
            modalObject.next(".modal-backdrop").css("zIndex", zIndex - 10);
        },
        alert: function(title, message, callback, options) {
            if (typeof message == "function") {
                options = callback;
                callback = message;
                message = undefined;
            }
            if (message === undefined) {
                message = title;
                title = "提示";
            }
            var buttons = [{
                text: "确定",
                "class": "btn-primary",
                click: function() {
                    if (typeof callback == "function") {
                        if (callback.call(this) !== false) {
                            this.close();
                        }
                    } else {
                        this.close();
                    }
                }
            }];
            this.dialog(title, message, buttons, options);
        },
        confirm: function(title, message, callback, options) {
            if (typeof message == "function") {
                options = callback;
                callback = message;
                message = title;
                title = "确定";
            }
            var buttons = [{
                text: "确定",
                "class": "btn-primary",
                click: function() {
                    if (typeof callback == "function") {
                        if (callback.call(this, true) !== false) {
                            this.close();
                        }
                    } else {
                        this.close();
                    }
                }
            }, {
                text: "取消",
                "class": "btn-secondary",
                click: function() {
                    if (typeof callback == "function") {
                        if (callback.call(this, false) !== false) {
                            this.close();
                        }
                    } else {
                        this.close();
                    }
                }
            }];
            this.dialog(title, message, buttons, options);
        },
        open: function(url, params, buttons, options) {
            if ($.isArray(params) || typeof params == "function") {
                options = buttons;
                buttons = params;
                params = undefined;
            }
            options = options || {};
            if (typeof buttons == "function") {
                var callback = buttons;
                buttons = [{
                    text: "确定",
                    "class": "btn-primary",
                    click: function() {
                        if (callback.call(this, true) !== false) {
                            this.close();
                        }
                    }
                }];
                if (!options.alert) { // 非alert模式，则添加取消按钮
                    buttons.push({
                        text: "取消",
                        "class": "btn-secondary",
                        click: function() {
                            if (callback.call(this, false) !== false) {
                                this.close();
                            }
                        }
                    });
                }
            }

            var _this = this;
            this.ajax(url, params, function(html) {
                html = html.trim();
                if (html.startsWith("<!DOCTYPE html>")) {
                    html = html.replace("<!DOCTYPE html>", "").trim();
                }
                html = tnx.util.replaceTag(html, "html", "tnx-html");
                html = tnx.util.replaceTag(html, "head", "tnx-head");
                html = tnx.util.replaceTag(html, "body", "tnx-body");
                html = $(html);
                var title = options.title;
                if (!title) {
                    title = $("tnx-head title", html).text();
                    if (!title) {
                        title = html.children(":first").attr("title");
                    }
                }
                var links = $("tnx-head link", html);

                var container = $("tnx-body", html);
                if (container.length == 0) { // 没有BODY
                    if (html.length > 1) { // 确保单根
                        html.wrap("<div></div>");
                        container = html.parent();
                    } else {
                        container = html;
                    }
                } else { // 有BODY
                    html = container[0].outerHTML;
                    container = $(tnx.util.replaceTag(html, "tnx-body", "div"));
                }
                container.prepend(links);
                container.attr("url", url); // 带上窗口的地址，以便于框架加载对应的css和js
                var width = options.width || container.attr("width");
                _this.dialog(title, container, buttons, {
                    width: width,
                    events: $.extend({}, options.events, {
                        shown: function() {
                            var modalObject = this;
                            container[0].close = function() {
                                modalObject.close();
                            };
                            _this.app.init(container[0]);
                        }
                    })
                });
            }, {
                type: "get", // 打开对话框链接一定是GET方式
                error: undefined // TODO
            });
        },
        _showToast: function(template, content, timeout, callback) {
            // 先关闭所有toast弹框
            $(".modal-loading, .modal-toast").modal("hide");

            var modalObject = $(template);
            if (content) {
                $(".modal-content div:last", modalObject).html(content);
            } else {
                $(".modal-content div:last", modalObject).remove();
            }
            modalObject.close = function() {
                modalObject.modal("hide");
            };
            // 注册事件
            if (timeout) {
                modalObject.on("shown.bs.modal", function() {
                    modalObject.off("shown.bs.modal");
                    setTimeout(function() {
                        modalObject.close();
                    }, timeout);
                });
            }
            modalObject.on("hidden.bs.modal", function() {
                if (typeof callback == "function") {
                    callback.call(modalObject);
                }
                modalObject.remove();
            });
            modalObject.modal({
                backdrop: false,
                keyboard: false,
            });
            var zIndex = tnx.util.minTopZIndex(20);
            modalObject.css("zIndex", zIndex);
        },
        /**
         * 在指定时间后自动关闭的弹框提示，一般用于呈现操作结果
         *
         * @param content 提示内容
         * @param timeout 关闭超时
         * @param callback 关闭后的回调
         */
        toast: function(content, timeout, callback) {
            if (typeof timeout == "function") {
                callback = timeout;
                timeout = undefined;
            }
            timeout = timeout || 1500; // 默认1.5秒后关闭
            this._showToast(this.templates.toast, content, timeout, callback);
        },
        /**
         * 不自动关闭而需要通过hideLoading()方法才会关闭的弹框提示，一般用于提示操作正在进行中
         *
         * @param content 提示内容
         */
        showLoading: function(content) {
            this._showToast(this.templates.loading, content);
        },
        /**
         * 关闭showLoading()的弹框，一般在正在进行的操作完成后调用
         */
        hideLoading: function() {
            $(".modal-loading").modal("hide");
        }
    });
    tnx = tnxjq;
    return tnx;
});
