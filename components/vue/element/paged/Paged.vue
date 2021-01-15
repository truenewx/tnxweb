<template>
    <el-pagination layout="total, prev, pager, next" :background="background" @current-change="change"
        :page-size="value.pageSize" :current-page="value.pageNo" :total="value.total"/>
</template>

<script>
export default {
    name: 'TnxelPaged',
    props: {
        value: {
            type: Object,
            required: true,
        },
        change: {
            type: Function
        },
        background: {
            type: Boolean,
            default: true,
        }
    },
}
</script>
