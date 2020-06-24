<template>
    <div id="app">base: {{base}}</div>
</template>

<script>
    import tnx from '../packages';

    export default {
        name: 'App',
        data () {
            return {
                base: tnx.jquery.base
            }
        }
    }
</script>
