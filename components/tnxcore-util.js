// tnxcore-util.js
import md5 from 'md5';

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
    },
    toPercent: function(scale) {
        return (this * 100).toFixed(scale) + "%";
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
    },
    remove: function(element) {
        let index = -1;
        if (typeof element === 'function') {
            for (let i = 0; i < this.length; i++) {
                if (element(this[i]) === true) {
                    index = i;
                    break;
                }
            }
        } else {
            for (let i = 0; i < this.length; i++) {
                if (this[i] === element) {
                    index = i;
                    break;
                }
            }
        }
        if (index >= 0) {
            this.splice(index, 1);
        }
        return index;
    },
});

const util = {
    md5: md5,
    /**
     * 从指定头信息集中获取指定头信息值
     * @param headers 头信息集
     * @param name 头信息名称
     * @returns {undefined|*} 头信息值
     */
    getHeader: function(headers, name) {
        if (headers && name) {
            return headers[name] || headers[name.toLowerCase()];
        }
        return undefined;
    },
    getMetaContent: function(name) {
        const meta = document.querySelector('meta[name="' + name + '"]');
        if (meta) {
            return meta.getAttribute('content');
        }
        return undefined;
    },
    getDocHeight: function() {
        return document.documentElement.clientHeight;
    },
    maxZIndex: function(elements) {
        let result = -1;
        elements.forEach(function(element) {
            const zIndex = Number(element.style.zIndex);
            if (result < zIndex) {
                result = zIndex;
            }
        });
        return result;
    },
    /**
     * 获取最小的可位于界面顶层的ZIndex
     */
    minTopZIndex: function(step) {
        step = step || 1;
        const maxValue = 2147483584; // 允许的最大值，取各浏览器支持的最大值中的最小一个（Opera）
        const elements = document.body.querySelectorAll('*');
        const maxZIndex = this.maxZIndex(elements); // 可见DOM元素中的最高层级
        if (maxZIndex > maxValue - step) {
            return maxValue;
        } else {
            return maxZIndex + step;
        }
    },
    /**
     * 最少超时回调
     * @param beginTime 开始时间
     * @param callback 回调函数
     * @param minTimeout 最少超时时间，单位：毫秒
     */
    setMinTimeout: function(beginTime, callback, minTimeout) {
        if (beginTime instanceof Date) {
            beginTime = beginTime.getTime();
        }
        minTimeout = minTimeout || 1500;
        const dTime = new Date().getTime() - beginTime;
        if (dTime > minTimeout) {
            callback();
        } else {
            setTimeout(callback, minTimeout - dTime);
        }
    },
    isUrl: function(s) {
        const regex = '^((https|http|ftp)?://)'
            + '?(([0-9a-z_!~*\'().&=+$%-]+: )?[0-9a-z_!~*\'().&=+$%-]+@)?' //ftp的user@
            + '(([0-9]{1,3}.){3}[0-9]{1,3}' // IP形式的URL- 199.194.52.184
            + '|' // 允许IP和DOMAIN（域名）
            + '([0-9a-z_!~*\'()-]+.)*' // 二级域名：www
            + '([0-9a-z][0-9a-z-]{0,61})?[0-9a-z].' // 一级域名
            + '[a-z]{2,6})' // 域名后缀：.com
            + '(:[0-9]{1,4})?' // 端口：80
            + '((/?)|'
            + '(/[0-9a-z_!~*\'().;?:@&=+$,%#-]+)+/?)$';
        return new RegExp(regex).test(s);
    },
};

export default util;
