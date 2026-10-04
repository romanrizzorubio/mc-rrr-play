import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    DIALOG_LIST,
    TARGET_YOUR_HERO,
} from 'mc-shared';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import spiderman from '../../../mc-data/seed/catalog/heroes/spiderman.js';

test('Spider-Man obligation proceeds to its resolution after flipping to Peter Parker', async () => {
    const match = new Match({
        mc: {
            mcSocket: {
                send() {},
            },
        },
        name: 'spider-obligation',
    });
    const matchFactory = new MatchFactory(match);
    const superhero = matchFactory.createSuperhero(spiderman.config);
    superhero.selectedSide = 1;

    const player = match.createPlayer({
        name: 'Peter Parker',
        superhero,
    });
    player.initPlayer();

    const [obligation] = superhero.obligations;
    obligation.owner = player;

    const dialogs = [];
    match.openDialog = async dialog => {
        dialogs.push(dialog);

        if (dialog.dialogType === DIALOG_LIST) {
            return {
                selected: {
                    id: dialogs.filter(item => item.dialogType === DIALOG_LIST).length === 1 ?
                        '0' :
                        '0.0',
                },
            };
        }

        return {};
    };

    const putPlayEffect = new PutPlayEffect({
        card: obligation,
        controller: player,
        match,
        target: TARGET_YOUR_HERO,
    });
    await putPlayEffect.runEffect({
        card: obligation,
        player,
    });

    assert.equal(superhero.isAlterEgo, true);
    assert.equal(player.exhausted, true);
    assert.equal(player.gameZone.cards.includes(obligation), false);
    assert.equal(dialogs.filter(dialog => dialog.dialogType === DIALOG_LIST).length, 2);
    assert.match(
        dialogs.at(-1).data.options[0].triggers[0].text,
        /Agotar a Peter Parker/
    );
});
