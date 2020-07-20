// tnxcore.js
/**
 * 基于原生JavaScript的扩展支持
 */

import util from './tnxcore-util';
import app from "./tnxcore-app";

const tnxcore = {
    libs: {},
    util: Object.assign({}, util, {
        owner: this
    }),
    app: Object.assign({}, app, {
        owner: this
    }),
    alert: function(message, title, callback) {
        if (typeof title === 'function') {
            callback = title;
            title = undefined;
        }
        const content = title ? (title + ':\n' + message) : message;
        alert(content);
        if (typeof callback === 'function') {
            callback();
        }
    },
    success: function(message, callback) {
        this.alert(message, '成功', callback);
    },
    error: function(message, callback) {
        this.alert(message, '错误', callback);
    },
    confirm: function(message, title, callback) {
        if (typeof title === 'function') {
            callback = title;
            title = undefined;
        }
        const yes = confirm(title + ':\n' + message);
        if (typeof callback === 'function') {
            callback(yes);
        }
    }
};

window.tnx = tnxcore;

export default tnxcore;
