<template>
    <el-checkbox-group v-model="model" v-if="selector === 'checkbox'">
        <el-checkbox v-for="item in items" :key="item[valueName]" :label="item[valueName]">
            {{ item[textName] }}
        </el-checkbox>
    </el-checkbox-group>
    <el-radio-group v-model="model" class="ignore-feedback" v-else-if="selector === 'radio'">
        <el-radio :label="emptyValue" v-if="empty">{{ emptyText }}</el-radio>
        <el-radio v-for="item in items" :key="item[valueName]" :label="item[valueName]">
            {{ item[textName] }}
        </el-radio>
    </el-radio-group>
    <el-radio-group v-model="model" class="ignore-feedback" v-else-if="selector === 'radio-button'">
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
        change: Function, // 选中值变化后的事件处理函数，由于比element的change事件传递更多参数，所以以prop的形式指定，以尽量节省性能
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
            this.triggerChange(value);
        },
        items(items) {
            this.model = this.getDefaultValue(items);
        }
    },
    methods: {
        triggerChange(value) {
            if (this.change) {
                let item = undefined;
                if (this.selector === 'checkbox') {
                    item = [];
                    if (Array.isArray(value)) {
                        for (let v of value) {
                            item.push(this.getItem(v));
                        }
                    }
                } else {
                    item = this.getItem(value);
                }
                this.change(item);
            }
        },
        getItem(value) {
            if (value !== undefined) {
                for (let item of this.items) {
                    if (item[this.valueName] === value) {
                        return item;
                    }
                }
            }
            return undefined;
        },
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
