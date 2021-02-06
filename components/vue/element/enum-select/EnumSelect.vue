<template>
    <tnxel-select v-model="model" :selector="selector" :items="items" value-name="key" text-name="caption"
        :empty="empty" :empty-value="emptyValue" :placeholder="placeholder" :filterable="filterable"/>
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
        empty: {
            type: [Boolean, String],
            default: false,
        },
        emptyValue: {
            type: [String, Boolean, Number],
            default: () => null,
        },
        placeholder: String,
        filterable: Boolean,
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
    },
    methods: {}
}
</script>
