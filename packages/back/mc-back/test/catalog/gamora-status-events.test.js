import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import aggressionEvents from '../../../mc-data/seed/catalog/aspects/aggression/events.js';
import basicEvents from '../../../mc-data/seed/catalog/aspects/basic/events.js';
import justiceEvents from '../../../mc-data/seed/catalog/aspects/justice/events.js';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Deck} from '../../src/model/match/deck.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

describe('status interactions for Attack and Thwart Events', () => {
    test('Stunned cancels Vapuleo even without a legal enemy target', async () => {
        const {match, matchFactory, player, superhero} =
            await createStatusMatch('stunned');
        const vapuleo = createEvent(
            matchFactory,
            player,
            aggressionEvents,
            'aggression-vapuleo',
        );
        const attack = vapuleo.abilities.find(({isAttack}) => isAttack);

        await attack.resolveAbility({match, player, card: vapuleo});

        assert.equal(superhero.isStunned, false);
        assert.equal(attack.resolved, false);
    });

    test('Confused cancels Cortar el paso instead of removing threat', async () => {
        const {mainScheme, match, matchFactory, player, superhero} =
            await createStatusMatch('confused');
        const cortarElPaso = createEvent(
            matchFactory,
            player,
            justiceEvents,
            'justice-cortar-el-paso',
        );
        const thwart = cortarElPaso.abilities.find(({isThwart}) => isThwart);

        await thwart.resolveAbility({
            match,
            player,
            card: cortarElPaso,
        });

        assert.equal(superhero.isConfused, false);
        assert.equal(mainScheme.threat, 3);
        assert.equal(thwart.resolved, false);
    });

    test('Confused cancels both parts of the Attack/Thwart Ataque relámpago', async () => {
        const {mainScheme, match, matchFactory, player, superhero} =
            await createStatusMatch('confused');
        const lightning = createEvent(
            matchFactory,
            player,
            basicEvents,
            'basic-ataque-relampago',
        );
        const ability = lightning.abilities[0];
        const effect = ability.effect;

        assert.equal(ability.isAttack, true);
        assert.equal(ability.isThwart, true);
        assert.equal(effect.isAttack, true);
        assert.equal(effect.isThwart, true);
        assert.equal(effect.activation.checkStatus(), false);
        effect.resetActivation();

        await ability.resolveAbility({match, player, card: lightning});

        assert.equal(superhero.isConfused, false);
        assert.equal(mainScheme.threat, 3);
        assert.equal(ability.resolved, false);
    });

    test('Stunned cancels both parts of the Attack/Thwart Ataque relámpago', async () => {
        const {mainScheme, match, matchFactory, player, superhero} =
            await createStatusMatch('stunned');
        const lightning = createEvent(
            matchFactory,
            player,
            basicEvents,
            'basic-ataque-relampago',
        );
        const ability = lightning.abilities[0];

        await ability.resolveAbility({match, player, card: lightning});

        assert.equal(superhero.isStunned, false);
        assert.equal(mainScheme.threat, 3);
        assert.equal(ability.resolved, false);
    });
});

async function createStatusMatch(status) {
    const catalog = await loadCatalog();
    const thor = catalog.heroes.find(({_id}) => _id === 'thor');
    const match = new Match({
        mc: {
            mcSocket: {
                send() {},
            },
        },
        name: `gamora-status-${status}`,
    });
    const matchFactory = new MatchFactory(match);
    const superhero = matchFactory.createSuperhero(thor.config);
    superhero.selectedSide = 1;
    superhero[status] = 1;

    const mainScheme = createMainScheme();
    match.scenario = {
        mainScheme,
        schemes: [mainScheme],
    };

    const player = match.createPlayer({
        name: 'Thor',
        superhero,
    });
    player.gameZone = new PlayerZone({owner: player});
    player.deck = new Deck({owner: player});
    player.deck.cards = [{}];
    player.refresh = async () => {};
    player.hand.refresh = async () => {};
    match.openDialog = async dialog => ({
        selected: dialog.data.cards[0],
    });

    return {mainScheme, match, matchFactory, player, superhero};
}

function createMainScheme() {
    return {
        isCard: true,
        isMainScheme: true,
        isScheme: true,
        name: 'Main Scheme',
        threat: 3,
        canRemoveThreat() {
            return this.threat > 0;
        },
        canThwart() {
            return this.canRemoveThreat();
        },
        removeThreat(count) {
            this.threat -= count;
        },
        refresh() {},
    };
}

function createEvent(matchFactory, player, events, id) {
    const entry = events.find(event => event._id === id);
    assert.ok(entry, `Missing event: ${id}`);

    return matchFactory.cardsFactory.createGameCardFromConfig(
        structuredClone(entry.card),
        {owner: player},
    );
}
