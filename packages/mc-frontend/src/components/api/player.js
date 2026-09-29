import {endpoints} from "../../misc/endpoints.js";

export class Player {
    constructor(api) {
        this.api = api;
    }
    endTurn() {
        return this.api.send({
            endpoint: endpoints.turn.end,
        });
    }
    flip(player) {
        const {api} = this;

        return api.post({
            endpoint: endpoints.player.flip,
            params: {
                player,
            }
        });
    }
    playCard(player, cardId) {
        const {api} = this;

        api.post({
            endpoint: endpoints.player.playCard,
            params: {
                player,
                cardId,
            }
        })
    }
    resolveAbility(player, card, ability) {
        const {api} = this;

        api.post({
            endpoint: endpoints.player.resolveAbility,
            params: {
                player,
                card,
                ability,
            }
        })
    }
}