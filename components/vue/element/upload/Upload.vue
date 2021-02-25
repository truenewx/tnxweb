<template>
    <el-upload ref="upload" class="d-none"
        :id="id"
        name="files"
        :action="action"
        :before-upload="beforeUpload"
        :on-progress="onProgress"
        :on-success="onSuccess"
        :on-error="onError"
        :with-credentials="true"
        list-type="picture-card"
        :file-list="fileList"
        :data="uploadParams"
        :headers="uploadHeaders"
        :multiple="uploadLimit.number > 1"
        :accept="uploadAccept">
        <i slot="default" class="el-icon-plus"></i>
        <div slot="file" slot-scope="{file}" class="el-upload-list__panel" :data-file-id="getFileId(file)">
            <img class="el-upload-list__item-thumbnail" :src="file.url" v-if="uploadLimit.imageable">
            <div v-else>
                <i class="el-icon-document"></i> {{ file.name }}
            </div>
            <label class="el-upload-list__item-status-label">
                <i class="el-icon-upload-success el-icon-check"></i>
            </label>
            <span class="el-upload-list__item-actions">
                <span class="el-upload-list__item-preview" @click="previewFile(file)" v-if="uploadLimit.imageable">
                    <i class="el-icon-zoom-in"></i>
                </span>
                <span class="el-upload-list__item-delete" @click="removeFile(file)" v-if="!readOnly">
                    <i class="el-icon-delete"></i>
                </span>
            </span>
        </div>
        <div slot="tip" class="el-upload__tip" v-if="tip" v-text="tip"></div>
    </el-upload>
</template>

<script>
import $ from 'jquery';

export default {
    name: 'TnxelUpload',
    props: {
        value: [String, Array],
        type: {
            type: String,
            required: true,
        },
        scope: String,
        readOnly: {
            type: Boolean,
            default: () => false,
        },
        width: {
            type: [Number, String],
        },
        height: {
            type: [Number, String],
        },
    },
    data() {
        const tnx = window.tnx;
        const rpc = tnx.app.rpc;
        let action = rpc.apps.fss + '/upload/' + this.type;
        if (this.scope) {
            action += '/' + this.scope;
        }
        return {
            tnx: tnx,
            id: 'upload-container-' + tnx.util.string.random(32),
            alone: !rpc.apps.fss.startsWith(rpc.getBaseUrl()), // FSS是否独立部署的服务
            action: action,
            uploadLimit: {},
            tipMessages: {
                number: '最多只能上传{0}个文件',
                capacity: '单个文件不能超过{0}',
                extensions: '只能上传{0}文件',
                excludedExtensions: '不能上传{0}文件',
            },
            uploadParams: {
                fileIds: []
            },
            uploadHeaders: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            fileList: [],
        };
    },
    computed: {
        tip() {
            if (!this.readOnly && this.uploadLimit) {
                let tip = '';
                const separator = '，';
                if (this.uploadLimit.number > 1) {
                    tip += separator + this.tipMessages.number.format(this.uploadLimit.number);
                }
                if (this.uploadLimit.capacity > 0) {
                    const capacity = this.tnx.util.string.getCapacityCaption(this.uploadLimit.capacity, 2);
                    tip += separator + this.tipMessages.capacity.format(capacity);
                }
                if (this.uploadLimit.extensions && this.uploadLimit.extensions.length) {
                    const extensions = this.uploadLimit.extensions.join('、');
                    if (this.uploadLimit.extensionsRejected) {
                        tip += separator + this.tipMessages.excludedExtensions.format(extensions);
                    } else {
                        tip += separator + this.tipMessages.extensions.format(extensions);
                    }
                }
                if (tip.length > 0) {
                    tip = tip.substr(separator.length);
                }
                return tip;
            }
            return undefined;
        },
        uploadAccept() {
            if (this.uploadLimit && this.uploadLimit.mimeTypes) {
                return this.uploadLimit.mimeTypes.join(',');
            }
            return undefined;
        },
        uploadFiles() {
            return this.$refs.upload ? this.$refs.upload.uploadFiles : [];
        },
    },
    mounted() {
        const vm = this;
        vm.tnx.app.rpc.ensureLogined(function() {
            if (vm.value) {
                let storageUrls = Array.isArray(vm.value) ? vm.value : [vm.value];
                vm.tnx.app.rpc.get('/metas', {storageUrls: storageUrls}, function(metas) {
                    metas.forEach(meta => {
                        if (meta) {
                            vm.fileList.push({
                                name: meta.name,
                                url: vm._getFullReadUrl(meta.thumbnailReadUrl || meta.readUrl),
                                previewUrl: vm._getFullReadUrl(meta.readUrl),
                                storageUrl: meta.storageUrl,
                            });
                        }
                    });
                    vm.$nextTick(function() {
                        vm._loadUploadLimit();
                    });
                }, {
                    app: 'fss'
                });
            } else {
                vm.$nextTick(function() {
                    vm._loadUploadLimit();
                });
            }
        }, {
            app: 'fss',
            toLogin: function(loginFormUrl, originalUrl, originalMethod) {
                return true;
            }
        });
    },
    methods: {
        _loadUploadLimit: function() {
            let vm = this;
            vm.tnx.app.rpc.get('/upload-limit/' + vm.type, function(uploadLimit) {
                vm.uploadLimit = uploadLimit;
                const $container = $('#' + vm.id);
                // 初始化显示尺寸
                let uploadSize = undefined;
                if (uploadLimit.sizes && uploadLimit.sizes.length) {
                    uploadSize = uploadLimit.sizes[0];
                }
                if (!uploadSize) {
                    uploadSize = {
                        width: vm.width || 128,
                        height: vm.height || (uploadLimit.imageable ? 128 : 40),
                    }
                }
                let width = window.tnx.util.string.getPixelString(uploadSize.width);
                let height = window.tnx.util.string.getPixelString(uploadSize.height);
                const $upload = $('.el-upload', $container);
                $upload.css({
                    width: width,
                    height: height,
                });

                let plusSize = Math.min($upload.width(), uploadSize.height) / 4;
                plusSize = Math.max(16, Math.min(plusSize, 32));
                $('.el-icon-plus', $upload).css({
                    fontSize: plusSize + 'px'
                });
                $container.removeClass('d-none');

                if (vm.fileList && vm.fileList.length) {
                    vm.fileList.forEach(function(file) {
                        vm._resizeFilePanel(file, vm.fileList);
                    });
                }
            }, {
                app: 'fss'
            });
        },
        _getFullReadUrl: function(readUrl) {
            if (readUrl && readUrl.startsWith('//')) {
                return window.location.protocol + readUrl;
            }
            return readUrl;
        },
        getFileId: function(file) {
            if (!file.id) {
                if (file.url) { // 有URL的文件通过URL即可唯一确定
                    file.id = this.tnx.util.md5(file.url);
                } else {
                    // 没有URL的文件，通过文件类型+文件名+文件大小+最后修改时间，几乎可以唯一区分一个文件，重复的概率极低，即使重复也不破坏业务一致性和完整性
                    file.id = this.tnx.util.md5(
                        file.type + '-' + file.name + '-' + file.size + '-' + file.lastModified);
                }
            }
            return file.id;
        },
        validate: function(file) {
            // 校验文件重复
            const vm = this;
            if (this.uploadFiles.contains(function(f) {
                const raw = f.raw ? f.raw : f;
                return file.uid !== raw.uid && vm.getFileId(file) === vm.getFileId(raw);
            })) {
                return false;
            }
            // 校验数量
            if (this.uploadLimit.number > 0 && this.uploadFiles.length > this.uploadLimit.number) {
                let message = this.tipMessages.number.format(this.uploadLimit.number);
                message += '，多余的文件未加入上传队列';
                this.tnx.error(message);
                return false;
            }
            // 校验容量大小
            if (this.uploadLimit.capacity > 0 && file.size > this.uploadLimit.capacity) {
                const capacity = this.tnx.util.string.getCapacityCaption(this.uploadLimit.capacity);
                let message = this.tipMessages.capacity.format(capacity, 2);
                message += '，文件"' + file.name + '"大小为' + this.tnx.util.string.getCapacityCaption(file.size,
                    2) + '，不符合要求';
                this.tnx.error(message);
                return false;
            }
            // 校验扩展名
            if (this.uploadLimit.extensions && this.uploadLimit.extensions.length) {
                const extension = file.name.substr(file.name.lastIndexOf('.') + 1);
                if (this.uploadLimit.extensionsRejected) { // 扩展名黑名单模式
                    if (this.uploadLimit.extensions.containsIgnoreCase(extension)) {
                        const extensions = this.uploadLimit.extensions.join('、');
                        this.tnx.error(this.tipMessages.excludedExtensions.format(extensions));
                        return false;
                    }
                } else { // 扩展名白名单模式
                    if (!this.uploadLimit.extensions.containsIgnoreCase(extension)) {
                        const extensions = this.uploadLimit.extensions.join('、');
                        let message = this.tipMessages.extensions.format(extensions);
                        message += '，文件"' + file.name + '"不符合要求';
                        this.tnx.error(message);
                        return false;
                    }
                }
            }
            return true;
        },
        beforeUpload: function(file) {
            const vm = this;
            const rpc = this.tnx.app.rpc;
            return new Promise(function(resolve, reject) {
                if (vm.validate(file)) {
                    if (vm.alone) {
                        // 确保在fss服务中已登录
                        rpc.ensureLogined(function() {
                            resolve(file);
                        }, {
                            app: 'fss',
                            toLogin: function(loginFormUrl, originalUrl, originalMethod) {
                                // 此时已可知在CAS服务器上未登录，即未登录任一服务
                                reject(file);
                                // 从fss服务一定无法取得登录表单地址，改为从当前服务获取
                                rpc.get('/authentication/login-url', function(loginUrl) {
                                    if (loginUrl) {
                                        // 默认登录后跳转回当前页面
                                        loginUrl += loginUrl.contains('?') ? '&' : '?';
                                        loginUrl += rpc.loginSuccessRedirectParameter + '=' + window.location.href;
                                        rpc.toLogin(loginUrl, vm.action, 'POST');
                                    }
                                });
                                return true;
                            }
                        });
                    } else {
                        resolve(file);
                    }
                } else {
                    reject(file);
                }
            });
        },
        onProgress: function(event, file, fileList) {
            this._resizeFilePanel(file, fileList);
        },
        _resizeFilePanel: function(file, fileList) {
            const $container = $('#' + this.id);
            const $upload = $('.el-upload', $container);
            let uploadStyle = $upload.attr('style'); // 隐藏之前取出样式
            if (fileList.length >= this.uploadLimit.number) {
                // 隐藏添加按钮
                $upload.hide();
            }
            const fileId = this.getFileId(file);
            const $listItem = $('.el-upload-list__panel[data-file-id="' + fileId + '"]', $container).parent();
            $listItem.attr('style', uploadStyle);
            if (typeof this.width === 'string' && this.width.endsWith('%')) {
                $listItem.parent().css({width: '100%'});
            }
            $listItem.parent().css({'min-height': $upload.outerHeight(true)});
        },
        onSuccess: function(uploadedFiles, file, fileList) {
            if (Array.isArray(uploadedFiles) && uploadedFiles.length) {
                const uploadedFile = uploadedFiles[0]; // 该组件为一次只上传一个文件的上传模式
                file.storageUrl = uploadedFile.storageUrl;
                this.emitInput();
            }
        },
        emitInput: function() {
            let storageUrls = [];
            for (let file of this.uploadFiles) {
                if (file.storageUrl) {
                    storageUrls.push(file.storageUrl);
                } else { // 存在一个未完成上传，则退出
                    return;
                }
            }
            if (this.uploadLimit.number === 1) {
                storageUrls = storageUrls[0];
            }
            this.$emit('input', storageUrls);
        },
        onError: function(error, file, fileList) {
            let message = JSON.parse(error.message);
            if (message && message.errors) {
                this.tnx.app.rpc.handleErrors(message.errors);
            } else {
                console.error(error.message);
            }
        },
        removeFile: function(file) {
            this.uploadFiles.remove(function(f) {
                return file.uid === f.uid;
            });
            if (this.uploadFiles.length < this.uploadLimit.number) {
                let container = $('#' + this.id);
                // 去掉文件列表的宽度，以免其占高度
                $('.el-upload-list', container).css({
                    width: 'unset'
                });
                // 显示添加按钮
                $('.el-upload', container).show();
            }
            this.emitInput();
        },
        previewFile: function(file) {
            if (!file.width || !file.height) {
                const image = new Image();
                image.src = file.previewUrl || file.url;
                const _this = this;
                image.onload = function() {
                    file.width = image.width;
                    file.height = image.height;
                    _this._doPreviewFile(file);
                }
            } else {
                this._doPreviewFile(file);
            }
        },
        _doPreviewFile: function(file) {
            const dialogPadding = 16;
            let top = (this.tnx.util.dom.getDocHeight() - file.height) / 2 - dialogPadding;
            top = Math.max(top, 5); // 最高顶部留5px空隙
            let width = file.width;
            width = Math.min(width, this.tnx.util.dom.getDocWidth() - 10); // 最宽两边各留10px空隙
            const content = '<img src="' + file.url + '" style="max-width: 100%;">';
            this.tnx.dialog(content, '', [], {
                top: top + 'px',
                width: width + 'px',
            });
        },
        size: function() {
            if (this.uploadFiles && this.uploadFiles.length) {
                return this.uploadFiles.length;
            }
            return 0;
        },
        /**
         * 校验上传是否已经全部完成
         * @param reject 没有完成上传时的处理函数，传入文件对象参数
         * @returns 文件存储路径或其数组，有上传未完成时返回false
         */
        validateUploaded: function(reject) {
            if (this.uploadLimit.number > 1) {
                const storageUrls = [];
                for (let file of this.uploadFiles) {
                    if (file.storageUrl) {
                        storageUrls.push(file.storageUrl);
                    } else {
                        this._doValidateUploadedReject(reject, file);
                        return false;
                    }
                }
                return storageUrls;
            } else if (this.uploadFiles.length) {
                let file = this.uploadFiles[0];
                if (file) {
                    if (file.storageUrl) {
                        return file.storageUrl;
                    } else {
                        this._doValidateUploadedReject(reject, file);
                        return false;
                    }
                }
            }
            return null;
        },
        _doValidateUploadedReject: function(reject, file) {
            if (typeof reject === 'function') {
                reject(file);
            } else {
                this.tnx.alert('文件"' + file.name + '"还未上传完毕，请稍候', function() {
                    if (reject && typeof reject.disable === 'function') {
                        reject.disable(false);
                    }
                });
            }
        }
    }
}
</script>

<style>
.el-upload {
    border-radius: .25rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
}

.el-upload-list--picture-card {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
}

.el-upload-list--picture-card .el-upload-list__item {
    width: 1rem;
    height: 1rem;
    transition: none;
    border-radius: 4px;
}

.el-upload-list__panel {
    width: 100%;
    height: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
}

.el-upload-list--picture-card .el-upload-list__item-thumbnail {
    object-fit: contain;
}

.el-upload-list--picture-card .el-upload-list__item-actions {
    font-size: 1rem;
}

.el-form-item__content .el-upload__tip {
    line-height: 1;
    margin-top: 0;
}

</style>
