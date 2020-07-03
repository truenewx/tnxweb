<template>
    <div class="text-center m-3">
        <h1 class="text-center">{{title}}</h1>
        <p>首页</p>
        <el-button @click="showTextDialog">文本弹框</el-button>
        <el-button @click="showComponentDialog">组件弹框</el-button>
        <el-button @click="showAlert">Alert</el-button>
    </div>
</template>

<script>
    import {app, tnx} from '../app.js';
    import info from './info.vue';

    export default {
        data () {
            return {
                title: process.env.VUE_APP_TITLE,
                rules: {},
            };
        },
        created () {
            const vm = this;
            app.rpc.getMeta('/manager/self/info', function(meta) {
                vm.rules = meta.rules;
            });
        },
        methods: {
            showTextDialog () {
                tnx.dialog('', 'Text: Hello World', [{
                    caption: '确定',
                    type: 'primary',
                    click () {
                        console.info('ok');
                    }
                }]);
            },
            showComponentDialog () {
                tnx.open(info, {
                    param: '- from params'
                }, undefined, this);
            },
            showAlert () {
                tnx.alert('Hello World', function() {
                });
            }
        }
    }
</script>
