<template>
    <div id="app">{{context}}</div>
</template>

<script>
    import {tnx} from '../packages';

    export default {
        name: 'App',
        data () {
            return {
                context: tnx.context
            }
        }
    }
</script>
