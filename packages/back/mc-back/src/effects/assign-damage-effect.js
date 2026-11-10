import {DIALOG_ASSIGN, EFFECT_CATEGORY_DAMAGE} from 'mc-shared';

import {DealDamageEffect} from './deal-damage-effect.js';
import {Effect} from './effect.js';

export class AssignDamageEffect extends Effect {
    constructor({
        damage,
    }) {
        super(arguments[0]);

        this.baseDamage = damage;
        this.damage = damage;
        this.damageModifier = 0;
    }
    get effectCategories() {
        return [EFFECT_CATEGORY_DAMAGE];
    }
    async execute(params) {
        const selectedTargets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget :
            [this.selectedTarget];
        const targetPlayer = selectedTargets.find(target =>
            target?.isPlayer);
        const selectedTarget = (targetPlayer ?
            [...(targetPlayer.allies ?? []), targetPlayer.superhero] :
            [...selectedTargets]).filter(Boolean);
        const assignmentParams = targetPlayer ?
            {...params, player: targetPlayer, targetPlayer} :
            params;
        const player = targetPlayer ?? params.player;
        if (!selectedTarget.length) {
            return;
        }

        selectedTarget.sort((first, second) =>
            Number(second.isSuperhero) - Number(first.isSuperhero)
        );
        const damage = (this.paramsCalc ?
            await this.calculate(assignmentParams) :
            this.baseDamage) + this.damageModifier;
        if (damage <= 0) {
            return;
        }

        this.damage = damage;
        const cardStats = await Promise.all(selectedTarget.map(async card => ({
            card,
            stats: await card.getEffectiveStats(assignmentParams),
        })));
        const dealDamage = (card, assignedDamage) => {
            if (!assignedDamage) {
                return;
            }

            const dealDamageEffect = new DealDamageEffect({
                selectedTarget: card,
                damage: assignedDamage,
                match: this.match,
            });

            return dealDamageEffect.runEffect(assignmentParams);
        };

        if (cardStats.length === 1) {
            const [{card, stats: {life}}] = cardStats;
            const assignedDamage = Math.min(this.damage, Math.max(0, life));

            return dealDamage(card, assignedDamage);
        }

        const cards = cardStats.map(({card, stats: {hitPoints, life}}) => ({
            ...card.toObj(params),
            isSuperhero: card.isSuperhero,
            hitPoints,
            life,
        }));

        const {assigned} = await this.openDialog({
            dialogType: DIALOG_ASSIGN,
            targetPlayer: player,
            title: `Reparte ${this.damage} de Daño indirecto`,
            hand: player.hand.cards.map(card => card.toObj(params)),
            data: {
                count: this.damage,
                field: 'life',
                cards,
            },
        });

        return this.promisesSequential(selectedTarget, card => {
            const assignedDamage = assigned[card.id];

            return dealDamage(card, assignedDamage);
        });
    }
}