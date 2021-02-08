<template>
    <el-select v-model="model" :loading="loading" :filterable="filterable" remote :remote-method="fetch"
        :placeholder="placeholder || defaultPlaceholder" :clearable="empty" default-first-option @clear="clear">
        <el-option v-for="item in items" :key="item[valueName]" :value="item[valueName]" :label="item[textName]"/>
        <el-option label="还有更多结果..." disabled v-if="more"/>
    </el-select>
</template>

<script>
export default {
    name: 'TnxelFetchSelect',
    props: {
        value: String,
        url: {
            type: String,
            required: true,
        },
        params: { // 构建远程检索请求参数集的函数
            type: Function,
            default: function(keyword) {
                return keyword ? {keyword} : undefined;
            }
        },
        resultName: {  // 从返回结果中取结果清单的字段名称，常用于从分页查询结果中获取记录清单，仅当返回结果不是数组而是对象时有效
            type: String,
            default: () => 'records',
        },
        valueName: {
            type: String,
            default: () => 'id',
        },
        textName: {
            type: String,
            default: () => 'name',
        },
        empty: Boolean,
        filterable: Boolean,
        placeholder: String,
        change: Function, // 选中值变化后的事件处理函数，由于比element的change事件传递更多参数，所以以prop的形式指定，以尽量节省性能
    },
    data() {
        return {
            model: this.value,
            loading: false,
            items: null,
            more: false,
        };
    },
    computed: {
        defaultPlaceholder() {
            return this.filterable ? '输入关键字进行检索' : '请选择';
        }
    },
    watch: {
        model(value) {
            this.$emit('input', value);
            this.triggerChange(value);
        },
        params(params) {
            if (!this.filterable) {
                this.load();
            }
        }
    },
    created() {
        if (!this.filterable) {
            this.load();
        }
    },
    methods: {
        triggerChange(value) {
            if (this.change) {
                let item = this.getItem(value);
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
        fetch(keyword) {
            if (keyword) {
                this.load(keyword);
            } else {
                this.clear();
            }
        },
        load(keyword) {
            if (this.params) { // 当参数函数被设置为null时，不进行取数操作，用于参数条件初始不满足的情况
                this.loading = true;
                let params = this.params(keyword);
                let vm = this;
                window.tnx.app.rpc.get(this.url, params, function(result) {
                    vm.loading = false;
                    if (Array.isArray(result)) {
                        vm.items = result;
                    } else if (typeof result === 'object') {
                        vm.items = result[vm.resultName];
                        if (result.paged) {
                            vm.more = result.paged.morePage;
                        }
                    }
                    // 如果不可检索且不能为空，则默认选中第一个选项
                    if (!vm.filterable && !vm.empty && vm.items && vm.items.length) {
                        vm.model = vm.items[0][vm.valueName];
                    }
                });
            }
        },
        clear() {
            this.items = null;
        }
    }
}
</script>
