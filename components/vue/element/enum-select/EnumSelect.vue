<template>
    <tnxel-fetch-cascader v-model="model" url="/api/meta/enums" value-name="key" text-name="caption"
        :params="{
            type: type,
            subtype:subtype,
            grouped: true,
        }" :disabled="disabled" :empty="empty" v-if="grouped"/>
    <tnxel-select v-model="model" :selector="selector" :items="items" value-name="key" text-name="caption"
        :default-value="defaultValue" :empty="empty" :empty-value="emptyValue" :placeholder="placeholder"
        :disabled="disabled" :change="change" v-else/>
</template>

<script>
import Select from '../select';
import FetchCascader from '../fetch-cascader';

export default {
    name: 'TnxelEnumSelect',
    components: {
        'tnxel-select': Select,
        'tnxel-fetch-cascader': FetchCascader,
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
        disabled: Boolean,
        change: Function,
        grouped: {
            type: Boolean,
            default: false,
        }
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
        },
        value(value) {
            this.model = this.value;
            this.initModel();
        }
    },
    created() {
        if (typeof this.type === 'string') {
            if (this.type.toLowerCase() === 'boolean') {
                this.items = [{
                    key: true,
                    caption: true.toText(),
                }, {
                    key: false,
                    caption: false.toText(),
                }];
                this.initModel();
            } else {
                let vm = this;
                window.tnx.app.rpc.loadEnumItems(this.type, this.subtype, function(items) {
                    vm.items = items;
                    vm.initModel();
                });
            }
        }
    },
    methods: {
        initModel() {
            if (!this.model && !this.empty && this.items && this.items.length) {
                this.model = this.items[0].key;
            }
        }
    }
}
</script>
