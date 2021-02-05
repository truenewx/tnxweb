<template>
    <el-steps class="w-fit-content tnxel-steps-nav" :id="id" direction="vertical" :space="space">
        <el-step :class="{'is-active': activeIndex === index}" status="finish"
            v-for="(item, index) in items" :key="item.target" :data-target="item.target" :title="item.title"/>
    </el-steps>
</template>

<script>
import $ from 'jquery';

export default {
    name: 'TnxelStepsNav',
    props: {
        container: {
            type: String,
            required: true,
        },
        items: {
            type: Array,
            required: true,
        },
        id: String,
        space: [String, Number],
        offset: [String, Number],
    },
    data() {
        return {
            activeIndex: 0,
        }
    },
    mounted() {
        let vm = this;
        let selector = this.id ? ('#' + this.id) : '.tnxel-steps-nav';
        $(selector + ' .el-step').each(function(index, step) {
            $(step).click(function() {
                vm.navTo(index);
            });
        });
    },
    methods: {
        navTo(index) {
            this.activeIndex = index;
            let top = 0;
            if (index > 0) {
                let top0 = $('#' + this.items[0].target).offset().top;
                let $target = $('#' + this.items[index].target);
                top = $target.offset().top - top0;
                if (this.offset) {
                    top += parseInt(this.offset);
                }
            }
            $(this.container).scrollTop(top);
        },
    }
}
</script>
