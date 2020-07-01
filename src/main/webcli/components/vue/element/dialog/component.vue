<template>
    <el-dialog :visible.sync="visible"
        :destroy-on-close="true"
        :close-on-click-modal="options['close-on-click-modal']"
        :close-on-press-escape="options['close-on-press-escape']"
        :width="width"
        @closed="onClosed">
        <div slot="title" class="dialog-title" :class="{'border-bottom':title}"
            v-html="title"></div>
        <div v-if="content">{{content}}</div>
        <tnxel-dialog-content v-else></tnxel-dialog-content>
        <div slot="footer" class="dialog-footer" :class="{'border-top':title}">
            <el-button @click="close">取消</el-button>
            <el-button type="primary" @click="close">确定</el-button>
        </div>
    </el-dialog>
</template>

<script>
    export default {
        name: 'Dialog',
        data () {
            return {
                visible: true,
                title: null,
                content: null,
                buttons: [],
                options: {
                    'close-on-click-modal': false,
                    'close-on-press-escape': true,
                },
            };
        },
        computed: {
            width () {
                return '30%';
            }
        },
        components: {
            'tnxel-dialog-content': null,
        },
        methods: {
            close () {
                this.visible = false;
            },
            onClosed () {
            }
        }
    }
</script>

<style>

    .el-dialog__header {
        padding: 0;
    }

    .dialog-title {
        font-size: 16px; /* 与关闭按钮大小一致 */
        padding: 1rem;
    }

    .dialog-title > :last-child,
    .el-dialog__body > div > :last-child {
        margin-bottom: 0;
    }

    .el-dialog__body {
        padding: 1rem;
        color: inherit;
    }

    .el-dialog__footer {
        padding: 0;
    }

    .dialog-footer {
        padding: 1rem;
    }
</style>
