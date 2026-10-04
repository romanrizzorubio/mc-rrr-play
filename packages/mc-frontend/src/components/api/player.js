import {ENDPOINTS, EVENTS} from 'mc-endpoints';

export class Player {
    constructor(api) {
        this.api = api;
    }
    endTurn(player) {
        return this.api.send({
            endpoint: EVENTS.TURN.END,
            params: {
                player,
            },
        });
    }
    flip(player) {
        const {api} = this;

        return api.post({
            endpoint: ENDPOINTS.PLAYER.FLIP,
            params: {
                player,
            }
        });
    }
    playCard(player, cardId) {
        const {api} = this;

        return api.post({
            endpoint: ENDPOINTS.PLAYER.PLAY_CARD,
            params: {
                player,
                cardId,
            }
        });
    }
    resolveAbility(player, card, ability) {
        const {api} = this;

        api.post({
            endpoint: ENDPOINTS.PLAYER.RESOLVE_ABILITY,
            params: {
                player,
                card,
                ability,
            }
        });
    }
}