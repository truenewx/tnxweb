// tnxel.js
/**
 * 基于Element的扩展支持
 */
import ElementUI from 'element-ui';

import tnxvue from '../tnxvue.js';
import dialog from './dialog';

const tnxel = Object.assign({}, tnxvue, {
    base: {
        name: 'element-ui',
        ref: ElementUI
    },
    dialog () {
        dialog.apply(tnxel, arguments);
    }
});

tnxel.app.owner = tnxel;

export default tnxel;
