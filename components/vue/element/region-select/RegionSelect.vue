<template>
    <el-cascader :value="value" :options="region.subs" :props="options" :placeholder="placeholder" :clearable="empty"
        @change="onChange"/>
</template>

<script>
export default {
    name: 'TnxelRegionSelect',
    props: {
        value: {
            required: true,
        },
        scope: {
            type: String,
            default: () => 'CN',
        },
        maxLevel: {
            type: [Number, String],
            default: 3,
        },
        minLevel: {
            type: [Number, String],
            default: 3,
        },
        empty: {
            type: Boolean,
            default: false,
        },
        placeholder: String,
    },
    data() {
        return {
            options: {
                expandTrigger: 'hover',
                emitPath: false,
                value: 'code',
                label: 'caption',
                children: 'subs',
                leaf: 'includingSub',
                checkStrictly: this.minLevel !== this.maxLevel, // 最小级别不等于最大级别，则取消父子节点选中关联，允许选择中间级别的节点
            },
            region: {},
        };
    },
    created() {
        let vm = this;
        window.tnx.app.rpc.loadRegion(this.scope, function(region) {
            vm.filterSubs(region);
            vm.region = region;
        });
    },
    methods: {
        onChange(value) {
            this.$emit('input', value);
        },
        filterSubs(region) {
            if (region.subs) {
                if (region.level >= parseInt(this.maxLevel)) {
                    delete region.subs;
                } else {
                    for (let sub of region.subs) {
                        this.filterSubs(sub);
                    }
                }
            }
        }
    }
}
</script>
