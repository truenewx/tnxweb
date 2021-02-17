// tnxel.js
/**
 * 基于Element的扩展支持
 */
import ElementUI, {Loading, Message, MessageBox} from 'element-ui';
import tnxvue from '../tnxvue.js';
import dialog from './dialog';
import $ from 'jquery';

import Alert from './alert';
import Upload from './upload';
import PermissionTree from './permission-tree';
import QueryForm from './query-form';
import SubmitForm from './submit-form';
import Select from './select';
import TagSelect from './tag-select';
import EnumSelect from './enum-select';
import FetchSelect from './fetch-select';
import FetchCascader from './fetch-cascader';
import RegionCascader from './region-cascader';
import Paged from './paged';
import Transfer from './transfer';
import Avatar from './avatar';
import InputNumber from './input-number';
import StepsNav from './steps-nav';
import DatePicker from './date-picker';
import DateRange from './date-range';

const components = Object.assign({}, tnxvue.components, {
    Alert,
    Upload,
    PermissionTree,
    QueryForm,
    SubmitForm,
    Select,
    TagSelect,
    EnumSelect,
    FetchSelect,
    FetchCascader,
    RegionCascader,
    Paged,
    Transfer,
    Avatar,
    InputNumber,
    StepsNav,
    DatePicker,
    DateRange,
});

const tnxel = Object.assign({}, tnxvue, {
    libs: Object.assign({}, tnxvue.libs, {ElementUI}),
    components,
    install(Vue) {
        Vue.use(ElementUI);
        Object.keys(components).forEach(key => {
            const component = components[key];
            Vue.component(component.name, component);
        });
    },
    dialog() {
        this._closeMessage();
        dialog.apply(this, arguments);
    },
    _closeMessage() {
        Message.closeAll();
        this.closeLoading();
    },
    _handleZIndex(selector) {
        const util = this.util;
        setTimeout(function() {
            const topZIndex = util.dom.minTopZIndex(2);
            const element = $(selector);
            const zIndex = Number(element.css('zIndex'));
            if (isNaN(zIndex) || topZIndex > zIndex) {
                element.css('zIndex', topZIndex);
                const modal = element.next();
                if (modal.is('.v-modal')) {
                    modal.css('zIndex', topZIndex - 1);
                }
            }
        });
    },
    alert(message, title, callback, options) {
        if (typeof title === 'function') {
            options = callback;
            callback = title;
            title = '提示';
        }
        options = Object.assign({
            dangerouslyUseHTMLString: true,
        }, options, {
            type: 'warning',
        });
        this._closeMessage();
        MessageBox.alert(message, title, options).then(callback);
        this._handleZIndex('.el-message-box__wrapper:last');
    },
    success(message, callback, options) {
        options = Object.assign({
            dangerouslyUseHTMLString: true,
        }, options, {
            type: 'success',
        });
        this._closeMessage();
        MessageBox.alert(message, '成功', options).then(callback);
        this._handleZIndex('.el-message-box__wrapper:last');
    },
    error(message, callback, options) {
        options = Object.assign({
            dangerouslyUseHTMLString: true,
        }, options, {
            type: 'error',
        });
        this._closeMessage();
        MessageBox.alert(message, '错误', options).then(callback);
        this._handleZIndex('.el-message-box__wrapper:last');
    },
    confirm(message, title, callback, options) {
        if (typeof title === 'function') {
            options = callback;
            callback = title;
            title = '确认';
        }
        options = Object.assign({
            dangerouslyUseHTMLString: true,
        }, options, {
            type: 'info',
            iconClass: 'el-icon-question',
        });
        this._closeMessage();
        const promise = MessageBox.confirm(message, title, options);
        if (typeof callback === 'function') {
            promise.then(function() {
                callback(true);
            }).catch(function() {
                callback(false);
            });
        }
        this._handleZIndex('.el-message-box__wrapper:last');
    },
    toast(message, timeout, callback, options) {
        if (typeof timeout === 'function') {
            options = callback;
            callback = timeout;
            timeout = undefined;
        }
        options = Object.assign({
            type: 'success', // 默认为成功主题，可更改为其它主题
            offset: this.util.dom.getDocHeight() * 0.4,
            dangerouslyUseHTMLString: true,
        }, options, {
            center: true, // 因为是竖向排列，所以必须居中
            showClose: false,
            message: message,
            duration: timeout || 1500,
            onClose: callback,
        });
        this._closeMessage();
        Message(options);
        this._handleZIndex('.el-message:last');
    },
    showLoading(message, options) {
        if (typeof message !== 'string') {
            options = message;
            message = undefined;
        }
        options = Object.assign({
            dangerouslyUseHTMLString: true,
        }, options, {
            text: message,
        });
        this._closeMessage();
        window.tnx.loadingInstance = Loading.service(options);
        this._handleZIndex('.el-loading-mask');
    },
    closeLoading() {
        if (window.tnx.loadingInstance) { // 确保绝对的单例
            window.tnx.loadingInstance.close();
            window.tnx.loadingInstance = undefined;
        }
    },
});

tnxel.date = {
    formatDateTime: function(row, column, cellValue) {
        if (typeof cellValue === 'number') {
            cellValue = new Date(cellValue);
        }
        if (cellValue instanceof Date) {
            return cellValue.formatDateTime();
        }
        return cellValue;
    },
    formatDate: function(row, column, cellValue) {
        if (typeof cellValue === 'number') {
            cellValue = new Date(cellValue);
        }
        if (cellValue instanceof Date) {
            return cellValue.formatDate();
        }
        return cellValue;
    },
    formatTime: function(row, column, cellValue) {
        if (typeof cellValue === 'number') {
            cellValue = new Date(cellValue);
        }
        if (cellValue instanceof Date) {
            return cellValue.formatTime();
        }
        return cellValue;
    },
    formatMinute: function(row, column, cellValue) {
        if (typeof cellValue === 'number') {
            cellValue = new Date(cellValue);
        }
        if (cellValue instanceof Date) {
            return cellValue.formatMinute();
        }
        return cellValue;
    }
};

tnxel.libs.Vue.use(tnxel);

const rpc = tnxel.app.rpc;
rpc.handleErrors = tnxel.util.function.around(rpc.handleErrors, function(handleErrors, errors, options) {
    if (options && options.form && typeof options.form.disable === 'function') {
        options.form.disable(false);
    }
    return handleErrors.call(rpc, errors, options);
});

window.tnx = tnxel;

export default tnxel;
