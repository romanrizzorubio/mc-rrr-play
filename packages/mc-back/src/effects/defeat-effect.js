import {
    PRIORITY_FORCED_INTERRUPT,
    TRIGGER_ATTACHED_DEFEAT,
    TRIGGER_THIS_DEFEAT_MINION,
    TRIGGER_YOU_DEFEAT_MINION,
    TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY
} from 'mc-shared';

import {Effect} from './effect.js';

export class DefeatEffect extends Effect {
    constructor() {
        super(arguments[0]);

        this.prevented = false;
    }
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
        if (this.prevented) {
            return;
        }

        const {selectedTarget} = this;
        const {player} = params;
        const {gameZone} = selectedTarget;

        await this.defeat(params);

        await this.trigger(
            PRIORITY_FORCED_INTERRUPT,
            [TRIGGER_THIS_DEFEAT_MINION],
            {
                ...params,
                effect: this,
                card: selectedTarget,
            }
        );

        await selectedTarget.defeat(player);

        const currentVillain = this.match.villain;
        if (selectedTarget.isVillain &&
            currentVillain !== selectedTarget &&
            currentVillain?.name === selectedTarget.name) {
            this.selectedTarget = currentVillain;

            const activation = this._activation;
            const activationTarget = activation?.selectedTarget;

            if (Array.isArray(activationTarget)) {
                const targets = activationTarget.map(target =>
                    target === selectedTarget ? currentVillain : target);
                if (targets.some((target, index) =>
                    target !== activationTarget[index])) {
                    activation.selectedTarget = targets;
                }
            } else if (activationTarget === selectedTarget) {
                activation.selectedTarget = currentVillain;
            }
        }

        if (selectedTarget.isVillain && this.match.villain) {
            this.match.villain.refresh();
        } else {
            if (gameZone) {
                await gameZone.refresh();
            }
        }
    }
}