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
        level: {
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
                leaf: 'includingSub'
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
                if (region.level === parseInt(this.level)) {
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
