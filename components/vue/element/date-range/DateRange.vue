<template>
    <el-date-picker type="daterange" v-model="model" :editable="false" value-format="yyyy-MM-dd"
        :range-separator="separator" :start-placeholder="beginPlaceholder" :end-placeholder="endPlaceholder"/>
</template>

<script>
export default {
    name: 'TnxelDateRange',
    props: {
        value: Object,
        separator: {
            type: String,
            default: '至',
        },
        beginPlaceholder: {
            type: String,
            default: '开始日期',
        },
        endPlaceholder: {
            type: String,
            default: '结束日期',
        },
    },
    data() {
        let model = [];
        if (this.value) {
            model.push(this.value.begin instanceof Date ? this.value.begin.formatDate() : this.value.begin);
            model.push(this.value.end instanceof Date ? this.value.end.formatDate() : this.value.end);
        }
        return {
            model: model,
        };
    },
    watch: {
        model(model) {
            let value = {};
            if (Array.isArray(model)) {
                if (model.length > 0) {
                    value.begin = model[0];
                }
                if (model.length > 1) {
                    value.end = model[1];
                }
            }
            this.$emit('input', value);
        },
    },
}
</script>
