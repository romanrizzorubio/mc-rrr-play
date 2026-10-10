import {
    PRIORITY_CONSTANT,
    TARGET_ALL_PLAYERS,
    TARGET_YOU,
    TRIGGER_FACEDOWN_CARD,
} from 'mc-shared';

import {EngageEffect} from './engage-effect.js';
import {Effect} from './effect.js';
import {PutPlayEffect} from './put-play-effect.js';

export class PutFacedownCardInPlayEffect extends Effect {
    constructor({
        count = 1,
        players,
    }) {
        super(arguments[0]);

        this.count = count;
        this.playersTarget = players;
    }
    getPlayers(params) {
        if (this.playersTarget === TARGET_ALL_PLAYERS) {
            const {players, initialPlayer} = this.match;
            const initialPlayerIndex = players.indexOf(initialPlayer);

            if (initialPlayerIndex < 0) {
                throw new Error('No se pudo determinar al primer jugador para poner cartas boca abajo en juego.');
            }

            return players.slice(initialPlayerIndex)
                .concat(players.slice(0, initialPlayerIndex));
        }

        const target = this.selectedTarget || params.player;

        return Array.isArray(target) ? target : target ? [target] : [];
    }
    async execute(params) {
        const players = this.getPlayers(params);

        for (const player of players) {
            for (let index = 0; index < this.count; index++) {
                const [facedownCard] = await player.deck.draw();

                if (!facedownCard) {
                    continue;
                }

                const facedownCardEvent = {
                    card: facedownCard,
                    sourceEffect: this,
                };
                await this.trigger(
                    PRIORITY_CONSTANT,
                    [TRIGGER_FACEDOWN_CARD],
                    {
                        ...params,
                        card: facedownCard,
                        effect: facedownCardEvent,
                        player,
                        triggeredCard: facedownCard,
                    }
                );

                if (!facedownCard.isFacedownCard) {
                    player.deck.cards.unshift(facedownCard);
                    throw new Error('No environment converted the facedown card into a character.');
                }

                const putInPlayEffect = facedownCard.isMinion ?
                    new EngageEffect({
                        card: facedownCard,
                        controller: player,
                        selectedTarget: player,
                        target: TARGET_YOU,
                        match: this.match,
                    }) :
                    new PutPlayEffect({
                        card: facedownCard,
                        controller: player,
                        match: this.match,
                    });

                await putInPlayEffect.runEffect({
                    ...params,
                    card: facedownCard,
                    player,
                });
            }

            await player.deck.refresh();
        }
    }
}
