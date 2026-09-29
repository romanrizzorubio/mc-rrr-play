import {Activation} from "./activation.js";
import {TRIGGER_THIS_ATTACK} from "../triggers/this-attack-trigger.js";

export class Attack extends Activation {
    constructor({}) {
        super(arguments[0]);

        this.takenDamage = 0;
    }
    async applyOverkill(params) {
        const {selectedTarget} = this;

        const damage = this.effect.getEffectProperty('damage', params);

        if (damage && selectedTarget) {
            const controller = this.getController();

            if (controller) {
                this.excessDamage = damage - selectedTarget.life;
                if (this.excessDamage < 0) {
                    this.excessDamage = 0;
                }

                if (this.excessDamage > 0) {
                    this.selectedTarget = [selectedTarget, controller];
                    this.effect.setEffectProperty('damage', [damage, this.excessDamage], params);
                }
            }
        }
    }
    checkStatus() {
        const {character} = this;

        if (!character) {
            console.log('checkStatus', this.character);
        }

        return !character.isStunned;
    }
    filterTarget(card, {player}) {
        return card.canBeAttacked(player);
    }
    getController() {
        const {selectedTarget} = this;

        if (selectedTarget.isMinion) {
            return this.match.villain;
        } else if (selectedTarget.isAlly) {
            return selectedTarget.controller;
        }
    }
    getTriggersEnds(params) {
        const {triggersEndsLaunched} = this;

        return !triggersEndsLaunched && this.activationEnd ? super.getTriggersEnds(params)
            .concat([
                TRIGGER_THIS_ATTACK,
            ]) : [];
    }
    getTriggersParams(params) {
        const {character} = this;

        return {
            ...super.getTriggersParams(params),
            card: character,
        };
    }
    getOverkill(params) {
        return this.effect.getEffectProperty('keywords.overkill', params);
    }
    resolveStatus() {
        const {character} = this;

        character.removeStunned();

        character.refresh();
    }
}