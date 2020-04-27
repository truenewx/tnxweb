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
        this.baseUrlRetry = 0;
        this.init();
    };

    FssUpload.defaults = {
        type: undefined, // 业务类型
        btnText: "选择...", //选择按钮的显示文本
        btnClass: "btn btn-light border", // 选择按钮的样式名称
        iconRemove: "<i class='far fa-times-circle'></i>", // 移除图标的内容
        previewSize: { // 预览框尺寸
            width: 64,
            height: 64,
        },
        storageUrls: undefined, // 初始化加载预览的文件存储路径清单
    }

    FssUpload.prototype.init = function() {
        if (!this.options.type) {
            throw new Error("FssUpload缺少type配置项");
        }
        if (!this.options.baseUrl && tnx.app.rpc.context) {
            this.options.baseUrl = tnx.app.rpc.context.fss;
        }
        var _this = this;
        if (!this.options.baseUrl) { // 基本路径没设置则等待后再重试
            if (++this.baseUrlRetry > 10) {
                throw new Error("FssUpload无法获取baseUrl配置项");
            }
            setTimeout(function() {
                _this.init();
            }, 100);
            return;
        }
        var url = this.options.baseUrl + "/upload-limit/" + this.options.type;
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
            $(this).removeAttr("data-for");
            _this.toSelectFile();
        });
        this.container.append(this.button);
        this.container.data(FssUpload.name, this);
        if (this.options.storageUrls) {
            this.load(this.options.storageUrls);
        }
    }

    FssUpload.prototype.toSelectFile = function() {
        // 移除现有的文件选择框后重新构建，以解决已上传过的文件移除后再次选择无法再次触发上传的问题
        $("input[type='file']", this.container).remove();
        var input = $("<input type='file'>").attr("accept", this.limit.mimeTypes).addClass("d-none");
        var forFileId = this.button.attr("data-for"); // 替换目标文件id
        this.button.removeAttr("data-for");
        if (this.limit.number !== 1 && !forFileId) { // 有替换目标则只能单选
            input.attr("multiple", "true");
        }
        var _this = this;
        input.change(function() {
            if (this.files.length) {
                var files = _this.validateFiles(this.files, forFileId);
                if (files.length) {
                    for (var file of files) {
                        _this.preview(file, forFileId);
                    }
                    _this.upload(files);
                }
            }
        });
        this.container.append(input);
        input.trigger("click");
    }

    FssUpload.prototype.validateFiles = function(files, forFileId) {
        var files = []; // 用新的数组保存可以上传的文件清单
        var errors = [];
        for (var file of files) {
            var fileErrors = this.validateFile(file);
            if (fileErrors && fileErrors.length) {
                errors = errors.concat(fileErrors);
            } else {
                files.push(file);
            }
            if (forFileId) {
                break; // 存在替换目标，则第一轮遍历即退出循环
            }
        }
        if (errors.length) {
            this.showErrors(errors);
            return [];
        }
        return files;
    }

    FssUpload.prototype.validateFile = function(file) {
        var errors = [];
        var extension = file.name.substr(file.name.lastIndexOf(".") + 1);
        // 不是指定扩展名清单中的一员，或者是其中一员但是为扩展名拒绝模式，则说明扩展名不合法
        if (!this.limit.extensions.contains(extension)) {
            errors.push("仅支持 " + this.limit.extensions.join("、") + " 文件，不能上传“{1}”");
        } else if (this.limit.extensionsRejected) {
            errors.push("不支持 " + this.limit.extensions.join("、") + " 文件，不能上传“{1}”");
        }
        return errors;
    }

    FssUpload.prototype.showErrors = function(errors) {
        tnx.error(errors.join("<br>"));
    }

    FssUpload.prototype.generateFileId = function(file) {
        // 同样类型、文件名、大小、最近修改时间的文件视为同一个文件，实际上不同文件重复的概率极低
        var text = file.type + "-" + file.name + "-" + file.size + "-" + file.lastModified;
        return tnx.util.md5(text);
    }

    FssUpload.prototype.preview = function(file, forFileId) {
        file.id = this.generateFileId(file);
        this.remove(file.id); // 如果存在同样的文件，则先移除
        var div;
        if (forFileId) {
            div = this.findPreviewDiv(forFileId).html(""); // 清空替换目标的内容重建
        }
        if (!div || !div.length) {
            div = $("<div></div>").addClass("fss-upload-preview border").css({
                width: (this.options.previewSize.width + 2) + "px",
                height: (this.options.previewSize.height + 2) + "px",
            }); // 边框占据宽度，所以需要多加2个px
            this.button.before(div);
        }
        div.attr("data-id", file.id);

        var image = $("<img>").addClass("fss-upload-image").css({
            maxWidth: this.options.previewSize.width + "px",
            maxHeight: this.options.previewSize.height + "px",
        });
        if (file.name) {
            image.attr("alt", file.name).attr("title", file.name);
        }
        var imgSrc = file.thumbnailReadUrl || file.readUrl;
        if (!imgSrc) { // 未指定读取地址，则视为本地预览
            imgSrc = tnx.util.createObjectUrl(file);
            image[0].onload = function() {
                tnx.util.revokeObjectUrl(this.src);
            };
        }
        image.attr("src", imgSrc);
        var _this = this;
        image.click(function() {
            _this.button.attr("data-for", file.id);
            _this.toSelectFile();
        });
        div.append(image);

        this.buildRemoveIcon(div, file.id);
        this.refreshButton();
    }

    FssUpload.prototype.findPreviewDiv = function(fileId) {
        return $(".fss-upload-preview[data-id='" + fileId + "']", this.container);
    }

    FssUpload.prototype.buildRemoveIcon = function(div, fileId) {
        var icon = $(this.options.iconRemove).addClass("fss-upload-icon text-secondary fss-upload-remove").attr("title", "移除");
        div.append(icon); // 先附着才能获得宽度
        icon.css("left", (div.position().left + div.width() - icon.width()) + "px");
        var _this = this;
        icon.click(function() {
            _this.remove(fileId);
        });
    }

    FssUpload.prototype.upload = function(files) {
        var formData = new window.FormData();
        formData.set("onlyStorage", "true"); // 本地可预览，只需服务端返回存储地址
        for (var file of files) {
            this.showUploading(file.id);
            formData.append("fileIds", file.id);
            formData.append("files", file);
        }
        var url = this.options.baseUrl + "/upload/" + this.options.type;
        var _this = this;
        tnx.app.rpc.post(url, formData, function(results) {
            results.forEach(function(result) {
                _this.uploaded(result);
            });
        });
    }

    FssUpload.prototype.uploaded = function(file) {
        var div = this.findPreviewDiv(file.id);
        $(".fss-upload-image", div).attr("storage-url", file.storageUrl);
        $(".fss-upload-uploading", div).remove();
        div.addClass("border-success");
    }

    FssUpload.prototype.showUploading = function(fileId) {
        var div = this.findPreviewDiv(fileId);
        div.removeClass("border-success");
        var icon = $("<div class='fss-upload-uploading'><div class='spinner-border text-light'></div></div>");
        icon.css({
            left: div.position().left + 1,
            width: div.width(),
            height: div.height(),
        }).attr("title", "上传中");
        div.append(icon);
        // 删除移除按钮后重新构建，以确保移除按钮在上传中遮罩层上层
        $(".fss-upload-remove", div).remove();
        this.buildRemoveIcon(div, fileId);
    }

    FssUpload.prototype.refreshButton = function() {
        // 文件数量达到最大限制，则隐藏选择按钮
        if (this.limit.number > 0 && $(".fss-upload-preview", this.container).length >= this.limit.number) {
            this.button.addClass("d-none");
        } else {
            this.button.removeClass("d-none");
        }
    }

    FssUpload.prototype.remove = function(fileId) {
        if (fileId) {
            this.findPreviewDiv(fileId).remove();
            this.refreshButton();
        }
    }

    FssUpload.prototype.getStorageUrls = function(callback) {
        var storageUrls = [];
        var uploadingFiles = [];
        $.each($(".fss-upload-image", this.container), function() {
            var image = $(this);
            var storageUrl = image.attr("storage-url");
            if (storageUrl) {
                storageUrls.push(storageUrl);
            } else {
                uploadingFiles.push(image.attr("alt"));
            }
        });
        if (typeof callback == "function") {
            callback(storageUrls, uploadingFiles);
        } else {
            return storageUrls;
        }
    }

    FssUpload.prototype.load = function(storageUrls) {
        var url = this.options.baseUrl + "/metas";
        var _this = this;
        tnx.app.rpc.get(url, {
            storageUrls: storageUrls
        }, function(files) {
            files.forEach(function(file) {
                _this.preview(file);
                _this.uploaded(file);
            });
        });
    }

    var methods = {
        init: function(options) {
            return new FssUpload($(this), options);
        },
        getStorageUrls: function(callback) {
            return $(this).data(FssUpload.name).getStorageUrls(callback);
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
