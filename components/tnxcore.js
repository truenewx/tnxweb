// tnxcore.js
/**
 * 基于原生JavaScript的扩展支持
 */

import util from './tnxcore-util';
import app from "./tnxcore-app";

/**
 * 将指定对象中的所有字段拼凑成形如a=a1&b=b1的字符串
 * @param object 对象
 * @returns {string} 拼凑成的字符串
 */
Object.stringify = function(object) {
    let s = '';
    Object.keys(object).forEach(function(key) {
        const value = object[key];
        if (value instanceof Array) {
            value.forEach(function(v) {
                s += '&' + key + '=' + v;
            });
        } else {
            s += '&' + key + '=' + value;
        }
    });
    if (s.length > 0) {
        s = s.substr(1);
    }
    return s;
};

Function.around = function(target, around) {
    const _this = this;
    return function() {
        const args = [target];
        for (let i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        return around.apply(_this, args);
    }
};

// 不要在Object.prototype中添加函数，否则vue会报错
Object.assign(String.prototype, {
    firstToLowerCase: function() {
        return this.substring(0, 1).toLowerCase() + this.substring(1);
    },
    firstToUpperCase: function() {
        return this.substring(0, 1).toUpperCase() + this.substring(1);
    },
    replaceAll: function(findText, replaceText) {
        const regex = new RegExp(findText, 'g');
        return this.replace(regex, replaceText);
    }
});

Object.assign(Number.prototype, {
    /**
     * 获取当前数值四舍五入到指定精度后的结果
     * @param scale 精度，即小数点后的位数
     * @returns {number} 四舍五入后的结果数值
     */
    toFixed: function(scale) {
        const p = Math.pow(10, scale);
        return Math.round(this * p) / p;
    }
});

Object.assign(Element.prototype, {
    /**
     * 获取不是指定标签的第一个子节点
     * @param tagName 标签名
     * @return ChildNode 不是指定标签的第一个子节点，没有则返回undefined
     */
    getFirstChildWithoutTagName: function(tagName) {
        const children = this.childNodes;
        for (let i = 0; i < children.length; i++) {
            if (children[i].tagName && children[i].tagName !== tagName.toUpperCase()) {
                return children[i];
            }
        }
        return undefined;
    }
});

Object.assign(Array.prototype, {
    contains: function(element) {
        for (let e of this) {
            if (e === element) {
                return true;
            }
        }
        return false;
    },
    containsIgnoreCase: function(element) {
        if (typeof element === 'string') {
            for (let e of this) {
                if (typeof e === 'string' && e.toLocaleLowerCase() === element.toLocaleLowerCase()) {
                    return true;
                }
            }
        }
        return false;
    }
});

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
    error: function(message, callback) {
        this.alert('错误', message, callback);
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
