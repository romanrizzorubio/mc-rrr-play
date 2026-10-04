import {
    TRIGGER_THIS_ATTACK,
    TRIGGER_YOU_ANY_ATTACK,
    TRIGGER_YOU_ATTACK,
   TRIGGER_YOU_BASIC_ATTACK,
   EFFECT_DEAL_DAMAGE,
} from 'mc-shared';

import {Activation} from './activation.js';
import {RetaliateTrigger} from '../triggers/retaliate-trigger.js';

export class Attack extends Activation {
    constructor({}) {
        super(arguments[0]);

        this.takenDamage = 0;
        this.attackedTargets = undefined;
    }
    async applyOverkill(params) {
        const selectedTarget = this.effect.attacked || this.selectedTarget;

        this.attackedTargets = Array.isArray(selectedTarget) ?
            selectedTarget.slice() :
            [selectedTarget];

        const damage = this.effect.getEffectProperty('damage', params);

        if (damage && selectedTarget) {
            const controller = this.getController(selectedTarget);

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
    async applyRetaliate(target, params) {
        const attacker = this.character;

        if (attacker && await this.canRetaliate(target)) {
            const dealDamageEffect = this.match.effectsFactory.createEffect({
                type: EFFECT_DEAL_DAMAGE,
                damage: target.card.retaliate,
                selectedTarget: attacker,
                ability: this.effect.ability,
            });

            await dealDamageEffect.runEffect(params);
        }
    }
    async canRetaliate(target) {
        if (!target || !target.card || !target.card.retaliate ||
            !target.isInPlay || this.effect.ranged || !this.character) {
            return false;
        }

        const enemyIsInPlay = this.match.enemies.some(enemy =>
            enemy === target || enemy.currentSide === target);
        if (target.isEnemy && !enemyIsInPlay) {
            return false;
        }

        return (await target.getLife()) > 0;
    }
    getForcedResponseTriggers(type) {
        if (!type.includes(TRIGGER_THIS_ATTACK) || this.effect.ranged) {
            return [];
        }

        const attackedTargets = this.attackedTargets ||
            this.effect.attacked ||
            this.selectedTarget;
        const targets = Array.isArray(attackedTargets) ? attackedTargets : [attackedTargets];

        return targets
            .filter(Boolean)
            .map(target => target.isPlayer ? target.superhero.currentSide : target)
            .map(target => new RetaliateTrigger(this, target));
    }
    checkStatus() {
        const {character} = this;

        return !character.isStunned;
    }
    filterTarget(card, {player}) {
        return !card.isEnemy || card.canBeAttacked(player);
    }
    getController(selectedTarget = this.selectedTarget) {
        if (selectedTarget.isMinion) {
            return this.match.villain;
        } else if (selectedTarget.isAlly) {
            return selectedTarget.controller;
        }
    }
    getCurrentVillainTarget(target) {
        if (Array.isArray(target)) {
            let changed = false;
            const targets = target.map(_target => {
                const currentTarget = this.getCurrentVillainTarget(_target);

                if (currentTarget !== _target) {
                    changed = true;
                }

                return currentTarget;
            });

            return changed ? targets : target;
        }

        const currentVillain = this.match.villain;

        if (target?.isVillain &&
            !target.isInPlay &&
            currentVillain?.name === target.name) {
            return currentVillain;
        }

        return target;
    }
    getTriggersEnds(params) {
        const {triggersEndsLaunched, effect} = this;
        const isBasic = effect?.ability?.isBasic;
        const effectTarget = params?.effect?.selectedTarget;
        const currentEffectTarget = this.getCurrentVillainTarget(effectTarget);
        const attackTarget = this.getCurrentVillainTarget(effect?.selectedTarget);

        if (currentEffectTarget !== effectTarget) {
            params.effect.selectedTarget = currentEffectTarget;
        }
        if (attackTarget !== effect?.selectedTarget) {
            effect.selectedTarget = attackTarget;
        }

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
            ...(character ? {character} : {}),
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