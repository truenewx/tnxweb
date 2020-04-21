// tnx-fss-upload.js
/**
 * 文件存储服务的文件上传组件
 */
define(["src/main/webapp/jq/tnx/js/tnxjq"], function(tnx) {
    var FssUpload = function FssUpload(element, options) {
        if (!element.is("div")) {
            throw new Error("FssUpload must be based on DIV element");
        }
        this.element = element;
        this.options = $.extend({}, FssUpload.defaults, options);
        this.config();
    };

    FssUpload.defaults = {
        baseUrl: tnx.app.rpc.context["fss"],
        type: undefined, // 业务类型
    }

    FssUpload.prototype.config = function() {
        if (!this.options.baseUrl) {
            throw new Error("FssUpload缺少baseUrl配置项");
        }
        if (!this.options.type) {
            throw new Error("FssUpload缺少type配置项");
        }
        var url = this.options.baseUrl + "/upload-limit/" + this.options.type;
        var _this = this;
        tnx.app.rpc.get(url, function(limit) {
            _this.limit = limit;
            _this.render();
        });
    }

    FssUpload.prototype.render = function() {

    }

    var methods = {
        init: function(options) {
            return new FssUpload($(this), options);
        },
        addFile: function(storageUrls) {
            $(this).data("fssUpload").addFile(storageUrls);
        },
        removeFile: function(fileId) {
            $(this).data("fssUpload").removeFile(fileId);
        }
    };

    $.fn.fssUpload = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1))
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments)
        } else {
            return $.error("Method " + method + " does not exist on plug-in: FssUpload");
        }
    };

    return FssUpload;
});
