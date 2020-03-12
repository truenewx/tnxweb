// tnxbs.js
require.config({
    paths: {
        "tnxjq": app_config.lib + "/jq/tnx/js/tnxjq",
        "popper": app_config.lib + "/bs/vendor/popper-1.16.0/js/popper.min",
        "bootstrap": app_config.lib + "/bs/vendor/bootstrap-4.4.1/js/bootstrap" + app_config.min,
    },
    map: {
        "*": {
            "popper.js": "popper"
        }
    }
});
define(["tnxjq", "bootstrap"], function(tnx) {
    return tnx;
});
