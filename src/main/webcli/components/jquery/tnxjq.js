// tnxjq.js
/**
 * 基于jQuery的扩展支持
 */
import $ from 'jquery';
import tnxcore from '../core/tnxcore.js';

const tnxjq = $.extend({}, tnxcore, {
    base: { // 标记是基于jQuery的扩展
        name: 'jquery',
        type: $
    },
});

export default tnxjq;
