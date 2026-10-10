import {Trigger} from './base/trigger.js';

export class YourPlayerGetMaxAlliesTrigger extends Trigger {
    async canRun(params) {
        return this.card.controller === params.player && await super.canRun(params);
    }
}
