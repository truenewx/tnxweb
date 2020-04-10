// tnxvue.js
var vue_components = {
    "tv-div": app_config.lib + "/vue/component/div",
    "tv-span": app_config.lib + "/vue/component/span",
};
require.config({
    paths: Object.assign({
        "tnxcore": app_config.lib + "/core/tnx/js/tnxcore",
        "vue": app_config.lib + "/vue/vendor/vue-2.6.10/vue" + app_config.min,
        "vue-router": app_config.lib + "/vue/vendor/vue-router-3.1.3/vue-router" + app_config.min,
        "vuelidate": app_config.lib + "/vue/vendor/vuelidate-0.7.5/vuelidate.min",
        "vuelidate-rules": app_config.lib + "/vue/vendor/vuelidate-0.7.5/validators.min",
    }, vue_components)
});

var Vue;
var VueRouter;
var Vuelidate;

define(["tnxcore", "vue", "vue-router", "vuelidate", "vuelidate-rules"], function(tnxcore, v, vr, vl, rules) {
    Vue = v;
    VueRouter = vr;
    Vuelidate = vl;
    require(Object.keys(vue_components));
    Vue.use(VueRouter);
    Vue.use(Vuelidate);
    Vuelidate.rules = rules;
    Vuelidate.transfer = function(meta) {
        var $vModel = {};
        Object.keys(meta).forEach(function(fieldName) {

        });
        return $vModel;
    }

    tnxcore.util.initPage = Function.around(tnxcore.util.initPage, function(initPage, page, container) {
        if (container.tagName == "BODY") { // vue不支持以body为容器，故从body下获取第一个div作为容器
            for (var i = 0; i < container.children.length; i++) {
                var child = container.children[i];
                if (child.tagName == "DIV") {
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