import {Mc} from './src/server/mc.js';

String.prototype.replaceAll = function (search, replace) {
    return this.split(search).join(replace);
};

const mc = new Mc();
await mc.init();
