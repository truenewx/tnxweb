<template>
    <div class="tnxel-tag-group">
        <el-tag v-for="(item, index) in items" :key="item.key" :type="type" :size="size"
            :effect="item.selected ? 'dark' : 'plain'" @click="select(index)">
            {{item.text || item.caption || item.label}}
        </el-tag>
    </div>
</template>

<script>
export default {
    name: 'TnxelTagSelect',
    props: {
        type: String,
        size: String,
        items: {
            type: Array,
            required: true,
        },
        keys: {
            type: Array,
            default() {
                return [];
            }
        },
    },
    methods: {
        select(index) {

        }
    }
}
</script>

<style scoped>
.tnxel-tag-group .el-tag {
    margin-top: 5px;
    margin-bottom: 5px;
    cursor: pointer;
}

.tnxel-tag-group .el-tag:not(:last-child) {
    margin-right: 10px;
}
</style>
