import {Trigger} from '../../triggers/base/trigger.js';
import {TRIGGER_MAP} from './triggers-map.js';

export class TriggersFactory {
    constructor(match) {
        this.match = match;
    }
    _createTriggerParams({card, type, ability, triggerParams}) {
        return {
            trigger: type,
            card,
            ability,
            ...triggerParams,
        };
    }
    createTrigger(params) {
        const {type} = params;
        const triggerParams = this._createTriggerParams(params);
        const TriggerClass = Object.hasOwn(TRIGGER_MAP, type) ?
            TRIGGER_MAP[type] :
            Trigger;

        return new TriggerClass(triggerParams);
    }
}
