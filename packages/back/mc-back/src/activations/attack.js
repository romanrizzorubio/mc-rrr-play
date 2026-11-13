import {
    PRIORITY_CONSTANT,
    PRIORITY_FORCED_INTERRUPT,
    PRIORITY_INTERRUPT,
    TRIGGER_THIS_ATTACK,
    TRIGGER_CHARACTER_ATTACKED,
    TRIGGER_YOU_ANY_ATTACK,
    TRIGGER_YOU_ALLY_ATTACK,
    TRIGGER_YOU_ATTACK,
    TRIGGER_YOU_BASIC_ATTACK,
    TRIGGER_YOU_DEALT_EXCESS_DAMAGE,
    TRIGGER_YOU_WOULD_DEAL_EXCESS_DAMAGE,
    EFFECT_DEAL_DAMAGE,
} from 'mc-shared';

import {Activation} from './activation.js';
import {RetaliateTrigger} from '../triggers/retaliate-trigger.js';
import {
    getEnemiesFor,
    getVillainFor,
} from '../utils/match-zone-utils.js';

export class Attack extends Activation {
    constructor({}) {
        super(arguments[0]);

        this.takenDamage = 0;
        this.attackedTargets = undefined;
        this.excessDamage = 0;
        this.excessDamageTarget = undefined;
        this.excessDamageTaken = 0;
    }
    async applyOverkill(params, effect = this.effect) {
        const selectedTarget = effect.attacked || effect.selectedTarget;

        this.excessDamage = 0;
        this.excessDamageTarget = undefined;
        this.excessDamageTaken = 0;
        this.attackedTargets = Array.isArray(selectedTarget) ?
            selectedTarget.slice() :
            [selectedTarget];

        const damage = effect.getEffectProperty('damage', params);
        await this.calculateExcessDamage(params, effect);
        if (damage && selectedTarget) {
            const controller = this.getController(selectedTarget);

            if (controller && this.excessDamage > 0) {
                this.excessDamageTarget = controller;
                const triggerParams = {
                    ...params,
                    effect,
                    attack: this,
                    character: this.character,
                };
                const trigger = [TRIGGER_YOU_WOULD_DEAL_EXCESS_DAMAGE];

                await this.trigger(PRIORITY_CONSTANT, trigger, triggerParams);
                await this.trigger(
                    PRIORITY_FORCED_INTERRUPT,
                    trigger,
                    triggerParams
                );
                await this.trigger(PRIORITY_INTERRUPT, trigger, triggerParams);

                const modifiedDamage = effect.getEffectProperty('damage', params);
                effect.selectedTarget = [selectedTarget, controller];
                effect.setEffectProperty(
                    'damage',
                    [modifiedDamage, this.excessDamage],
                    params
                );
            }
        }
    }
    async calculateExcessDamage(params, effect = this.effect) {
        const selectedTarget = effect.attacked || effect.selectedTarget;
        this.excessDamage = 0;

        if (!selectedTarget ||
            Array.isArray(selectedTarget) ||
            (!selectedTarget.isAlly && !selectedTarget.isMinion) ||
            typeof selectedTarget.getLife !== 'function') {
            return this.excessDamage;
        }

        const damage = effect.getEffectProperty('damage', params);
        const life = await selectedTarget.getLife();
        if (Number.isFinite(damage) && Number.isFinite(life)) {
            this.attackedTargets = [selectedTarget];
            this.excessDamage = Math.max(0, damage - life);
        }

        return this.excessDamage;
    }
    async applyRetaliate(target, params) {
        const dealDamageEffect = await this.getRetaliateDamageEffect(target, params);

        if (dealDamageEffect) {
            await dealDamageEffect.runEffect(params);
        }
    }
    async canRetaliate(target, params) {
        return Boolean(await this.getRetaliateDamageEffect(target, params));
    }
    async getRetaliateDamageEffect(target, params) {
        const character = this.character;
        const attacker = character?.isSuperhero && character.owner?.isPlayer ?
            character.owner :
            character;

        if (!attacker || !target?.isInPlay || !character) {
            return;
        }

        const retaliate = typeof target.getRetaliateValue === 'function' ?
            await target.getRetaliateValue(params) :
            target.retaliate ?? target.card?.retaliate;
        if (!retaliate) {
            return;
        }

        const player = character?.owner?.isPlayer ?
            character.owner :
            character?.controller?.isPlayer ?
                character.controller :
                undefined;
        if (target.isEnemy) {
            const enemies = player ?
                getEnemiesFor(this.match, player) :
                this.match.enemies;
            const enemyIsInPlay = enemies.some(enemy =>
                enemy && (enemy === target || enemy.currentSide === target));
            if (!enemyIsInPlay) {
                return;
            }
        }
        if (this.effect.ranged) {
            this.effect.markAttackKeywordUsed?.('ranged');

            return;
        }
        if (await target.getLife() <= 0) {
            return;
        }

        const dealDamageEffect = this.match.effectsFactory.createEffect({
            type: EFFECT_DEAL_DAMAGE,
            damage: retaliate,
            selectedTarget: attacker,
            ability: this.effect.ability,
            isAttack: false,
        });

        return await dealDamageEffect.canRun(params) ? dealDamageEffect : undefined;
    }
    getForcedResponseTriggers(type) {
        if (!type.includes(TRIGGER_THIS_ATTACK)) {
            return [];
        }

        const attackedTargets = this.attackedTargets ||
            this.effect.attacked ||
            this.selectedTarget;
        const targets = Array.isArray(attackedTargets) ? attackedTargets : [attackedTargets];

        return targets.filter(Boolean)
            .map(target => target.isPlayer ? target.superhero.currentSide : target)
            .map(target => new RetaliateTrigger(this, target));
    }
    getTriggersInit(params) {
        const {triggersInitLaunched, effect} = this;
        const triggers = super.getTriggersInit(params);

        if (triggersInitLaunched) {
            return triggers;
        }

        this.excessDamage = 0;
        this.excessDamageTarget = undefined;
        this.excessDamageTaken = 0;

        const attackTriggers = triggers.concat(
            TRIGGER_THIS_ATTACK,
            TRIGGER_CHARACTER_ATTACKED,
            ...(effect?.character?.isAlly ? [TRIGGER_YOU_ALLY_ATTACK] : [])
        );
        const playerAttackTriggers = effect?.ability?.card ?
            attackTriggers.concat(TRIGGER_YOU_ATTACK) :
            attackTriggers;

        return effect?.ability?.isBasic ?
            playerAttackTriggers.concat(TRIGGER_YOU_BASIC_ATTACK) :
            playerAttackTriggers;
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
            const player = selectedTarget.engaged ??
                this.character?.owner ??
                this.character?.controller;
            return getVillainFor(this.match, player);
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

        const currentVillain = target?.scenarioZone ?
            target.scenarioZone.currentVillain :
            getVillainFor(
                this.match,
                this.character?.owner ?? this.character?.controller
            );

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
            TRIGGER_CHARACTER_ATTACKED,
            TRIGGER_YOU_ATTACK,
            TRIGGER_YOU_ANY_ATTACK,
        ];

        if (effect?.character?.isAlly) {
            triggers.push(TRIGGER_YOU_ALLY_ATTACK);
        }

        if (isBasic) {
            triggers.push(TRIGGER_YOU_BASIC_ATTACK);
        }
        if (this.excessDamageTaken > 0) {
            triggers.push(TRIGGER_YOU_DEALT_EXCESS_DAMAGE);
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
        return this.effect.getEffectProperty('overkill', params);
    }
    resolveStatus() {
        const {character} = this;

        character.removeStunned();

        character.refresh();
    }
}