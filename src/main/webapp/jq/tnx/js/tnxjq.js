// tnxjq.js
require.config({
    paths: {
        "jquery": app_config.lib + "/jq/vendor/jquery-3.5.1/jquery" + app_config.min,
    },
    map: {
        "*": {
            "tnxcore": app_config.lib + "/core/tnx/js/tnxcore.js?v=" + app_config.libVersion
        }
    }
});

define(["tnxcore", "jquery"], function(tnxcore) {
    $.extend(tnxcore.util, {
        maxZIndex: function(objs) {
            var result = -1;
            $.each(objs, function(i, obj) {
                var zIndex = Number($(obj).css("zIndex"));
                if (result < zIndex) {
                    result = zIndex;
                }
            });
            return result;
        },
        /**
         * 获取最小的可位于界面顶层的ZIndex
         */
        minTopZIndex: function(step) {
            var maxValue = 2147483584; // 允许的最大值，取各浏览器支持的最大值中的最小一个（Opera）
            var maxZIndex = this.maxZIndex($("body *")); // 已有DOM元素中的最高层级
            if (maxZIndex > maxValue - step) {
                return maxValue;
            } else {
                return maxZIndex + step;
            }
        }
    });
    $.extend(tnxcore, {
        ajax: function(url, params, callback, options) {
            if (typeof params == "function" || params instanceof jQuery) {
                options = callback;
                callback = params;
                params = undefined;
            }
            options = options || {};
            var _this = this;
            var resp = $.ajax(url, {
                cache: false,
                data: params,
                type: options.type,
                dataType: "html",
                contentType: "application/x-www-form-urlencoded; charset=" + this.encoding, // 不能更改
                error: options.error,
                success: function(html) {
                    if (typeof callback == "function") {
                        callback(html);
                    } else if (callback instanceof jQuery) {
                        callback.html(html);
                    }
                }
            });
            resp.fail(options.error);
        }
    });
    $.extend(tnxcore.app, {
        router: {
            owner: tnxcore.app,
            viewContainer: null,
            init: function(viewContainer, linkContainer) {
                this.viewContainer = viewContainer;
                var _this = this;
                $("a[href]", linkContainer).each(function() {
                    var link = $(this);
                    var href = link.attr("href");
                    if (href.startsWith("#/")) {
                        var path = href.substr(1);
                        link.click(function() {
                            _this.show(path);
                        });
                    }
                });
            },
            /**
             * 展示指定路径的页面内容，浏览器地址栏不变化
             * @param path 页面相对站点根目录的路径
             */
            show: function(path) {
                var app = this.owner;
                var url = this._toUrl(path);
                var _this = this;
                app.owner.ajax(url, function(html) {
                    var container = $(_this.viewSelector);
                    container.html(html);
                    container.attr("url", app.context + path);
                    app.init(container);
                });
            },
            _toUrl: function(path) {
                return this.owner.context + path + ".ajax";
            }
        }
    });
    tnx = tnxcore;
    return tnx;
});