import {ABILITY_ACTION} from 'mc-shared';
import {ENDPOINTS} from 'mc-endpoints';
import {MatchFactory} from '../../factory/match-factory.js';
import {logGameTrace} from '../../utils/game-trace.js';

let abilityTraceSequence = 0;

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
            const heroConfig = await this.mc.data.getHeroConfig(hero);
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
        await match.refresh();

        return player.toObjWithPlayableHand();
    }
    async playCard(params) {
        const {match, cardId} = params;
        const player = match.getPlayer(params.player);

        await player.playCard({
            cardId,
            abilityType: ABILITY_ACTION,
        });

        await match.refresh();

        return player.toObjWithPlayableHand();
    }
    async resolveAbility(params) {
        const {match, card, ability} = params;
        const player = match.getPlayer(params.player);
        const traceId = `ability-${++abilityTraceSequence}`;

        if (!player) {
            console.log('resolveAbility');
        }

        logGameTrace('ability.resolve.start', {
            traceId,
            match: match.name,
            player: player && player.name,
        });

        let outcome = 'failed';
        try {
            await player.resolveAbility(card, ability);
            await match.refresh();
            const result = await player.toObjWithPlayableHand();
            outcome = 'completed';
            return result;
        } finally {
            logGameTrace('ability.resolve.end', {
                traceId,
                outcome,
            });
        }
    }
}