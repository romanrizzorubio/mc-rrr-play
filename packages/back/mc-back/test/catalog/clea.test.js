import assert from 'node:assert/strict';
import {test} from 'node:test';

import {DIALOG_USE_CARD} from 'mc-shared';
import protectionAllies from '../../../mc-data/seed/catalog/aspects/protection/allies.js';
import blackWidow from '../../../mc-data/seed/catalog/heroes/black-widow.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

const cleaDefinition = protectionAllies.find(({_id}) =>
    _id === 'protection-clea').card;

test('Clea can be shuffled into the player deck when defeated', async () => {
    const match = new Match({
        mc: {
            mcSocket: {
                send() {},
            },
        },
        name: 'clea-defeat',
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

    const clea = matchFactory.cardsFactory.createGameCardFromConfig(
        cleaDefinition,
        {owner: player}
    );
    clea.controller = player;
    clea.refresh = async () => {};
    player.gameZone.addToGameZone(clea);
    await clea.initTriggers({player});

    const dialogs = [];
    match.openDialog = async dialog => {
        dialogs.push(dialog);

        return dialog.dialogType === DIALOG_USE_CARD ?
            {selected: {id: clea.id}} :
            {};
    };

    const defeat = new DefeatEffect({
        match,
        selectedTarget: clea,
    });
    await defeat.runEffect({
        match,
        player,
    });

    assert.ok(dialogs.some(({dialogType}) => dialogType === DIALOG_USE_CARD));
    assert.equal(clea.isInPlay, false);
    assert.equal(player.deck.cards.includes(clea), true);
    assert.equal(player.deck.discardPile.includes(clea), false);
});
