// tnxel.js
/**
 * 基于Element的扩展支持
 */
import ElementUI from 'element-ui/lib/index'; // 默认的引入方式不能直接用于浏览器
import tnxvue from '../tnxvue.js';
import dialog from './dialog';
import {Loading, Message, MessageBox} from 'element-ui';

tnxvue.libs.Vue.use(ElementUI);

const tnxel = Object.assign({}, tnxvue, {
    libs: Object.assign({}, tnxvue.libs, {ElementUI}),
    dialog () {
        this.closeToast();
        dialog.apply(tnxel, arguments);
    },
    alert (message, title, callback, options) {
        if (typeof title === 'function') {
            options = callback;
            callback = title;
            title = '提示';
        }
        options = Object.assign({}, options, {
            type: 'warning',
        });
        this.closeToast();
        MessageBox.alert(message, title, options).then(callback);
    },
    error (message, callback, options) {
        options = Object.assign({}, options, {
            type: 'error',
        });
        this.closeToast();
        MessageBox.alert(message, '错误', options).then(callback);
    },
    confirm (message, title, callback, options) {
        if (typeof title === 'function') {
            options = callback;
            callback = title;
            title = '确定';
        }
        this.closeToast();
        const promise = MessageBox.confirm(message, title, options);
        if (typeof callback === 'function') {
            promise.then(function() {
                callback(true);
            }).catch(function() {
                callback(false);
            });
        }
    },
    toastInstance: undefined,
    closeToast: function() {
        if (this.toastInstance) {
            this.toastInstance.close();
            this.toastInstance = undefined;
        }
    },
    toast: function(message, timeout, callback, options) {
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
            duration: timeout,
            callback: callback,
        });
        this.closeToast();
        this.toastInstance = Message(options);
    },
    loadingInstance: undefined,
    closeLoading: function() {
        if (this.loadingInstance) {
            this.loadingInstance.close();
            this.loadingInstance = undefined;
        }
    },
    showLoading: function(message, options) {
        if (typeof message !== 'string') {
            options = message;
            message = undefined;
        }
        options = Object.assign({}, options, {
            text: message
        });
        this.closeToast();
        this.closeLoading();
        this.loadingInstance = Loading.service(options);
    }
});

tnxel.app.owner = tnxel;

export default tnxel;
