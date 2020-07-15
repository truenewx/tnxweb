<template>
    <el-upload :id="id"
        :action="action"
        :show-file-list="false"
        :before-upload="beforeUpload"
        :on-success="onSuccess"
        :on-error="onError"
        :with-credentials="true"
        list-type="picture-card"
        name="files"
        :data="params"
        :file-list="fileList">
        <i class="el-icon-plus"></i>
        <div slot="tip" class="el-upload__tip" v-if="tip" v-text="tip"></div>
    </el-upload>
</template>

<script>
    import $ from 'jquery';

    export default {
        name: 'TnxelUpload',
        props: {
            baseUrl: {
                type: String,
                required: true,
            },
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
                action: this.baseUrl + '/upload/' + this.type,
                tip: null,
                fileList: [],
                params: {
                    fileIds: []
                },
            };
        },
        watch: {
            files: function(files) {
                const fileList = [];
                if (files) {
                    if (!(files instanceof Array)) {
                        files = [files];
                    }
                    files.forEach(file => {
                        fileList.push({
                            name: file.name,
                            url: file.thumbnailReadUrl,
                        });
                    });
                }
                this.fileList = fileList;
            }
        },
        mounted () {
            const vm = this;
            this.$nextTick(function() {
                let size = vm.size;
                if (size instanceof Number) {
                    size = size + 'px';
                }
                if (size) {
                    const $upload = $('#' + vm.id + ' .el-upload');
                    $upload.css({
                        width: size,
                        height: size,
                    });
                    $upload.addClass('border');

                    let plusSize = $upload.height() / 4;
                    plusSize = Math.max(16, Math.min(plusSize, 32));
                    $('.el-icon-plus', $upload).css({
                        fontSize: plusSize + 'px'
                    });
                }
            });
        },
        methods: {
            beforeUpload: function(file) {

            },
            onSuccess: function(result, file, fileList) {
                if (result instanceof Array) {
                    this.files = this.files.concat(result);
                }
            },
            onError: function(error, file, fileList) {

            },
            getFileUrls: function() {

            }
        }
    }
</script>

<style>
    .el-upload {
        overflow: hidden;
        border-radius: 4px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .el-upload .el-icon-plus {
        color: #909399;
    }
</style>
