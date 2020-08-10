<template>
    <el-tree ref="tree"
        :data="nodes"
        :show-checkbox="true"
        :default-expand-all="true"
        :check-strictly="true"
        :check-on-click-node="true"
        :expand-on-click-node="false"
        @check-change="onCheckChange"
        node-key="id"
        class="px-1 py-2">
        <div class="permission-node" slot-scope="{node,data}">
            <span>{{data.label}}</span>
            <span class="text-muted" :class="{'d-none': !data.remark}">({{data.remark}})</span>
        </div>
    </el-tree>
</template>

<script>
function addTreeNodesTo (parentId, menuItems, treeNodes) {
    for (let i = 0; i < menuItems.length; i++) {
        const item = menuItems[i];
        let node = {
            id: (parentId || 'node') + '-' + i,
            parentId: parentId,
            label: item.caption,
            remark: item.desc,
            permission: item.permission,
        };
        if (item.subs && item.subs.length) {
            node.children = node.children || [];
            addTreeNodesTo(node.id, item.subs, node.children);
        }
        if (item.operations && item.operations.length) {
            node.children = node.children || [];
            addTreeNodesTo(node.id, item.operations, node.children);
        }
        treeNodes.push(node);
    }
}

function getTreeNodes (menu) {
    let items = menu.getAssignableItems();
    const nodes = [];
    addTreeNodesTo(undefined, items, nodes);
    return nodes;
}

export default {
    props: ['menu', 'permissions'],
    data () {
        return {
            nodes: this.getTreeNodes(this.menu),
        };
    },
    methods: {
        onCheckChange (node, checked) {
            if (checked) { // 节点被选中，则上级节点必须选中
                if (node.parentId) {
                    this.$refs.tree.setChecked(node.parentId, true);
                }
            } else { // 节点未选中，则下级节点必须全部未选中
                if (node.children) {
                    const tree = this.$refs.tree;
                    node.children.forEach(child => {
                        tree.setChecked(child.id, false);
                    });
                }
            }
        },
        getPermissions () {
            const nodes = this.$refs.tree.getCheckedNodes();
            if (nodes && nodes.length) {

            }
        }
    }
}
</script>

<style>
.permission-node {
    width: 100%;
}

.permission-node span:last-child {
    float: right;
    margin-right: 6px;
}
</style>
