import {DIALOG_ASSIGN} from 'mc-shared';

import {DealDamageEffect} from './deal-damage-effect.js';
import {Effect} from './effect.js';

export class AssignDamageEffect extends Effect {
    constructor({
        damage,
    }) {
        super(arguments[0]);

        this.damage = damage;
    }
    async execute(params) {
        const {selectedTarget} = this;
        const {player} = params;

        const {assigned} = await this.openDialog({
            dialogType: DIALOG_ASSIGN,
            title: `Reparte ${this.damage} de Daño`,
            hand: player.hand.cards.map(card => card.toObj(arguments[0])),
            data: {
                count: this.damage,
                field: 'life',
                cards: selectedTarget.map(card => card.toObj(arguments[0])),
            },
        });

        return this.promisesSequential(selectedTarget, card => {
            const assignedDamage = assigned[card.id];

            if (assignedDamage) {
                const dealDamageEffect = new DealDamageEffect({
                    selectedTarget: card,
                    damage: assignedDamage,
                    match: this.match,
                });

                return dealDamageEffect.runEffect(params);
            }
        });
    }
}