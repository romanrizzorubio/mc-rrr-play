import {ABILITY_ACTION} from '../../constants/abilities.js';
import {ENDPOINTS} from 'mc-endpoints';
import {MatchFactory} from '../../factory/match-factory.js';

export class PlayerRest {
    constructor(rest) {
        this.rest = rest;
    }
    get mc() {
        return this.rest.mc;
    }
    createEndpoints() {
        this.rest.post(ENDPOINTS.PLAYER.CREATE, this.createPlayer.bind(this));
        this.rest.post(ENDPOINTS.PLAYER.FLIP, this.flip.bind(this));
        this.rest.post(ENDPOINTS.PLAYER.PLAY_CARD, this.playCard.bind(this));
        this.rest.post(ENDPOINTS.PLAYER.RESOLVE_ABILITY, this.resolveAbility.bind(this));
    }
    async createPlayer(params) {
        const {match, name, hero, initial} = params;

        const matchFactory = new MatchFactory(match);

        if (name && hero) {
            const {heroConfig} = await import(`../../../data/heroes/${hero}/index.js`);
            const heroCreated = matchFactory.createSuperhero(heroConfig);
            const player = match.createPlayer({
                name,
                superhero: heroCreated,
                initial,
                config: heroConfig
            });

            return player.toObj();
        }
    }
    async flip(params) {
        const {match} = params;
        const player = match.getPlayer(params.player);

        await player.flip(true);

        return player.toObj();
    }
    async playCard(params) {
        const {match, cardId} = params;
        const player = match.getPlayer(params.player);

        await player.playCard({
            cardId,
            abilityType: ABILITY_ACTION,
        });

        return player.toObj();
    }
    async resolveAbility(params) {
        const {match, card, ability} = params;
        const player = match.getPlayer(params.player);

        if (!player) {
            console.log('resolveAbility');
        }

        await player.resolveAbility(card, ability);

        return player.toObj();
    }
}