// /components/vue/element/dialog/index.js
import Vue from 'vue';
import ElementUI from 'element-ui';
import component from './component.vue';
import $ from 'jquery';

Vue.use(ElementUI);

export default function(title, content, buttons, options) {
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
    const dialog = new Dialog().$mount('#' + dialogId);
    dialog.title = title;
    dialog.content = content;
    if (buttons instanceof Array) {
        dialog.buttons = buttons;
    }
    dialog.options = Object.assign(dialog.options, options);
}
