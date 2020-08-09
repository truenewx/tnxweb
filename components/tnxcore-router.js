/**
 * 路由器组件
 */
function addRoute (path, routes, fnImportPage) {
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

function applyItemsToRoutes (items, routes, fnImportPage) {
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

const Router = function Router (menu, fnImportPage) {
    this.menu = menu;
    this.fnImportPage = fnImportPage;
}

Router.prototype.getRoutes = function() {
    const routes = [];
    applyItemsToRoutes(this.menu.items, routes, this.fnImportPage);
    return routes;
}

export default Router;
