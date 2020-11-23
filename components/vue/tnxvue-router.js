/**
 * 基于Vue的路由器支持组件
 */
function addRoute(path, routes, fnImportPage) {
    if (path) {
        routes.push({
            path: path,
            component: () => {
                path = path.replace(/\/:[a-zA-Z0-9_]+/g, '');
                return fnImportPage(path);
            },
        });
        return true;
    }
    return false;
}

function applyItemsToRoutes(items, routes, fnImportPage) {
    if (items && items.length) {
        items.forEach(item => {
            if (addRoute(item.path, routes, fnImportPage)) {
                if (item.operations && item.operations.length) {
                    item.operations.forEach(operation => {
                        addRoute(operation.path, routes, fnImportPage);
                    });
                }
            } else {
                applyItemsToRoutes(item.subs, routes, fnImportPage);
            }
        });
    }
}

const Router = function Router(menu, fnImportPage) {
    if (Array.isArray(menu)) {
        this.items = [];
        let _this = this;
        menu.forEach(function(m) {
            _this.items = _this.items.concat(m.items);
        });
    } else {
        this.items = menu.items;
    }
    this.fnImportPage = fnImportPage;
}

Router.prototype.getRoutes = function() {
    const routes = [];
    applyItemsToRoutes(this.items, routes, this.fnImportPage);
    return routes;
}

export default Router;
