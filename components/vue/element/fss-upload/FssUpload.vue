<template>
    <tnxel-upload ref="upload" :app-name="fss" :action="action" :upload-limit="uploadLimit" :file-list="fileList"
        :read-only="readOnly" :width="width" :height="height" :on-success="onSuccess" :on-removed="emitInput"/>
</template>

<script>
import Upload from '../upload';

export default {
    components: {
        'tnxel-upload': Upload,
    },
    name: 'TnxelFssUpload',
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
            action: action,
            uploadLimit: {},
            fileList: [],
        };
    },
    computed: {
        uploadFiles() {
            return this.$refs.upload ? this.$refs.upload.uploadFiles : [];
        },
    },
    watch: {
        value(newValue, oldValue) {
            if (!oldValue && newValue) {
                this._init();
            }
        }
    },
    mounted() {
        this._init();
    },
    methods: {
        _init: function() {
            const vm = this;
            vm.tnx.app.rpc.ensureLogined(function() {
                if (vm.value) {
                    let storageUrls = Array.isArray(vm.value) ? vm.value : [vm.value];
                    vm.tnx.app.rpc.get('/metas', {storageUrls: storageUrls}, function(metas) {
                        vm.fileList = [];
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
        _loadUploadLimit: function() {
            let vm = this;
            vm.tnx.app.rpc.get('/upload-limit/' + vm.type, function(uploadLimit) {
                vm.uploadLimit = uploadLimit;
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
        onSuccess: function(uploadedFile, file, fileList) {
            if (uploadedFile) {
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
        size: function() {
            return this.$refs.upload.size();
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
