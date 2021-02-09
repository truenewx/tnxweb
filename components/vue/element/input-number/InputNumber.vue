<template>
    <el-col class="d-flex" :span="span">
        <el-input-number ref="input" class="flex-grow-1" v-model="model" :min="min" :max="max" controls-position="right"
            :placeholder="placeholder" @change="onChange"/>
        <div class="static-text ml-2 text-muted" v-if="append">{{ append }}</div>
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
        append: String,
    },
    data() {
        return {
            model: this.value,
        }
    },
    watch: {
        model(value) {
            this.$emit('input', value);
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
