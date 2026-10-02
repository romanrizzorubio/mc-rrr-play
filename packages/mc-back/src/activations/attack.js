import {
    TRIGGER_THIS_ATTACK,
    TRIGGER_YOU_ANY_ATTACK,
    TRIGGER_YOU_ATTACK,
   TRIGGER_YOU_BASIC_ATTACK,
   EFFECT_DEAL_DAMAGE,
} from 'mc-shared';

import {Activation} from './activation.js';

export class Attack extends Activation {
    constructor({}) {
        super(arguments[0]);

        this.takenDamage = 0;
        this.retaliateApplied = false;
    }
    async applyOverkill(params) {
        const {selectedTarget} = this;

        const damage = this.effect.getEffectProperty('damage', params);

        if (damage && selectedTarget) {
            const controller = this.getController();

            if (controller) {
                this.excessDamage = damage - await selectedTarget.getLife();
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
    async afterTriggerEnds(params) {
        if (!this.retaliateApplied) {
            this.retaliateApplied = true;
            await this.applyRetaliate(params);
        }
    }
    async applyRetaliate(params) {
        const {selectedTarget, effect} = this;
        const attacker = this.character;

        if (selectedTarget && attacker) {
            const targets = selectedTarget instanceof Array ? selectedTarget : [selectedTarget];

            for (const target of targets) {
                if (!target.isDefeated && target.retaliate) {
                    const dealDamageEffect = this.match.effectsFactory.createEffect({
                        type: EFFECT_DEAL_DAMAGE,
                        damage: target.retaliate,
                        selectedTarget: attacker,
                        ability: effect.ability,
                    });

                    await dealDamageEffect.runEffect(params);
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
        return !card.isEnemy || card.canBeAttacked(player);
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
        const {triggersEndsLaunched, effect} = this;
        const isBasic = effect && effect.ability && effect.ability.isBasic;

        const triggers = [
            TRIGGER_THIS_ATTACK,
            TRIGGER_YOU_ATTACK,
            TRIGGER_YOU_ANY_ATTACK,
        ];

        if (isBasic) {
            triggers.push(TRIGGER_YOU_BASIC_ATTACK);
        }

        return !triggersEndsLaunched ? super.getTriggersEnds(params)
            .concat(triggers) : [];
    }
    getTriggersParams(params) {
        const {character} = this;

        return {
            ...super.getTriggersParams(params),
            card: character,
            attack: this,
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