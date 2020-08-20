<template>
    <el-form label-position="right" label-width="auto" ref="form" :model="model"
        :rules="rules" :validate-on-rule-change="false" :disabled="disabled" status-icon>
        <slot></slot>
    </el-form>
</template>

<script>
export default {
    name: 'TnxelForm',
    props: {
        tnx: {
            type: Object,
            default: () => window.tnx,
        },
        model: {
            type: Object,
            required: true,
        },
        rule: [String, Object], // 加载字段校验规则的URL地址，或规则集对象
        submit: Function,
    },
    data() {
        return {
            rules: {},
            disabled: false,
        };
    },
    created() {
        if (typeof this.rule === 'string') {
            const vm = this;
            this.tnx.app.rpc.getMeta(this.rule, meta => {
                vm.rules = meta.rules;
            });
        } else if (this.rule) {
            this.rules = this.rule;
        }
    },
    methods: {
        disable(disabled) {
            this.disabled = disabled !== false;
        },
        validate(callback) {
            return this.$refs.form.validate(callback);
        },
        validateField(props, callback) {
            this.$refs.form.validateField(props, callback);
        },
        toSubmit(callback) {
            this.validate(function(success) {
                if (success) {
                    callback = callback || this.submit;
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            });
        },
    }
}
</script>

<style scoped>

</style>
