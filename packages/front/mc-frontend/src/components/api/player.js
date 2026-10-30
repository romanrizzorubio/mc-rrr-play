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
    playCard(player, cardId, targetId) {
        const {api} = this;

        return api.post({
            endpoint: ENDPOINTS.PLAYER.PLAY_CARD,
            params: {
                player,
                cardId,
                ...(targetId !== undefined ? {targetId} : {}),
            }
        });
    }
    resolveAbility(player, card, ability, targetId, resourcePayment) {
        const {api} = this;

        return api.post({
            endpoint: ENDPOINTS.PLAYER.RESOLVE_ABILITY,
            params: {
                player,
                card,
                ability,
                ...(targetId !== undefined ? {targetId} : {}),
                ...(resourcePayment !== undefined ? {resourcePayment} : {}),
            }
        });
    }
    requestAction(player, targetPlayer) {
        return this.api.post({
            endpoint: ENDPOINTS.MATCH.REQUEST_ACTION,
            params: {player, targetPlayer},
        });
    }
    respondToActionRequest(player, accept) {
        return this.api.post({
            endpoint: ENDPOINTS.MATCH.RESPOND_ACTION,
            params: {player, accept},
        });
    }
    completeRequestedAction(player) {
        return this.api.post({
            endpoint: ENDPOINTS.MATCH.COMPLETE_ACTION,
            params: {player},
        });
    }
}