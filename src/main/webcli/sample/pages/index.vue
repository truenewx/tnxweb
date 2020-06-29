<template>
    <div class="text-center m-3">
        <h1 class="text-center">{{title}}</h1>
        <p>首页：{{managerCaption}}</p>
    </div>
</template>

<script>
    import app from '../app.js';

    export default {
        data () {
            return {
                title: process.env.VUE_APP_TITLE,
                managerCaption: null,
            };
        },
        created () {
            const _this = this;
            app.rpc.get('/manager/self/caption', function(managerCaption) {
                _this.managerCaption = managerCaption;
            });
        }
    }
</script>
