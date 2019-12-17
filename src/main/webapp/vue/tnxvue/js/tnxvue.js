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
    tnx.util.loadPage = Function.around(tnx.util.loadPage, function(loadPage, page, container) {
        if (container.tagName == "BODY") { // vue不支持以body为容器，故从body下获取第一个div作为容器
            for (var i = 0; i < container.children.length; i++) {
                var child = container.children[i];
                if (child.tagName == "DIV") {
                    container = child;
                    break;
                }
            }
        }
        loadPage.call(this, page, container);
    });
    return tnx;
});