import {RESOURCE_ANY} from 'mc-shared';

import {Effect} from './effect.js';
import {PayCostEffect} from './pay-cost-effect.js';


export class PayPrintedCostEffect extends Effect {
    constructor() {
        super(arguments[0]);
    }

    async execute(params) {
        const {player, card} = params;
        
        if (!card) {
            return;
        }

        const cost = card.cost;
        if (cost === 0) {
            return;
        }

        // Generamos un array de recursos universales para representar el coste impreso
        const requiredResources = Array(cost).fill(RESOURCE_ANY);
        
        const paid = await player.spendResources(requiredResources, card);

        if (paid) {
            const payCostEffect = new PayCostEffect({
                hand: paid.hand,
                generators: paid.generators,
                selectedTarget: card,
                match: this.match,
            });

            await payCostEffect.runEffect(params);
        } else {
            // Si no se puede pagar, deberíamos interrumpir la cadena.
            throw new Error('Cancelado: no se pudo pagar el coste impreso.');
        }
    }
}
