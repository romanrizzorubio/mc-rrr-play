import {DIALOG_ASSIGN, EFFECT_CATEGORY_DAMAGE} from 'mc-shared';

import {DealDamageEffect} from './deal-damage-effect.js';
import {Effect} from './effect.js';

export class AssignDamageEffect extends Effect {
    constructor({
        damage,
    }) {
        super(arguments[0]);

        this.damage = damage;
    }
    get effectCategories() {
        return [EFFECT_CATEGORY_DAMAGE];
    }
    async execute(params) {
        const {selectedTarget} = this;
        const {player} = params;
        const damage = this.paramsCalc ?
            await this.calculate(params) :
            this.damage;
        if (damage <= 0) {
            return;
        }

        this.damage = damage;
        const cardStats = await Promise.all(selectedTarget.map(async card => ({
            card,
            stats: await card.getEffectiveStats(),
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

            return dealDamageEffect.runEffect(params);
        };

        if (cardStats.length === 1) {
            const [{card, stats: {life}}] = cardStats;
            const assignedDamage = Math.min(this.damage, Math.max(0, life));

            return dealDamage(card, assignedDamage);
        }

        const cards = cardStats.map(({card, stats: {hitPoints, life}}) => ({
            ...card.toObj(params),
            hitPoints,
            life,
        }));

        const {assigned} = await this.openDialog({
            dialogType: DIALOG_ASSIGN,
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