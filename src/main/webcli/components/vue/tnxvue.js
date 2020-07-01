// tnxvue.js
/**
 * 基于Vue的扩展支持
 */

import Vue from 'vue';
import tnxcore from '../tnxcore.js';

const tnxvue = Object.assign({}, tnxcore, {
    base: {
        name: 'vue',
        ref: Vue
    },
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
