//tnxvue.js
require.config({
    paths: {
        "tnxjs": app_config.lib + "/js/tnxjs/tnxjs",
        "vue": app_config.lib + "/vue/vendor/vue-2.6.10/vue",
        "vue-router": app_config.lib + "/vue/vendor/vue-router-3.1.3/vue-router",
    }
});

define(["tnxjs", "vue", "vue-router"], function(tnx, Vue, VueRouter) {
    // 为tnx附加vue相关能力
    tnx.app.page.vue = function(options) {
        return new Vue(options);
    };
    return tnx;
});