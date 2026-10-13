import {
    DIALOG_DEFENSE,
    PRIORITY_CONSTANT,
    PRIORITY_FORCED_INTERRUPT,
    PRIORITY_INTERRUPT,
    TARGET_CARD,
    TRIGGER_ATTACHED_WOULD_ATTACK,
    TRIGGER_HERO_DEFENDS_ATTACK,
    TRIGGER_ENEMY_ATTACKS_YOU,
    TRIGGER_THIS_ATTACK,
    TRIGGER_VILLAIN_ACTIVATES,
    TRIGGER_VILLAIN_ATTACKS,
    TRIGGER_VILLAIN_ATTACKS_YOU
} from 'mc-shared';

import {Calc} from '../engine/calc.js';
import {DealDamageEffect} from './deal-damage-effect.js';
import {EnemyActivationEffect} from './enemy-activation-effect.js';
import {ExhaustEffect} from './exhaust-effect.js';
import {ValidTarget} from '../targets/valid-target.js';
import {checkCondition} from '../engine/utils.js';


export class EnemyAttackEffect extends EnemyActivationEffect {
    constructor(params = {}) {
        super({
            ...params,
            isAttack: true,
        });

        this.attackModifierCalc = params.attackModifierCalc;
        this.modifyAttack = 0;
        this._attackModifierResolved = false;
        this.defender = null;
        this.defValue = 0;
        this.defendersByTarget = new Map();
        this.defenseValues = new Map();
        this.originalAttackTarget = undefined;
        this.defenderConditions = [];
        this.modifyDefense = 0;
    }
    resetForResolution() {
        super.resetForResolution();
        this.modifyAttack = 0;
        this._attackModifierResolved = false;
        this.defender = null;
        this.defValue = 0;
        this.defendersByTarget.clear();
        this.defenseValues.clear();
        this.originalAttackTarget = undefined;
        this.defenderConditions = [];
        this.modifyDefense = 0;
        this.attacked = undefined;
    }
    get isDefended() {
        return Boolean(this.defender || this.defendersByTarget.size);
    }
    get attackedCharacters() {
        const attacked = Array.isArray(this.attacked) ?
            this.attacked :
            [this.attacked];

        return attacked.filter(Boolean).map(target => {
            if (!target.isPlayer) {
                return target;
            }

            const superhero = target.superhero?.currentSide;
            if (!superhero) {
                throw new TypeError(
                    'EnemyAttackEffect requires a player target to have a current superhero side.'
                );
            }

            return superhero;
        });
    }
    async canRun(params) {
        if (!(await this.getValidTarget(params)).length) {
            this.resolved = false;
            this.fullResolved = false;

            return false;
        }
        if (this.enemy) {
            return true;
        }

        const enemyTarget = new ValidTarget({
            condition: this.condition,
            effect: this,
            match: this.match,
        });

        const validEnemies = enemyTarget.getValidTarget({
            ...params,
            ability: this.ability,
            target: this.enemyType,
        });
        if (validEnemies.length) {
            return true;
        }

        this.resolved = false;
        this.fullResolved = false;

        return false;
    }
    getTargetDialog() {
        const selectedTarget = Array.isArray(this.selectedTarget) ?
            this.selectedTarget[0] :
            this.selectedTarget;

        if (!selectedTarget || typeof selectedTarget !== 'object') {
            throw new TypeError(
                'EnemyAttackEffect requires a selected target for its activation dialog.'
            );
        }

        if (Object.hasOwn(selectedTarget, 'superhero')) {
            if (!selectedTarget.superhero) {
                throw new TypeError(
                    'EnemyAttackEffect requires a player target to have a superhero.'
                );
            }

            return selectedTarget.superhero;
        }

        return selectedTarget;
    }
    getBoostTarget() {
        return this.originalAttackTarget || super.getBoostTarget();
    }
    async resolveStatus(params) {
        await this.showActivationSkippedDialog(
            'stunned',
            `${this.character.name} estaba aturdido y no ataca.`
        );

        return super.resolveStatus(params);
    }
    async getAttackValue(params) {
        if (this.attackModifierCalc && !this._attackModifierResolved) {
            const modifier = await new Calc(this.attackModifierCalc).calculate({
                ...params,
                match: params.match ?? this.match,
                effect: this,
            });
            if (!Number.isFinite(modifier)) {
                throw new TypeError(
                    'EnemyAttackEffect requires a finite attack modifier.'
                );
            }

            this.modifyAttack += modifier;
            this._attackModifierResolved = true;
        }

        const attackValue = await this.character.getAttackValue(params);

        return attackValue + this.modifyAttack;
    }
    async getActivationCharacterData(params) {
        const attackValue = await this.getAttackValue(params);

        return {
            ...this.character.toObj(params),
            attack: attackValue,
        };
    }
    async getDefenseValue(params, defender = this.defender) {
        return await defender.getDefenseValue(params) + this.modifyDefense;
    }
    async getDefenseBonusPreview(params) {
        const {character, defender} = this;
        if (!character || !defender) {
            throw new TypeError(
                'Defense-bonus preview requires an enemy and a hero defender.'
            );
        }

        const attackValue = await this.getAttackValue(params);
        const defenseValue = await this.getDefenseValue(params, defender);
        if (typeof character.name !== 'string' ||
            typeof defender.name !== 'string' ||
            !Number.isFinite(attackValue) ||
            !Number.isFinite(defenseValue)) {
            throw new TypeError(
                'Defense-bonus preview received invalid attack or defense values.'
            );
        }

        return {
            enemyName: character.name,
            attackValue,
            defenderName: defender.name,
            defenseValue,
        };
    }
    async defense(params) {
        const attackTargets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget :
            [this.selectedTarget];

        for (const attackTarget of attackTargets) {
            const requiredDefenders = this.getRequiredDefenders(attackTarget);
            const mustDefend = requiredDefenders.length > 0;
            const defenders = mustDefend ?
                requiredDefenders :
                this.getDefenders(attackTarget);
            if (defenders.length) {
                const targetPlayer = this.getTargetPlayer(attackTarget);
                const attackValue = await this.getAttackValue(params);
                const attack = this.toObj(arguments[0]);
                attack.character.attack = attackValue;
                const defenderCards = await Promise.all(defenders.map(async defender => {
                    const {hitPoints, life} = await defender.getEffectiveStats();

                    return {
                        ...defender.toObj(params),
                        hitPoints,
                        life,
                    };
                }));

                attack.target = attackTarget.toObj(arguments[0]);

                const {defender} = await this.openDialog({
                    dialogType: DIALOG_DEFENSE,
                    hand: targetPlayer.hand.cards.map(card => card.toObj(arguments[0])),
                    hideOk: mustDefend,
                    data: {
                        attack,
                        defenders: defenderCards,
                    },
                });

                const objDefender = defender &&
                    defenders.find(d => d.id === defender.id);
                if (mustDefend && !objDefender) {
                    throw new Error('EnemyAttackEffect requires a qualifying defender.');
                }

                if (objDefender) {
                    await this.setDefender(objDefender, attackTarget, params);

                    if (objDefender.isSuperhero) {
                        const selectedDefender = this.defendersByTarget.get(attackTarget);
                        const defenseValue = await this.getDefenseValue(
                            params,
                            selectedDefender
                        );

                        if (Array.isArray(this.selectedTarget)) {
                            this.defenseValues.set(attackTarget, defenseValue);
                        } else {
                            this.defValue = defenseValue;
                        }
                    }
                }
            }
        }
    }
    getDefenders(target = this.selectedTarget) {
        if (Array.isArray(target)) {
            return target.flatMap(attackTarget => this.getDefenders(attackTarget));
        }

        const defenders = this.getDefenderCandidates(target);
        const requiredDefenders = this.getRequiredDefenders(target);

        return requiredDefenders.length ? requiredDefenders : defenders;
    }
    getDefenderCandidates(target) {
        if (Array.isArray(target)) {
            return target.flatMap(attackTarget =>
                this.getDefenderCandidates(attackTarget));
        }
        if (target && Array.isArray(target.defenders)) {
            return target.defenders;
        }

        if (!target || typeof target !== 'object') {
            throw new TypeError(
                'EnemyAttackEffect requires a character or player attack target.'
            );
        }

        const {owner} = target;
        if (owner && Array.isArray(owner.defenders)) {
            return owner.defenders;
        }

        throw new TypeError(
            'EnemyAttackEffect requires its attack target to provide defenders.'
        );
    }
    getTargetPlayer(target) {
        if (target.isPlayer) {
            return target;
        }
        if (target.owner) {
            return target.owner;
        }

        throw new TypeError(
            'EnemyAttackEffect requires its attack target to belong to a player.'
        );
    }
    getRequiredDefenders(target) {
        if (Array.isArray(target)) {
            return target.flatMap(attackTarget => this.getRequiredDefenders(attackTarget));
        }

        if (!this.defenderConditions.length) {
            return [];
        }

        return this.getDefenderCandidates(target).filter(defender =>
            this.defenderConditions.every(condition => checkCondition(defender, condition)));
    }
    changeAttackTargets(targets) {
        if (!Array.isArray(targets) || !this.selectedTarget) {
            throw new Error('EnemyAttackEffect requires attack targets and an existing target.');
        }

        if (!this.originalAttackTarget) {
            this.originalAttackTarget = this.selectedTarget;
        }
        this.selectedTarget = targets;
    }
    addDefenderCondition(condition) {
        this.defenderConditions.push(condition);
    }
    getTitleDialog() {
        const {character} = this;
        const target = this.getTargetDialog();

        return `${character.name} ataca a ${target.name}`;
    }
    getTriggersWould() {
        return super.getTriggersWould()
            .concat([
                TRIGGER_ATTACHED_WOULD_ATTACK,
                TRIGGER_THIS_ATTACK,
            ]);
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([
                TRIGGER_VILLAIN_ACTIVATES,
                TRIGGER_VILLAIN_ATTACKS,
                TRIGGER_VILLAIN_ATTACKS_YOU,
                TRIGGER_ENEMY_ATTACKS_YOU,
            ]);
    }
    getTriggersEnds(params) {
        return this.activation.getTriggersEnds(params)
            .concat([TRIGGER_VILLAIN_ATTACKS_YOU]);
    }
    async setDefender(defender, attackTarget = this.selectedTarget, params = {}) {
        if (defender) {
            this.defender = defender.isSuperhero ? defender.currentSide : defender;
            this.defendersByTarget.set(attackTarget, this.defender);
            if (!Array.isArray(this.selectedTarget)) {
                this.selectedTarget = defender.owner;
            }

            const exhaustEffect = new ExhaustEffect({
                target: TARGET_CARD,
                match: this.match,
            });

            await exhaustEffect.runEffect({
                card: defender,
            });

            if (this.defender.isHero) {
                const triggerParams = {
                    ...params,
                    effect: this,
                    player: this.defender.owner,
                };
                const trigger = [TRIGGER_HERO_DEFENDS_ATTACK];

                await this.trigger(PRIORITY_CONSTANT, trigger, triggerParams);
                await this.trigger(PRIORITY_FORCED_INTERRUPT, trigger, triggerParams);
                await this.trigger(PRIORITY_INTERRUPT, trigger, triggerParams);
            }
        }
    }
    async execute(params) {
        const {character, selectedTarget} = this;
        const isMultiTarget = Array.isArray(selectedTarget);
        const attackTargets = isMultiTarget ? selectedTarget : [selectedTarget];

        await this.dealBoostCards(params);
        await this.showBoostCards();
        await this.defense(params);
        const boost = await this.resolveBoostCards(params);
        const atkValue = await this.getAttackValue(params);
        const attackedTargets = attackTargets.map(attackTarget =>
            this.defendersByTarget.get(attackTarget) ||
                (isMultiTarget ? attackTarget : this.defender || attackTarget));
        const damages = attackTargets.map(attackTarget => {
            const defValue = isMultiTarget ?
                this.defenseValues.get(attackTarget) || 0 :
                this.defValue;

            return Math.max(0, atkValue + boost - defValue);
        });

        this.attacked = isMultiTarget ? attackedTargets : attackedTargets[0];

        const dealDamageEffect = new DealDamageEffect({
            character,
            damage: isMultiTarget ? damages : damages[0],
            activation: this.activation,
            isAttack: true,
            match: this.match,
            selectedTarget: isMultiTarget ? attackedTargets : attackedTargets[0],
            ability: this.ability,
        });

        await dealDamageEffect.runEffect(params);

        this.activation.takenDamage = dealDamageEffect.takenDamage;
    }
}