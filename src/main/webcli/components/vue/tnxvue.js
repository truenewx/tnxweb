// tnxvue.js
/**
 * 基于Vue的扩展支持
 */

import Vue from 'vue';
import tnxcore from '../tnxcore.js';

function getDefaultDialogButtons (type, callback) {
    if (type) {
        if (type === 'confirm') {
            return [{
                text: '取消',
                click () {
                    if (typeof callback === "function") {
                        return callback(false);
                    }
                }
            }, {
                text: '确定',
                type: 'primary',
                click () {
                    if (typeof callback === "function") {
                        return callback(true);
                    }
                }
            }];
        } else {
            return [{
                text: '确定',
                type: 'primary',
                click: callback
            }];
        }
    }
    return [];
}

const tnxvue = Object.assign({}, tnxcore, {
    base: {
        name: 'vue',
        ref: Vue
    },
    dialog (title, content, buttons, options) {
        // 默认不实现，由UI框架扩展层实现
        throw new Error('Unsupported function');
    },
    alert (title, content, callback, options) {
        if (typeof content === "function") {
            options = callback;
            callback = content;
            content = undefined;
        }
        if (content === undefined) {
            content = title;
            title = '提示';
        }
        const buttons = getDefaultDialogButtons('alert', callback);
        this.dialog(title, content, buttons, options);
    },
    error (content, callback, options) {
        this.alert('错误', content, callback, options);
    },
    confirm (title, content, callback, options) {
        if (typeof content === 'function') {
            options = callback;
            callback = content;
            content = title;
            title = '确定';
        }
        const buttons = getDefaultDialogButtons('confirm', callback);
        this.dialog(title, content, buttons, options);
    },
    open (component, params, options) {
        if (component.methods.dialog) {
            options = Object.assign({}, component.methods.dialog(), options);
        }
        const title = component.title || options.title;
        const buttons = getDefaultDialogButtons(options.type, options.click);
        delete options.title;
        delete options.type;
        delete options.click;
        if (params) {
            Object.keys(params).forEach(key => {
                const prop = component.props[key];
                if (prop) {
                    prop.default = params[key];
                }
            });
        }
        this.dialog(title, component, buttons, options);
    }
});

Object.assign(tnxcore.util, {
    /**
     * 判断指定对象是否组件实例
     * @param obj 对象
     * @returns {boolean} 是否组件实例
     */
    isComponent: obj => {
        return (typeof obj === 'object') && (typeof obj.data === 'function')
            && (typeof obj.render === 'function');
    }
});

export default tnxvue;
