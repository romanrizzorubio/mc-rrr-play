import {targetMap} from '../targets/index.js';
import {Trigger} from './base/trigger.js';

export class CharacterWouldBeDefeatedTrigger extends Trigger {
    constructor({target, ...params}) {
        super(params);

        this.target = target;
    }
    canTrigger(params) {
        if (this.target) {
            const resolveTarget = targetMap[this.target];
            if (!resolveTarget) {
                throw new Error(`Unknown defeat trigger target "${this.target}".`);
            }

            const owner = this.card.controller || this.card.owner;
            const targets = resolveTarget({
                ...params,
                ability: this.ability,
                card: this.card,
                match: this.card.match,
                player: owner?.isPlayer ? owner : params.player,
            });
            const defeatedTarget = params.effect?.selectedTarget;

            return targets.some(target =>
                target === defeatedTarget ||
                target?.parent === defeatedTarget ||
                target === defeatedTarget?.parent ||
                target?.id === defeatedTarget?.id) &&
                super.canTrigger(params);
        }

        const owner = this.card.controller || this.card.owner;
        const superhero = owner?.superhero;
        const target = params.effect?.selectedTarget;

        if (superhero &&
            (target === superhero ||
                target === superhero.currentSide ||
                target?.parent === superhero ||
                (target?.isPlayer && target.superhero === superhero))) {
            return super.canTrigger(params);
        }
    }
}
