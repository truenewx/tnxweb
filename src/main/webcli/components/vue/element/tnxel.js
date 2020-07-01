// tnxel.js
/**
 * 基于Element的扩展支持
 */

import tnxvue from '../tnxvue.js';
import ElementUI from 'element-ui';

const tnxel = Object.assign({}, tnxvue, {
    base: {
        name: 'element-ui',
        ref: ElementUI
    },
});

export default tnxel;
