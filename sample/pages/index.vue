<template>
    <div class="text-center m-3">
        <h1>{{title}}</h1>
        <p>首页</p>
        <p>
            <el-button @click="showAlert">Alert</el-button>
            <el-button @click="showError">Error</el-button>
            <el-button @click="showConfirm">Confirm</el-button>
            <el-button @click="showToast">Toast</el-button>
            <el-button @click="showLoading">Loading</el-button>
            <el-button @click="showOpen">Open</el-button>
        </p>
        <p>
            <tnxel-upload ref="headImageUpload" v-if="uploadBaseUrl" :base-url="uploadBaseUrl"
                type="ManagerHeadImage" size="64" :on-unauthorized="toLogin"/>
        </p>
    </div>
</template>

<script>
    import {app, tnx} from '../app.js';
    import info from './info.vue';

    export default {
        data () {
            return {
                title: process.env.VUE_APP_TITLE,
                uploadBaseUrl: app.rpc.context.fss,
                tnx: tnx,
            };
        },
        created () {
            if (!this.uploadBaseUrl) {
                const vm = this;
                app.rpc.loadConfig(function(context) {
                    vm.uploadBaseUrl = context.context.fss;
                });
            }
        },
        methods: {
            showAlert () {
                tnx.alert('Hello World', function() {
                    console.info('Alerted');
                });
            },
            showError () {
                tnx.error('Hello World', function() {
                    console.info('Errored');
                });
            },
            showConfirm () {
                tnx.confirm('Hello World', function(yes) {
                    console.info(yes);
                });
            },
            showToast () {
                tnx.toast('操作成功', 2000, function() {
                    console.info('Toast closed.');
                });
            },
            showLoading () {
                tnx.showLoading('加载中');
                setTimeout(function() {
                    tnx.closeLoading();
                }, 2000);
            },
            showOpen () {
                tnx.open(info, {
                    param: '- from params',
                    opener: this,
                });
            },
            toLogin: function(loginUrl, callback) {
                app.rpc.get('/validate-login', function() {
                    app.rpc.get(loginUrl, callback);
                });
            }
        }
    }
</script>
