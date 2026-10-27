import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_ALLY,
    CLASSIFICATION_LEADERSHIP,
    RESOURCE_ENERGY,
    TRAIT_AVENGER,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

describe('Aguijón (Cassie Lang)', () => {
    test('is a unique Leadership Avenger ally in the Ant-Man precon', async () => {
        const catalog = await loadCatalog();
        const antMan = catalog.heroes.find(({_id}) => _id === 'ant-man');
        const definition = catalog.aspects.find(({_id}) =>
            _id === 'leadership-aguijon');

        assert.ok(antMan);
        assert.ok(definition);
        assert.equal(definition.aspect, CLASSIFICATION_LEADERSHIP);
        assert.deepEqual(definition.card, {
            type: CARD_TYPE_ALLY,
            params: {
                name: 'Aguijón',
                subtitle: 'Cassie Lang',
                set: CLASSIFICATION_LEADERSHIP,
                image: 'aspect/leadership/allies/12014.png',
                traits: [TRAIT_AVENGER],
                unique: true,
                cost: 1,
                resources: [RESOURCE_ENERGY],
                classification: CLASSIFICATION_LEADERSHIP,
                attack: 1,
                thwart: 1,
                attackConsequential: 1,
                thwartConsequential: 1,
                hitPoints: 2,
                paramsToPlay: {
                    'superhero.traits': TRAIT_AVENGER,
                },
                countsTowardAllyLimit: false,
            },
        });

        const precon = antMan.config.precon.find(({aspect}) =>
            aspect === CLASSIFICATION_LEADERSHIP);
        assert.ok(precon);
        assert.ok(precon.cardRefs.some(({id, count}) =>
            id === definition._id && count === 1));
    });

    test('requires an Avenger and does not count toward the ally limit', async () => {
        const catalog = await loadCatalog();
        const antMan = catalog.heroes.find(({_id}) => _id === 'ant-man');
        const definition = catalog.aspects.find(({_id}) =>
            _id === 'leadership-aguijon');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'leadership-aguijon-ally-limit',
        });
        match.scenario = {
            villain: undefined,
            gameZone: {
                cards: [],
                currentScheme: undefined,
            },
        };
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            return {
                accepted: true,
                selected: dialog.data.cards[0],
            };
        };

        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...antMan.config,
            cards: [],
            precon: [],
        });
        const player = match.createPlayer({
            name: 'Hombre Hormiga',
            superhero,
            initial: true,
        });
        player.deck = {
            async refresh() {},
        };
        player.gameZone = new PlayerZone({owner: player});
        player.gameZone.refresh = async () => {};
        superhero.selectedSide = 1;

        const stingerCard = matchFactory.cardsFactory.createCard(definition.card);
        const stinger = matchFactory.cardsFactory.createGameCard({
            card: stingerCard,
            owner: player,
        });
        const existingAllies = [1, 2, 3].map(index => ({
            id: `ally-${index}`,
            isAlly: true,
            countsTowardAllyLimit: true,
            controller: player,
            async discard() {
                player.gameZone.cards.splice(
                    player.gameZone.cards.indexOf(this),
                    1,
                );
            },
            toObj() {
                return {id: this.id};
            },
        }));
        player.gameZone.cards.push(...existingAllies);

        superhero.selectedSide = 0;
        assert.equal(await stingerCard.canPlay({
            gameCard: stinger,
            player,
        }), false);

        superhero.selectedSide = 1;
        assert.equal(await stingerCard.canPlay({
            gameCard: stinger,
            player,
        }), true);
        assert.deepEqual(dialogs, []);

        const putPlayEffect = new PutPlayEffect({
            card: stinger,
            controller: player,
            match,
        });
        await putPlayEffect.execute({player});

        assert.equal(stinger.countsTowardAllyLimit, false);
        assert.equal(player.allies.length, 4);
        assert.deepEqual(dialogs, []);

        const regularAllyCard = matchFactory.cardsFactory.createCard({
            type: CARD_TYPE_ALLY,
            params: {
                name: 'Aliado de prueba',
                set: CLASSIFICATION_LEADERSHIP,
                cost: 1,
                attack: 1,
                thwart: 1,
                hitPoints: 1,
            },
        });
        assert.equal(await regularAllyCard.canPlay({
            gameCard: matchFactory.cardsFactory.createGameCard({
                card: regularAllyCard,
                owner: player,
            }),
            player,
        }), true);
        assert.equal(dialogs.length, 1);
        assert.deepEqual(
            dialogs[0].data.cards.map(({id}) => id),
            ['ally-1', 'ally-2', 'ally-3'],
        );

        const regularAlly = matchFactory.cardsFactory.createGameCard({
            card: regularAllyCard,
            owner: player,
        });
        const regularAllyPutPlayEffect = new PutPlayEffect({
            card: regularAlly,
            controller: player,
            match,
        });
        const delayedEffects = [];
        const playCardEffect = {
            createDelayedEffect(effect) {
                delayedEffects.push(effect);
            },
        };
        await regularAllyPutPlayEffect.execute({
            effect: playCardEffect,
            player,
        });

        assert.equal(delayedEffects.length, 1);
        await delayedEffects[0].resolve({player});

        assert.equal(player.allies.includes(stinger), true);
        assert.equal(player.allies.length, 4);
        assert.equal(dialogs.length, 2);
        assert.deepEqual(
            dialogs[1].data.cards.map(({id}) => id),
            ['ally-1', 'ally-2', 'ally-3', regularAlly.id],
        );
    });
});
