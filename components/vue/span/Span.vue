<template>
    <span v-if="valid">{{ prepend }}<slot></slot>{{ append }}</span>
    <span v-else-if="emptyText">{{ emptyText }}</span>
</template>

<script>
export default {
    name: 'TnxvueSpan',
    props: {
        prepend: String,
        append: String,
        emptyText: String,
    },
    computed: {
        valid() {
            if (this.$slots.default) {
                // 有多个子节点的，均视为有效
                if (this.$slots.default.length > 1) {
                    return true;
                }
                // 只有一个子节点的，需看其内容是否有效
                let defaultSlot = this.$slots.default[0];
                if (defaultSlot && defaultSlot.text) {
                    return defaultSlot.text.trim() !== '';
                }
            }
            return false;
        }
    }
}
</script>
