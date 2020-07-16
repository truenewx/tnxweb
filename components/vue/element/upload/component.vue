<template>
    <div>
        <el-upload :id="id"
            :action="action"
            :on-preview="onPreview"
            :before-upload="beforeUpload"
            :on-success="onSuccess"
            :on-error="onError"
            :with-credentials="true"
            list-type="picture-card"
            name="files"
            :file-list="fileList"
            :data="uploadParams"
            :headers="uploadHeaders">
            <i slot="default" class="el-icon-plus"></i>
            <div slot="file" slot-scope="{file}">
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
                id: 'upload-' + new Date().getTime(),
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
            onPreview: function(file) {
                console.info('on preview: ' + file.name);
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
            previewFile: function(file) {

            },
            removeFile: function(file) {

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

    .el-upload-list--picture-card .el-upload-list__item {
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
</style>
