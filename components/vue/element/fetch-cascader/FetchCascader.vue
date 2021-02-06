<template>
    <el-cascader v-model="model" class="ignore-feedback" :options="items" :props="options" :placeholder="placeholder"
        :show-all-levels="showAllLevels" :clearable="empty"/>
</template>

<script>
export default {
    name: 'TnxelFetchCascader',
    props: {
        value: String,
        url: {
            type: String,
            required: true,
        },
        params: Object,
        valueName: {
            type: String,
            default: () => 'id',
        },
        textName: {
            type: String,
            default: () => 'name',
        },
        childrenName: {
            type: String,
            default: () => 'children',
        },
        leafName: {
            type: String,
            default: () => 'leaf',
        },
        showAllLevels: {
            type: Boolean,
            default: true,
        },
        empty: Boolean,
        placeholder: {
            type: String,
            default: '请选择',
        },
    },
    data() {
        return {
            options: {
                expandTrigger: 'hover',
                emitPath: false,
                value: this.valueName,
                label: this.textName,
                children: this.childrenName,
                leaf: this.leafName,
            },
            model: this.value,
            items: null,
        };
    },
    watch: {
        model(value) {
            this.$emit('input', value);
        }
    },
    created() {
        this.load();
    },
    methods: {
        load() {
            let vm = this;
            window.tnx.app.rpc.get(this.url, this.params, function(result) {
                vm.items = result;
            });
        },
    }
}
</script>
