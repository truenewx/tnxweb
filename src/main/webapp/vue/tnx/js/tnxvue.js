// tnxvue.js
var vue_components = {
    "tv-div": app_config.lib + "/vue/component/div.js?v=" + app_config.libVersion,
    "tv-span": app_config.lib + "/vue/component/span.js?v=" + app_config.libVersion,
};
require.config({
    paths: {
        "vue": app_config.lib + "/vue/vendor/vue-2.6.10/vue" + app_config.min,
        "vue-router": app_config.lib + "/vue/vendor/vue-router-3.1.3/vue-router" + app_config.min,
    },
    map:{
        "*": Object.assign({
            "tnxcore": app_config.lib + "/core/tnx/js/tnxcore.js?v=" + app_config.libVersion
        }, vue_components)
    }
});

var Vue;
var VueRouter;

define(["tnxcore", "vue", "vue-router"].concat(Object.keys(vue_components)), function(tnxcore, v, vr) {
    Vue = v;
    VueRouter = vr;
    Vue.use(VueRouter);

    tnxcore.util.initPage = Function.around(tnxcore.util.initPage, function(initPage, page, container) {
        if (container.tagName === "BODY") { // vue不支持以body为容器，故从body下获取第一个div作为容器
            for (var i = 0; i < container.children.length; i++) {
                var child = container.children[i];
                if (child.tagName === "DIV") {
                    container = child;
                    break;
                }
            }
        }
        initPage.call(this, page, container);
    });
    tnx = tnxcore;
    return tnx;
});