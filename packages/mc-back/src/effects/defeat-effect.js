import {
    TRIGGER_ATTACHED_DEFEAT,
    TRIGGER_THIS_DEFEAT_MINION,
    TRIGGER_YOU_DEFEAT_MINION,
    TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY
} from 'mc-shared';

import {Effect} from './effect.js';

export class DefeatEffect extends Effect {
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([
                TRIGGER_ATTACHED_DEFEAT,
            ]);
    }
    getTriggersEnds() {
        return super.getTriggersEnds()
            .concat([
                TRIGGER_YOU_DEFEAT_MINION,
                TRIGGER_THIS_DEFEAT_MINION,
                TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY,
            ]);
    }
    defeat(params) {
        const {selectedTarget} = this;

        if (selectedTarget.abilities) {
            const ability = selectedTarget.abilities.find(_ability => _ability.isWhenDefeated && _ability.isValidIdentity(params));

            if (ability) {
                return ability.resolveAbility({
                    ...params,
                    card: selectedTarget,
                });
            }
        }
    }
    async execute(params) {
        const {selectedTarget} = this;
        const {player} = params;
        const {gameZone} = selectedTarget;

        await this.defeat(params);

        await selectedTarget.defeat(player);

        if (selectedTarget.isVillain) {
            this.match.villain.refresh();
        } else {
            if (gameZone) {
                await gameZone.refresh();
            }
        }
    }
}