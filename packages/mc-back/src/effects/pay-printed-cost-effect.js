import {Effect} from "./effect.js";
import {RESOURCE_ANY} from "../constants/resources.js";

export const EFFECT_PAY_PRINTED_COST = 'pay-printed-cost';

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
            // El motor de pago ya debería haber procesado los descartes/agotados en spendResources o similar
            // Si el motor requiere ejecución explícita de PayCostEffect, se haría aquí.
            // Pero según SpendEffect, spendResources devuelve los recursos pagados.
            this.match.logger.info(`${player.name} ha pagado el coste de ${cost} para ${card.name}.`);
        } else {
            // Si no se puede pagar, deberíamos interrumpir la cadena.
            throw new Error('Cancelado: no se pudo pagar el coste impreso.');
        }
    }
}
