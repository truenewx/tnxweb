// tnxcore.js
/**
 * 基于原生JavaScript的扩展支持
 */

const tnxcore = {
    base: 'core',
    init: config => {
        if (config) {
            if (config.app) {
                this.app.name = config.app || this.app.name;
            }
        }
    },
};

tnxcore.app = {
    name: 'tnx.app',
};

export default tnxcore;
