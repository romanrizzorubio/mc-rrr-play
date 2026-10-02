import {Effect} from './effect.js';

export class EndLastingEffect extends Effect {
    async execute(params) {
        const {ability} = this;
        const {lasting} = ability;

        for (const cleanup of lasting.cleanups.slice().reverse()) {
            cleanup.ability = ability;
            await cleanup.runEffect({
                ...params,
                card: lasting.card,
                player: lasting.player,
                lasting,
            });
        }

        if (lasting.endEffect) {
            lasting.endEffect.ability = ability;
            lasting.endEffect.selectedTarget = lasting.selectedTarget;
            lasting.endEffect.refreshTarget = false;
            await lasting.endEffect.runEffect({
                ...params,
                card: lasting.card,
                player: lasting.player,
            });
        }

        lasting.card.removeLastingTriggers(lasting);
        const lastingIndex = lasting.match.lasting.indexOf(lasting);

        if (lastingIndex > -1) {
            lasting.match.lasting.splice(lastingIndex, 1);
        }
    }
}