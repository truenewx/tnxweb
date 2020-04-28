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
        this.options = $.extend({}, this.defaults, options);
        this.baseUrlRetry = 0;
        this.error = { // 校验错误
            number: 0, // 文件数量超限时的文件数量
            capacity: [], // 容量大小超限的文件名清单
            extensions: [], // 扩展名不合法的文件名清单
            clean: function() {
                this.number = 0;
                this.capacity = [];
                this.extensions = [];
            }
        };
        this.init();
    };

    FssUpload.prototype.templates = {
        preview: '<div class="fss-upload-preview border">' +
            '   <img class="fss-upload-image">' +
            '   <div class="fss-upload-preview-mask d-none"></div>' +
            '   <i class="fss-upload-remove text-secondary far fa-times-circle" title="移除"></i>' +
            '</div>', // 预览框
    };

    FssUpload.prototype.defaults = {
        type: undefined, // 业务类型
        btnText: "选择...", //选择按钮的显示文本
        btnClass: "btn btn-light border", // 选择按钮的样式名称
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
                var files = _this.validate(this.files, forFileId);
                _this.showErrorMessages();
                if (files.length) {
                    for (var file of files) {
                        _this.preview(file, forFileId);
                    }
                    if (!_this.error.number) { // 没有文件数量超限错误才开始上传
                        _this.upload(files);
                    }
                }
            }
        });
        this.container.append(input);
        input.trigger("click");
    }

    FssUpload.prototype.validate = function(files, forFileId) {
        this.error.clean(); // 先清空所有原有的错误信息
        var previewableFiles = []; // 用新的数组保存可以预览的文件清单
        for (var file of files) {
            var valid = true;
            if (this.limit.capacity < file.size) { // 文件大小超限
                this.error.capacity.push(file.name);
                valid = false;
            }
            var extension = file.name.substr(file.name.lastIndexOf(".") + 1);
            // 不是指定扩展名清单中的一员，或者是其中一员但是为扩展名拒绝模式，则说明扩展名不合法
            if (!this.limit.extensions.containsIgnoreCase(extension) || this.limit.extensionsRejected) {
                this.error.extensions.push(file.name);
                valid = false;
            }
            if (valid) {
                previewableFiles.push(file);
            }
            if (forFileId) {
                break; // 存在替换目标，则第一轮遍历即退出循环
            }
        }
        // 排除掉不可预览的文件，剩下可预览文件再计算文件数量
        var number = $(".fss-upload-preview", this.container).length;
        for (var file of previewableFiles) {
            file.id = this.generateFileId(file);
            if (!forFileId && !this.findPreviewDiv(file.id).length) {
                number++; // 没有指定替换目标，且新的文件没有已选，才增加已选数量
            }
        }
        if (number > this.limit.number) { // 文件数量超限
            this.error.number = number;
        }
        return previewableFiles;
    }

    FssUpload.prototype.showErrorMessages = function() {
        var messages = [];
        if (this.error.number) {
            messages.push("最多可以选择" + this.limit.number + "个文件，你已选了" + this.error.number + "个，请移除多余文件");
        } else { // 文件数量未超限才考虑显示其它错误信息
            if (this.error.capacity.length) { // 存在容量大小错误
                var prefix = this.limit.number === 1 ? "" : "单个";
                var capacity = tnx.util.getCapacityCaption(this.limit.capacity);
                messages.push(prefix + "文件大小不能超过" + capacity + "，文件："
                    + this.error.capacity.join("、") + " 已超过该大小；");
            }
            if (this.error.extensions.length) { // 存在扩展名错误
                var prefix = this.limit.extensionsRejected ? "不" : "只";
                messages.push(prefix + "支持" + this.limit.extensions.join("、") + "文件，文件："
                    + this.error.extensions.join("、") + " 不符合要求；");
            }
            if (messages.length) {
                messages.push("以上文件已被排除。");
            }
        }
        if (messages.length) {
            tnx.error(messages.join("<br>"));
        }
    }

    FssUpload.prototype.generateFileId = function(file) {
        // 同样类型、文件名、大小、最近修改时间的文件视为同一个文件，实际上不同文件重复的概率极低，即使重复也没有太大影响
        var text = file.type + "-" + file.name + "-" + file.size + "-" + file.lastModified;
        return tnx.util.md5(text);
    }

    FssUpload.prototype.findPreviewDiv = function(fileId) {
        return $(".fss-upload-preview[data-id='" + fileId + "']", this.container);
    }

    FssUpload.prototype.preview = function(file, forFileId) {
        var fileId = file.id;
        this.findPreviewDiv(fileId).remove(); // 如果存在同样的文件，则先移除
        var div;
        if (forFileId) {
            div = this.findPreviewDiv(forFileId);
        }
        if (!div || !div.length) {
            div = $(this.templates.preview).css({
                width: (this.options.previewSize.width + 2) + "px",
                height: (this.options.previewSize.height + 2) + "px",
            }); // 边框占据宽度，所以需要多加2个px
            this.button.before(div);
        }
        div.attr("data-id", fileId);

        var image = $(".fss-upload-image", div).css({
            maxWidth: this.options.previewSize.width + "px",
            maxHeight: this.options.previewSize.height + "px",
        });
        image.attr("alt", file.name).attr("title", file.name);
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
            _this.button.attr("data-for", fileId);
            _this.toSelectFile();
        });
        div.append(image);

        var mask = $(".fss-upload-preview-mask", div);
        mask.css({
            left: div.position().left + 1,
            width: div.width(),
            height: div.height(),
            fontSize: div.width() / 3,
        });

        var icon = this.locateRemoveIcon(div);
        var _this = this;
        icon.click(function() {
            _this.remove(fileId);
        });

        if (this.error.number) { // 存在文件数量超限错误，则所有文件预览全部加上警示样式
            div.addClass("border-danger");
            div.data("file", file); // 缓存文件对象，以便于用户移除多余文件后继续上传处理
            mask.removeClass("d-none");
        }

        if (!forFileId) {
            this.refreshButton();
        }
    }

    FssUpload.prototype.locateRemoveIcon = function(div) {
        var icon = $(".fss-upload-remove", div);
        icon.css("left", (div.position().left + div.width() - icon.width()) + "px");
        return icon;
    }

    FssUpload.prototype.upload = function(files) {
        var formData = new window.FormData();
        for (var file of files) {
            this.showUploading(file.id);
            formData.append("fileIds", file.id);
            formData.append("files", file);
        }
        formData.set("onlyStorage", "true"); // 本地可预览，只需服务端返回存储地址
        var url = this.options.baseUrl + "/upload/" + this.options.type;
        var _this = this;
        tnx.app.rpc.post(url, formData, function(results) {
            results.forEach(function(result) {
                _this.uploaded(result);
            });
        });
    }

    FssUpload.prototype.showUploading = function(fileId) {
        var div = this.findPreviewDiv(fileId);
        div.removeClass("border-success border-danger").removeData("file");
        var mask = $(".fss-upload-preview-mask", div).attr("title", "上传中");
        mask.html("<div class='spinner-border text-light'></div>").removeClass("d-none");
    }

    FssUpload.prototype.uploaded = function(file) {
        var div = this.findPreviewDiv(file.id);
        $(".fss-upload-image", div).attr("storage-url", file.storageUrl);
        $(".fss-upload-preview-mask", div).addClass("d-none");
        div.addClass("border-success");
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
        this.findPreviewDiv(fileId).remove();
        var divs = $(".fss-upload-preview", this.container);
        if (this.error.number) {
            // 如果原本文件数量超限，则移除一个文件后重新检查文件数量是否超限，不超限则重新发起上传
            this.error.number = divs.length;
            if (this.error.number <= this.limit.number) {
                this.error.number = 0; // 文件数量已经不超限
                var files = [];
                for (var div of divs) {
                    div = $(div);
                    this.locateRemoveIcon(div); // 重新定位移除按钮的位置
                    var file = div.data("file");
                    if (file) {
                        files.push(file);
                    }
                }
                this.upload(files);
                return;
            }
        }
        // 确保移除按钮都获得重新定位
        for (var div of divs) {
            div = $(div);
            this.locateRemoveIcon(div); // 重新定位移除按钮的位置
        }
        this.refreshButton();
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
