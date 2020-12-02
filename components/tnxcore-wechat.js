// tnxcore-wechat.js
/**
 * 微信登录客户端支持
 */
!function(a, b, c) {
    function d(a) {
        var c = "default";
        a.self_redirect === !0 ? c = "true" : a.self_redirect === !1 && (c = "false");
        var d = b.createElement("iframe"),
            e = "https://open.weixin.qq.com/connect/qrconnect?appid=" + a.appid + "&scope=" + a.scope + "&redirect_uri=" + a.redirect_uri + "&state=" + a.state + "&login_type=jssdk&self_redirect=" + c + '&styletype=' + (a.styletype || '') + '&sizetype=' + (a.sizetype || '') + '&bgcolor=' + (a.bgcolor || '') + '&rst=' + (a.rst || '');
        e += a.style ? "&style=" + a.style : "", e += a.href ? "&href=" + a.href : "", d.src = e, d.frameBorder = "0", d.allowTransparency = "true", d.scrolling = "no", d.width = "300px", d.height = "400px";
        var f = b.getElementById(a.id);
        f.innerHTML = "", f.appendChild(d)
    }

    a.WxLogin = d
}(window, document);
// 以上来自于 http://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js

const webLogin = function(options) {
    // 微信接口要求必须为生产环境域名
    const productDomain = options.productDomain;
    const protocol = window.location.protocol;
    const host = window.location.host;

    let url = protocol + '//' + productDomain;
    if (host !== productDomain) { // 不是生产环境则借助于生产环境的直接重定向能力进行再跳转
        url += '/redirect/' + protocol.substr(0, protocol.length - 1) + '/' + host;
    }
    url += options.redirectUri;

    let state = undefined;
    if (options.state) {
        state = JSON.stringify(options.state);
        state = util.base64.encode(state);
    }

    let cssHref = undefined;
    if (options.cssHref) {
        cssHref = protocol + '//' + host + options.cssHref
    }

    new window.WxLogin({
        id: options.containerId,
        appid: options.appId,
        scope: "snsapi_login",
        redirect_uri: encodeURI(url),
        href: cssHref,
        state: state,
    });
};
export default {webLogin}
