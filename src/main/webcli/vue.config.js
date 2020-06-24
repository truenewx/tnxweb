// vue.config.js
module.exports = {
    publicPath: "/tnxweb",
    devServer: {
        port: 80
    },
    // 修改/src为/pages
    pages: {
        index: {
            entry: 'pages/main.js',
            template: 'public/index.html',
            filename: 'index.html'
        }
    },
    // 扩展 webpack 配置，使 /modules 加入编译
    chainWebpack: config => {
        let path = require('path');
        config.module
        .rule('js')
        .include
        .add(path.resolve(__dirname, './packages'))
        .end()
        .use('babel')
        .loader('babel-loader')
        .tap(options => {
            return options
        });
    }
}
