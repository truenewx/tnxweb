/**
 * 基于Vue的字段校验插件
 */
(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global = global || self, global.TnxValidator = factory());
}(this, function() {

    var TnxValidator = function TnxValidator(owner, model, meta) {
        if (!owner) {
            throw new Error("The owner is not defined.");
        }
        if (!model) {
            throw new Error("The model is not defined.");
        }
        if (!meta) {
            throw new Error("The meta is not defined.");
        }
        this.owner = owner; // 所属的Vue实例
        this.model = model;
        this.meta = meta;
        this.cleanResult();
    };

    TnxValidator.prototype.cleanResult = function() {
        this.result = {
            valid: {}, // 校验通过的字段映射集
            invalid: {}, // 校验失败的字段映射集
        };
    };

    /**
     * 扩展校验
     *
     * @param name 校验名
     * @param message 错误消息模板
     * @param checker 检查函数或正则表达式
     */
    TnxValidator.extend = function(name, message, checker) {
        TnxValidator.prototype.messages[name] = message;
        if (typeof checker == "function") {
            TnxValidator.prototype.checkers[name] = checker;
        } else if (checker instanceof RegExp) { // 为正则表达式时生成正则表达式检查函数
            TnxValidator.prototype.checkers.regExps[name] = checker;
            TnxValidator.prototype.checkers[name] = function(validationValue, fieldValue) {
                if (validationValue && fieldValue !== "") {
                    return this.checkers.regExps[name].test(fieldValue);
                }
                return true;
            };
        }
    }

    TnxValidator.prototype.checkers = {
        regExps: {
            number: /^-?([1-9]\d{0,2}((,?\d{3})*|\d*)(\.\d*)?|0?\.\d*|0)$/,
            integer: /^(-?[1-9]\d{0,2}(,?\d{3}))|0*$/,
            email: /^[a-zA-Z0-9_\-]([a-zA-Z0-9_\-\.]{0,62})@[a-zA-Z0-9_\-]([a-zA-Z0-9_\-\.]{0,62})$/,
            mobilePhone: /^1[34578]\d{9}$/,
            url: /^https?:\/\/[A-Za-z0-9]+(\.?[A-Za-z0-9_-]+)*(:[0-9]+)?(\/\S*)?$/
        },
        required: function(validationValue, fieldValue) {
            if (validationValue) {
                if (typeof fieldValue == "string") {
                    return fieldValue.length > 0;
                } else {
                    return fieldValue !== undefined && fieldValue !== null;
                }
            }
            // 不要求必填，则检查通过
            return true;
        },
        notBlank: function(validationValue, fieldValue) {
            if (typeof fieldValue == "string") {
                if (fieldValue.length && !fieldValue.trim().length) { // 为纯空格时校验失败
                    return false;
                } else { // 否则转为使用required规则
                    return "required";
                }
            }
            return true; // 非字符串值，视为检查通过
        },
        maxLength: function(validationValue, fieldValue) {
            if (typeof validationValue == "number") {
                // 回车符计入长度
                var enterLength = fieldValue.indexOf("\n") < 0 ? 0 : fieldValue.match(/\n/g).length;
                var fieldLength = fieldValue.length + enterLength;
                if (fieldLength > validationValue) {
                    return [validationValue, fieldLength - validationValue];
                }
            }
            // 校验值不为数字无法校验，忽略该检查器
            return undefined;
        },
        minLength: function(validationValue, fieldValue) {
            if (typeof validationValue == "number") {
                // 回车符计入长度
                var enterLength = fieldValue.indexOf("\n") < 0 ? 0 : fieldValue.match(/\n/g).length;
                var fieldLength = fieldValue.length + enterLength;
                if (fieldLength < validationValue) {
                    return [validationValue, validationValue - fieldLength];
                }
            }
            // 校验值不为数字无法校验，忽略该检查器
            return undefined;
        },
        number: function(validationValue, fieldValue) {
            if (validationValue && fieldValue !== "") {
                return typeof fieldValue == "number" || this.regExps.number.test(fieldValue);
            }
            return true; // 不要求为数字，则检查通过
        },
        integerLength: function(validationValue, fieldValue) {
            if (typeof validationValue == "number") { // 校验值为数字才可校验
                if (typeof fieldValue != "string") { // 字段值一律转换为字符串再进行校验
                    fieldValue = String(fieldValue);
                }
                if (this.regExps.number.test(fieldValue)) { // 字段值为数值才可进行校验
                    // 取整数部分
                    var index = fieldValue.indexOf(".");
                    if (index >= 0) {
                        fieldValue = fieldValue.substr(0, index);
                    }
                    // 去掉整数部分可能包含的逗号分隔符
                    fieldValue = fieldValue.replace(/,/g, "");

                    if (fieldValue.length > validationValue) {
                        return [validationValue, fieldValue.length - validationValue];
                    }
                }
            }
            return undefined;
        },
        scale: function(validationValue, fieldValue) {
            if (typeof validationValue == "number" && validationValue > 0) { // 校验值为数字且大于0才可校验
                if (typeof fieldValue != "string") { // 字段值一律转换为字符串再进行校验
                    fieldValue = String(fieldValue);
                }
                if (this.regExps.number.test(fieldValue)) { // 字段值为数值才可进行校验
                    var index = fieldValue.indexOf(".");
                    if (index >= 0) { // 存在小数部分才校验
                        fieldValue = fieldValue.substr(index + 1); // 取小数部分

                        if (fieldValue.length > validationValue) {
                            return [validationValue, fieldValue.length - validationValue];
                        }
                    }
                }
            }
            return undefined;
        },
        integer: function(validationValue, fieldValue) {
            if (validationValue && fieldValue !== "") {
                // 本身为数值时，四舍五入为整数时与原值相等，说明其为整数
                return (typeof fieldValue == "number" && Math.ceil(fieldValue) === fieldValue)
                    || this.regExps.integer.test(fieldValue);
            }
            return true; // 不要求为整数，则检查通过
        },
        maxValue: function(validationValue, fieldValue) {
            if (typeof validationValue == "number") {
                if (typeof fieldValue == "number") {
                    return fieldValue <= validationValue;
                } else if (this.regExps.number.test(fieldValue)) {
                    return Number(fieldValue) <= validationValue;
                } // 字段值不为数字无法校验，忽略该检查器
            }
            return true; // 校验值不为数字无法校验，忽略该检查器
        },
        minValue: function(validationValue, fieldValue) {
            if (typeof validationValue == "number") {
                if (typeof fieldValue == "number") {
                    return fieldValue >= validationValue;
                } else if (this.regExps.number.test(fieldValue)) {
                    return Number(fieldValue) >= validationValue;
                } // 字段值不为数字无法校验，忽略该检查器
            }
            return true; // 校验值或字段值不为数字无法校验，忽略该检查器
        },
        regex: function(validationValue, fieldValue) {
            var checker = function(expression, fieldValue) {
                if (expression && fieldValue !== "") {
                    return new RegExp(expression).test(fieldValue);
                }
                return true;
            };
            var expression = validationValue;
            var message = "";
            if (validationValue instanceof Array) {
                if (validationValue.length > 0) {
                    expression = validationValue[0];
                    if (validationValue.length > 1) {
                        message = "，" + validationValue[1];
                    }
                } else {
                    expression = undefined;
                }
            }
            if (!checker(expression, fieldValue)) {
                return [message];
            }
            return undefined;
        },
        email: function(validationValue, fieldValue) {
            if (validationValue && fieldValue !== "") {
                return this.regExps.email.test(fieldValue);
            }
            return true;
        },
        mobilePhone: function(validationValue, fieldValue) {
            if (validationValue && fieldValue !== "") {
                return this.regExps.mobilePhone.test(fieldValue);
            }
            return true;
        },
        url: function(validationValue, fieldValue) {
            if (validationValue && fieldValue !== "") {
                return this.regExps.url.test(fieldValue);
            }
            return true;
        },
        notContains: function(validationValue, fieldValue) {
            if (validationValue && fieldValue !== "") {
                var values = validationValue.split(" ");
                for (var i = 0; i < values.length; i++) {
                    if (fieldValue.indexOf(values[i]) >= 0) {
                        return false;
                    }
                }
            }
            return true;
        },
        notContainsAngleBracket: function(validationValue, fieldValue) {
            if (validationValue && fieldValue !== "") {
                var values = ["<", ">"];
                for (var i = 0; i < values.length; i++) {
                    if (fieldValue.indexOf(values[i]) >= 0) {
                        return false;
                    }
                }
            }
            return true;
        },
        notContainsHtmlChars: function(validationValue, fieldValue) {
            if (validationValue && fieldValue !== "") {
                var values = ["<", ">", "'", "\"", "/", "\\"];
                for (var i = 0; i < values.length; i++) {
                    if (fieldValue.indexOf(values[i]) >= 0) {
                        return false;
                    }
                }
            }
            return true;
        },
        rejectTags: function(validationValue, fieldValue) {
            if (validationValue && fieldValue !== "") {
                fieldValue = fieldValue.trim();
                var regExp = new RegExp("^.*<[a-z]+.*>.*$", "i");
                return !regExp.test(fieldValue);
            }
        },
        allowedTags: function(validationValue, fieldValue) {
            if (validationValue && fieldValue !== "") {
                fieldValue = fieldValue.trim();
                var tags = validationValue.split(",");
                var leftIndex = fieldValue.indexOf("<");
                var rightIndex = leftIndex >= 0 ? fieldValue.indexOf(">", leftIndex) : -1;
                while (leftIndex >= 0 && rightIndex >= 0) {
                    var sub = fieldValue.substring(leftIndex + 1, rightIndex); // <>中间的部分
                    var spaceIndex = sub.indexOf(" ");
                    var tag = spaceIndex >= 0 ? sub.substring(0, spaceIndex) : sub;
                    if (tag.startsWith("/")) {
                        tag = tag.substr(1);
                    }
                    if (tags.indexOf(tag.toLowerCase()) < 0) {
                        return false; // 存在不允许的标签，则直接返回false
                    }
                    leftIndex = fieldValue.indexOf("<", rightIndex);
                    rightIndex = leftIndex >= 0 ? fieldValue.indexOf(">", leftIndex) : -1;
                }
            }
            return true;
        },
        forbiddenTags: function(validationValue, fieldValue) {
            if (validationValue && fieldValue !== "") {
                fieldValue = fieldValue.trim().toLowerCase();
                var tags = validationValue.split(",");
                for (var i = 0; i < tags.length; i++) {
                    var tag = tags[i];
                    if (fieldValue.indexOf("<" + tag + ">") > -1
                        || fieldValue.indexOf("<" + tag + " ") > -1) {
                        return false;
                    }
                }
            }
            return true;
        }
    };

    TnxValidator.prototype.messages = {
        required: "{0}不能为空",
        notBlank: "{0}不能为空或纯空格",
        maxLength: "{0}长度最多可以有{1}位，已超出{2}位",
        minLength: "{0}长度最少必须有{1}位，还缺少{2}位",
        number: "{0}必须为数字",
        integer: "{0}必须为整数",
        integerLength: "{0}整数位最多可以有{1}位，已超出{2}位",
        scale: "{0}小数位最多可以有{1}位，已超出{2}位",
        maxValue: "{0}最大可以为{1}",
        minValue: "{0}最小可以为{1}",
        email: "{0}只能包含字母、数字、下划线、-和.，@两边各自的长度应小于64",
        mobilePhone: "{0}只能是以1开头的11位数字手机号码",
        url: "{0}应为格式正确的网址链接",
        regex: "{0}格式错误{1}",
        notContains: "{0}不能包含：{1}",
        notContainsAngleBracket: "{0}不能包含：< >",
        notContainsHtmlChars: "{0}不能包含：< > \" '",
        rejectTags: "{0}不能包含任何标签",
        allowedTags: "{0}只能包含标签：{1}",
        forbiddenTags: "{0}不能包含标签：{1}"
    };

    TnxValidator.prototype.validate = function(fieldName) {
        if (fieldName) {
            if (fieldName.target) { // 事件对象特征
                fieldName = fieldName.target.getAttribute("name");
            }
            if (typeof fieldName == "string") {
                return this.validateField(fieldName);
            }
        } else {
            return this.validateModel();
        }
        return true;
    };

    TnxValidator.prototype.validateModel = function() {
        this.cleanResult(); // 先清空原有的所有校验结果
        var _this = this;
        Object.keys(this.model).forEach(function(fieldName) {
            _this.validateField(fieldName);
        });
        return !this.hasError();
    };

    TnxValidator.prototype.validateField = function(fieldName) {
        this._prepare();
        var fieldMeta = this.meta[fieldName];
        if (fieldMeta) {
            // 先清空字段原有的校验结果
            this.result.valid[fieldName] = undefined;
            this.result.invalid[fieldName] = undefined;
            var validation = fieldMeta.validation;
            if (validation) {
                var fieldValue = this.model[fieldName];
                var validator = this;
                Object.keys(validation).forEach(function(validationName) {
                    // 不能为空的校验规则在有最小长度限制时无效
                    if ((validationName === "required" || validationName === "notBlank") && validation.minLength) {
                        return false;
                    }
                    var validationValue = validation[validationName];
                    validator._validate(validationName, validationValue, fieldName, fieldValue);
                });
            }
            this.result.valid[fieldName] = !this.hasError(fieldName);
            return this.result.valid[fieldName];
        }
        // 指定字段没有对应的元数据，视为校验通过
        return true;
    };

    TnxValidator.prototype._prepare = function() {
        if (typeof this.model == "string") {
            this.model = this.owner[this.model];
        }
        if (typeof this.meta == "string") {
            this.meta = this.owner[this.meta];
        }
    };

    TnxValidator.prototype._validate = function(validationName, validationValue, fieldName, fieldValue) {
        var checker = this.checkers[validationName];
        if (checker) {
            var checkResult = checker.call(this.checkers, validationValue, fieldValue);
            if (typeof checkResult == "boolean") { // 若检查方法返回布尔值，则按默认规则格式化错误消息
                if (!checkResult) {
                    this._addErrorMessage(fieldName, validationName, validationValue);
                }
            } else if (checkResult instanceof Array) { // 若检查方法返回数组，则将数组作为消息格式化参数
                this._addErrorMessage(fieldName, validationName, checkResult);
            } else if (typeof checkResult == "string") { // 若检查方法返回字符串，则转为使用该字符串表示的校验规则
                this._validate(checkResult, validationValue, fieldName, fieldValue);
            }
        }
    };

    TnxValidator.prototype._addErrorMessage = function(fieldName, validationName, validationValue) {
        var message = this.messages[validationName];
        if (message) {
            var fieldMeta = this.meta[fieldName];
            var caption = fieldMeta ? fieldMeta.caption : undefined;
            if (!caption) {
                caption = "";
            }
            var args = [caption];
            if (validationValue instanceof Array) { // 拼接数组
                args = args.concat(validationValue);
            } else {
                args.push(validationValue);
            }
            args.forEach(function(arg, index) {
                message = message.replaceAll("\\{" + index + "\\}", args[index]);
            });
            this.result.invalid[fieldName] = this.result.invalid[fieldName] || [];
            this.result.invalid[fieldName].push(message);
        }
    };

    TnxValidator.prototype.hasError = function(fieldName) {
        if (fieldName) {
            var fieldErrors = this.result.invalid[fieldName];
            return fieldErrors && fieldErrors.length;
        }
        var fieldNames = Object.keys(this.result);
        for (var i = 0; i < fieldNames.length; i++) {
            if (this.hasError(fieldNames[i])) {
                return true;
            }
        }
        return false;
    }

    TnxValidator.install = function(Vue) {
        Vue.prototype.extendValidate = TnxValidator.extend;
        Vue.prototype.createValidator = function(model, meta, symbol) {
            model = model || "model";
            meta = meta || "meta";
            symbol = symbol || "$v";
            this[symbol] = new TnxValidator(this, model, meta);
            return this[symbol].result;
        };
    };

    if (Vue && typeof Vue.use == "function") {
        Vue.use(TnxValidator);
    }

    return TnxValidator;
}));