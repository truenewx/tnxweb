// tnxvue.js
/**
 * 基于Vue的扩展支持
 */
import Vue from 'vue';
import tnxcore from '../tnxcore.js';
import validator from './tnxvue-validator';
import buildRouter from './tnxvue-router';

function getDefaultDialogButtons(type, callback, theme) {
    if (type) {
        if (type === 'confirm') {
            return [{
                text: '取消',
                click(close) {
                    if (typeof callback === 'function') {
                        return callback.call(this, false, close);
                    }
                }
            }, {
                text: '确定',
                type: theme || 'primary',
                click(close) {
                    if (typeof callback === 'function') {
                        return callback.call(this, true, close);
                    }
                }
            }];
        } else {
            return [{
                text: '确定',
                type: theme || 'primary',
                click(close) {
                    if (typeof callback === 'function') {
                        return callback.call(this, close);
                    }
                }
            }];
        }
    }
    return [];
}

const components = {
    'Div': {
        name: 'TnxvueDiv',
        template: '<div><slot></slot></div>'
    },
    'Span': {
        name: 'TnxvueSpan',
        template: '<span><slot></slot></span>'
    }
};

const tnxvue = Object.assign({}, tnxcore, {
    libs: Object.assign({}, tnxcore.libs, {Vue}),
    components,
    buildRouter,
    install(Vue) {
        Object.keys(components).forEach(key => {
            const component = components[key];
            Vue.component(component.name, component);
        });
    },
    dialog(content, title, buttons, options, contentProps) {
        // 默认不实现，由UI框架扩展层实现
        throw new Error('Unsupported function');
    },
    open(component, props, options) {
        if (component.methods.dialog) {
            options = Object.assign({}, component.methods.dialog(), options);
        } else {
            options = options || {};
        }
        const title = component.title || options.title;
        const buttons = options.buttons || getDefaultDialogButtons(options.type, options.click, options.theme);
        delete options.title;
        delete options.type;
        delete options.click;
        this.dialog(component, title, buttons, options, props);
    }
});

Object.assign(tnxvue.util, {
    /**
     * 判断指定对象是否组件实例
     * @param obj 对象
     * @returns {boolean} 是否组件实例
     */
    isComponent: function(obj) {
        return (typeof obj === 'object') && (typeof obj.data === 'function') && (typeof obj.render === 'function');
    }
});

tnxvue.app.isProduction = function() {
    if (process && process.env && process.env.NODE_ENV !== 'production') {
        return false;
    }
    return true;
};

// 元数据到async-validator组件规则的转换处理
tnxvue.app.validator = validator;
tnxvue.app.rpc.getMeta = tnxvue.util.function.around(tnxvue.app.rpc.getMeta, function(getMeta, url, callback) {
    getMeta.call(tnxvue.app.rpc, url, function(meta) {
        if (meta) { // meta已被缓存，所以直接修改其内容，以便同步缓存
            meta.rules = validator.getRules(meta);
        }
        if (typeof callback === 'function') {
            callback.call(this, meta);
        }
    });
});

tnxvue.app.page.init = tnxvue.util.function.around(tnxvue.app.page.init, function(init, page, container) {
    if (container.tagName === 'BODY') { // vue不推荐以body为挂载目标，故从body下获取第一个div作为容器
        for (let i = 0; i < container.children.length; i++) {
            const child = container.children[i];
            if (child.tagName === 'DIV') {
                container = child;
                break;
            }
        }
    }
    init.call(this, page, container);
});

Object.assign(tnxvue.app.page, {
    startCache: function(model, intervalMillis, ignoredFields) {
        if (localStorage && intervalMillis && intervalMillis > 1000) { // 缓存间隔必须超过1秒
            let anchor = this._readCache(undefined, function(cache) {
                Object.assign(model, cache.model);
            });

            if (anchor) {
                let _this = this;
                let intervalId = setInterval(function() {
                    _this._storeCache(anchor, intervalId, model, ignoredFields);
                }, intervalMillis);
            }
        }
        return model;
    },
    _readCache: function(anchor, callback) {
        if (localStorage) {
            anchor = anchor || tnxvue.util.net.getAnchor() || '/';
            let cache = localStorage[anchor];
            if (cache) {
                cache = window.tnx.util.string.parseJson(cache);
                if (typeof callback === 'function') {
                    callback.call(this, cache);
                }
            }
            return anchor;
        }
    },
    _storeCache: function(anchor, intervalId, model, ignoredFields) {
        if (anchor && intervalId) {
            let data = {};
            if (Array.isArray(ignoredFields) && ignoredFields.length) {
                Object.keys(model).forEach(key => {
                    if (!ignoredFields.contains(key)) {
                        data[key] = model[key];
                    }
                });
            } else {
                data = model;
            }
            localStorage[anchor] = tnxvue.util.string.toJson({
                intervalId: intervalId,
                model: data,
                ignored: ignoredFields,
            });
        }
    },
    saveCache: function(model) {
        let intervalId;
        let ignoredFields;
        let anchor = this._readCache(undefined, function(cache) {
            intervalId = cache.intervalId;
            ignoredFields = cache.ignored;
        });
        this._storeCache(anchor, intervalId, model, ignoredFields);
    },
    stopCache: function(anchor) {
        return this._readCache(anchor, function(cache) {
            clearInterval(cache.intervalId);
        });
    },
    clearCache: function() {
        let anchor = this.stopCache();
        if (anchor) {
            delete localStorage[anchor];
        }
    },
    /**
     * 前端页面模型转换为后端命令模型，检查文件上传是否完成，去掉后端不需要的多余字段，转换多层嵌入字段数据使其符合服务端命令模型的基本要求
     * @param model 前端页面模型
     * @param refs 页面中的组件引用集
     * @param rules 字段校验规则，有则清除多余字段
     */
    toCommandModel: function(vm, model, rules) {
        let result = {};
        if (model) {
            if (vm.$refs) {
                let refKeys = Object.keys(vm.$refs);
                for (let refKey of refKeys) {
                    let ref = vm.$refs[refKey];
                    if (typeof ref.getStorageUrl === 'function') {
                        if (ref.validateUploaded() === false) {
                            return null;
                        }
                    }
                }
            }
            let fieldNames = Object.keys(model);
            for (let fieldName of fieldNames) {
                if (!rules || rules[fieldName]) {
                    if (fieldName.contains('__')) {
                        let path = fieldName.replaceAll('__', '.');
                        tnxvue.util.object.setValue(result, path, model[fieldName]);
                    } else {
                        result[fieldName] = model[fieldName];
                    }
                }
            }
        }
        return result;
    },
    /**
     * 转换多层嵌入字段数据使其符合前端页面模型的基本要求
     * @param model 服务端视图模型
     */
    toPageModel: function(model) {
        let expanded = this._expandRefFields(model);
        while (expanded) {
            expanded = this._expandRefFields(model);
        }
        return model;
    },
    _expandRefFields: function(model) {
        let expanded = false;
        Object.keys(model).forEach(key => {
            let value = model[key];
            if (value && typeof value === 'object') {
                Object.keys(value).forEach(refKey => {
                    model[key + '__' + refKey] = value[refKey];
                });
                delete model[key];
                expanded = true;
            }
        });
        return expanded;
    }
});

Vue.use(tnxvue);

window.tnx = tnxvue;

export default tnxvue;
