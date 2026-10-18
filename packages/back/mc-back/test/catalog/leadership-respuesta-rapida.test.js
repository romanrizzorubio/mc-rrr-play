import assert from 'node:assert/strict';
import {test} from 'node:test';

import {DIALOG_USE_CARD} from 'mc-shared';
import leadershipAllies from '../../../mc-data/seed/catalog/aspects/leadership/allies.js';
import leadershipUpgrades from '../../../mc-data/seed/catalog/aspects/leadership/upgrades.js';
import blackWidow from '../../../mc-data/seed/catalog/heroes/black-widow.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

const responseDefinition = leadershipUpgrades.find(({_id}) =>
    _id === 'leadership-respuesta-rapida').card;
const allyDefinition = leadershipAllies.find(({_id}) =>
    _id === 'leadership-wonder-man').card;

test('Respuesta rápida returns the defeated ally to play before dealing damage', async () => {
    const match = new Match({
        mc: {
            mcSocket: {
                send() {},
            },
        },
        name: 'respuesta-rapida',
    });
    match.scenario = {
        gameZone: {
            cards: [],
            currentScheme: undefined,
        },
        villain: undefined,
    };
    const matchFactory = new MatchFactory(match);
    const superhero = matchFactory.createSuperhero(blackWidow.config);
    superhero.selectedSide = 1;
    const player = match.createPlayer({
        name: 'Natasha',
        superhero,
    });
    player.initPlayer();
    player.gameZone.refresh = async () => {};
    player.deck.refresh = async () => {};

    const response = matchFactory.cardsFactory.createGameCardFromConfig(
        responseDefinition,
        {owner: player}
    );
    const ally = matchFactory.cardsFactory.createGameCardFromConfig(
        allyDefinition,
        {owner: player}
    );
    ally.refresh = async () => {};
    response.controller = player;
    ally.controller = player;
    player.gameZone.addToGameZone(response);
    player.gameZone.addToGameZone(ally);
    await response.initTriggers({player});

    const dialogs = [];
    match.openDialog = async dialog => {
        dialogs.push(dialog);

        return dialog.dialogType === DIALOG_USE_CARD ?
            {selected: {id: response.id}} :
            {};
    };

    const defeat = new DefeatEffect({
        match,
        selectedTarget: ally,
    });
    await defeat.runEffect({
        card: ally,
        match,
        player,
    });

    assert.ok(dialogs.some(({dialogType}) => dialogType === DIALOG_USE_CARD));
    assert.equal(response.isInPlay, false);
    assert.equal(ally.isInPlay, true);
    assert.equal(player.gameZone.cards.includes(ally), true);
    assert.equal(player.deck.discardPile.includes(ally), false);
    assert.equal(ally.damage, 1);
});
