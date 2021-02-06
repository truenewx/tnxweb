<template>
    <el-radio-group v-model="model" :class="{'ignore-error': !empty}" v-if="selector === 'radio-group'">
        <el-radio-button :label="emptyValue" v-if="empty">{{ emptyText }}</el-radio-button>
        <el-radio-button v-for="item in selectableItems" :key="item[valueName]" :label="item[valueName]">
            {{ item[textName] }}
        </el-radio-button>
    </el-radio-group>
    <el-select v-model="model" :class="{'ignore-error': !empty}" :placeholder="placeholder" :filterable="filterable"
        v-else>
        <el-option class="text-muted" :value="emptyValue" :label="emptyText" v-if="empty"/>
        <el-option v-for="item in selectableItems" :key="item[valueName]" :value="item[valueName]"
            :label="item[textName]"/>
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
        filterable: Boolean,
    },
    data() {
        return {
            selectableItems: this.items,
            model: this.value || this.getDefaultValue(this.items),
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
            this.selectableItems = items;
            if (!this.model) {
                this.model = this.getDefaultValue(items);
            }
        }
    },
    methods: {
        getDefaultValue(items) {
            let defaultValue = this.defaultValue;
            if (!defaultValue && !this.empty && items && items.length) {
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
