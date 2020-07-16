// app.js
import tnxel from '../components/vue/element/tnxel';

export const tnx = tnxel;
export const util = tnx.util;
export const app = tnx.app;

app.rpc.setConfig({
    baseUrl: process.env.VUE_APP_RPC_BASE_URL
});

app.rpc.toLogin = function(loginUrl, originalUrl) {
    let alertable = !originalUrl;
    const username = process.env.VUE_APP_LOGIN_USERNAME;
    const password = process.env.VUE_APP_LOGIN_PASSWORD;
    if (username && password) { // 将默认用户名密码插入到参数清单头部，以免被其它参数中的#影响而被忽略
        const index = loginUrl.indexOf('?') + 1;
        loginUrl = loginUrl.substr(0, index) + 'username=' + username + '&password='
            + password + '&' + loginUrl.substr(index);
        alertable = false;
    }
    if (alertable) {
        tnx.alert('尚未登录或登录会话已过期，需重新登录', function() {
            window.location.href = loginUrl;
        });
    } else {
        window.location.href = loginUrl;
    }
    return true;
}

export default app;
