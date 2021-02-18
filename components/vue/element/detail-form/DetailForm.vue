<template>
    <el-form :label-position="vertical ? 'top' : 'right'" label-width="auto" ref="form" :model="model"
        class="tnxel-detail-form" :class="theme ? ('theme-' + theme) : null">
        <slot></slot>
        <el-form-item v-if="back !== false">
            <el-button :type="theme || 'default'" @click="toBack">{{ backText }}</el-button>
        </el-form-item>
    </el-form>
</template>

<script>

export default {
    name: 'TnxelDetailForm',
    props: {
        model: {
            type: Object,
            default: () => {
            },
        },
        theme: String,
        back: {
            type: [String, Function, Boolean],
            default: () => true
        },
        backText: {
            type: String,
            default: () => '返回'
        },
        vertical: {
            type: Boolean,
            default: () => false
        }
    },
    data() {
        return {};
    },
    methods: {
        toBack() {
            if (typeof this.back === 'function') {
                this.back();
            } else if (typeof this.back === 'string') {
                this.$router.back(this.back);
            } else if (this.back !== false) {
                this.$router.back();
            }
        }
    }
}
</script>
