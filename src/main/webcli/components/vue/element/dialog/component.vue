<template>
    <el-dialog
        :visible.sync="visible"
        :destroy-on-close="true"
        :append-to-body="true"
        :modal="options.modal"
        :close-on-click-modal="options['close-on-click-modal']"
        :close-on-press-escape="options['close-on-press-escape']"
        :show-close="options['show-close']"
        :center="options.center"
        :width="width"
        :top="top"
        @closed="onClosed">
        <div slot="title" class="dialog-title" :class="{'border-bottom': title}"
            v-html="title"></div>
        <div v-if="content">{{content}}</div>
        <tnxel-dialog-content v-else></tnxel-dialog-content>
        <div slot="footer" class="dialog-footer" :class="{'border-top': (title && buttons.length)}">
            <el-button v-for="(button, index) in buttons" :type="button.type" :key="index"
                @click="btnClick(index)">{{button.caption || button.text}}
            </el-button>
        </div>
    </el-dialog>
</template>

<script>
    import $ from 'jquery';

    export default {
        name: 'Dialog',
        data () {
            return {
                visible: true,
                top: null,
                title: null,
                content: null,
                buttons: [],
                options: { // 以下配置项均来自于element的Dialog组件
                    modal: true, // 是否需要遮罩层
                    'close-on-click-modal': false, // 是否可以通过点击 modal 关闭 Dialog
                    'close-on-press-escape': true, // 是否可以通过按下 ESC 关闭 Dialog
                    'show-close': true, // 是否显示关闭按钮
                    center: false, // 是否对头部和底部采用居中布局
                    width: '500px', // Dialog 的宽度
                },
            };
        },
        computed: {
            width () {
                if (typeof this.options.width === 'function') {
                    return this.options.width();
                } else {
                    return this.options.width;
                }
            }
        },
        mounted () {
            const docHeight = $(document).height();
            const dialogHeight = $('.el-dialog:last').height();
            // 除以3而不是2，以使得对话框略微靠上，让视觉感受更舒服
            this.top = (docHeight - dialogHeight) / 3 + 'px';
        },
        components: {
            'tnxel-dialog-content': null,
        },
        methods: {
            btnClick (index) {
                const button = this.buttons[index];
                if (button && typeof button.click === 'function') {
                    if (button.click() === false) {
                        return;
                    }
                }
                this.visible = false;
            },
            onClosed () {
                $('.el-dialog__wrapper:last').remove();
                if (typeof this.options.onClosed === 'function') {
                    this.options.onClosed();
                }
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
