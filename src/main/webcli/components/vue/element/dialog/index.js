// /components/vue/element/dialog/index.js
import Vue from 'vue';
import ElementUI from 'element-ui';
import component from './component.vue';
import $ from 'jquery';

Vue.use(ElementUI);

export default function(title, content, buttons, options, contentParams) {
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
            title: title,
            content: content,
            contentParams: contentParams,
            buttons: buttons,
        }
    }).$mount('#' + dialogId);
    dialog.options = Object.assign(dialog.options, options);
}
