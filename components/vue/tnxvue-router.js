/**
 * 基于Vue的路由器构建函数
 */
import {FunctionUtil} from '../tnxcore-util';

function addRoute(routes, superiorPath, item, fnImportPage) {
    if (item && item.path) {
        routes.push({
            path: item.path,
            meta: {
                superiorPath: superiorPath,
            },
            component: () => {
                let path = item.page || item.path.replace(/\/:[a-zA-Z0-9_]+/g, '');
                return fnImportPage(path);
            },
        });
    }
}

function applyItemsToRoutes(items, routes, fnImportPage) {
    if (items && items.length) {
        items.forEach(item => {
            addRoute(routes, undefined, item, fnImportPage);
            applyItemsToRoutes(item.subs, routes, fnImportPage);
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
    router.beforeEach((to, from, next) => {
        window.tnx.app.page.stopCache(from.path);
        next();
    });
    router.afterEach((to, from) => {
        router.prev = from;
    });
    router.back = FunctionUtil.around(router.back, function(back, path) {
        let route = router.app.$route;
        path = path || route.meta.superiorPath;
        if (path) {
            if (path.contains('/:') && route.params) {
                Object.keys(route.params).forEach(key => {
                    path = path.replaceAll('/:' + key + '/', '/' + route.params[key] + '/');
                });
            }
            if (!path.contains('/:') && router.prev && router.prev.path !== path) {
                router.replace(path);
                return;
            }
        }
        back.call(router);
    });
    return router;
}
