<template>
    <div>
        <el-upload ref="upload" class="d-none"
            :id="id"
            :action="action"
            :before-upload="beforeUpload"
            :on-progress="onProgress"
            :on-success="onSuccess"
            :on-error="onError"
            :with-credentials="true"
            list-type="picture-card"
            name="files"
            :file-list="fileList"
            :data="uploadParams"
            :headers="uploadHeaders"
            :multiple="uploadLimit.number > 1"
            :accept="uploadAccept">
            <i slot="default" class="el-icon-plus"></i>
            <div slot="file" slot-scope="{file}" class="el-upload-list__panel" :data-file-id="getFileId(file)">
                <img class="el-upload-list__item-thumbnail" :src="file.url">
                <label class="el-upload-list__item-status-label">
                    <i class="el-icon-upload-success el-icon-check"></i>
                </label>
                <span class="el-upload-list__item-actions">
                    <span class="el-upload-list__item-preview" @click="previewFile(file)">
                    <i class="el-icon-zoom-in"></i>
                    </span>
                    <span class="el-upload-list__item-delete" @click="removeFile(file)">
                      <i class="el-icon-delete"></i>
                    </span>
                </span>
            </div>
            <div slot="tip" class="el-upload__tip" v-if="tip" v-text="tip"></div>
        </el-upload>
    </div>
</template>

<script>
import $ from 'jquery';

const util = window.tnx.util;
const rpc = window.tnx.app.rpc;

export default {
    name: 'TnxelUpload',
    props: {
        type: {
            type: String,
            required: true,
        },
        scope: String,
        files: [Object, Array],
    },
    data() {
        let action = rpc.apps.fss + '/upload/' + this.type;
        if (this.scope) {
            action += '/' + this.scope;
        }
        return {
            id: 'upload-container-' + new Date().getTime(),
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
            fileList: this.getFileList(),
            preview: {
                visible: false,
                url: '',
                top: undefined,
                width: undefined,
            },
        };
    },
    computed: {
        tip() {
            if (this.uploadLimit) {
                let tip = '';
                const separator = '，';
                if (this.uploadLimit.number > 1) {
                    tip += separator + this.tipMessages.number.format(this.uploadLimit.number);
                }
                if (this.uploadLimit.capacity > 0) {
                    const capacity = util.getCapacityCaption(this.uploadLimit.capacity, 2);
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
        this.$nextTick(function() {
            rpc.get('/upload-limit/' + vm.type, function(uploadLimit) {
                vm.uploadLimit = uploadLimit;
                // 初始化显示尺寸
                let uploadSize = undefined;
                if (uploadLimit.sizes && uploadLimit.sizes.length) {
                    uploadSize = uploadLimit.sizes[0];
                }
                const $container = $('#' + vm.id);
                if (uploadSize) {
                    const $upload = $('.el-upload', $container);
                    $upload.css({
                        width: uploadSize.width + 'px',
                        height: uploadSize.height + 'px',
                    });

                    let plusSize = Math.min(uploadSize.width, uploadSize.height) / 4;
                    plusSize = Math.max(16, Math.min(plusSize, 32));
                    $('.el-icon-plus', $upload).css({
                        fontSize: plusSize + 'px'
                    });
                }
                $container.removeClass('d-none');

                if (vm.fileList && vm.fileList.length) {
                    vm.fileList.forEach(function(file) {
                        vm._resizeImage(file, vm.fileList);
                    });
                }
            }, {
                app: 'fss'
            });
        });
    },
    methods: {
        getFileList: function() {
            let initialFiles = this.files;
            if (initialFiles) {
                if (typeof initialFiles === 'object') {
                    initialFiles = [initialFiles];
                }
                if (initialFiles instanceof Array) {
                    const fileList = [];
                    const _this = this;
                    initialFiles.forEach(initialFile => {
                        fileList.push({
                            name: initialFile.name,
                            url: _this._getFullReadUrl(initialFile.thumbnailReadUrl || initialFile.readUrl),
                            previewUrl: _this._getFullReadUrl(initialFile.readUrl),
                            storageUrl: initialFile.storageUrl,
                        });
                    });
                    return fileList;
                }
            }
            return [];
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
                    file.id = util.md5(file.url);
                } else {
                    // 没有URL的文件，通过文件类型+文件名+文件大小+最后修改时间，几乎可以唯一区分一个文件，重复的概率极低，即使重复也不破坏业务一致性和完整性
                    file.id = util.md5(file.type + '-' + file.name + '-' + file.size + '-' + file.lastModified);
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
                tnx.error(message);
                return false;
            }
            // 校验容量大小
            if (this.uploadLimit.capacity > 0 && file.size > this.uploadLimit.capacity) {
                const capacity = util.getCapacityCaption(this.uploadLimit.capacity);
                let message = this.tipMessages.capacity.format(capacity, 2);
                message += '，文件"' + file.name + '"大小为' + util.getCapacityCaption(file.size, 2) + '，不符合要求';
                tnx.error(message);
                return false;
            }
            // 校验扩展名
            if (this.uploadLimit.extensions && this.uploadLimit.extensions.length) {
                const extension = file.name.substr(file.name.lastIndexOf('.') + 1);
                if (this.uploadLimit.extensionsRejected) { // 扩展名黑名单模式
                    if (this.uploadLimit.extensions.containsIgnoreCase(extension)) {
                        const extensions = this.uploadLimit.extensions.join('、');
                        tnx.error(this.tipMessages.excludedExtensions.format(extensions));
                        return false;
                    }
                } else { // 扩展名白名单模式
                    if (!this.uploadLimit.extensions.containsIgnoreCase(extension)) {
                        const extensions = this.uploadLimit.extensions.join('、');
                        let message = this.tipMessages.extensions.format(extensions);
                        message += '，文件"' + file.name + '"不符合要求';
                        tnx.error(message);
                        return false;
                    }
                }
            }
            return true;
        },
        beforeUpload: function(file) {
            const vm = this;
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
            this._resizeImage(file, fileList);
        },
        _resizeImage: function(file, fileList) {
            if (fileList.length >= this.uploadLimit.number) {
                // 隐藏添加按钮
                $('#' + this.id + ' .el-upload').hide();
            }
            const $container = $('#' + this.id);
            const $upload = $('.el-upload', $container);
            const fileId = this.getFileId(file);
            const $listItem = $('.el-upload-list__panel[data-file-id="' + fileId + '"]', $container).parent();
            $listItem.css({
                width: $upload.css('width'),
                height: $upload.css('height'),
            });
            $listItem.parent().css({'min-height': $upload.outerHeight(true)});
            const $image = $('.el-upload-list__item-thumbnail', $listItem);
            let imageWidth = $image.width();
            let imageHeight = $image.height();
            // 缓存图片尺寸，预览时需用到
            file.width = imageWidth;
            file.height = imageHeight;
            const imageRatio = imageWidth / imageHeight; // 图片宽高比
            const boxRatio = $upload.outerWidth() / $upload.outerHeight(); // 缩略框宽高比
            if (boxRatio > imageRatio) {
                // 缩略框的宽高比大于图片宽高比，说明等比缩放后，缩略框比图片更宽或更矮，此时应保持两者高度一致
                imageHeight = $upload.height();
                imageWidth = imageHeight * imageRatio;
            } else {
                // 否则，说明等比缩放后，缩略框比图片更窄或更高，此时应保持两者宽度一致。宽高比相等是满足此种情况的特例
                imageWidth = $upload.width();
                imageHeight = imageWidth / imageRatio;
            }
            $image.css({
                width: imageWidth,
                height: imageHeight,
            });
        },
        onSuccess: function(uploadedFiles, file, fileList) {
            if (uploadedFiles instanceof Array) {
                const uploadedFile = uploadedFiles[0]; // 该组件为单文件上传模式
                file.storageUrl = uploadedFile.storageUrl;
            }
        },
        onError: function(error, file, fileList) {
            console.error(error.message);
        },
        removeFile: function(file) {
            this.uploadFiles.remove(function(f) {
                return file.uid === f.uid;
            });
            if (this.uploadFiles.length < this.uploadLimit.number) {
                // 显示添加按钮
                const $upload = $('#' + this.id + ' .el-upload');
                setTimeout(function() {
                    $upload.show();
                }, 500);
            }
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
            let top = (util.getDocHeight() - file.height) / 2 - dialogPadding;
            top = Math.max(top, 5); // 最高顶部留5px空隙
            let width = file.width;
            width = Math.min(width, util.getDocWidth() - 10); // 最宽两边各留10px空隙
            this.preview = {
                visible: true,
                url: file.url,
                top: top + 'px',
                width: width + 'px',
            }
            const content = '<img src="' + file.url + '" style="max-width: 100%;">';
            tnx.dialog(content, '', [], {
                width: width + 'px'
            });
        },
        /**
         * 获取已上传文件的存储地址集合
         * @return {Promise<已全部上传完毕的回调, 未全部上传完毕的回调>}
         */
        getStorageUrls: function() {
            const vm = this;
            return new Promise(function(resolve, reject) {
                const storageUrls = [];
                for (let file of vm.uploadFiles) {
                    if (file.storageUrl) {
                        storageUrls.push(file.storageUrl);
                    } else {
                        reject(file);
                        return;
                    }
                }
                try {
                    resolve(storageUrls);
                } catch (error) {
                    console.error(error);
                }
            });
        }
    }
}
</script>

<style>
.el-upload {
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
}

.el-upload-list--picture-card {
    display: inline-flex;
    align-items: center;
}

.el-upload-list--picture-card .el-upload-list__item {
    width: 1rem;
    height: 1rem;
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
    width: unset;
    height: unset;
}

.el-upload-list--picture-card .el-upload-list__item-actions {
    font-size: 1rem;
}

.el-form-item__content .el-upload__tip {
    line-height: 1;
    margin-top: 0;
}

</style>
