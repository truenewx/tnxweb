<template>
    <el-col class="tnxel-input-number-group" :span="span">
        <el-input-number ref="input" class="flex-grow-1" :class="{'rounded-right-0': suffix}" v-model="model" :min="min"
            :max="max" controls-position="right" :placeholder="placeholder" :disabled="disabled" :controls="controls"
            :step="step" :precision="precision" step-strictly @change="onChange"/>
        <div class="el-input-group__append" v-if="suffix">{{ suffix }}</div>
    </el-col>
</template>

<script>
export default {
    name: 'TnxelInputNumber',
    props: {
        value: Number,
        span: Number,
        min: Number,
        max: Number,
        placeholder: {
            type: String,
            default: () => '请设置',
        },
        disabled: Boolean,
        append: String,
        controls: {
            type: Boolean,
            default: true,
        },
        step: Number,
        precision: Number,
    },
    data() {
        return {
            model: this.value,
        }
    },
    computed: {
        suffix() {
            if (this.append) {
                return this.append;
            }
            if (this.$slots && this.$slots.append && this.$slots.append.length) {
                return this.$slots.append[0].text;
            }
            return null;
        }
    },
    watch: {
        model(value) {
            this.$emit('input', value);
        },
        value(value) {
            this.model = value;
        }
    },
    methods: {
        onChange(currentValue, oldValue) {
            if (oldValue === undefined && currentValue !== undefined) {
                this.$refs.input.focus();
            }
        }
    }
}
</script>
