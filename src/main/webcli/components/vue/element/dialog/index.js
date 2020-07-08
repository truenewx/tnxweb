// /components/vue/element/dialog/index.js
import tnxjq from '../../../jquery/tnxjq';
import tnxvue from '../../tnxvue.js';
import component from './component.vue';

const $ = tnxjq.libs.$;
const Vue = tnxvue.libs.Vue;

export default function(content, title, buttons, options, contentParams) {
    let componentOption = {};
    if (this.util.isComponent(content)) {
        componentOption.components = {
            'tnxel-dialog-content': content
        };
        content = null;
    }
    let Dialog = Vue.extend(Object.assign({}, component, componentOption));

    const dialogId = 'dialog-' + (new Date().getTime());
    $('body').append('<div id="' + dialogId + '"></div>');
    if (!(buttons instanceof Array)) {
        buttons = [];
    }
    const dialog = new Dialog({
        propsData: {
            content: content,
            title: title,
            contentParams: contentParams,
            buttons: buttons,
        }
    }).$mount('#' + dialogId);
    dialog.options = Object.assign(dialog.options, options);
}
