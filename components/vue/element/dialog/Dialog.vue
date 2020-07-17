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
        <div v-if="content" v-html="content"></div>
        <tnxel-dialog-content ref="content" v-bind="contentProps" v-else></tnxel-dialog-content>
        <div slot="footer" class="dialog-footer"
            :class="{'border-top': buttons && buttons.length}">
            <el-button v-for="(button, index) in buttons" :type="button.type" :key="index"
                @click="btnClick(index)">{{button.caption || button.text}}
            </el-button>
        </div>
    </el-dialog>
</template>

<script>
    import $ from 'jquery';

    export default {
        name: 'TnxelDialog',
        props: ['title', 'content', 'contentProps', 'buttons'],
        data () {
            return {
                visible: true,
                height: 0,
                options: {
                    modal: true, // 是否需要遮罩层
                    'close-on-click-modal': false, // 是否可以通过点击遮罩层关闭对话框
                    'close-on-press-escape': true, // 是否可以通过按下 ESC 关闭对话框
                    'show-close': true, // 是否显示关闭按钮
                    center: false, // 是否对头部和底部采用居中布局
                    width: '422px', // 对话框宽度，默认与MessageBox的宽度一致
                    // 以上均为element的Dialog组件配置项
                    onShown: undefined, // 对话框展示后的事件回调
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
            },
            top () {
                const docHeight = $(document).height();
                if (this.height >= docHeight) { // 如果对话框高度大于文档高度，则top偏移为0
                    return '0px';
                }
                // 对话框高度占文档高度的比例
                const heightRatio = this.height / docHeight;
                // 为了获得更好的视觉舒适度，根据高度比确定对话框中线位置：从33vh->50vh
                const baseline = 33 + (50 - 33) * heightRatio;
                return 'calc(' + baseline + 'vh - ' + this.height / 2 + 'px)';
            }
        },
        mounted () {
            this.$nextTick(function() {
                // 根据对话框高度计算top而不是直接在此计算top，直接计算的话，对话框在被关闭后会出现莫名的闪现情况
                this.height = $('.el-dialog:last').height();
                if (typeof this.options.onShown === 'function') {
                    this.options.onShown.call(this);
                }
            });
        },
        components: {
            'tnxel-dialog-content': null,
        },
        methods: {
            btnClick (index) {
                const button = this.buttons[index];
                if (button && typeof button.click === 'function') {
                    if (button.click.call(this.$refs.content, this.close) === false) {
                        return;
                    }
                }
                this.close();
            },
            close () {
                if (!this.content) { // 避免组件内容在关闭时被再次加载
                    const height = $('.el-dialog__wrapper:last .el-dialog__body').height();
                    this.content = '<div style="height: ' + height + 'px"></div>';
                }
                this.visible = false;
            },
            onClosed () {
                $('.el-dialog__wrapper:last').remove();
                if (typeof this.options.onClosed === 'function') {
                    this.options.onClosed.call(this.$refs.content);
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
