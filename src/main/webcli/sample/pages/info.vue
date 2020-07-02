<template>
    <div>
        <p>Component: Hello World {{param}}</p>
    </div>
</template>

<script>
    export default {
        props: ['param'],
        data () {
            return {};
        },
        methods: {
            dialog () {
                return {
                    title: '组件',
                    type: 'confirm',
                    click: this.toSubmit
                }
            },
            toSubmit (yes) {
                console.info(yes);
            }
        }
    }
</script>
