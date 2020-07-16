<template>
    <div>
        <el-upload :id="id"
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
            :headers="uploadHeaders">
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
                tip: null,
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
                if (!file.id) { // 文件类型+文件名+文件大小+最后修改时间，几乎可以唯一区分一个文件，重复的概率极低
                    file.id = util.md5(file.type + '-' + file.name + '-' + file.size + '-' + file.lastModified);
                }
                return file.id;
            },
            beforeUpload: function(file) {
                // 校验限制条件
                const vm = this;
                return new Promise(function(resolve, reject) {
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
            },
            onProgress: function(event, file, fileList) {
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
                this.fileList = fileList;
            },
            onSuccess: function(uploadedFiles, file, fileList) {
                if (uploadedFiles instanceof Array) {
                    const uploadedFile = uploadedFiles[0]; // 该组件为单文件上传模式
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
                this.fileList.remove(function(f) {
                    return file.uid === f.uid;
                });
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
