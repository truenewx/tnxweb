<template>
    <el-radio-group v-model="model" v-if="selector === 'radio-group'">
        <el-radio-button :label="emptyValue" v-if="empty">{{ emptyText }}</el-radio-button>
        <el-radio-button v-for="item in items" :key="item.key" :label="item.key">{{ item.caption }}</el-radio-button>
    </el-radio-group>
    <el-select v-model="model" :placeholder="placeholder" :filterable="filterable" v-else>
        <el-option class="text-muted" :value="emptyValue" :label="emptyText" v-if="empty"/>
        <el-option v-for="item in items" :key="item.key" :value="item.key" :label="item.caption"/>
    </el-select>
</template>

<script>
export default {
    name: 'TnxelEnumSelect',
    props: {
        value: String,
        selector: String,
        type: {
            type: [String, Array],
            required: true,
        },
        subtype: String,
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
            model: this.value,
            items: null,
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
        }
    },
    created() {
        let vm = this;
        if (typeof this.type === 'string') {
            if (this.type.toLowerCase() === 'boolean') {
                vm.items = [{
                    key: true,
                    caption: true.toText(),
                }, {
                    key: false,
                    caption: false.toText(),
                }];
            } else {
                window.tnx.app.rpc.loadEnumItems(this.type, this.subtype, function(items) {
                    vm.items = items;
                });
            }
        } else if (Array.isArray(this.type)) {
            vm.items = this.type;
        }
    },
    methods: {}
}
</script>
