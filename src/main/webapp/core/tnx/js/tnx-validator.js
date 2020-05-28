/**
 * 字段校验器组件
 */
define([], function() {
    var TnxValidator = function TnxValidator() {
        this.model = {};
        this.meta = {};
        this.required = {};
        this.valid = {};
        this.invalid = {};
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

    TnxValidator.prototype.setModel = function(model) {
        if (typeof model == "object") {
            this.model = model;
        }
        return this;
    }

    TnxValidator.prototype.setMeta = function(meta) {
        if (typeof meta == "object") {
            this.meta = meta;
            this.required = {};
            var _this = this;
            for (var fieldName in meta) {
                var validation = meta[fieldName].validation;
                if (validation && (validation.required || validation.notBlank)) {
                    _this.required[fieldName] = true;
                }
            }
        }
        return this;
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
            if (typeof validationValue == "number" && fieldValue) {
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
            if (typeof validationValue == "number" && fieldValue) {
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
            if (validationValue && fieldValue) {
                return typeof fieldValue == "number" || this.regExps.number.test(fieldValue);
            }
            return true; // 不要求为数字，则检查通过
        },
        integerLength: function(validationValue, fieldValue) {
            if (typeof validationValue == "number" && fieldValue) { // 校验值为数字才可校验
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
            if (typeof validationValue == "number" && validationValue > 0 && fieldValue) { // 校验值为数字且大于0才可校验
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
            if (validationValue && fieldValue) {
                // 本身为数值时，四舍五入为整数时与原值相等，说明其为整数
                return (typeof fieldValue == "number" && Math.ceil(fieldValue) === fieldValue)
                    || this.regExps.integer.test(fieldValue);
            }
            return true; // 不要求为整数，则检查通过
        },
        maxValue: function(validationValue, fieldValue) {
            if (typeof validationValue == "number" && fieldValue) {
                if (typeof fieldValue == "number") {
                    return fieldValue <= validationValue;
                } else if (this.regExps.number.test(fieldValue)) {
                    return Number(fieldValue) <= validationValue;
                } // 字段值不为数字无法校验，忽略该检查器
            }
            return true; // 校验值不为数字无法校验，忽略该检查器
        },
        minValue: function(validationValue, fieldValue) {
            if (typeof validationValue == "number" && fieldValue) {
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
                if (expression && fieldValue) {
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
            if (validationValue && fieldValue) {
                return this.regExps.email.test(fieldValue);
            }
            return true;
        },
        mobilePhone: function(validationValue, fieldValue) {
            if (validationValue && fieldValue) {
                return this.regExps.mobilePhone.test(fieldValue);
            }
            return true;
        },
        url: function(validationValue, fieldValue) {
            if (validationValue && fieldValue) {
                return this.regExps.url.test(fieldValue);
            }
            return true;
        },
        notContains: function(validationValue, fieldValue) {
            if (validationValue && fieldValue) {
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
            if (validationValue && fieldValue) {
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
            if (validationValue && fieldValue) {
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
            if (validationValue && fieldValue) {
                fieldValue = fieldValue.trim();
                var regExp = new RegExp("^.*<[a-z]+.*>.*$", "i");
                return !regExp.test(fieldValue);
            }
        },
        allowedTags: function(validationValue, fieldValue) {
            if (validationValue && fieldValue) {
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
            if (validationValue && fieldValue) {
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

    TnxValidator.prototype.validate = function(field) {
        if (field) {
            var fieldName;
            if (typeof field == "string") { // 字段名
                fieldName = field
            } else if (field instanceof jQuery) { // jQuery对象
                fieldName = field.attr("name");
            } else if (typeof field.getAttribute == "function") { // DOM对象
                fieldName = field.getAttribute("name");
            } else if (field.target) { // 事件对象
                fieldName = field.target.getAttribute("name");
            }
            if (fieldName) {
                return this.validateField(fieldName);
            }
        } else {
            return this.validateModel();
        }
        return true;
    };

    TnxValidator.prototype.validateModel = function() {
        // 先清空原有的所有校验结果
        this.valid = {};
        this.invalid = {};
        var _this = this;
        for (var fieldName in this.meta) {
            _this.validateField(fieldName);
        }
        return !this.hasError();
    };

    TnxValidator.prototype.validateField = function(fieldName) {
        var fieldMeta = this.meta[fieldName];
        if (fieldMeta) {
            // 先清空字段原有的校验结果
            this.valid[fieldName] = undefined;
            this.invalid[fieldName] = undefined;
            var validation = fieldMeta.validation;
            if (validation) {
                var fieldValue = this.model[fieldName];
                var _this = this;
                for (var validationName in validation) {
                    // 不能为空的校验规则在有最小长度限制时无效
                    if ((validationName === "required" || validationName === "notBlank") && validation.minLength) {
                        return false;
                    }
                    var validationValue = validation[validationName];
                    _this._validate(validationName, validationValue, fieldName, fieldValue);
                }
            }
            if (this.hasError(fieldName)) {
                return false;
            } else {
                this.valid[fieldName] = true;
            }
        } // 指定字段没有对应的元数据，视为校验通过
        return true;
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
            this.invalid[fieldName] = this.invalid[fieldName] || [];
            this.invalid[fieldName].push(message);
        }
    };

    TnxValidator.prototype.hasError = function(fieldName) {
        if (fieldName) {
            var fieldErrors = this.invalid[fieldName];
            return fieldErrors && fieldErrors.length;
        } else {
            // 元数据中有的字段才能进行校验，这里取所有可校验的字段逐一判断
            for (var fieldName in this.meta) {
                if (this.hasError(fieldName)) {
                    return true;
                }
            }
        }
        return false;
    }

    return TnxValidator;
});
