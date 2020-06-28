import Vue from 'vue';
import '../components/bootstrap/base-4.5.0.css';
import App from './App.vue';

Vue.config.productionTip = false;

new Vue({
    render: h => h(App),
}).$mount('#app');
