//tnxvue.js
var components = {
    "tv-div": app_config.lib + "/vue/component/div",
    "tv-span": app_config.lib + "/vue/component/span",
};

require.config({
    paths: Object.assign({
        "tnxjs": app_config.lib + "/js/tnxjs/tnxjs",
        "vue": app_config.lib + "/vue/vendor/vue-2.6.10/vue" + app_config.min,
        "vue-router": app_config.lib + "/vue/vendor/vue-router-3.1.3/vue-router" + app_config.min,
    }, components)
});

define(["tnxjs", "vue", "vue-router"], function(tnx, Vue, VueRouter) {
    require(Object.keys(components));
    Vue.use(VueRouter);
    // 附加vue相关能力
    tnx.app.Vue = Vue;
    tnx.app.VueRouter = VueRouter;
    tnx.util.loadPage = function(page) {
        if (typeof page.onLoad == "function") {
            page.onLoad();
        } else { // 未提供onLoad方法，则将页面对象视为Vue构建参数对象
            new Vue(page);
        }
    }
    return tnx;
});