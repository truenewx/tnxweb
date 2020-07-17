<template>
    <div>
        <el-upload ref="upload"
            :id="id"
            :action="action"
            :before-upload="beforeUpload"
            :on-progress="onProgress"
            :on-success="onSuccess"
            :on-error="onError"
            :on-preview="onPreview"
            :with-credentials="true"
            list-type="picture-card"
            name="files"
            :file-list="fileList"
            :data="uploadParams"
            :headers="uploadHeaders"
            :multiple="uploadLimit.number > 1"
            :accept="uploadAccept">
            <i slot="default" class="el-icon-plus"></i>
            <div slot="file" slot-scope="{file}" class="el-upload-list__panel"
                :data-file-id="getFileId(file)">
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
            files: [Object, Array],
            size: [String, Number],
        },
        data () {
            return {
                id: 'upload-container-' + new Date().getTime(),
                action: rpc.context.fss + '/upload/' + this.type,
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
                fileList: this.toFileList(this.files), // 本地预览文件集
                previewVisible: false,
                previewImageUrl: '',
            };
        },
        computed: {
            tip () {
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
            uploadAccept () {
                if (this.uploadLimit && this.uploadLimit.mimeTypes) {
                    return this.uploadLimit.mimeTypes.join(',');
                }
                return undefined;
            },
            uploadFiles () {
                return this.$refs.upload ? this.$refs.upload.uploadFiles : [];
            },
        },
        created () {
            const vm = this;
            rpc.get('/upload-limit/' + this.type, function(uploadLimit) {
                uploadLimit.number++; // TODO
                vm.uploadLimit = uploadLimit;
            }, {
                base: 'fss'
            });
        },
        mounted () {
            const vm = this;
            this.$nextTick(function() {
                let size = Number(vm.size);
                if (isNaN(size)) {
                    size = vm.size;
                } else {
                    size = size + 'px';
                }
                if (size) {
                    const $upload = $('#' + vm.id + ' .el-upload');
                    $upload.css({
                        width: size,
                        height: size,
                    });

                    let plusSize = $upload.height() / 4;
                    plusSize = Math.max(16, Math.min(plusSize, 32));
                    $('.el-icon-plus', $upload).css({
                        fontSize: plusSize + 'px'
                    });
                }
            });
        },
        methods: {
            toFileList: function(uploadedFiles) {
                if (uploadedFiles) {
                    if (typeof uploadedFiles === 'object') {
                        uploadedFiles = [uploadedFiles];
                    }
                    if (uploadedFiles instanceof Array) {
                        uploadedFiles.forEach(file => {
                            file.url = file.thumbnailReadUrl || file.readUrl;
                        });
                        return uploadedFiles;
                    }
                }
                return [];
            },
            getFileId: function(file) {
                if (!file.id) {
                    // 文件类型+文件名+文件大小+最后修改时间，几乎可以唯一区分一个文件，重复的概率极低，即使重复也不破坏业务一致性和完整性
                    file.id = util.md5(file.type + '-' + file.name + '-' + file.size + '-' + file.lastModified);
                }
                return file.id;
            },
            validate: function(file) {
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
                if (this.validate(file)) {
                    const vm = this;
                    return new Promise(function(resolve, reject) {
                        // 确保在fss服务中已登录
                        rpc.ensureLogined(function() {
                            resolve(file);
                        }, {
                            base: 'fss',
                            toLogin: function(loginFormUrl, originalUrl, originalMethod) {
                                // 此时已可知在CAS服务器上未登录，即未登录任一服务
                                reject(file);
                                // 从fss服务一定无法取得登录表单地址，改为从当前服务获取
                                rpc.get('/authentication/login-url', function(loginUrl) {
                                    // 默认登录后跳转回当前页面
                                    loginUrl += '&' + rpc.loginSuccessRedirectParameter + '=' + window.location.href;
                                    rpc.toLogin(loginUrl, vm.action, 'POST');
                                });
                                return true;
                            }
                        });
                    });
                }
                return false;
            },
            onProgress: function(event, file, fileList) {
                if (fileList.length >= this.uploadLimit.number) {
                    // 隐藏添加按钮
                    $('#' + this.id + ' .el-upload').fadeOut('slow');
                }
                const $container = $('#' + this.id);
                const $upload = $('.el-upload', $container);
                const fileId = this.getFileId(file);
                const $panel = $('.el-upload-list__panel[data-file-id="' + fileId + '"]', $container);
                const $listItem = $panel.parent();
                $listItem.css({
                    width: $upload.css('width'),
                    height: $upload.css('height'),
                });
                const $image = $('.el-upload-list__item-thumbnail', $listItem);
                let imageWidth = $image.width();
                let imageHeight = $image.height();
                if (imageWidth > imageHeight) {
                    imageHeight = (imageHeight / imageWidth).toPercent(4);
                    imageWidth = '100%';
                } else if (imageWidth < imageHeight) {
                    imageWidth = (imageWidth / imageHeight).toPercent(4);
                    imageHeight = '100%';
                } else {
                    imageWidth = '100%';
                    imageHeight = '100%';
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
                if (error.status === 401) {
                    console.error(error.message);
                }
            },
            onPreview: function(file) {
                console.info('on preview: ' + file.name);
            },
            previewFile: function(file) {

            },
            removeFile: function(file) {
                this.uploadFiles.remove(function(f) {
                    return file.uid === f.uid;
                });
                if (this.uploadFiles.length < this.uploadLimit.number) {
                    // 显示添加按钮
                    $('#' + this.id + ' .el-upload').fadeIn('slow');
                }
            },
            getFileUrls: function() {

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

</style>
