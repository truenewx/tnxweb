/**
 * 基于Vue的路由器构建函数
 */
function addRoute(routes, superiorPath, path, fnImportPage) {
    if (path) {
        routes.push({
            path: path,
            meta: {
                superiorPath: superiorPath,
            },
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
            if (addRoute(routes, undefined, item.path, fnImportPage)) {
                if (item.operations && item.operations.length) {
                    item.operations.forEach(operation => {
                        addRoute(routes, item.path, operation.path, fnImportPage);
                    });
                }
            } else {
                applyItemsToRoutes(item.subs, routes, fnImportPage);
            }
        });
    }
}

export default function(VueRouter, menu, fnImportPage) {
    let items;
    if (Array.isArray(menu)) {
        items = [];
        menu.forEach(function(m) {
            items = items.concat(m.items);
        });
    } else {
        items = menu.items;
    }

    const routes = [];
    applyItemsToRoutes(items, routes, fnImportPage);

    const router = new VueRouter({routes});
    router.afterEach((to, from) => {
        router.prev = from;
    });
    router.back = Function.around(router.back, function(back, path) {
        path = path || router.app._route.meta.superiorPath;
        if (path) {
            if (router.prev && router.prev.path === path) {
                back.call(router);
            } else {
                router.replace(path);
            }
        } else {
            back.call(router);
        }
    });
    return router;
}
