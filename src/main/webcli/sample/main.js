import '../components/jquery/bootstrap/base-4.5.0.css';
import 'element-ui/lib/theme-chalk/index.css';
import '../components/vue/element/tnxel.css';
import tnx from '../components/vue/element/tnxel';
import App from './App.vue';

const Vue = tnx.depends.Vue;
Vue.config.productionTip = false;

new Vue({
    render: h => h(App),
}).$mount('#app');
