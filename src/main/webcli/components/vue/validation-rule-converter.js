// validation-rule-converter.js
/**
 * 校验规则转换器，将服务端元数据中的校验规则转换为async-validator组件的规则
 */

function getRule (validationName, validationValue, fieldMeta) {
    let rule;
    switch (validationName) {
        case 'required':
        case 'notEmpty':
        case 'notBlank':
            if (validationValue === true) {
                rule = {
                    required: true,
                    message: fieldMeta.caption + '不能为空',
                }
            }
            break;
    }
    if (rule) {
        rule.trigger = (fieldMeta.type && fieldMeta.type.toLowerCase() === 'select') ? 'change' : 'blur';
    }
    return rule;
}

export default function(meta) { // 从服务端元数据中构建完整的规则集
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
            rules[fieldName] = fieldRules;
        }
    });
    return rules;
}
