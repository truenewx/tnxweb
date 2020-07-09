/**
 * 页面路由组件
 */
define(["src/main/webcli/public/assets/js/tnxjq"], function(tnx) {

    var TnxRouter = function TnxRouter (viewContainer) {
        this.viewContainer = $(viewContainer);
        this.to(this.getCurrentPath());
        var _this = this;
        $(window).bind("hashchange", function(event) {
            _this.to(_this.getCurrentPath());
        });
    }

    TnxRouter.prototype.getCurrentPath = function() {
        var href = window.location.href;
        var index = href.indexOf("#");
        if (index >= 0) {
            var path = href.substr(index + 1);
            if (path.startsWith("/")) {
                return path;
            }
        }
        return undefined;
    }

    TnxRouter.prototype.to = function(path, callback) {
        if (typeof path === "string" && path.startsWith("/")) {
            var app = tnx.app;
            var url = this._toUrl(path);
            var _this = this;
            app.owner.ajax(url, function(html) {
                _this.viewContainer.html(html);
                callback = callback || _this.viewCallback;
                var container = _this.viewContainer.children("[js],[css]");
                container.each(function() {
                    $(this).attr("url", app.context + path);
                    app.init(this, callback);
                });
            });
            return path;
        }
    }

    TnxRouter.prototype.navTo = function(path) {
        if (path.startsWith("/")) {
            var href = window.location.href;
            var index = href.indexOf("#");
            if (index >= 0) {
                href = href.substr(0, index);
            } else if (!href.endsWith("/")) {
                href += "/";
            }
            window.location.href = href + "#" + path;
            return path;
        }
    }

    TnxRouter.prototype._toUrl = function(path) {
        return tnx.app.context + path + ".ajax";
    }

    TnxRouter.prototype.setViewCallback = function(viewCallback) {
        this.viewCallback = viewCallback;
    }

    return TnxRouter;
});
