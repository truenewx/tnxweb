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
        baseUrl: tnx.app.rpc.context ? tnx.app.rpc.context.fss : "",
        type: undefined, // 业务类型
        btnText: "选择...", //选择按钮的显示文本
        btnClass: "btn btn-light border", // 选择按钮的样式名称
        previewSize: { // 预览框尺寸
            width: 64,
            height: 64,
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
        this.button = $("<button type='button'></button>").addClass(this.options.btnClass).text(this.options.btnText);
        var _this = this;
        this.button.click(function() {
            var input = $("input[type='file']", _this.container);
            if (!input.length) {
                input = $("<input type='file'>").attr("accept", _this.limit.mimeTypes.join(","));
                if (_this.limit.number !== 1) {
                    input.attr("multiple", "true");
                }
                input.addClass("d-none");
                input.change(function() {
                    if (this.files.length) {
                        var files = []; // 转换后的文件数组
                        for (var i = 0; i < this.files.length; i++) {
                            var file = this.files[i];
                            let readUrl = tnx.util.createObjectUrl(file);
                            files[i] = {
                                id: _this.generateFileId(file, i),
                                name: file.name,
                                readUrl: readUrl,
                                thumbnailReadUrl: readUrl,
                                source: file,
                            };
                            _this.preview(files[i]);
                        }
                        _this.upload(files);
                        // 发起上传后移除文件选择框，后续重新构建，为了解决已上传过的文件移除后再次选择无法再次触发上传的问题
                        input.remove();
                    }
                });
                _this.container.append(input);
            }
            input.trigger("click");
        });
        this.container.append(this.button);
    }

    FssUpload.prototype.generateFileId = function(file, index) {
        var text = Date.now() + "-" + index + "-" + file.name + "-" + file.size;
        return tnx.util.md5(text);
    }
    FssUpload.prototype.preview = function(file) {
        var div = $("<div></div>").addClass("preview border").attr("data-id", file.id).css({
            width: (this.options.previewSize.width + 2) + "px",
            height: (this.options.previewSize.height + 2) + "px",
        }); // 边框占据宽度，所以需要多加2个px
        var icon = $("<span></span>").addClass("remove text-muted").attr("title", "移除").html("&times;");

        icon.css("margin-left", (this.options.previewSize.width / 2 - 10) + "px");
        var _this = this;
        icon.click(function() {
            _this.remove(file.id);
        });
        div.append(icon);

        var imgSrc = file.thumbnailReadUrl || file.readUrl;
        var image = $("<img>").attr("src", imgSrc).attr("read-url", file.readUrl);
        if (file.name) {
            image.attr("alt", file.name).attr("title", file.name);
        }
        if (imgSrc.startsWith("blob:")) {
            image[0].onload = function() {
                tnx.util.revokeObjectUrl(this.src);
            };
        }
        image.css({
            maxWidth: this.options.previewSize.width + "px",
            maxHeight: this.options.previewSize.height + "px",
        });
        div.append(image);
        this.button.before(div);
        this.refreshButton();
    }

    FssUpload.prototype.upload = function(files) {
        var formData = new window.FormData();
        formData.set("onlyStorage", "true"); // 本地可预览，只需服务端返回存储地址
        for (var file of files) {
            formData.append("fileIds", file.id);
            formData.append("files", file.source);
        }
        var url = this.options.baseUrl + "/upload/" + this.options.type;
        var _this = this;
        tnx.app.rpc.post(url, formData, function(results) {
            results.forEach(function(result) {
                var div = $(".preview[data-id='" + result.id + "']", _this.container);
                $("img", div).attr("storage-url", result.storageUrl);
            })
        });
    }

    FssUpload.prototype.refreshButton = function() {
        // 文件数量达到最大限制，则隐藏选择按钮
        if (this.limit.number > 0 && $(".preview", this.container).length >= this.limit.number) {
            this.button.addClass("d-none");
        } else {
            this.button.removeClass("d-none");
        }
    }

    FssUpload.prototype.remove = function(fileId) {
        if (fileId) {
            $(".preview[data-id='" + fileId + "']", this.container).remove();
            this.refreshButton();
        }
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
