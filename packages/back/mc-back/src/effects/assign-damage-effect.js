import {DIALOG_ASSIGN, EFFECT_CATEGORY_DAMAGE} from 'mc-shared';

import {DealDamageEffect} from './deal-damage-effect.js';
import {Effect} from './effect.js';

export class AssignDamageEffect extends Effect {
    constructor(params = {}) {
        super(params);

        this.baseDamage = params.damage;
        this.damage = params.damage;
        this.damageModifier = 0;
        this._character = params.character;
        this.attackKeywordSource = params.attackKeywordSource;
        this.takenDamageByTarget = new Map();
    }
    get character() {
        return this._character || super.character;
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.takenDamageByTarget.clear();
    }
    getTakenDamageFor(target) {
        const normalizedTarget = target?.currentSide ?? target;
        let totalDamage = 0;
        for (const [assignedTarget, damage] of this.takenDamageByTarget) {
            if (assignedTarget === target ||
                (assignedTarget.currentSide ?? assignedTarget) === normalizedTarget) {
                totalDamage += damage;
            }
        }

        return totalDamage;
    }
    get effectCategories() {
        return [EFFECT_CATEGORY_DAMAGE];
    }
    async execute(params) {
        const selectedTargets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget :
            [this.selectedTarget];
        const targetPlayers = selectedTargets.filter(target =>
            target?.isPlayer);
        const groups = targetPlayers.length ?
            targetPlayers.map((player, index) => ({
                player,
                selectedTarget: [...(player.allies ?? []), player.superhero]
                    .filter(Boolean),
                damage: Array.isArray(this.baseDamage) ?
                    this.baseDamage[index] :
                    this.baseDamage,
            })) :
            [{
                player: params.player,
                selectedTarget: selectedTargets.filter(Boolean),
                damage: this.baseDamage,
            }];

        for (const group of groups) {
            await this.assignDamage(group, params);
        }
    }
    async assignDamage({player, selectedTarget, damage: baseDamage}, params) {
        const assignmentParams = player ?
            {...params, player, targetPlayer: player} :
            params;
        if (!selectedTarget.length) {
            return;
        }

        selectedTarget.sort((first, second) =>
            Number(second.isSuperhero) - Number(first.isSuperhero)
        );
        const baseDamageValue = this.paramsCalc ?
            await this.calculate(assignmentParams) :
            baseDamage;
        const damage = baseDamageValue + this.damageModifier;
        if (!Number.isFinite(damage)) {
            throw new TypeError('AssignDamageEffect requires a finite damage value.');
        }
        if (damage <= 0) {
            return;
        }

        this.damage = damage;
        const cardStats = await Promise.all(selectedTarget.map(async card => ({
            card,
            stats: await card.getEffectiveStats(assignmentParams),
        })));
        let assignments;
        if (cardStats.length === 1) {
            const [{card, stats: {life}}] = cardStats;
            assignments = [{
                card,
                damage: Math.min(this.damage, Math.max(0, life)),
            }];
        } else {
            const cards = cardStats.map(({card, stats: {hitPoints, life}}) => ({
                ...card.toObj(assignmentParams),
                isSuperhero: card.isSuperhero,
                hitPoints,
                life,
            }));
            const assignmentPlayer = player ?? params.player;
            const {assigned} = await this.openDialog({
                dialogType: DIALOG_ASSIGN,
                targetPlayer: assignmentPlayer,
                title: `Reparte ${this.damage} de Daño indirecto`,
                hand: assignmentPlayer.hand.cards.map(card =>
                    card.toObj(assignmentParams)),
                data: {
                    count: this.damage,
                    field: 'life',
                    cards,
                },
            });
            assignments = selectedTarget.map(card => ({
                card,
                damage: assigned?.[card.id],
            }));
        }

        const damageAssignments = assignments.filter(({damage: amount}) =>
            amount > 0);
        if (damageAssignments.length === 0) {
            return;
        }

        if (this.isAttack) {
            const damageTargets = damageAssignments.map(({card}) => card);
            const assignedDamage = damageAssignments.map(({damage: amount}) => amount);
            const dealDamageEffect = new DealDamageEffect({
                ability: this.ability,
                activation: this.activation,
                attackKeywordSource: this.attackKeywordSource,
                character: this.character,
                damage: damageTargets.length === 1 ?
                    assignedDamage[0] :
                    assignedDamage,
                isAttack: true,
                match: this.match,
                selectedTarget: damageTargets.length === 1 ?
                    damageTargets[0] :
                    damageTargets,
            });
            await dealDamageEffect.runEffect(assignmentParams);
            this.recordTakenDamage(damageTargets, dealDamageEffect.takenDamage);

            return;
        }

        return this.promisesSequential(damageAssignments, async ({card, damage}) => {
            const dealDamageEffect = new DealDamageEffect({
                ability: this.ability,
                character: this.character,
                damage,
                match: this.match,
                selectedTarget: card,
            });
            await dealDamageEffect.runEffect(assignmentParams);
            this.recordTakenDamage([card], dealDamageEffect.takenDamage);
        });
    }
    recordTakenDamage(targets, damage) {
        const takenDamage = Array.isArray(damage) ? damage : [damage];
        targets.forEach((target, index) => {
            this.takenDamageByTarget.set(
                target,
                (this.takenDamageByTarget.get(target) ?? 0) +
                    (takenDamage[index] ?? 0)
            );
        });
    }
}
