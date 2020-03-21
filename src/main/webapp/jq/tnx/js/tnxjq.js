// tnxjq.js
require.config({
    paths: {
        "tnxcore": app_config.lib + "/core/tnx/js/tnxcore",
        "jquery": app_config.lib + "/jq/vendor/jquery-3.4.1/jquery" + app_config.min,
    }
});

define(["tnxcore", "jquery"], function(tnxcore) {
    Object.assign(tnxcore.util, {
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
    Object.assign(tnxcore.app, {
        ajax: function(url, params, callback, options) {
            var _this = this;
            var resp = $.ajax(url, {
                cache: false,
                data: params,
                type: options.type,
                dataType: "html",
                contentType: "application/x-www-form-urlencoded; charset=" + this.encoding, // 不能更改
                error: options.error,
                success: function(html) {
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
                            container.prepend(links);
                            html = container.html();
                        } else {
                            container = html;
                            container.prepend(links);
                        }
                    } else { // 有BODY
                        html = container[0].outerHTML;
                        container = $(tnx.util.replaceTag(html, "tnx-body", "div"));
                        container.prepend(links);
                        html = container.html();
                    }
                    container.attr("url", url);
                    _this.init(container[0], function() {
                        if (typeof callback == "function") {
                            callback.call(_this, title, html, {
                                width: options.width || container.attr("width"),
                                events: options.events,
                            });
                        }
                    });
                }
            });
            resp.fail(options.error);
        }
    });
    tnx = tnxcore;
    return tnx;
});