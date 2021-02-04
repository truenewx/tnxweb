<template>
    <el-avatar :size="size" :style="style" icon="el-icon-user-solid" :shape="shape" fit="contain" :src="src"/>
</template>

<script>
export default {
    name: 'TnxelAvatar',
    props: {
        src: String,
        shape: String,
        size: {},
    },
    computed: {
        style() {
            if (typeof this.size === 'number') {
                return {
                    'font-size': (this.size / 2) + 'px',
                };
            }
            return undefined;
        }
    }
}
</script>
