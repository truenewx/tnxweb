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
    } else if (item.subs && item.subs.length) {
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
    // 确保路径头尾都有/
    if (!path.startsWith('/')) {
        path = '/' + path;
    }
    if (!path.endsWith('/')) {
        path += '/';
    }
    // 移除可能包含的路径变量
    let permission = path.replaceAll(/\/:[^\/]+\//g, '/');
    // 去掉许可头尾的/
    if (permission.startsWith('/')) {
        permission = permission.substr(1);
    }
    if (permission.endsWith('/')) {
        permission = permission.substr(0, permission.length - 1);
    }
    // 许可所有中间的/替换为_
    permission = permission.replaceAll(/\//g, '_');
    // 加上应用前缀
    const baseApp = window.tnx.app.rpc.baseApp;
    return baseApp ? (baseApp + '.' + permission) : permission;
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
            if (item.path) {
                let pattern = item.path.replace(/\/:[a-zA-Z0-9_]+/g, '/[a-zA-Z0-9_\\*]+');
                if (pattern === item.path) { // 无路径参数
                    if (item.path === path) {
                        return callback(item);
                    }
                } else { // 有路径参数
                    if (new RegExp(pattern, 'g').test(path)) {
                        return callback(item);
                    }
                }
            }
            // 直接路径不匹配，则尝试在子菜单中查找
            if (item.subs) {
                let result = findItem(path, item.subs, callback);
                if (result) {
                    return callback(item, result);
                }
            }
        }
    }
    return undefined;
}

const Menu = function Menu(config) {
    this.caption = config.caption;
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
    return findItem(path, this.items, (item, sub) => {
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
        };
        prepareItem(item);
        if (item.subs && item.subs.length) {
            assignableItem.subs = findAssignableItems(item.subs);
        }
        // 当前菜单有许可限定，或有可分配的子级或操作，则当前菜单项为可分配项
        if (item.permission || assignableItem.subs.length) {
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
    let breadcrumbItems = findItem(path, this.items, (item, breadcrumbItems) => {
        if (breadcrumbItems && breadcrumbItems.length) {
            breadcrumbItems.unshift(item);
            return breadcrumbItems;
        } else {
            return [item];
        }
    });
    return breadcrumbItems || [];
};

Menu.prototype.isGranted = function(path) {
    const _this = this;
    return findItem(path, this.items, (item, sub) => {
        return isGranted(_this.authority, sub || item);
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
            } else {
                authorities.permissions = authorities.permissions || [];
                _this.authority = authorities;
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
