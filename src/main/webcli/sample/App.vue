<template>
    <div id="app" v-if="logined">
        <page-index/>
    </div>
</template>

<script>
    import app from './app.js';
    import index from './pages/index.vue';

    export default {
        name: 'App',
        components: {
            'page-index': index,
        },
        data () {
            return {
                logined: false,
            }
        },
        created () {
            const vm = this;
            app.rpc.get('/validate-login', () => {
                vm.logined = true;
            });
        }
    }
</script>
