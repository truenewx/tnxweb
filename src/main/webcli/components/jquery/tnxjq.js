// tnxjq.js
/**
 * 基于jQuery的扩展支持
 */
import $ from 'jquery';
import tnxcore from '../tnxcore.js';

const tnxjq = $.extend({}, tnxcore, {
    base: {
        name: 'jquery',
        ref: $
    },
});

export default tnxjq;
