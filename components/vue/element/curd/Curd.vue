<template>
    <el-col :span="span">
        <el-button :type="btnType" :icon="btnIcon" @click="toAdd">{{ addText }}</el-button>
        <el-table :data="list" border stripe v-if="list && list.length">
            <slot></slot>
            <el-table-column label="操作" header-align="center" align="center" v-if="updatable || removeable">
                <template slot-scope="scope">
                    <el-button type="text" class="p-0" @click="toUpdate(scope.$index)" v-if="updatable">
                        {{ updateText }}
                    </el-button>
                    <el-button type="text" class="p-0" @click="toRemove(scope.$index)" v-if="removeable">
                        {{ removeText }}
                    </el-button>
                </template>
            </el-table-column>
        </el-table>
    </el-col>
</template>

<script>
export default {
    name: 'TnxelCurd',
    props: {
        page: {
            type: Object,
            required: true,
        },
        value: Array,
        span: Number,
        btnType: {
            type: String,
            default: 'primary',
        },
        btnIcon: String,
        addText: {
            type: String,
            default: '新增',
        },
        updatable: {
            type: Boolean,
            default: true,
        },
        updateText: {
            type: String,
            default: '修改',
        },
        removeable: {
            type: Boolean,
            default: true,
        },
        removeText: {
            type: String,
            default: '移除',
        }
    },
    data() {
        return {
            list: this.value,
        }
    },
    watch: {
        list(value) {
            this.$emit('input', value);
        },
        value(value) {
            this.list = value;
        }
    },
    methods: {
        toAdd() {
            let vm = this;
            tnx.open(this.page, undefined, {
                click: function(yes, close) {
                    if (yes) {
                        if (typeof this.validateForm === 'function') {
                            this.validateForm(function(model) {
                                vm.list = vm.list || [];
                                vm.list.push(model);
                                close();
                            });
                            return false;
                        } else { // 没有定义表单校验函数，则不进行表单校验
                            vm.list = vm.list || [];
                            vm.list.push(model);
                        }
                    }
                }
            });
        },
        toUpdate(index) {
            let model = this.list[index];
            if (model) {
                let vm = this;
                tnx.open(this.page, {
                    value: model
                }, {
                    click: function(yes, close) {
                        if (yes) {
                            if (typeof this.validateForm === 'function') {
                                this.validateForm(function(model) {
                                    vm.list[index] = model;
                                    close();
                                });
                                return false;
                            } else { // 没有定义表单校验函数，则不进行表单校验
                                vm.list[index] = model;
                            }
                            return false;
                        }
                    }
                });
            }
        },
        toRemove(index) {
            this.list.splice(index, 1);
        }
    }
}
</script>
