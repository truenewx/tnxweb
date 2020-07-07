// tnxel.js
/**
 * 基于Element的扩展支持
 */
import ElementUI from 'element-ui/lib/index'; // 默认的引入方式不能直接用于浏览器
import tnxvue from '../tnxvue.js';
import dialog from './dialog';

tnxvue.depends.Vue.use(ElementUI);

const tnxel = Object.assign({}, tnxvue, {
    depends: Object.assign({}, tnxvue.depends, {ElementUI}),
    dialog () {
        dialog.apply(tnxel, arguments);
    }
});

tnxel.app.owner = tnxel;

export default tnxel;
