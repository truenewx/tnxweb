<template>
    <el-select v-model="model" :placeholder="placeholder">
        <el-option class="text-muted" :key="emptyValue" :value="emptyValue" :label="emptyText" v-if="empty"/>
        <el-option v-for="item in items" :key="item.key" :value="item.key" :label="item.caption"/>
    </el-select>
</template>

<script>
export default {
    name: 'TnxelEnumSelect',
    props: {
        value: String,
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
    },
    data() {
        return {
            model: null,
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
