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

var tnxbs = {
    templates: {
        dialog: '<div class="modal fade" tabindex="-1" role="dialog">\n' +
            '  <div class="modal-dialog" role="document">\n' +
            '    <div class="modal-content">\n' +
            '      <div class="modal-header">\n' +
            '        <h5 class="modal-title">${title}</h5>\n' +
            '        <button type="button" class="close" data-dismiss="modal">\n' +
            '          <span>&times;</span>\n' +
            '        </button>\n' +
            '      </div>\n' +
            '      <div class="modal-body">${content}</div>\n' +
            '      <div class="modal-footer"></div>\n' +
            '    </div>\n' +
            '  </div>\n' +
            '</div>'
    }
};

define(["tnxjq", "bootstrap"], function(tnx) {
    Object.assign(tnx.app, {
        dialog: function(title, content, buttons, options) {
            var html = tnxbs.templates.dialog;
            var $dialog = $(html);
            $("body").append($dialog);
            options = options || {};
            $dialog.modal(options);
            var zIndex = tnx.util.minTopZIndex(20);
            $dialog.css("zIndex", zIndex);
            $dialog.next(".modal-backdrop").css("zIndex", zIndex - 10);
        },
        alert: function(title, message, callback, options) {

        },
        confirm: function(title, message, callback, options) {

        }
    });
    return tnx;
});
