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
        change: Function, // 选中值变化后的事件处理函数，由于比element的change事件传递更多参数，所以以prop的形式指定，以尽量节省性能
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
            this.triggerChange(value);
        }
    },
    created() {
        this.load();
    },
    methods: {
        triggerChange(value) {
            if (this.change) {
                let item = this.getItem(this.items, value);
                this.change(item);
            }
        },
        getItem(items, value) {
            if (items && value !== undefined) {
                for (let item of items) {
                    if (item[this.valueName] === value) {
                        return item;
                    }
                    let children = item[this.childrenName];
                    let child = this.getItem(children, value);
                    if (child) {
                        return child;
                    }
                }
            }
            return undefined;
        },
        load() {
            let vm = this;
            window.tnx.app.rpc.get(this.url, this.params, function(result) {
                vm.items = result;
            });
        },
    }
}
</script>
