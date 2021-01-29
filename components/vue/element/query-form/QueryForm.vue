<template>
    <el-form :inline="true" :model="value" :class="theme ? ('theme-' + theme) : null">
        <slot></slot>
        <el-form-item v-if="query">
            <el-button :type="theme || 'primary'" icon="el-icon-search" @click="query" :plain="plain">
                {{ queryText }}
            </el-button>
            <el-button @click="doClear" :plain="plain" v-if="clearable">{{ clearText }}</el-button>
        </el-form-item>
    </el-form>
</template>

<script>
export default {
    name: 'TnxelQueryForm',
    props: {
        value: {
            type: Object,
            required: true,
        },
        theme: String,
        query: Function,
        queryText: {
            type: String,
            default: () => '查询'
        },
        clearable: {
            type: Boolean,
            default: () => true
        },
        clearText: {
            type: String,
            default: () => '清空'
        },
        clear: Function,
        plain: {
            type: Boolean,
            default: () => true
        }
    },
    methods: {
        doClear() {
            if (Object.keys(this.value).length) {
                this.$emit('input', {});
                if (this.clear) {
                    this.clear();
                }
                if (this.query) {
                    this.query();
                }
            }
        }
    }
}
</script>
