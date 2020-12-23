<template>
    <el-form :label-position="vertical ? 'top' : 'right'" label-width="auto" ref="form" :model="model"
        :rules="validationRules" :validate-on-rule-change="false" :inline-message="!vertical"
        :disabled="disabled" :class="theme ? ('theme-' + theme) : null" status-icon>
        <slot></slot>
        <el-form-item v-if="submit">
            <el-button :type="theme || 'primary'" @click="toSubmit">{{ _submitText }}</el-button>
            <el-button type="default" @click="toCancel" v-if="cancel !== false">{{ cancelText }}</el-button>
        </el-form-item>
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
        rules: [String, Object], // 加载字段校验规则的URL地址，或规则集对象
        onRulesLoaded: Function, // 规则集加载后的附加处理函数，仅在rule为字符串类型的URL地址时有效
        submit: Function,
        submitText: String,
        theme: String,
        cancel: {
            type: [String, Function, Boolean],
            default: () => true
        },
        cancelText: {
            type: String,
            default: () => '取消'
        },
        vertical: {
            type: Boolean,
            default: () => false
        }
    },
    data() {
        return {
            validationRules: {},
            disabled: false,
        };
    },
    computed: {
        _submitText() {
            if (this.submitText) {
                return this.submitText;
            }
            return this.cancel === false ? '保存' : '提交';
        }
    },
    created() {
        if (typeof this.rules === 'string') {
            const vm = this;
            this.tnx.app.rpc.getMeta(this.rules, meta => {
                if (vm.onRulesLoaded) {
                    vm.onRulesLoaded(meta.rules);
                } else {
                    vm.$emit('rules-loaded', meta.rules);
                }
                vm.validationRules = meta.rules;
                delete meta.rules;
                this.$emit('meta', meta);
            });
        } else if (this.rules) {
            this.validationRules = this.rules;
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
        toSubmit(callback, disabled) {
            const vm = this;
            this.validate(function(success) {
                if (success) {
                    if (typeof callback !== 'function') {
                        callback = vm.submit;
                    }
                    if (typeof callback === 'function') {
                        if (disabled !== false) {
                            vm.disable();
                        }
                        callback(vm);
                    }
                }
            });
        },
        toCancel() {
            if (typeof this.cancel === 'function') {
                this.cancel();
            } else if (typeof this.cancel === 'string') {
                this.$router.back(this.cancel);
            } else if (this.cancel !== false) {
                this.$router.back();
            }
        }
    }
}
</script>
