<template>
    <el-form label-position="right" label-width="auto" ref="form" :model="model"
        :rules="rules" :validate-on-rule-change="false" :inline-message="true" :disabled="disabled"
        status-icon>
        <slot></slot>
        <el-form-item v-if="submit">
            <el-button type="primary" @click="toSubmit">{{submitText}}</el-button>
            <el-button @click="$router.back()">{{cancelText}}</el-button>
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
        rule: [String, Object], // 加载字段校验规则的URL地址，或规则集对象
        onRulesLoaded: Function, // 规则集加载后的附加处理函数，仅在rule为字符串类型的URL地址时有效
        submit: Function,
        submitText: {
            type: String,
            default: () => '确定' // TODO 国际化
        },
        cancelText: {
            type: String,
            default: () => '取消'
        }
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
                if (vm.onRulesLoaded) {
                    vm.onRulesLoaded(meta.rules);
                }
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
            const vm = this;
            this.validate(function(success) {
                if (success) {
                    if (typeof callback !== 'function') {
                        callback = vm.submit;
                    }
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            });
        },
    }
}
</script>
