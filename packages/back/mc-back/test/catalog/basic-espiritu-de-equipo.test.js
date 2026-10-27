import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_SUPPORT,
    CLASSIFICATION_BASIC,
    DIALOG_PAY_COST,
    EFFECT_EXHAUST,
    EFFECT_PLAY_CARD,
    PLACE_DISCARD_PILE,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_YOUR_HERO,
    TRAIT_AVENGER,
    TRAIT_TACTIC,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {HeroActionAbility} from '../../src/abilities/actions/hero-action-ability.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

describe('Espíritu de equipo', () => {
    test('is a basic support included three times in the Ant-Man precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const support = aspects.find(({_id}) =>
            _id === 'basic-espiritu-de-equipo');
        const antMan = heroes.find(({_id}) => _id === 'ant-man');

        assert.ok(support);
        assert.ok(antMan);
        assert.equal(support.classification, CLASSIFICATION_BASIC);
        assert.equal(support.card.type, CARD_TYPE_SUPPORT);
        assert.deepEqual(support.card.params, {
            name: 'Espíritu de equipo',
            set: CLASSIFICATION_BASIC,
            image: 'aspect/basic/supports/12024.png',
            cost: 2,
            resources: [RESOURCE_PHYSICAL],
            classification: CLASSIFICATION_BASIC,
            abilities: [
                {
                    type: ABILITY_HERO_ACTION,
                    params: {
                        arrow: {
                            type: EFFECT_EXHAUST,
                            params: {target: TARGET_THIS},
                        },
                        effect: {
                            type: EFFECT_PLAY_CARD,
                            params: {
                                target: TARGET_SOURCE,
                                source: 'player.hand.cards',
                                sharedTraitsWith: TARGET_YOUR_HERO,
                                costReduction: 1,
                            },
                        },
                    },
                },
            ],
        });

        const basicPrecon = antMan.config.precon.find(({classification}) =>
            classification === CLASSIFICATION_BASIC);
        assert.ok(basicPrecon);
        assert.ok(basicPrecon.cardRefs.some(({id, count}) =>
            id === support._id && count === 3));
    });

    test('plays one matching card immediately with a single cost reduction', async () => {
        const catalog = await loadCatalog();
        const antMan = catalog.heroes.find(({_id}) => _id === 'ant-man');
        const spiritConfig = catalog.aspects.find(({_id}) =>
            _id === 'basic-espiritu-de-equipo').card;
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'espiritu-de-equipo',
        });
        match.scenario = {
            villain: undefined,
            gameZone: {
                currentScheme: undefined,
                cards: [],
            },
        };
        const matchFactory = new MatchFactory(match);
        const {cardsFactory} = matchFactory;
        const superhero = matchFactory.createSuperhero({
            ...antMan.config,
            cards: [],
            precon: [],
        });
        superhero.selectedSide = 1;
        const player = match.createPlayer({
            name: 'Ant-Man',
            superhero,
            initial: true,
        });
        player.gameZone = new PlayerZone({owner: player});
        player.gameZone.refresh = async () => {};
        player.hand.refresh = async () => {};
        player.deck = {
            cards: [],
            discardPile: [],
            async discard(card) {
                this.discardPile.push(card);
            },
            async refresh() {},
        };

        const source = cardsFactory.createGameCardFromConfig(
            spiritConfig,
            {index: 1, owner: player},
        );
        const secondCopy = cardsFactory.createGameCardFromConfig(
            spiritConfig,
            {index: 2, owner: player},
        );
        [source, secondCopy].forEach(card => {
            card.controller = player;
            player.gameZone.addToGameZone(card);
        });

        const matchingCard = cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_SUPPORT,
            params: {
                name: 'Apoyo Vengador',
                set: CLASSIFICATION_BASIC,
                cost: 2,
                resources: [],
                classification: CLASSIFICATION_BASIC,
                traits: [TRAIT_AVENGER],
            },
        }, {index: 1, owner: player});
        const nonMatchingCard = cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_SUPPORT,
            params: {
                name: 'Apoyo Táctico',
                set: CLASSIFICATION_BASIC,
                cost: 2,
                resources: [],
                classification: CLASSIFICATION_BASIC,
                traits: [TRAIT_TACTIC],
            },
        }, {index: 1, owner: player});
        const resourceCard = cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name: 'Recurso Universal',
                set: CLASSIFICATION_BASIC,
                resources: [RESOURCE_WILD],
                classification: CLASSIFICATION_BASIC,
            },
        }, {index: 1, owner: player});
        player.hand.addCards([matchingCard, nonMatchingCard, resourceCard]);

        const paymentCosts = [];
        match.openDialog = async dialog => {
            assert.equal(dialog.dialogType, DIALOG_PAY_COST);
            paymentCosts.push(dialog.data.cost);
            const resource = dialog.data.cards.hand.find(({id}) =>
                id === resourceCard.id);
            assert.ok(resource);

            return {
                paid: {
                    generators: [],
                    hand: [resource],
                },
                resources: [RESOURCE_WILD],
            };
        };

        const ability = source.abilities[0];
        assert.ok(ability instanceof HeroActionAbility);
        assert.equal(ability.effect.effectType, EFFECT_PLAY_CARD);
        assert.equal(typeof ability.effect.canRun, 'function');
        assert.deepEqual(
            await ability.effect.getValidTarget({
                ability,
                card: source,
                match,
                player,
            }),
            [matchingCard],
        );

        superhero.selectedSide = 0;
        assert.equal(await ability.canRun({card: source, match, player}), false);
        superhero.selectedSide = 1;

        await player.resolveAbility(
            source.id,
            0,
            matchingCard.id,
        );

        assert.deepEqual(paymentCosts, [1]);
        assert.equal(source.exhausted, true);
        assert.equal(secondCopy.exhausted, false);
        assert.ok(player.gameZone.inPlayCards.includes(matchingCard));
        assert.equal(player.hand.cards.includes(matchingCard), false);
        assert.equal(player.hand.cards.includes(nonMatchingCard), true);
        assert.equal(player.hand.cards.includes(resourceCard), false);
        assert.ok(player.deck.discardPile.includes(resourceCard));
        assert.equal(ability.resolved, true);
        assert.equal(
            await secondCopy.abilities[0].canRun({
                card: secondCopy,
                match,
                player,
            }),
            false,
        );

        const discardCard = cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_SUPPORT,
            params: {
                name: 'Apoyo desde el descarte',
                set: CLASSIFICATION_BASIC,
                cost: 1,
                resources: [],
                classification: CLASSIFICATION_BASIC,
                traits: [TRAIT_AVENGER],
                playFrom: [PLACE_DISCARD_PILE],
            },
        }, {index: 1, owner: player});
        player.deck.discardPile.push(discardCard);
        secondCopy.abilities[0].effect.setConfigValue(
            'source',
            'player.deck.discardPile',
        );

        await player.resolveAbility(
            secondCopy.id,
            0,
            discardCard.id,
        );

        assert.ok(player.gameZone.inPlayCards.includes(discardCard));
        assert.equal(player.deck.discardPile.includes(discardCard), false);
        assert.equal(secondCopy.exhausted, true);
    });

    test('does not stay exhausted when the selected card payment is cancelled', async () => {
        const catalog = await loadCatalog();
        const antMan = catalog.heroes.find(({_id}) => _id === 'ant-man');
        const spiritConfig = catalog.aspects.find(({_id}) =>
            _id === 'basic-espiritu-de-equipo').card;
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'espiritu-de-equipo-cancelled-payment',
        });
        match.scenario = {
            villain: undefined,
            gameZone: {
                currentScheme: undefined,
                cards: [],
            },
        };
        const matchFactory = new MatchFactory(match);
        const {cardsFactory} = matchFactory;
        const superhero = matchFactory.createSuperhero({
            ...antMan.config,
            cards: [],
            precon: [],
        });
        superhero.selectedSide = 1;
        const player = match.createPlayer({
            name: 'Ant-Man',
            superhero,
            initial: true,
        });
        player.gameZone = new PlayerZone({owner: player});
        player.gameZone.refresh = async () => {};
        player.hand.refresh = async () => {};
        player.deck = {
            cards: [],
            discardPile: [],
            async discard(card) {
                this.discardPile.push(card);
            },
            async refresh() {},
        };

        const source = cardsFactory.createGameCardFromConfig(
            spiritConfig,
            {index: 1, owner: player},
        );
        source.controller = player;
        player.gameZone.addToGameZone(source);

        const cardToPlay = cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_SUPPORT,
            params: {
                name: 'Apoyo Vengador',
                set: CLASSIFICATION_BASIC,
                cost: 2,
                resources: [],
                classification: CLASSIFICATION_BASIC,
                traits: [TRAIT_AVENGER],
            },
        }, {index: 1, owner: player});
        const resourceCard = cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name: 'Recurso Universal',
                set: CLASSIFICATION_BASIC,
                resources: [RESOURCE_WILD],
                classification: CLASSIFICATION_BASIC,
            },
        }, {index: 1, owner: player});
        player.hand.addCards([cardToPlay, resourceCard]);

        let paymentDialogCount = 0;
        match.openDialog = async dialog => {
            assert.equal(dialog.dialogType, DIALOG_PAY_COST);
            paymentDialogCount++;

            return undefined;
        };

        await player.resolveAbility(source.id, 0, cardToPlay.id);

        assert.equal(paymentDialogCount, 1);
        assert.equal(source.exhausted, false);
        assert.equal(source.abilities[0].paymentCancelled, true);
        assert.equal(source.abilities[0].resolved, false);
        assert.equal(cardToPlay.isPlaying, false);
        assert.ok(player.hand.cards.includes(cardToPlay));
        assert.ok(player.hand.cards.includes(resourceCard));
        assert.equal(player.gameZone.inPlayCards.includes(cardToPlay), false);
    });

    test('stacks its reduction with Helitransporte lasting cost reduction', async () => {
        const catalog = await loadCatalog();
        const antMan = catalog.heroes.find(({_id}) => _id === 'ant-man');
        const spiritConfig = catalog.aspects.find(({_id}) =>
            _id === 'basic-espiritu-de-equipo').card;
        const helicarrierConfig = catalog.aspects.find(({_id}) =>
            _id === 'basic-helicarrier').card;
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'espiritu-helicarrier-discount',
        });
        match.scenario = {
            villain: undefined,
            gameZone: {
                currentScheme: undefined,
                cards: [],
            },
        };
        const matchFactory = new MatchFactory(match);
        const {cardsFactory} = matchFactory;
        const superhero = matchFactory.createSuperhero({
            ...antMan.config,
            cards: [],
            precon: [],
        });
        superhero.selectedSide = 1;
        const player = match.createPlayer({
            name: 'Ant-Man',
            superhero,
            initial: true,
        });
        player.gameZone = new PlayerZone({owner: player});
        player.gameZone.refresh = async () => {};
        player.hand.refresh = async () => {};
        player.deck = {
            cards: [],
            discardPile: [],
            async discard(card) {
                this.discardPile.push(card);
            },
            async refresh() {},
        };

        const helicarrier = cardsFactory.createGameCardFromConfig(
            helicarrierConfig,
            {index: 1, owner: player},
        );
        const spirit = cardsFactory.createGameCardFromConfig(
            spiritConfig,
            {index: 1, owner: player},
        );
        [helicarrier, spirit].forEach(card => {
            card.controller = player;
            player.gameZone.addToGameZone(card);
        });

        const matchingCard = cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_SUPPORT,
            params: {
                name: 'Apoyo Vengador de coste 3',
                set: CLASSIFICATION_BASIC,
                cost: 3,
                resources: [],
                classification: CLASSIFICATION_BASIC,
                traits: [TRAIT_AVENGER],
            },
        }, {index: 1, owner: player});
        const resourceCard = cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name: 'Recurso Universal',
                set: CLASSIFICATION_BASIC,
                resources: [RESOURCE_WILD],
                classification: CLASSIFICATION_BASIC,
            },
        }, {index: 1, owner: player});
        player.hand.addCards([matchingCard, resourceCard]);

        const paymentCosts = [];
        match.openDialog = async dialog => {
            assert.equal(dialog.dialogType, DIALOG_PAY_COST);
            paymentCosts.push(dialog.data.cost);
            const resource = dialog.data.cards.hand.find(({id}) =>
                id === resourceCard.id);
            assert.ok(resource);

            return {
                paid: {
                    generators: [],
                    hand: [resource],
                },
                resources: [RESOURCE_WILD],
            };
        };

        await player.resolveAbility(helicarrier.id, 0);

        assert.equal(helicarrier.exhausted, true);
        assert.equal(match.lasting.length, 1);

        await player.resolveAbility(spirit.id, 0, matchingCard.id);

        assert.deepEqual(paymentCosts, [1]);
        assert.equal(spirit.exhausted, true);
        assert.ok(player.gameZone.inPlayCards.includes(matchingCard));
    });
});
