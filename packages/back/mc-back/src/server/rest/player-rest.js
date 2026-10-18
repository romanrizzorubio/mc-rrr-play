import {ABILITY_ACTION} from 'mc-shared';
import {ENDPOINTS, INTERNAL_ENDPOINTS} from 'mc-endpoints';
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
    async refreshPlayer(match, player) {
        const matchState = await match.refresh();
        const refreshedPlayer = matchState.players.find(({name}) =>
            name === player.name);

        if (!refreshedPlayer) {
            throw new Error(`No se encontró al jugador "${player.name}" en la actualización de la partida.`);
        }

        return refreshedPlayer;
    }
    createEndpoints() {
        this.rest.post(
            INTERNAL_ENDPOINTS.PLAYER.CREATE,
            this.createPlayer.bind(this)
        );
        this.rest.post(ENDPOINTS.PLAYER.FLIP, this.flip.bind(this));
        this.rest.post(ENDPOINTS.PLAYER.PLAY_CARD, this.playCard.bind(this));
        this.rest.post(ENDPOINTS.PLAYER.RESOLVE_ABILITY, this.resolveAbility.bind(this));
    }
    async createPlayer(params) {
        const {match, name, hero, initial, deckId} = params;

        const matchFactory = new MatchFactory(match);

        if (name && hero) {
            const heroConfig = await this.mc.data.getHeroConfig(hero);
            if (deckId) {
                const deckConfig = await this.mc.data.getDeckConfig(deckId, hero);
                heroConfig.precon = deckConfig.cards;
                heroConfig.aspect = deckConfig.aspect;
            }
            const creationPlayerConfig = structuredClone(heroConfig);
            const heroCreated = matchFactory.createSuperhero(heroConfig);
            const player = match.createPlayer({
                name,
                superhero: heroCreated,
                initial,
                config: heroConfig
            });
            match.creationConfig ??= {players: [], scenario: null, expert: false};
            match.creationConfig.players.push({
                name,
                initial: initial ?? false,
                config: creationPlayerConfig,
            });

            return player.toObj();
        }
    }
    async flip(params) {
        const {match} = params;
        const player = match.getPlayer(params.player);
        await player.flip(true);

        return this.refreshPlayer(match, player);
    }
    async playCard(params) {
        const {match, cardId, targetId} = params;
        const player = match.getPlayer(params.player);

        await player.playCard({
            cardId,
            abilityType: ABILITY_ACTION,
            targetId,
        });

        return this.refreshPlayer(match, player);
    }
    async resolveAbility(params) {
        const {match, card, ability, targetId} = params;
        const player = match.getPlayer(params.player);
        const traceId = `ability-${++abilityTraceSequence}`;

        if (!player) {
            console.log('resolveAbility');
        }

        logGameTrace('ability.resolve.start', {
            traceId,
            match: match.name,
            player: player?.name,
        });

        let outcome = 'failed';
        try {
            if (targetId === undefined) {
                await player.resolveAbility(card, ability);
            } else {
                await player.resolveAbility(card, ability, targetId);
            }
            const result = await this.refreshPlayer(match, player);
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