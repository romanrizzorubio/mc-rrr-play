import assert from 'node:assert/strict';
import {test} from 'node:test';

import basicUpgrades from '../../../mc-data/seed/catalog/aspects/basic/upgrades.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

test('Aguante can be assigned to another player who does not control a copy', async () => {
    const aguante = basicUpgrades.find(card => card._id === 'basic-aguante');
    assert.ok(aguante);

    const cardId = `${aguante.card.params.name}--${aguante.card.params.set}`
        .replaceAll(' ', '_')
        .toLowerCase();
    const owner = {
        isPlayer: true,
        getPrintedCard(id) {
            return id === cardId ? {id} : undefined;
        },
    };
    const eligiblePlayer = {
        isPlayer: true,
        getPrintedCard: () => undefined,
    };
    const match = {
        players: [owner, eligiblePlayer],
        isUniqueCard: () => false,
    };
    const cardsFactory = new CardsFactory({match});
    const gameCard = cardsFactory.createGameCardFromConfig(aguante.card);
    gameCard.owner = owner;

    assert.equal(await gameCard.canPlay({player: owner}), true);

    const playEffect = new PlayCardEffect({
        card: gameCard,
        match,
    });
    assert.equal(
        playEffect.filterTarget(eligiblePlayer, {player: owner}),
        true
    );
    assert.equal(playEffect.filterTarget({
        ...eligiblePlayer,
        getPrintedCard: () => ({id: cardId}),
    }, {player: owner}), false);
});
