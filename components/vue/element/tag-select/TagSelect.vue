<template>
    <div class="tnxel-tag-group" v-if="tags">
        <el-tag v-for="(tag, index) in tags"
            :key="tag.key" :type="type" :size="size"
            :effect="tag.selected ? 'dark' : 'plain'" @click="select(index)">
            {{tag.text}}
        </el-tag>
    </div>
    <div v-else>
        <i class="el-icon-loading"/>
    </div>
</template>

<script>
export default {
    name: 'TnxelTagSelect',
    props: {
        type: String,
        size: String,
        items: Array,
        keyName: {
            type: String,
            default: 'key',
        },
        textName: {
            type: String,
            default: 'text',
        },
        keys: {
            type: Array,
            default() {
                return [];
            }
        },
    },
    data() {
        return {
            tags: this.getTags()
        }
    },
    watch: {
        items() {
            this.tags = this.getTags();
        }
    },
    methods: {
        getTags() {
            if (this.items) {
                const vm = this;
                const tags = [];
                this.items.forEach(item => {
                    const key = item[vm.keyName];
                    tags.push({
                        key: key,
                        text: item[vm.textName],
                        selected: vm.keys.contains(key),
                    });
                });
                return tags;
            }
            return undefined;
        },
        select(index) {
            this.tags[index].selected = !this.tags[index].selected;
        },
        getSelectedKeys() {
            const keys = [];
            this.tags.forEach(tag => {
                if (tag.selected) {
                    keys.push(tag.key);
                }
            });
            return keys;
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
