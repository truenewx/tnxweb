// tnxjq.js
/**
 * 基于jQuery的扩展支持
 */
import $ from 'jquery';
import tnxcore from '../tnxcore.js';

const tnxjq = $.extend({}, tnxcore, {
    libs: $.extend({}, tnxcore.libs, {$})
});

tnxjq.app.owner = tnxjq;

export default tnxjq;
