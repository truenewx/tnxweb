<template>
    <div class="text-center m-3">
        <h1 class="text-center">{{title}}</h1>
        <p>首页</p>
        <el-button @click="showTextDialog">文本弹框</el-button>
        <el-button @click="showComponentDialog">组件弹框</el-button>
    </div>
</template>

<script>
    import {tnx} from '../app.js';
    import info from './info.vue';

    export default {
        data () {
            return {
                title: process.env.VUE_APP_TITLE,
            };
        },
        methods: {
            showTextDialog () {
                tnx.dialog('', 'Text: Hello World', [], {});
            },
            showComponentDialog () {
                tnx.dialog('组件', info, [], {});
            }
        }
    }
</script>
