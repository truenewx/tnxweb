// tnxel.js
/**
 * 基于Element的扩展支持
 */
import ElementUI, {Loading, Message, MessageBox} from 'element-ui';
import ElementUI_UMD from 'element-ui/lib/index';
import tnxvue from '../tnxvue.js';
import dialog from './dialog';
import $ from 'jquery';

import Upload from './upload/Upload.vue';

function usePlugin(Vue, plugin) {
    Vue.use(plugin);
    Vue.component('tnxel-upload', Upload);
}

usePlugin(tnxvue.libs.Vue, ElementUI);
usePlugin(tnxvue.libs.Vue_UMD, ElementUI_UMD);

const tnxel = Object.assign({}, tnxvue, {
    libs: Object.assign({}, tnxvue.libs, {ElementUI, ElementUI_UMD}),
    dialog() {
        this._closeMessage();
        dialog.apply(this, arguments);
    },
    _closeMessage: function () {
        Message.closeAll();
        this.closeLoading();
    },
    _handleZIndex: function (selector) {
        const util = this.util;
        setTimeout(function () {
            const topZIndex = util.minTopZIndex(2);
            const element = $(selector);
            const zIndex = Number(element.css('zIndex'));
            if (isNaN(zIndex) || topZIndex > zIndex) {
                element.css('zIndex', topZIndex);
                const modal = element.next();
                if (modal.is('.v-modal')) {
                    modal.css('zIndex', topZIndex - 1);
                }
            }
        });
    },
    alert(message, title, callback, options) {
        if (typeof title === 'function') {
            options = callback;
            callback = title;
            title = '提示';
        }
        options = Object.assign({}, options, {
            type: 'warning',
        });
        this._closeMessage();
        MessageBox.alert(message, title, options).then(callback);
        this._handleZIndex('.el-message-box__wrapper:last');
    },
    success(message, callback, options) {
        options = Object.assign({}, options, {
            type: 'success',
        });
        this._closeMessage();
        MessageBox.alert(message, '成功', options).then(callback);
        this._handleZIndex('.el-message-box__wrapper:last');
    },
    error(message, callback, options) {
        options = Object.assign({}, options, {
            type: 'error',
        });
        this._closeMessage();
        MessageBox.alert(message, '错误', options).then(callback);
        this._handleZIndex('.el-message-box__wrapper:last');
    },
    confirm(message, title, callback, options) {
        if (typeof title === 'function') {
            options = callback;
            callback = title;
            title = '确认';
        }
        options = Object.assign({}, options, {
            type: 'info',
            iconClass: 'el-icon-question',
        });
        this._closeMessage();
        const promise = MessageBox.confirm(message, title, options);
        if (typeof callback === 'function') {
            promise.then(function () {
                callback(true);
            }).catch(function () {
                callback(false);
            });
        }
        this._handleZIndex('.el-message-box__wrapper:last');
    },
    toast: function (message, timeout, callback, options) {
        if (typeof timeout === 'function') {
            options = callback;
            callback = timeout;
            timeout = undefined;
        }
        options = Object.assign({
            type: 'success', // 默认为成功主题，可更改为其它主题
            offset: this.util.getDocHeight() * 0.4,
        }, options, {
            center: true, // 因为是竖向排列，所以必须居中
            showClose: false,
            message: message,
            duration: timeout || 1500,
            onClose: callback,
        });
        this._closeMessage();
        Message(options);
        this._handleZIndex('.el-message:last');
    },
    loadingInstance: undefined,
    closeLoading: function () {
        if (this.loadingInstance) {
            this.loadingInstance.close();
            this.loadingInstance = undefined;
        }
    },
    showLoading: function (message, options) {
        if (typeof message !== 'string') {
            options = message;
            message = undefined;
        }
        options = Object.assign({}, options, {
            text: message
        });
        this._closeMessage();
        this.loadingInstance = Loading.service(options);
        this._handleZIndex('.el-loading-mask');
    }
});

tnxel.util.owner = tnxel;
tnxel.app.owner = tnxel;

window.tnx = tnxel;

export default tnxel;
