<template>
    <tnxel-select v-model="model" :selector="selector" :items="items" value-name="key" text-name="caption"
        :default-value="defaultValue" :empty="empty" :empty-value="emptyValue" :placeholder="placeholder"
        :change="change"/>
</template>

<script>
import Select from '../select';

export default {
    name: 'TnxelEnumSelect',
    components: {
        'tnxel-select': Select,
    },
    props: {
        value: String,
        selector: String,
        type: {
            type: String,
            required: true,
        },
        subtype: String,
        defaultValue: String,
        empty: {
            type: [Boolean, String],
            default: false,
        },
        emptyValue: {
            type: [String, Boolean, Number],
            default: () => null,
        },
        placeholder: String,
        change: Function,
    },
    data() {
        return {
            model: this.value,
            items: null,
        };
    },
    watch: {
        model(value) {
            this.$emit('input', value);
        }
    },
    created() {
        if (typeof this.type === 'string') {
            let vm = this;
            if (this.type.toLowerCase() === 'boolean') {
                vm.items = [{
                    key: true,
                    caption: true.toText(),
                }, {
                    key: false,
                    caption: false.toText(),
                }];
            } else {
                window.tnx.app.rpc.loadEnumItems(this.type, this.subtype, function(items) {
                    vm.items = items;
                });
            }
        }

    },
    methods: {}
}
</script>
