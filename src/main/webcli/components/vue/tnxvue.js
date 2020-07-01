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

export default tnxvue;
