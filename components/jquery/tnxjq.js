// tnxjq.js
/**
 * 基于jQuery的扩展支持
 */
import $ from 'jquery';
import tnxcore from '../tnxcore.js';

const tnxjq = $.extend({}, tnxcore, {
    libs: $.extend({}, tnxcore.libs, {$})
});

tnxjq.util.owner = tnxjq;
tnxjq.app.owner = tnxjq;

export default tnxjq;
