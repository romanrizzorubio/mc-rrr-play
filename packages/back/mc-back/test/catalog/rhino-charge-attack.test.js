import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_ALLY,
    CARD_TYPE_TREACHERY,
    DIALOG_DEFENSE,
    DIALOG_USE_CARD,
} from 'mc-shared';
import captainAmerica from '../../../mc-data/seed/catalog/heroes/captain-america.js';
import rhino from '../../../mc-data/seed/catalog/scenarios/rhino.js';
import {AttachEffect} from '../../src/effects/attach-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

describe('Rhino Charge attack', () => {
    test('grants overkill for the attack, damages the hero through an ally and discards Charge afterward', async () => {
        const match = new Match({
            name: 'rhino-charge-attack',
            mc: {mcSocket: {send() {}}},
        });
        match.persist = async () => {};
        match.refresh = async () => {};
        match.skipDiscardOrderDialog = true;
        match.openDialog = async () => ({});
        const factory = new MatchFactory(match);
        const player = match.createPlayer({
            name: 'Player',
            userId: 'captain-america-player',
            initial: true,
            superhero: factory.createSuperhero({
                ...captainAmerica.config,
                cards: [],
                precon: [],
                nemesis: [],
                obligation: undefined,
            }),
        });
        player.initPlayer();
        player.superhero.selectedSide = 1;
        match.currentPlayer = player;
        match.scenario = await factory.createScenario({
            ...rhino.config,
            sets: [],
            defaultSets: [],
            cards: [],
        });
        await match.scenario.initScenario([], false);
        match.phase = 'villain';
        match.playing = true;
        player.deck.cards = [factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {name: 'Remaining player card', hitPoints: 1},
        }, {owner: player})];
        match.scenario.deck.cards = [factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_TREACHERY,
            params: {name: 'Remaining encounter', boost: 0},
        }, {owner: match.scenario})];
        const villain = match.villain;
        const baseAttack = await villain.getAttackValue({player});
        const charge = factory.cardsFactory.createGameCardFromConfig(
            rhino.config.cards.find(({card}) => card.params.name === 'Embestida').card,
            {owner: match.scenario},
        );
        await new AttachEffect({card: charge, match, selectedTarget: villain}).runEffect({player});
        await charge.initTriggers();
        const ally = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {name: 'Defending ally', hitPoints: 2, attack: 1, thwart: 1},
        }, {owner: player});
        await new PutPlayEffect({card: ally, match, selectedTarget: player}).runEffect({player});

        const attack = new EnemyAttackEffect({
            match, enemy: villain, selectedTarget: player, giveBoost: false,
        });
        let defenseDialogs = 0;
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_USE_CARD && dialog.data.mandatory) {
                assert.equal(dialog.data.cards[0].id, charge.id);
                return {selected: {id: charge.id}};
            }
            if (dialog.dialogType !== DIALOG_DEFENSE) {
                return {};
            }
            defenseDialogs++;
            assert.equal(attack.overkill, true);
            assert.equal(dialog.data.attack.overkill, true);
            assert.equal(dialog.data.attack.character.attack, baseAttack + 3);
            assert.ok(villain.attached.includes(charge));
            assert.ok(dialog.data.defenders.some(card => card.id === ally.id));
            return {defender: {id: ally.id}};
        };

        await attack.runEffect({player});

        assert.equal(attack.resolved, true);
        assert.equal(defenseDialogs, 1);
        assert.equal(player.gameZone.cards.includes(ally), false);
        assert.ok(player.deck.discardPile.includes(ally));
        assert.equal(player.superhero.damage, baseAttack + 3 - ally.hitPoints);
        assert.equal(villain.attached.includes(charge), false);
        assert.ok(match.scenario.deck.discardPile.includes(charge));
        assert.equal(await villain.getAttackValue({player}), baseAttack);

        const nextAttack = new EnemyAttackEffect({
            match, enemy: villain, selectedTarget: player, giveBoost: false,
        });
        const previousDamage = player.superhero.damage;
        match.openDialog = async () => ({});
        await nextAttack.runEffect({player});
        assert.equal(nextAttack.resolved, true);
        assert.equal(nextAttack.overkill, false);
        assert.equal(player.superhero.damage, previousDamage + baseAttack);
    });
});
