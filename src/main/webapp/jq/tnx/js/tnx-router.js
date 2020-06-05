/**
 * 页面路由组件
 */
define(["tnxjq"], function(tnx) {

    var TnxRouter = function TnxRouter(viewContainer) {
        this.viewContainer = $(viewContainer);
    }

    TnxRouter.prototype.to = function(path) {
        if (typeof path === "object") { // event
            var link = $(path.target);
            var href = link.attr("href");
            if (href.startsWith("#/")) {
                path = href.substr(1);
            }
        }
        if (typeof path === "string") {
            var app = tnx.app;
            var url = this._toUrl(path);
            var _this = this;
            app.owner.ajax(url, function(html) {
                _this.viewContainer.html(html);
                var container = _this.viewContainer.children("[js],[css]");
                container.each(function() {
                    $(this).attr("url", app.context + path);
                    app.init(this);
                });
            });
        }
    }

    TnxRouter.prototype.push = function(path) {
    }

    TnxRouter.prototype._toUrl = function(path) {
        return tnx.app.context + path + ".ajax";
    }

    return TnxRouter;
});
