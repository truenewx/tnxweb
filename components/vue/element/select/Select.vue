<template>
    <el-checkbox-group v-model="model" v-if="selector === 'checkbox'">
        <el-checkbox v-for="item in items" :key="item[valueName]" :label="item[valueName]">
            {{ item[textName] }}
        </el-checkbox>
    </el-checkbox-group>
    <el-radio-group v-model="model" class="ignore-feedback" v-else-if="selector === 'radio-group'">
        <el-radio-button :label="emptyValue" v-if="empty">{{ emptyText }}</el-radio-button>
        <el-radio-button v-for="item in items" :key="item[valueName]" :label="item[valueName]">
            {{ item[textName] }}
        </el-radio-button>
    </el-radio-group>
    <el-select v-model="model" class="ignore-feedback" :placeholder="placeholder" v-else>
        <el-option class="text-muted" :value="emptyValue" :label="emptyText" v-if="empty"/>
        <el-option v-for="item in items" :key="item[valueName]" :value="item[valueName]" :label="item[textName]"/>
    </el-select>
</template>

<script>
export default {
    name: 'TnxelSelect',
    props: {
        value: String,
        selector: String,
        items: {
            type: Array,
            required: true,
        },
        valueName: {
            type: String,
            default: 'value',
        },
        textName: {
            type: String,
            default: 'text',
        },
        defaultValue: String,
        empty: {
            type: [Boolean, String],
            default: false,
        },
        emptyValue: {
            type: [String, Boolean, Number],
            default: () => null,
        },
        placeholder: String,
    },
    data() {
        return {
            model: this.getDefaultValue(this.items),
        };
    },
    computed: {
        emptyText() {
            return typeof this.empty === 'string' ? this.empty : '';
        }
    },
    watch: {
        model(value) {
            this.$emit('input', value);
        },
        items(items) {
            this.model = this.getDefaultValue(items);
        }
    },
    methods: {
        getDefaultValue(items) {
            let defaultValue = this.value || this.defaultValue;
            if (this.selector === 'checkbox') { // 多选时需确保值为数组
                if (defaultValue) {
                    if (!Array.isArray(defaultValue)) {
                        defaultValue = [defaultValue];
                    }
                } else {
                    defaultValue = [];
                }
            } else if (!defaultValue && !this.empty && items && items.length) {
                let firstItem = items[0];
                if (firstItem) {
                    defaultValue = firstItem[this.valueName];
                }
            }
            return defaultValue;
        }
    }
}
</script>
