<template>
    <el-select :value="value" :placeholder="placeholder" @change="onChange">
        <el-option class="text-muted" :value="emptyValue" :label="emptyText" v-if="empty"/>
        <el-option v-for="item in items" :key="item.key" :value="item.key" :label="item.caption"/>
    </el-select>
</template>

<script>
export default {
    name: 'TnxelEnumSelect',
    props: {
        value: {
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        subtype: String,
        empty: {
            type: Boolean,
            default: false,
        },
        emptyValue: [String, Boolean, Number],
        emptyText: String,
        placeholder: String,
    },
    data() {
        return {
            items: null,
        };
    },
    created() {
        let vm = this;
        window.tnx.app.rpc.loadEnumItems(this.type, this.subtype, function(items) {
            vm.items = items;
        });
    },
    methods: {
        onChange(value) {
            this.$emit('input', value);
        }
    }
}
</script>
