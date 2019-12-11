//tnxvue.js
require.config({
    paths: {
        "tnxjs": app_config.lib + "/js/tnxjs/tnxjs",
        "vue": app_config.lib + "/vue/vendor/vue-2.6.10/vue",
        "vue-router": app_config.lib + "/vue/vendor/vue-router-3.1.3/vue-router",
    }
});

define(["tnxjs", "vue", "vue-router"], function(tnx, Vue, VueRouter) {
    Vue.use(VueRouter);
    Vue.component("tnx-span", {
        template: "<span><slot></slot></span>"
    });
    // 附加vue相关能力
    tnx.app.Vue = Vue;
    tnx.app.VueRouter = VueRouter;
    return tnx;
});