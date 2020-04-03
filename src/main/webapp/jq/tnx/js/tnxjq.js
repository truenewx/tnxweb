// tnxjq.js
require.config({
    paths: {
        "tnxcore": app_config.lib + "/core/tnx/js/tnxcore",
        "jquery": app_config.lib + "/jq/vendor/jquery-3.4.1/jquery" + app_config.min,
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
    $.extend(tnxcore.app, {
        ajax: function(url, params, callback, options) {
            if (typeof params == "function" || params instanceof jQuery) {
                options = callback;
                callback = params;
                params = undefined;
            }
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
    tnx = tnxcore;
    return tnx;
});