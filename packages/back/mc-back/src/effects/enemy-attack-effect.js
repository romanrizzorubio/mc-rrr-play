import {
    DIALOG_DEFENSE,
    PRIORITY_CONSTANT,
    PRIORITY_FORCED_INTERRUPT,
    PRIORITY_INTERRUPT,
    STATUS_STUNNED,
    TARGET_CARD,
    TRIGGER_ATTACHED_WOULD_ATTACK,
    TRIGGER_HERO_DEFENDS_ATTACK,
    TRIGGER_ENEMY_ATTACKS_YOU,
    TRIGGER_THIS_ATTACK,
    TRIGGER_YOU_BASIC_DEFENSE,
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
import {getScenarioZone} from '../utils/match-zone-utils.js';
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
        this.attackModifier = params.attackModifier ?? 0;
        this.enemyTargetEffect = params.enemyTargetEffect;
        this.modifyAttack = 0;
        this._attackModifierResolved = false;
        this.defender = null;
        this.defValue = 0;
        this.defendersByTarget = new Map();
        this.basicDefendersByTarget = new Map();
        this.defendingPlayersByTarget = new Map();
        this.defenseValues = new Map();
        this.originalAttackTarget = undefined;
        this.defenderConditions = [];
        this.modifyDefense = 0;
        this.activationInterrupted = false;
        this.preventDamage = 0;
        if (!Number.isFinite(this.attackModifier)) {
            throw new TypeError(
                'EnemyAttackEffect requires a finite attack modifier.'
            );
        }
    }
    resetForResolution() {
        super.resetForResolution();
        this.resetAttackKeywordData();
        this.modifyAttack = 0;
        this._attackModifierResolved = false;
        this.defender = null;
        this.defValue = 0;
        this.defendersByTarget.clear();
        this.basicDefendersByTarget.clear();
        this.defendingPlayersByTarget.clear();
        this.defenseValues.clear();
        this.originalAttackTarget = undefined;
        this.defenderConditions = [];
        this.modifyDefense = 0;
        this.attacked = undefined;
        this.activationInterrupted = false;
        this.preventDamage = 0;
    }
    canContinueActivation() {
        const defenderEliminated = [...this.defendingPlayersByTarget.values()]
            .some(player => player.defeated) ||
            [...this.defendersByTarget.values(), this.defender].some(defender =>
                (defender?.controller?.isPlayer ? defender.controller : defender?.owner)?.defeated);
        if (defenderEliminated) {
            this.activationInterrupted = true;
            return false;
        }

        return super.canContinueActivation();
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
    getActivationDialogPlayer(params = {}) {
        const target = Array.isArray(this.selectedTarget) ?
            this.selectedTarget[0] : this.selectedTarget;

        return target ? this.getTargetPlayer(target) :
            super.getActivationDialogPlayer(params);
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
    getTriggersParams(params) {
        const triggerParams = super.getTriggersParams(params);

        return !Array.isArray(this.selectedTarget) && this.defendingPlayersByTarget.size ?
            {...triggerParams, player: this.getTargetPlayer(this.selectedTarget)} :
            triggerParams;
    }
    async resolveStatus(params) {
        await this.showActivationSkippedDialog(
            STATUS_STUNNED,
            `${this.character.name} estaba aturdido y no ataca.`,
            params,
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

        return attackValue + this.modifyAttack + this.attackModifier;
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
    async triggerBasicDefense(params) {
        const type = [TRIGGER_YOU_BASIC_DEFENSE];
        const triggerParams = {
            ...this.getTriggersParams({...params, effect: this}),
            effect: this,
            player: params.player,
        };

        if (await this.trigger(PRIORITY_CONSTANT, type, triggerParams) &&
            await this.trigger(PRIORITY_FORCED_INTERRUPT, type, triggerParams)) {
            await this.trigger(PRIORITY_INTERRUPT, type, triggerParams);
        }
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
            const defender = await this.selectAttackDefender(attackTarget, params);
            if (!this.canContinueActivation()) {
                return;
            }
            if (defender) {
                await this.setDefender(defender, attackTarget, params);

                if (defender.isSuperhero) {
                    let selectedDefender = this.defendersByTarget.get(attackTarget);
                    if (this.basicDefendersByTarget.get(attackTarget)) {
                        await this.triggerBasicDefense({
                            ...params,
                            player: this.getTargetPlayer(selectedDefender),
                        });
                        this.refreshSuperheroDefender(defender, attackTarget);
                        selectedDefender = this.defendersByTarget.get(attackTarget);
                    }
                    const defenseValue = await this.getDefenseValue(
                        {...params, player: defender.owner},
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
    getPlayerDefenders(player, attackTarget) {
        if (player.defeated) {
            return [];
        }
        const targetPlayer = this.getTargetPlayer(attackTarget);
        if (this.match?.scenario?.separatePlayAreas &&
            getScenarioZone(this.match, player) !==
                getScenarioZone(this.match, targetPlayer)) {
            return [];
        }
        if (player === targetPlayer) {
            return this.getDefenders(attackTarget);
        }
        if (this.getDefendingPlayerForTarget(attackTarget)) {
            return [];
        }

        const defenders = player.defenders;
        return this.getRequiredDefenders(attackTarget).length ?
            defenders.filter(defender => this.defenderConditions.every(condition =>
                checkCondition(defender, condition))) :
            defenders;
    }
    getOtherDefendingPlayers(attackTarget) {
        const targetPlayer = this.getTargetPlayer(attackTarget);

        return (this.match.players || []).filter(player =>
            player !== targetPlayer &&
            this.getPlayerDefenders(player, attackTarget).length);
    }
    async openDefenseSelection(attackTarget, player, params, {allowRequests = false} = {}) {
        const defenders = this.getPlayerDefenders(player, attackTarget);
        const otherPlayers = allowRequests ? this.getOtherDefendingPlayers(attackTarget) : [];
        if (!defenders.length && !otherPlayers.length) {
            return {defender: null};
        }

        const attackValue = await this.getAttackValue(params);
        const defenderCards = await Promise.all(defenders.map(async defender => {
            const stats = await defender.getEffectiveStats({...params, player});

            return {...defender.toObj({...params, player}), ...stats};
        }));
        const players = await Promise.all(otherPlayers.map(async otherPlayer => {
            const stats = await otherPlayer.superhero.getEffectiveStats({...params, player: otherPlayer});

            return {...otherPlayer.toTargetObj({...params, player: otherPlayer}), ...stats};
        }));
        const attack = this.toObj(params);
        attack.character.attack = attackValue;
        attack.target = attackTarget.toTargetObj?.(params) ?? attackTarget.toObj(params);
        const mustDefend = allowRequests && this.getRequiredDefenders(attackTarget).length > 0;
        const response = await this.openDialog({
            dialogType: DIALOG_DEFENSE,
            targetPlayer: player,
            hand: player.hand.cards.map(card => card.toObj({...params, player})),
            hideOk: mustDefend,
            data: {
                attack,
                defenders: defenderCards,
                ...(players.length ? {players} : {}),
            },
        });
        if (!this.canContinueActivation()) {
            return {defender: null};
        }
        if (response?.defendingPlayerId) {
            if (response.defender ||
                !otherPlayers.some(otherPlayer => otherPlayer.id === response.defendingPlayerId)) {
                throw new Error('El jugador solicitado para defender no es válido.');
            }
            const requestedPlayer = otherPlayers.find(otherPlayer =>
                otherPlayer.id === response.defendingPlayerId);
            if (!this.getPlayerDefenders(requestedPlayer, attackTarget).length) {
                throw new Error('El jugador solicitado ya no puede defender este ataque.');
            }
            return {requestedPlayer};
        }
        const defender = response?.defender &&
            this.getPlayerDefenders(player, attackTarget)
                .find(candidate => candidate.id === response.defender.id);
        if (response?.defender && !defender) {
            throw new Error('El defensor seleccionado no es válido.');
        }
        if (mustDefend && !defender) {
            throw new Error('EnemyAttackEffect requires a qualifying defender.');
        }

        return {defender};
    }
    async selectAttackDefender(attackTarget, params) {
        const targetPlayer = this.getTargetPlayer(attackTarget);
        while (this.canContinueActivation()) {
            const selection = await this.openDefenseSelection(
                attackTarget, targetPlayer, params, {allowRequests: true}
            );
            if (!selection.requestedPlayer) {
                return selection.defender;
            }
            const requestedSelection = await this.openDefenseSelection(
                attackTarget, selection.requestedPlayer, params
            );
            if (requestedSelection.defender) {
                return requestedSelection.defender;
            }
        }

        return null;
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
        if (target.controller?.isPlayer) {
            return target.controller;
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
    getDefendingPlayerForTarget(target) {
        const defender = this.getDefenderForTarget(target);

        return this.defendingPlayersByTarget.get(target) ||
            (defender && this.getTargetPlayer(defender)) ||
            (!Array.isArray(this.selectedTarget) ?
                this.defendingPlayersByTarget.values().next().value : undefined);
    }
    canUseDefenseAbility(player) {
        if (this.resolved || !player) {
            return false;
        }

        const attackTarget = this.getDefenseAbilityTarget(player);
        if (!attackTarget) {
            return false;
        }
        if (this.match?.scenario?.separatePlayAreas &&
            getScenarioZone(this.match, player) !==
                getScenarioZone(this.match, this.getTargetPlayer(attackTarget))) {
            return false;
        }

        const defendingPlayer = this.getDefendingPlayerForTarget(attackTarget);

        return !defendingPlayer || defendingPlayer === player;
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
            {exhaust: false, isBasicDefense: false}
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
        const triggers = super.getTriggersEnds(params)
            .concat([
                TRIGGER_VILLAIN_ATTACKS_YOU,
                TRIGGER_ENEMY_ATTACKS_YOU,
            ]);
        if ([...this.basicDefendersByTarget.values()].some(Boolean)) {
            triggers.push(TRIGGER_YOU_BASIC_DEFENSE);
        }

        return triggers;
    }
    hasBasicDefenseFor(player) {
        for (const [target, isBasicDefense] of this.basicDefendersByTarget) {
            const defender = this.getDefenderForTarget(target);
            if (isBasicDefense &&
                defender?.isHero &&
                this.getTargetPlayer(defender) === player) {
                return true;
            }
        }

        return false;
    }
    async setDefender(
        defender,
        attackTarget = this.selectedTarget,
        params = {},
        {exhaust = true, isBasicDefense = true} = {}
    ) {
        if (defender) {
            const previousDefender = this.getDefenderForTarget(attackTarget);
            this.defender = defender.isSuperhero ? defender.currentSide : defender;
            this.defendersByTarget.set(attackTarget, this.defender);
            this.basicDefendersByTarget.set(
                attackTarget,
                Boolean(isBasicDefense && this.defender.isHero)
            );
            const defendingPlayer = this.getTargetPlayer(this.defender);
            this.defendingPlayersByTarget.set(attackTarget, defendingPlayer);
            if (!Array.isArray(this.selectedTarget)) {
                this.selectedTarget = defendingPlayer;
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
                this.refreshSuperheroDefender(defender, attackTarget);
            }
        }
    }
    refreshSuperheroDefender(defender, attackTarget) {
        if (defender.isSuperhero) {
            this.defender = defender.currentSide;
            this.defendersByTarget.set(attackTarget, this.defender);
        }
    }
    removeDepartedDefenders() {
        for (const [target, defender] of this.defendersByTarget) {
            if (defender.isAlly && defender.isInPlay === false) {
                this.defendersByTarget.delete(target);
                this.defenseValues.delete(target);
                if (this.defender === defender) {
                    this.defender = null;
                    this.defValue = 0;
                }
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

        const defenseParams = !isMultiTarget && this.defendingPlayersByTarget.size ?
            {...params, player: this.getTargetPlayer(this.selectedTarget)} :
            params;
        const boost = await this.resolveBoostCards(defenseParams);
        if (!this.canContinueActivation()) {
            return;
        }

        this.removeDepartedDefenders();
        const atkValue = await this.getAttackValue(defenseParams);
        if (!this.canContinueActivation()) {
            return;
        }

        const {character} = this;
        const attackedTargets = attackTargets.map(attackTarget =>
            this.defendersByTarget.get(attackTarget) ||
                (isMultiTarget ?
                    this.defendingPlayersByTarget.get(attackTarget) || attackTarget :
                    this.defender || this.selectedTarget));
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

        await dealDamageEffect.runEffect(defenseParams);
        if (!this.canContinueActivation()) {
            return;
        }

        this.activation.takenDamage = dealDamageEffect.takenDamage;
        await this.resolveDelayedEffects({
            ...defenseParams,
            effect: this,
        });
    }
}