// tnxvue.js
/**
 * 基于Vue的扩展支持
 */
import Vue from 'vue/dist/vue'; // 默认的引入方式不能直接用于浏览器
import tnxcore from '../tnxcore.js';
import validator from './tnxvue-validator';

Vue.component('tnxvue-div', {
    template: '<div><slot></slot></div>'
});

Vue.component('tnxvue-span', {
    template: '<span><slot></slot></span>'
});

function getDefaultDialogButtons (type, callback) {
    if (type) {
        if (type === 'confirm') {
            return [{
                text: '取消',
                click (close) {
                    if (typeof callback === 'function') {
                        return callback.call(this, false, close);
                    }
                }
            }, {
                text: '确定',
                type: 'primary',
                click (close) {
                    if (typeof callback === 'function') {
                        return callback.call(this, true, close);
                    }
                }
            }];
        } else {
            return [{
                text: '确定',
                type: 'primary',
                click (close) {
                    if (typeof callback === 'function') {
                        return callback.call(this, close);
                    }
                }
            }];
        }
    }
    return [];
}

const tnxvue = Object.assign({}, tnxcore, {
    libs: Object.assign({}, tnxcore.libs, {Vue}),
    dialog (content, title, buttons, options, contentProps) {
        // 默认不实现，由UI框架扩展层实现
        throw new Error('Unsupported function');
    },
    open (component, props, options) {
        if (component.methods.dialog) {
            options = Object.assign({}, component.methods.dialog(), options);
        } else {
            options = options || {};
        }
        const title = component.title || options.title;
        const buttons = options.buttons || getDefaultDialogButtons(options.type, options.click);
        delete options.title;
        delete options.type;
        delete options.click;
        this.dialog(component, title, buttons, options, props);
    },
});

Object.assign(tnxvue.util, {
    owner: tnxvue,
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

tnxvue.util.initPage = Function.around(tnxvue.util.initPage, function(initPage, page, container) {
    if (container.tagName === 'BODY') { // vue不支持以body为容器，故从body下获取第一个div作为容器
        for (let i = 0; i < container.children.length; i++) {
            const child = container.children[i];
            if (child.tagName === 'DIV') {
                container = child;
                break;
            }
        }
    }
    initPage.call(this, page, container);
});

tnxvue.app.owner = tnxvue;

// 元数据到async-validator组件规则的转换处理
tnxvue.app.rpc.getMeta = Function.around(tnxvue.app.rpc.getMeta, function(getMeta, url, callback) {
    getMeta.call(tnxvue.app.rpc, url, function(meta) {
        if (meta) { // meta已被缓存，所以直接修改其内容，以便同步缓存
            meta.rules = validator.getRules(meta);
        }
        if (typeof callback === 'function') {
            callback.call(this, meta);
        }
    });
});

export default tnxvue;
