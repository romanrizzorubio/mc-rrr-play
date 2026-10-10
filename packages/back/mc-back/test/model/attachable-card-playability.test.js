import assert from 'node:assert/strict';
import test from 'node:test';

import {
    ABILITY_ACTION,
    ABILITY_INTERRUPT,
    TARGET_SIDE_SCHEME,
    TRIGGER_ATTACHED_DEFEAT,
} from 'mc-shared';
import justiceUpgrades from '../../../mc-data/seed/catalog/aspects/justice/upgrades.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

test('Seguimiento requires an available side scheme and is limited per scheme', async () => {
    const seguimiento = justiceUpgrades.find(({_id}) =>
        _id === 'justice-seguimiento');
    assert.ok(seguimiento);
    assert.equal(seguimiento.card.params.attach, TARGET_SIDE_SCHEME);
    assert.equal(seguimiento.card.params.maxAttach, 1);
    assert.equal(
        seguimiento.card.params.abilities[0].type,
        ABILITY_INTERRUPT
    );

    const match = {
        isUniqueCard: () => false,
        schemes: [],
        sideSchemes: [],
    };
    const player = {match};
    const cardsFactory = new CardsFactory({match});
    const printedCard = cardsFactory.createCard(seguimiento.card);
    const card = cardsFactory.createGameCard({
        card: printedCard,
        owner: player,
    });
    const [ability] = card.abilities;
    assert.equal(ability.isInterrupt, true);
    assert.equal(ability.trigger, TRIGGER_ATTACHED_DEFEAT);
    const canPlay = () => card.canPlay({
        abilityType: ABILITY_ACTION,
        checkOnly: true,
        player,
    });

    match.schemes.push({attached: []});
    assert.equal(await canPlay(), false);

    const firstSideScheme = {attached: []};
    const secondSideScheme = {attached: []};
    match.sideSchemes.push(firstSideScheme, secondSideScheme);
    assert.equal(await canPlay(), true);

    firstSideScheme.attached.push({card: {id: printedCard.id}});
    assert.equal(await canPlay(), true);

    const playEffect = new PlayCardEffect({card, match});
    assert.deepEqual(
        await playEffect.getValidTarget({match, player}),
        [secondSideScheme]
    );

    secondSideScheme.attached.push({card: {id: printedCard.id}});
    assert.equal(await canPlay(), false);
});
