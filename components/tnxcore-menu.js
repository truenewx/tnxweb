/**
 * 菜单组件
 * 菜单配置中的权限配置不是服务端权限判断的依据，仅用于生成具有权限的客户端菜单，以及分配权限时展示可分配的权限范围
 */
function isGranted(authority, item) {
    prepareItem(item);
    if (item.rank || item.permission) {
        if (item.rank) {
            if (authority.rank !== item.rank) {
                return false;
            }
        }
        if (item.permission) {
            if (authority.permissions.contains('*')) {
                return true;
            }
            if (!authority.permissions.containsIgnoreCase(item.permission)) {
                return false;
            }
        }
    } else if ((item.subs && item.subs.length) || (item.operations && item.operations.length)) {
        return undefined;
    }
    return true;
}

function prepareItem(item) {
    if (item.path && item.permission === true) {
        item.permission = getDefaultPermission(item.path);
    }
}

function getDefaultPermission(path) {
    let permission = path.replaceAll(/\/\{[^}]+\}\//g, '/');
    permission = permission.replaceAll(/\//g, '.');
    const baseApp = window.tnx.app.rpc.baseApp;
    return baseApp ? (baseApp + permission) : permission;
}

function applyGrantedItemToItems(authority, item, items) {
    const granted = isGranted(authority, item);
    if (granted === true) { // 授权匹配
        items.push(Object.assign({}, item));
    } else if (granted === false) { // 授权不匹配
        // 不做处理
    } else { // 无法判断，需到子节点中查找
        if (item.subs && item.subs.length) {
            const subs = [];
            for (let sub of item.subs) {
                if (isGranted(authority, sub)) {
                    subs.push(Object.assign({}, sub));
                }
            }
            if (subs.length) {
                items.push(Object.assign({}, item, {
                    subs: subs
                }));
            }
        }
        if (item.operations && item.operations.length) {
            const operations = [];
            for (let operation of item.operations) {
                if (isGranted(authority, operation)) {
                    operations.push(Object.assign({}, operation));
                }
            }
            if (operations.length) {
                items.push(Object.assign({}, item, {
                    operations: operations
                }));
            }
        }
    }
}

function findItem(path, items, callback) {
    if (path && items && items.length && typeof callback === 'function') {
        for (let item of items) {
            // 去掉可能的请求参数部分
            const index = path.indexOf('?');
            if (index >= 0) {
                path = path.substr(index);
            }
            // 检查直接路径是否匹配
            if (item.path && item.path === path) {
                return callback(item);
            }
            // 直接路径不匹配，则尝试在包含的操作中查找
            if (item.operations && item.operations.length) {
                for (let operation of item.operations) {
                    if (operation.path) {
                        let pattern = operation.path.replace(/\/:[a-zA-Z0-9_]+/g, '/[a-zA-Z0-9_\\*]+');
                        if (pattern === operation.path) { // 无路径参数
                            if (operation.path === path) {
                                return callback(item, operation);
                            }
                        } else { // 有路径参数
                            if (new RegExp(pattern, 'g').test(path)) {
                                return callback(item, operation);
                            }
                        }
                    }
                }
            }
            // 最后尝试在子菜单中查找
            if (item.subs) {
                let result = findItem(path, item.subs, callback);
                if (result) {
                    return callback(item, undefined, result);
                }
            }
        }
    }
    return undefined;
}

const Menu = function Menu(config) {
    this.items = config.items;
    this._url = config.url;
    this._grantedItems = null;
    this.authority = {
        type: null,
        rank: null,
        permissions: [],
    };
}

Menu.prototype.getItemByPath = function(path) {
    return findItem(path, this.items, (item, operation, sub) => {
        return sub ? sub : item;
    });
};

function findItemByPermission(items, permission) {
    for (let item of items) {
        prepareItem(item);
        if (item.permission === permission) {
            return item;
        }
        if (item.subs) {
            const sub = findItemByPermission(item.subs, permission);
            if (sub) {
                return sub;
            }
        }
        if (item.operations) {
            const operation = findItemByPermission(item.operations, permission);
            if (operation) {
                return operation;
            }
        }
    }
    return undefined;
}

Menu.prototype.getItemByPermission = function(permission) {
    return findItemByPermission(this.items, permission);
}

function findAssignableItems(items) {
    const assignableItems = [];
    items.forEach(item => {
        let assignableItem = {
            subs: [],
            operations: [],
        };
        prepareItem(item);
        if (item.subs && item.subs.length) {
            assignableItem.subs = findAssignableItems(item.subs);
        }
        if (item.operations && item.operations.length) {
            assignableItem.operations = findAssignableItems(item.operations);
        }
        // 当前菜单有许可限定，或有可分配的子级或操作，则当前菜单项为可分配项
        if (item.permission || assignableItem.subs.length || assignableItem.operations.length) {
            assignableItem = Object.assign({}, item, assignableItem);
            assignableItems.push(assignableItem);
        }
    });
    return assignableItems;
}

Menu.prototype.getAssignableItems = function() {
    return findAssignableItems(this.items);
}

Menu.prototype.getBreadcrumbItems = function(path) {
    let breadcrumbItems = findItem(path, this.items, (item, operation, breadcrumbItems) => {
        if (breadcrumbItems && breadcrumbItems.length) {
            breadcrumbItems.unshift(item);
            return breadcrumbItems;
        } else if (operation) {
            return [item, operation];
        } else {
            return [item];
        }
    });
    return breadcrumbItems || [];
};

Menu.prototype.isGranted = function(path) {
    const _this = this;
    return findItem(path, this.items, (item, operation, sub) => {
        return isGranted(_this.authority, sub || operation || item);
    });
};

Menu.prototype.loadGrantedItems = function(callback) {
    if (this._grantedItems) {
        callback(this._grantedItems);
    } else {
        const _this = this;
        window.tnx.app.rpc.get(this._url, function(authorities) {
            if (authorities && authorities.length) {
                authorities.forEach(auth => {
                    switch (auth.kind) {
                        case 'TYPE':
                            _this.authority.type = auth.name;
                            break;
                        case 'RANK':
                            _this.authority.rank = auth.name;
                            break;
                        case 'PERMISSION':
                            _this.authority.permissions.push(auth.name);
                            break;
                    }
                });
            }
            _this._grantedItems = [];
            _this.items.forEach(item => {
                applyGrantedItemToItems(_this.authority, item, _this._grantedItems);
            });
            callback(_this._grantedItems);
        });
    }
}

export default Menu;
