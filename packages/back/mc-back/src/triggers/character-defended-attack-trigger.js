import {Trigger} from './base/trigger.js';

export class CharacterDefendedAttackTrigger extends Trigger {
    getDefender(params) {
        const defenders = params.effect?.defendersByTarget?.values?.() ?? [];

        return [...defenders].find(defender =>
            defender === this.card ||
            (defender?.id !== undefined &&
                defender.id === this.card.id &&
                defender.name === this.card.name)
        );
    }
    canTrigger(params) {
        const defender = this.getDefender(params);
        const player = defender?.owner ?? defender?.controller;

        return Boolean(defender && player?.isPlayer) &&
            super.canTrigger({...params, player});
    }
    getAbilityParams(params) {
        const defender = this.getDefender(params);
        const player = defender?.owner ?? defender?.controller;

        return super.getAbilityParams({
            ...params,
            defender,
            player,
        });
    }
}
