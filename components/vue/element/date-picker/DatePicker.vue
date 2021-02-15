<template>
    <el-date-picker :type="type" v-model="model" :value-format="format" :editable="false" :placeholder="placeholder"/>
</template>

<script>
export default {
    name: 'TnxelDatePicker',
    props: {
        value: [Date, Number, String],
        valueFormat: String,
        type: {
            type: String,
            default: 'date',
        },
        placeholder: {
            type: String,
            default: '请选择',
        },
    },
    data() {
        return {
            model: this.getModel(),
        };
    },
    computed: {
        format() {
            if (this.valueFormat) {
                return this.valueFormat;
            }
            return this.type === 'datetime' ? window.tnx.util.date.patterns.dateTime : window.tnx.util.date.patterns.date;
        }
    },
    watch: {
        model(value) {
            this.$emit('input', value);
        },
        value(value) {
            this.model = this.getModel();
        }
    },
    methods: {
        getModel() {
            if (this.value instanceof Date) {
                return this.value.format(this.format);
            }
            if (typeof this.value === 'number') {
                return new Date(this.value).format(this.format);
            }
            return this.value;
        }
    }
}
</script>
