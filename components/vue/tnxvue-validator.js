// tnxvue-validator.js
/**
 * 校验规则转换器，将服务端元数据中的校验规则转换为async-validator组件的规则。
 * async-validator组件详见：https://github.com/yiminghe/async-validator
 */
import validator from '../tnxcore-validator';

const regExps = {
    number: /^-?([1-9]\d{0,2}((,?\d{3})*|\d*)(\.\d*)?|0?\.\d*|0)$/,
    integer: /^(-?[1-9]\d{0,2}(,?\d{3}))|0*$/,
    email: /^[a-zA-Z0-9_\-]([a-zA-Z0-9_\-\.]{0,62})@[a-zA-Z0-9_\-]([a-zA-Z0-9_\-\.]{0,62})$/,
    url: /^https?:\/\/[A-Za-z0-9]+(\.?[A-Za-z0-9_-]+)*(:[0-9]+)?(\/\S*)?$/
}

/**
 * async-validator组件支持的类型清单
 */
const ruleTypes = ['string', 'number', 'boolean', 'method', 'regexp', 'integer', 'float', 'array', 'object', 'enum',
    'date', 'url', 'hex', 'email', 'any'];

function getRuleType(metaType) {
    if (ruleTypes.contains(metaType)) {
        return metaType;
    }
    switch (metaType) {
        case 'decimal':
            return 'float';
        case 'regex':
            return 'regexp';
    }
    return ruleTypes[0];
}

function getRule(validationName, validationValue, fieldMeta) {
    let rule = undefined;
    switch (validationName) {
        case 'required':
        case 'notNull':
        case 'notEmpty':
        case 'notBlank':
            if (validationValue === true) {
                rule = {
                    required: true,
                    message: validator.getErrorMessage(validationName, fieldMeta.caption),
                }
            }
            break;
        case 'maxLength':
            rule = {
                validator(r, fieldValue, callback, source, options) {
                    if (typeof validationValue === 'number' && fieldValue) {
                        // 回车符计入长度
                        const enterLength = fieldValue.indexOf('\n') < 0 ? 0 : fieldValue.match(/\n/g).length;
                        const fieldLength = fieldValue.length + enterLength;
                        if (fieldLength > validationValue) {
                            const message = validator.getErrorMessage(validationName, fieldMeta.caption,
                                validationValue, fieldLength - validationValue);
                            return callback(new Error(message));
                        }
                    }
                    return callback();
                }
            };
            break;
        case 'notContainsHtmlChars':
            if (validationValue === true) {
                rule = {
                    validator(r, fieldValue, callback, source, options) {
                        if (validationValue && fieldValue) {
                            const limitedValues = ['<', '>', '\'', '"', '/', '\\'];
                            for (let i = 0; i < limitedValues.length; i++) {
                                if (fieldValue.indexOf(limitedValues[i]) >= 0) {
                                    const s = limitedValues.join(' ');
                                    const message = validator.getErrorMessage('notContains', fieldMeta.caption, s);
                                    return callback(new Error(message));
                                }
                            }
                        }
                        return callback();
                    }
                };
            }
            break;
        case 'email':
            if (validationValue === true) {
                rule = {
                    type: validationName,
                    message: validator.getErrorMessage(validationName, fieldMeta.caption),
                }
            }
            break;
        case 'url':
            rule = {
                validator(r, fieldValue, callback, source, options) {
                    if (validationValue && fieldValue) {
                        if (!regExps.url.test(fieldValue)) {
                            const message = validator.getErrorMessage(validationName, fieldMeta.caption);
                            return callback(new Error(message));
                        }
                    }
                    return callback();
                }
            };
            break;
        case 'regex':
            rule = {
                validator(r, fieldValue, callback, source, options) {
                    if (fieldValue) {
                        let pattern = validationValue[0];
                        let regexp = new RegExp(pattern, 'gi');
                        if (!regexp.test(fieldValue)) {
                            let message = validationValue[1];
                            if (message) {
                                message = (fieldMeta.caption || '') + message;
                            } else {
                                message = validator.getErrorMessage('regex', fieldMeta.caption, '');
                            }
                            return callback(new Error(message));
                        }
                    }
                    return callback();
                }
            }
            break;
    }
    if (rule) {
        let metaType = 'text';
        if (fieldMeta.type) {
            metaType = fieldMeta.type.toLowerCase();
        }
        rule.type = rule.type || getRuleType(metaType);
        rule.trigger = metaType === 'option' ? 'change' : 'blur';
    }
    return rule;
}

/**
 * 从服务端元数据中构建完整的规则集
 * @param meta
 * @returns {{}}
 */
export function getRules(meta) {
    const rules = {};
    Object.keys(meta).forEach(fieldName => {
        const fieldMeta = meta[fieldName];
        if (fieldMeta.validation) {
            const fieldRules = [];
            Object.keys(fieldMeta.validation).forEach(validationName => {
                const validationValue = fieldMeta.validation[validationName];
                const rule = getRule(validationName, validationValue, fieldMeta);
                if (rule) {
                    fieldRules.push(rule);
                }
            });
            // 将可能包含的引用字段路径中的.替换为__，以符合async-validator规则名称的规范
            let ruleName = fieldName.replace('.', '__');
            rules[ruleName] = fieldRules;
        }
    });
    return rules;
}

export default {getRules}
