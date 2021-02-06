<template>
    <el-select v-model="model" :remote-method="load" :loading="loading" :placeholder="placeholder" :clearable="empty"
        default-first-option filterable remote @clear="clear">
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
            default: () => {
                return function(keyword) {
                    return {keyword};
                };
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
        empty: {
            type: Boolean,
            default: () => false,
        },
        placeholder: {
            type: String,
            default: '输入关键字进行检索',
        },
    },
    data() {
        return {
            model: this.value,
            loading: false,
            items: null,
            more: false,
        };
    },
    watch: {
        model(value) {
            this.$emit('input', value);
        }
    },
    methods: {
        load(keyword, callback) {
            if (keyword) {
                let params = this.params(keyword);
                let vm = this;
                window.tnx.app.rpc.get(this.url, params, function(result) {
                    if (Array.isArray(result)) {
                        vm.items = result;
                    } else if (typeof result === 'object') {
                        vm.items = result[vm.resultName];
                        if (result.paged) {
                            vm.more = result.paged.morePage;
                        }
                    }
                });
            } else {
                this.items = null;
            }
        },
        clear() {
            this.items = null;
        }
    }
}
</script>
