<template>
    <div class="d-flex">
        <el-col :span="span">
            <el-input-number v-model="model" :min="min" :max="max" :placeholder="placeholder"/>
        </el-col>
        <p class="ml-2 text-muted" v-if="suffix">{{ suffix }}</p>
    </div>
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
        suffix: String,
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
    }
}
</script>
