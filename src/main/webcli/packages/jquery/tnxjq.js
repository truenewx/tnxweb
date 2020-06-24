// tnxjq.js
/**
 * 基于jQuery的扩展支持
 */
import $ from 'jquery';
import tnxcore from '../core/tnxcore.js';

const tnxjq = $.extend({}, tnxcore, {
    base: 'jquery',
});

export default tnxjq;
