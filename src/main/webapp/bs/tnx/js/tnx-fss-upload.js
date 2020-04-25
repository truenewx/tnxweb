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
        iconRemove: "<i class='far fa-times-circle'></i>", // 移除图标的内容
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
            _this.limit.mimeTypes = limit.mimeTypes.join(","); // 转换为字符串以便于使用
            _this.render();
        });
    }

    FssUpload.prototype.render = function() {
        this.container.addClass("fss-upload").html(""); // 先清空
        this.button = $("<button type='button'></button>");
        this.button.addClass(this.options.btnClass).text(this.options.btnText);
        var _this = this;
        this.button.click(function() {
            $(this).removeAttr("for");
            _this.toSelectFile();
        });
        this.container.append(this.button);
    }

    FssUpload.prototype.toSelectFile = function() {
        // 移除现有的文件选择框后重新构建，以解决已上传过的文件移除后再次选择无法再次触发上传的问题
        $("input[type='file']", this.container).remove();
        var input = $("<input type='file'>").attr("accept", this.limit.mimeTypes).addClass("d-none");
        var forFileId = this.button.attr("for"); // 替换目标文件id
        this.button.removeAttr("for");
        if (this.limit.number !== 1 && forFileId) { // 有替换目标则只能单选
            input.attr("multiple", "true");
        }
        var _this = this;
        input.change(function() {
            if (this.files.length) {
                var files = [];
                for (var i = 0; i < this.files.length; i++) {
                    var file = this.files[i];
                    _this.preview(file, forFileId);
                    files.push(file);
                    if (forFileId) {
                        break; // 存在替换目标，则第一轮遍历即退出循环
                    }
                }
                _this.upload(files);
            }
        });
        this.container.append(input);
        input.trigger("click");
    }

    FssUpload.prototype.generateFileId = function(file) {
        // 同样类型、文件名、大小、最近修改时间的文件视为同一个文件，实际上不同文件重复的概率极低
        var text = file.type + "-" + file.name + "-" + file.size + "-" + file.lastModified;
        return tnx.util.md5(text);
    }

    FssUpload.prototype.preview = function(file, forFileId) {
        file.id = this.generateFileId(file);
        this.remove(file.id); // 如果存在同样的文件，则先移除
        var _this = this;
        var reader = new FileReader();
        reader.onloadend = function() {
            var div;
            if (forFileId) {
                div = $(".preview[data-id='" + forFileId + "']").html(""); // 清空替换目标的内容重建
            }
            if (!div || !div.length) {
                div = $("<div></div>").addClass("preview border").css({
                    width: (_this.options.previewSize.width + 2) + "px",
                    height: (_this.options.previewSize.height + 2) + "px",
                }); // 边框占据宽度，所以需要多加2个px
                _this.button.before(div);
            }
            div.attr("data-id", file.id);

            var image = $("<img>").attr("src", reader.result);
            if (file.name) {
                image.attr("alt", file.name).attr("title", file.name);
            }
            image.css({
                maxWidth: _this.options.previewSize.width + "px",
                maxHeight: _this.options.previewSize.height + "px",
            });
            image.click(function() {
                _this.button.attr("for", file.id);
                _this.toSelectFile();
            });
            div.append(image);

            var icon = $(_this.options.iconRemove).addClass("remove").attr("title", "移除");
            div.append(icon); // 先附着才能获得宽度
            icon.css("margin-left", (_this.options.previewSize.width / 2 - icon.width() / 2 - 1) + "px");
            icon.click(function() {
                _this.remove(file.id);
            });

            _this.refreshButton();
        }
        reader.readAsDataURL(file);
    }

    FssUpload.prototype.upload = function(files) {
        var formData = new window.FormData();
        formData.set("onlyStorage", "true"); // 本地可预览，只需服务端返回存储地址
        for (var file of files) {
            formData.append("fileIds", file.id);
            formData.append("files", file);
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
