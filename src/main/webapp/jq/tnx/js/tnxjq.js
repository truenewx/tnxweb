// tnxjq.js
require.config({
    paths: {
        "tnxcore": app_config.lib + "/core/tnx/js/tnxcore",
        "jquery": app_config.lib + "/jq/vendor/jquery-3.4.1/jquery" + app_config.min,
    }
});

define(["tnxcore", "jquery"], function(tnx) {
    Object.assign(tnx.util, {
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
        },
    });
    return tnx;
});