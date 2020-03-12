// tnxjq.js
require.config({
    paths: {
        "tnxcore": app_config.lib + "/core/tnx/js/tnxcore",
        "jquery": app_config.lib + "/jq/vendor/jquery-3.4.1/jquery" + app_config.min,
    }
});

define(["tnxcore", "jquery"], function(tnx) {
    return tnx;
});