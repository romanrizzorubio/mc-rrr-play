import {
    PRIORITY_FORCED_INTERRUPT,
    PRIORITY_FORCED_RESPONSE,
    PRIORITY_INTERRUPT,
    EFFECT_CATEGORY_LEAVE_PLAY,
    TRIGGER_ATTACHED_DEFEAT,
    TRIGGER_CHARACTER_DEFEATED,
    TRIGGER_CHARACTER_WOULD_BE_DEFEATED,
    TRIGGER_THIS_DEFEAT,
    TRIGGER_THIS_DEFEAT_MINION,
    TRIGGER_YOU_DEFEAT_MINION,
    TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY
} from 'mc-shared';

import {Effect} from './effect.js';

export class DefeatEffect extends Effect {
    constructor() {
        super(arguments[0]);

        this.prevented = false;
        this.defeated = false;
        this.defeatedCharacter = undefined;
        this.defeatedController = undefined;
    }
    get effectCategories() {
        return [EFFECT_CATEGORY_LEAVE_PLAY];
    }
    get isActivation() {
        return false;
    }
    get usesActivationTargetFilter() {
        return false;
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.defeated = false;
        this.defeatedCharacter = undefined;
        this.defeatedController = undefined;
    }
    checkTrigger() {
        return !this.prevented &&
            (this.selectedTarget?.isInPlay || this.resolved);
    }
    getTriggersWould() {
        return [TRIGGER_CHARACTER_WOULD_BE_DEFEATED];
    }
    getTriggersInit() {
        return [TRIGGER_ATTACHED_DEFEAT];
    }
    getTriggersEnds() {
        const triggers = super.getTriggersEnds()
            .concat([
                TRIGGER_YOU_DEFEAT_MINION,
                TRIGGER_THIS_DEFEAT_MINION,
                TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY,
            ]);

        return this.defeated && this.defeatedCharacter?.isCharacter ?
            triggers.concat([TRIGGER_CHARACTER_DEFEATED]) :
            triggers;
    }
    getTriggersParams(params) {
        return {
            ...super.getTriggersParams(params),
            card: this.selectedTarget,
            defeatedController: this.defeatedController,
        };
    }
    defeat(params) {
        const {selectedTarget} = this;

        return this.trigger(
            PRIORITY_FORCED_RESPONSE,
            [TRIGGER_THIS_DEFEAT],
            {
                ...params,
                match: this.match,
                effect: this,
                card: selectedTarget,
            }
        );
    }
    async execute(params) {
        this.defeated = false;
        this.defeatedCharacter = undefined;

        if (this.prevented) {
            return;
        }

        const {selectedTarget} = this;
        const {player} = params;
        const {gameZone} = selectedTarget;

        this.defeatedCharacter = selectedTarget;
        await this.defeat(params);

        await this.trigger(
            PRIORITY_FORCED_INTERRUPT,
            [TRIGGER_THIS_DEFEAT],
            {
                ...params,
                match: this.match,
                effect: this,
                card: selectedTarget,
            }
        );

        this.defeatedController = selectedTarget.controller;
        await this.trigger(
            PRIORITY_INTERRUPT,
            [TRIGGER_THIS_DEFEAT],
            {
                ...params,
                match: this.match,
                effect: this,
                card: selectedTarget,
            }
        );
        if (selectedTarget.isInPlay !== false) {
            await selectedTarget.defeat(player);
        }
        this.defeated = true;

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