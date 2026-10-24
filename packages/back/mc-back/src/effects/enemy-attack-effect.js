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
import {checkCondition, path} from '../engine/utils.js';
import {DealDamageEffect} from './deal-damage-effect.js';
import {EnemyActivationEffect} from './enemy-activation-effect.js';
import {AttackEffect} from './attack-effect.js';
import {ExhaustEffect} from './exhaust-effect.js';
import {ValidTarget} from '../targets/valid-target.js';
import {
    filterTargetCandidates,
    splitTargetCondition,
} from '../utils/target-condition-utils.js';


export class EnemyAttackEffect extends AttackEffect(EnemyActivationEffect) {
    constructor(params = {}) {
        super({
            ...params,
            isAttack: true,
        });

        this.attackModifierCalc = params.attackModifierCalc;
        this.enemyTargetEffect = params.enemyTargetEffect;
        this.modifyAttack = 0;
        this._attackModifierResolved = false;
        this.defender = null;
        this.defValue = 0;
        this.defendersByTarget = new Map();
        this.defenseValues = new Map();
        this.originalAttackTarget = undefined;
        this.defenderConditions = [];
        this.modifyDefense = 0;
        this.activationInterrupted = false;
        this.preventDamage = 0;
    }
    resetForResolution() {
        super.resetForResolution();
        this.resetAttackKeywordData();
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
        this.activationInterrupted = false;
        this.preventDamage = 0;
    }
    canContinueActivation() {
        if (this.activationInterrupted || !this.enemy ||
            this.match?.gameOverReason) {
            this.activationInterrupted = true;
            return false;
        }

        const currentVillain = this.match?.villain;
        if (this.enemy.isVillain && currentVillain) {
            if (currentVillain !== this.enemy) {
                if (currentVillain.name !== this.enemy.name) {
                    this.activationInterrupted = true;
                    return false;
                }

                this.enemy = currentVillain;
            }

            return true;
        }

        if (this.enemy.isInPlay === false) {
            this.activationInterrupted = true;
            return false;
        }

        return true;
    }
    isResolved() {
        return !this.activationInterrupted;
    }
    checkTrigger() {
        return super.checkTrigger() && this.canContinueActivation();
    }
    async resolvePrepared(effectParams, triggersParams) {
        if (!this.canContinueActivation()) {
            return;
        }

        await super.resolvePrepared(effectParams, triggersParams);
    }
    async triggerEnds(params, options) {
        if (!this.canContinueActivation()) {
            return;
        }

        await super.triggerEnds(params, options);
    }
    get isDefended() {
        return Boolean(this.defender || this.defendersByTarget.size);
    }
    get enemyTargets() {
        return this.enemy && this.enemy.isInPlay !== false ?
            [this.enemy] :
            [];
    }
    async getEnemyTargetFilter(params) {
        if (!this.enemyTargetEffect) {
            return undefined;
        }

        const targetEffect = path(params, this.enemyTargetEffect);
        if (!targetEffect?.validTarget ||
            typeof targetEffect.validTarget.filter !== 'function') {
            throw new TypeError(
                'EnemyAttackEffect requires enemyTargetEffect to resolve to an effect with target validation.'
            );
        }

        const {condition, selectionConditions} =
            splitTargetCondition(targetEffect.condition);
        const canAttack = Boolean((await this.getValidTarget(params)).length);

        const canDamageEnemy = (enemy, targetParams) => {
            if (condition && !checkCondition(enemy, condition)) {
                return false;
            }
            if (!filterTargetCandidates([enemy], selectionConditions).length) {
                return false;
            }

            return targetEffect.validTarget.filter(enemy, {
                ...params,
                ...targetParams,
                ability: targetEffect.ability,
                effect: targetEffect,
                match: targetEffect.match ?? this.match,
                source: targetEffect.source,
                target: targetEffect.target,
            });
        };

        return (enemy, targetParams) =>
            canAttack || canDamageEnemy(enemy, targetParams);
    }
    async shouldSkipActivationDialog(params) {
        return Boolean(this.enemyTargetEffect) &&
            !(await this.getValidTarget(params)).length;
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
        const canAttack = (await this.getValidTarget(params)).length > 0;
        if (!canAttack && !this.enemyTargetEffect) {
            this.resolved = false;
            this.fullResolved = false;

            return false;
        }
        const filter = await this.getEnemyTargetFilter(params);
        if (this.enemy) {
            if (canAttack && (!filter || filter(this.enemy, params))) {
                return true;
            }

            this.resolved = false;
            this.fullResolved = false;

            return false;
        }

        const enemyTarget = new ValidTarget({
            condition: this.condition,
            effect: this,
            filter,
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

        return this.getCharacterDialogData(
            this.character,
            params,
            {attack: attackValue}
        );
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
                    const stats = await defender.getEffectiveStats({
                        player: targetPlayer,
                    });

                    return {
                        ...defender.toObj(params),
                        ...stats,
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
        const availableDefenders = requiredDefenders.length ?
            requiredDefenders :
            defenders;
        const currentDefender = this.getDefenderForTarget(target);

        if (currentDefender) {
            return availableDefenders.filter(defender =>
                defender === currentDefender ||
                (defender.isSuperhero &&
                    defender.currentSide === currentDefender)
            );
        }

        return availableDefenders;
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
    getDefenseAbilityTarget(player) {
        const attackTargets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget :
            [this.selectedTarget];

        if (attackTargets.length === 1) {
            return attackTargets[0];
        }

        return attackTargets.find(target => this.getTargetPlayer(target) === player);
    }
    getDefenderForTarget(target) {
        const defender = this.defendersByTarget.get(target);
        if (defender) {
            return defender;
        }

        return Array.isArray(this.selectedTarget) ? undefined : this.defender;
    }
    canUseDefenseAbility(player) {
        if (this.resolved || !player) {
            return false;
        }

        const attackTarget = this.getDefenseAbilityTarget(player);
        if (!attackTarget) {
            return false;
        }

        const defender = this.getDefenderForTarget(attackTarget);

        return !defender || defender.owner === player;
    }
    async setDefenderByAbility(player, params = {}) {
        if (this.resolved || !this.canUseDefenseAbility(player)) {
            return;
        }

        const attackTarget = this.getDefenseAbilityTarget(player);
        if (this.getDefenderForTarget(attackTarget)) {
            return;
        }
        if (!player.superhero?.currentSide) {
            throw new TypeError(
                'A defense ability requires its player to have a superhero.'
            );
        }

        await this.setDefender(
            player.superhero,
            attackTarget,
            params,
            {exhaust: false}
        );
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
    getEnemySelectionDialogTitle() {
        return 'Elige el atacante';
    }
    getTitleDialog() {
        const {character} = this;
        const target = this.getTargetDialog();

        return `${character.name} ataca a ${target.name}`;
    }
    getDialogEmphasizedStat() {
        return 'attack';
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
    async resolveAttachedAttackModifiers(card, params) {
        if (this.resolved ||
            !this.activation?.triggersInitLaunched ||
            card.attachedTo !== this.character) {
            return;
        }

        const triggers = card.triggers?.[TRIGGER_VILLAIN_ATTACKS]?.[PRIORITY_CONSTANT] ??
            [];
        const triggerParams = this.getTriggersParams({
            ...params,
            effect: this,
        });

        await this.promisesSequential(triggers, async trigger => {
            if (trigger.hasTriggeredFor(this) ||
                !await trigger.canTrigger(triggerParams)) {
                return;
            }

            await trigger.runTrigger(triggerParams);
        });
    }
    getTriggersEnds(params) {
        return this.activation.getTriggersEnds(params)
            .concat([
                TRIGGER_VILLAIN_ATTACKS_YOU,
                TRIGGER_ENEMY_ATTACKS_YOU,
            ]);
    }
    async setDefender(
        defender,
        attackTarget = this.selectedTarget,
        params = {},
        {exhaust = true} = {}
    ) {
        if (defender) {
            const previousDefender = this.getDefenderForTarget(attackTarget);
            this.defender = defender.isSuperhero ? defender.currentSide : defender;
            this.defendersByTarget.set(attackTarget, this.defender);
            if (!Array.isArray(this.selectedTarget)) {
                this.selectedTarget = defender.owner;
            }

            if (exhaust) {
                const exhaustEffect = new ExhaustEffect({
                    target: TARGET_CARD,
                    match: this.match,
                });

                await exhaustEffect.runEffect({
                    card: defender,
                });
            }

            if (this.defender.isHero && this.defender !== previousDefender) {
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
        const {selectedTarget} = this;
        const isMultiTarget = Array.isArray(selectedTarget);
        const attackTargets = isMultiTarget ? selectedTarget : [selectedTarget];

        if (!this.canContinueActivation()) {
            return;
        }

        await this.dealBoostCards(params);
        if (!this.canContinueActivation()) {
            return;
        }

        await this.showBoostCards();
        if (!this.canContinueActivation()) {
            return;
        }

        await this.defense(params);
        if (!this.canContinueActivation()) {
            return;
        }

        const boost = await this.resolveBoostCards(params);
        if (!this.canContinueActivation()) {
            return;
        }

        const atkValue = await this.getAttackValue(params);
        if (!this.canContinueActivation()) {
            return;
        }

        const {character} = this;
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
            preventDamage: this.preventDamage,
            match: this.match,
            selectedTarget: isMultiTarget ? attackedTargets : attackedTargets[0],
            ability: this.ability,
        });

        await dealDamageEffect.runEffect(params);
        if (!this.canContinueActivation()) {
            return;
        }

        this.activation.takenDamage = dealDamageEffect.takenDamage;
        await this.resolveDelayedEffects({
            ...params,
            effect: this,
        });
    }
}