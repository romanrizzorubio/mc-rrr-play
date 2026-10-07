import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    PRIORITY_FORCED_RESPONSE,
    TRIGGER_THIS_SCHEME,
} from 'mc-shared';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {CharacterGameCard} from '../../src/model/cards/character-game-card.js';
import {Scheme} from '../../src/activations/scheme.js';
import {GetSchemeEffect} from '../../src/effects/get-scheme-effect.js';
import ultron from '../../../mc-data/seed/catalog/scenarios/ultron.js';

const getTransmitterConfig = () => ultron.config.cards.find(({card}) =>
    card.params.name === 'Transmisor de programa').card;

test('Transmisor de programa increases Ultron scheme value', async () => {
    const match = {};
    const villain = new CharacterGameCard({
        card: {
            id: 'ultron',
            isCharacter: true,
            isVillain: true,
            match,
            name: 'Ultrón',
            scheme: 2,
        },
    });
    const transmitter = {
        card: {
            scheme: getTransmitterConfig().params.scheme,
        },
    };
    villain.attached.push(transmitter);

    const schemeEffect = new GetSchemeEffect({
        match,
        selectedTarget: villain,
    });
    await schemeEffect.execute({});

    assert.equal(schemeEffect.scheme, 3);
});

test('Transmisor de programa places threat on every side scheme when Ultron schemes', async () => {
    const sideSchemes = [0, 1].map(index => ({
        id: `side-scheme-${index}`,
        isMainScheme: false,
        isSideScheme: true,
        threat: 0,
        placeThreat(threat) {
            this.threat += threat;
        },
        refresh() {},
    }));
    const player = {
        isHero: true,
        isPlayer: true,
        name: 'Player',
    };
    const scenario = {
        gameZone: {
            cards: [],
        },
    };
    const villain = {
        id: 'ultron',
        isVillain: true,
        name: 'Ultrón',
    };
    const match = {
        initialPlayer: player,
        players: [player],
        scenario,
        sideSchemes,
        triggerCards: {},
    };
    player.match = match;

    const cardsFactory = new CardsFactory({match});
    const transmitter = cardsFactory.createGameCard({
        card: cardsFactory.createCard(getTransmitterConfig()),
        owner: scenario,
    });
    transmitter.controller = scenario;
    transmitter.attachedTo = villain;
    villain.attached = [transmitter];
    await transmitter.initTriggers();

    const [trigger] = transmitter.triggers[TRIGGER_THIS_SCHEME][PRIORITY_FORCED_RESPONSE];
    const scheme = new Scheme({
        effect: {
            character: villain,
        },
    });
    const params = {
        effect: {
            character: villain,
        },
        match,
        player,
        ...scheme.getTriggersParams({}),
    };

    assert.ok(scheme.getTriggersEnds({}).includes(TRIGGER_THIS_SCHEME));
    assert.equal(await trigger.canTrigger(params), true);
    await trigger.runTrigger(params);

    assert.deepEqual(sideSchemes.map(({threat}) => threat), [1, 1]);
});
