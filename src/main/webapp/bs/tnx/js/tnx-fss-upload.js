// tnx-fss-upload.js
/**
 * 文件存储服务的文件上传组件
 */
define(["tnxbs"], function(tnx) {
    var FssUpload = function FssUpload(container, options) {
        if (!container.is("div")) {
            throw new Error("FssUpload must be based on DIV element");
        }
        this.container = container;
        this.options = $.extend({}, FssUpload.defaults, options);
        this.config();
    };

    FssUpload.defaults = {
        baseUrl: tnx.app.rpc.context["fss"],
        type: undefined, // 业务类型
        btnText: "选择...", //选择按钮的显示文本
        btnClass: "btn btn-light border", // 选择按钮的样式名称
        previewSize: { // 预览框尺寸
            width: "64px",
            height: "64px",
        }
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
        this.container.addClass("fss-upload").html(""); // 先清空
        this.input = $("<input type='file'>").attr("accept", this.limit.mimeTypes.join(","));
        if (this.limit.number > 1) {
            this.input.attr("multiple", "true");
        }
        this.input.addClass("d-none");
        var _this = this;
        this.input.change(function() {
            _this.upload(this.files);
        });

        this.container.append(this.input);
        this.button = $("<button type='button'></button>").addClass(this.options.btnClass).text(this.options.btnText);
        this.button.click(function() {
            _this.input.trigger("click");
        });
        this.container.append(this.button);
    }

    FssUpload.prototype.upload = function(files) {
        var formData = new window.FormData();
        for (var file of files) {
            formData.append("files", file);
        }
        var url = this.options.baseUrl + "/upload/" + this.options.type;
        var _this = this;
        tnx.app.rpc.post(url, formData, function(results) {
            results.forEach(function(result) {
                _this.onUploaded(result);
            });
        });
    }

    FssUpload.prototype.onUploaded = function(result) {
        var image = $("<img>").attr("src", result.thumbnailReadUrl).attr("alt", result.filename);
        image.addClass("border preview").css(this.options.previewSize);
        this.button.before(image);
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
