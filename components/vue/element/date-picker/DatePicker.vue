<template>
    <el-date-picker :type="type" v-model="model" :value-format="format" :editable="false" :placeholder="placeholder"
        :clearable="empty" :default-value="defaultDate"/>
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
        empty: {
            type: Boolean,
            default: false,
        },
        defaultValue: [Date, Number, String],
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
        },
        defaultDate() {
            if (this.defaultValue instanceof Date) {
                return this.defaultValue;
            }
            if (typeof this.defaultValue === 'number') {
                return new Date(this.defaultValue);
            }
            if (typeof this.defaultValue === 'string') {
                return tnx.util.date.parseDate(this.defaultValue);
            }
            return undefined;
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
