// app.js
import tnxjq from '../components/jquery/tnxjq';

export const tnx = tnxjq;
export const util = tnx.util;
export const app = tnx.app;

app.rpc.setConfig({
    baseUrl: 'http://localhost:8888'
});

app.rpc.toLoginForm = function(loginFormUrl) {
    if (loginFormUrl) {
        tnx.alert('尚未登录或登录会话已过期，需重新登录', function() {
            window.location.href = loginFormUrl;
        });
    }
    return true;
}

export default app;
