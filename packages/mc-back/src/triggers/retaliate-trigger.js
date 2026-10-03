import {TRIGGER_THIS_ATTACK} from 'mc-shared';
import {Trigger} from './base/trigger.js';

export class RetaliateTrigger extends Trigger {
    constructor(attack, target) {
        const ability = {
            name: 'Represalia',
            effect: {
                isChoose: false,
                isChooseAbility: false,
            },
            hideDialog: false,
            isEndLasting: false,
            resolved: false,
        };

        super({
            card: target,
            ability,
            trigger: TRIGGER_THIS_ATTACK,
        });

        this.attack = attack;
        this.target = target;
    }
    canTrigger() {
        return this.attack.canRetaliate(this.target);
    }
    getName() {
        return this.ability.name;
    }
    get keepTriggering() {
        return false;
    }
    async runTrigger(params) {
        await this.attack.applyRetaliate(this.target, params);
        this.ability.resolved = true;
        this.triggered = true;
    }
}
