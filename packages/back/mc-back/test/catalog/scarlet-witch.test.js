import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_HERO,
    CALC_ALL,
    DIALOG_LIST,
    DIALOG_REVEAL_CARDS,
    DIALOG_SELECT_TARGET,
    DIALOG_USE_CARD,
    EFFECT_CONFUSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_STUN,
    EFFECT_TAKE_DAMAGE,
    EFFECT_TOUGH,
    EFFECT_COUNT_BOOST_ICONS,
    EFFECT_COUNT_BOOST_ICONS_BATCH,
    EFFECT_RESOLVE_CARDS_IN_ORDER,
    TARGET_CHARACTER,
    TARGET_ENEMY,
    TARGET_FRIENDLY_CHARACTER,
    TARGET_PARENT,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {ChooseEffect} from '../../src/effects/choose-effect.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Deck} from '../../src/model/match/deck.js';
import {Match} from '../../src/model/match/match.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {SelectAndOrderTopCardsEffect} from '../../src/effects/select-and-order-top-cards-effect.js';
import {CharacterWouldTakeDamageTrigger} from '../../src/triggers/character-would-take-damage-trigger.js';

describe('Bruja Escarlata', () => {
    test('catalog data, precon, and boost-counting effect shapes are consistent', async () => {
        const catalog = await loadCatalog();
        const scarletWitch = catalog.heroes.find(({_id}) =>
            _id === 'scarlet-witch');

        assert.ok(scarletWitch);
        assert.deepEqual(scarletWitch.config.sides.map(({type, params}) => [
            type,
            params.name,
            params.hitPoints,
            params.handSize,
        ]), [
            ['alter-ego', 'Wanda Maximoff', 10, 6],
            [CARD_TYPE_HERO, 'Bruja Escarlata', 10, 5],
        ]);
        assert.equal(scarletWitch.config.cards.length, 8);
        assert.equal(scarletWitch.config.cards.reduce(
            (total, {count}) => total + count,
            0
        ), 15);
        scarletWitch.config.cards.forEach(cardEntry => {
            assert.deepEqual(
                Object.keys(cardEntry).sort(),
                ['card', 'count']
            );
        });

        const preconRefs = scarletWitch.config.precon.flatMap(({cardRefs}) =>
            cardRefs.map(({id, count}) => [id, count]));
        assert.deepEqual(preconRefs.sort(([left], [right]) =>
            left.localeCompare(right)), [
            ['basic-energy', 1],
            ['basic-genius', 1],
            ['basic-meditacion-espiritual', 3],
            ['basic-orden-y-caos', 1],
            ['basic-strength', 1],
            ['justice-cambiar-la-situacion', 3],
            ['justice-castigo-inmediato', 3],
            ['justice-crisis-resuelta', 3],
            ['justice-intuicion-heroica', 2],
            ['justice-multitarea', 3],
            ['justice-the-power-of-justice', 2],
            ['justice-veloz', 1],
            ['justice-wiccan', 1],
        ]);
        assert.equal(preconRefs.reduce((total, [, count]) =>
            total + count, 0), 25);

        const checkEffects = value => {
            if (!value || typeof value !== 'object') {
                return;
            }
            if (value.type === EFFECT_COUNT_BOOST_ICONS) {
                assert.equal(typeof value.params?.card, 'string');
                assert.equal(Object.hasOwn(value.params, 'cards'), false);
            }
            if (value.type === EFFECT_COUNT_BOOST_ICONS_BATCH) {
                assert.equal(typeof value.params?.cards, 'string');
                assert.equal(Object.hasOwn(value.params, 'card'), false);
            }
            if (value.type === EFFECT_RESOLVE_CARDS_IN_ORDER) {
                assert.equal(typeof value.params?.cards, 'string');
                assert.equal(
                    value.params?.effectDefinition?.type,
                    EFFECT_COUNT_BOOST_ICONS
                );
                assert.equal(
                    value.params.effectDefinition.params.card,
                    'card'
                );
            }
            Object.values(value).forEach(checkEffects);
        };
        checkEffects(scarletWitch.config);

        const superhero = new MatchFactory({triggerCards: {}})
            .createSuperhero({...scarletWitch.config, precon: []});
        for (const ability of [
            ...superhero.sides.flatMap(side => side.abilities),
            ...superhero.cards.flatMap(card => card.abilities),
        ]) {
            if (ability.effect) {
                assert.equal(typeof ability.effect.canRun, 'function');
            }
        }

        const getCard = name => scarletWitch.config.cards.find(({card}) =>
            card.params.name === name).card;
        const hex = getCard('Maleficio');
        const hexEffects = hex.params.abilities[0].params.effect.params.effects;
        assert.equal(hexEffects[0].type, EFFECT_DISCARD_FROM_DECK);
        assert.equal(hexEffects[0].params.showDialog, false);
        assert.equal(hexEffects[1].type, EFFECT_RESOLVE_CARDS_IN_ORDER);
        assert.equal(hexEffects[1].params.showSingleCardDialog, true);
        const getBatchCountConfig = cardName => getCard(cardName)
            .params.abilities[0].params.effect.params.effects
            .find(({type}) => type === EFFECT_RESOLVE_CARDS_IN_ORDER)
            .params.effectDefinition.params;
        assert.equal(getBatchCountConfig('Maleficio').showDialog, false);
        const molecularResolution = getCard('Descomposición molecular')
            .params.abilities[0].params.effect.params.effects
            .find(({type}) => type === EFFECT_COUNT_BOOST_ICONS_BATCH);
        assert.equal(molecularResolution.params.cards, 'effects.0.cards');
        assert.equal(molecularResolution.params.showDialog, true);
        assert.equal(
            getCard('Descomposición molecular')
                .params.abilities[0].params.effect.params.effects[0]
                .params.showDialog,
            false
        );
        assert.match(
            molecularResolution.params.interactionInstructions,
            /Haz clic en una carta/
        );
        const witchSide = scarletWitch.config.sides.find(({params}) =>
            params.name === 'Bruja Escarlata');
        const chaosCountConfig = witchSide.params.abilities.find(({params}) =>
            params.name === 'Control del caos')
            .params.effect.params.effects[2].params;
        const chaosModifyConfig = witchSide.params.abilities.find(({params}) =>
            params.name === 'Control del caos')
            .params.effect.params.effects[3].params;
        assert.equal(
            witchSide.params.abilities.find(({params}) =>
                params.name === 'Control del caos')
                .params.effect.params.showSingleTargetDialog,
            undefined
        );
        assert.equal(chaosCountConfig.showDialog, false);
        assert.equal(
            chaosModifyConfig.countedCard,
            'effects.1.cards.0'
        );
        assert.equal(
            witchSide.params.abilities.find(({params}) =>
                params.name === 'Control del caos')
                .params.effect.params.effects[0].params.replaceCount,
            true
        );
        const tiara = getCard('Tiara de la Bruja Escarlata');
        const tiaraChoice = tiara.params.abilities[0]
            .params.effect.params.effects[0].params;
        assert.equal(tiaraChoice.showCancel, true);
        assert.equal(tiaraChoice.showSingleTargetDialog, undefined);
        assert.deepEqual(tiaraChoice.contextCards, [
            {
                card: 'effects.0.selectedTarget',
                label: 'Carta cuyo Aumento se modifica',
            },
        ]);
        const statusTargets = [];
        const visitedValues = new Set();
        const collectStatusTargets = value => {
            if (!value || typeof value !== 'object' ||
                visitedValues.has(value)) {
                return;
            }
            visitedValues.add(value);
            if ([EFFECT_STUN, EFFECT_CONFUSE, EFFECT_TOUGH].includes(value.type)) {
                statusTargets.push(value.params.target);
            }
            Object.values(value).forEach(collectStatusTargets);
        };
        collectStatusTargets(hex);
        assert.deepEqual(statusTargets, [
            TARGET_CHARACTER,
            TARGET_CHARACTER,
            TARGET_CHARACTER,
        ]);

        const shield = getCard('Escudo mágico').params.abilities[0].params;
        assert.deepEqual(shield.triggerParams, {
            target: TARGET_FRIENDLY_CHARACTER,
        });

        const agatha = getCard('Agatha Harkness').params.abilities[0]
            .params.effect.params;
        assert.match(
            agatha.selectionInstructions,
            /más a la derecha.*fondo del mazo/i
        );
    });

    test('Tiara dialog shows only Tiara and the selected encounter card', async () => {
        const catalog = await loadCatalog();
        const scarletWitch = catalog.heroes.find(({_id}) =>
            _id === 'scarlet-witch');
        const tiara = scarletWitch.config.cards.find(({card}) =>
            card.params.name === 'Tiara de la Bruja Escarlata').card;
        const contextCards = tiara.params.abilities[0]
            .params.effect.params.effects[0].params.contextCards;
        const tiaraCard = {
            toObj() {
                return {id: 'tiara', name: 'Tiara de la Bruja Escarlata'};
            },
        };
        const countedCard = {
            toObj() {
                return {
                    id: 'replacement-card',
                    image: 'replacement.png',
                    name: 'Carta de reemplazo',
                };
            },
        };
        const dialogs = [];
        const match = {
            async openDialog(dialog) {
                dialogs.push(dialog);
                return {selected: {id: 0}};
            },
        };
        const createOption = title => ({
            async canRun() {
                return true;
            },
            getTitle() {
                return title;
            },
            async runEffect() {},
        });
        const effect = new ChooseEffect({
            contextCards,
            match,
            options: [
                createOption('Incrementa en 1 los iconos de Aumento'),
                createOption('Reduce en 1 los iconos de Aumento'),
            ],
            showCancel: true,
        });
        effect.selectedTarget = {
            toObj: () => countedCard.toObj(),
        };
        effect.ability = {card: tiaraCard};

        await effect.execute({
            effects: [effect],
            effect: {boostValue: 2},
            player: {
                hand: {cards: []},
                id: 'player',
            },
        });

        assert.equal(dialogs[0].dialogType, DIALOG_LIST);
        assert.equal(dialogs[0].showCancel, true);
        assert.deepEqual(
            dialogs[0].data.contextCards.map(({card, label}) => [
                label,
                card.id,
            ]),
            [
                ['Carta cuyo Aumento se modifica', 'replacement-card'],
            ]
        );
        assert.equal(dialogs[0].data.card.id, 'tiara');
    });

    test('cancelling the Tiara choice returns its exhaust cost', async () => {
        const catalog = await loadCatalog();
        const scarletWitch = catalog.heroes.find(({_id}) =>
            _id === 'scarlet-witch');
        const dialogs = [];
        const exhaustionAtDialog = [];
        const match = {
            mc: {mcSocket: {send() {}}},
            name: 'test-match',
            triggerCards: {},
            sourceCard: undefined,
            async openDialog(dialog) {
                dialogs.push(dialog);
                exhaustionAtDialog.push(this.sourceCard.exhausted);
            },
        };
        const superhero = new MatchFactory(match)
            .createSuperhero({...scarletWitch.config, precon: []});
        const tiara = superhero.cards.find(({name}) =>
            name === 'Tiara de la Bruja Escarlata');
        const player = {
            hand: {cards: []},
            id: 'player',
            isPlayer: true,
            name: 'Wanda',
        };
        tiara.controller = player;
        match.sourceCard = tiara;

        const countWindow = {
            boostValue: 1,
            card: {
                toObj() {
                    return {
                        id: 'encounter-card',
                        image: 'encounter.png',
                        name: 'Carta de Encuentro',
                    };
                },
            },
            countReplaced: false,
            id: 'count-window',
            toObj(params) {
                return {
                    ...this.card.toObj(params),
                    boost: this.boostValue,
                    id: this.id,
                };
            },
            toTargetObj(params) {
                return this.toObj(params);
            },
        };

        await tiara.abilities[0].resolveAbility({
            card: tiara,
            match,
            player,
            triggeredEffect: {boostCountWindows: [countWindow]},
        });

        assert.equal(dialogs.length, 1);
        assert.equal(dialogs[0].showCancel, true);
        assert.deepEqual(exhaustionAtDialog, [true]);
        assert.equal(tiara.exhausted, false);
        assert.equal(tiara.abilities[0].paymentCancelled, true);
        assert.equal(tiara.abilities[0].resolved, false);
        assert.equal(countWindow.boostValue, 1);
    });

    test('playing Molecular Decomposition through Chaos Magic shows both discards in order', async () => {
        const catalog = await loadCatalog();
        const scarletWitch = catalog.heroes.find(({_id}) =>
            _id === 'scarlet-witch');
        const events = [];
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'scarlet-witch-chaos-magic-discard-order',
        });
        const factory = new MatchFactory(match);
        const superhero = factory.createSuperhero({
            ...scarletWitch.config,
            precon: [],
        });
        superhero.selectedSide = 1;
        const player = match.createPlayer({
            initial: true,
            name: 'Wanda',
            superhero,
        });
        player.initPlayer();

        const enemy = {
            damage: 0,
            hitPoints: 99,
            id: 'enemy',
            isCharacter: true,
            isEnemy: true,
            isInPlay: true,
            name: 'Enemigo de prueba',
            async getLife() {
                return this.hitPoints - this.damage;
            },
            canBeAttacked() {
                return true;
            },
            async refresh() {},
            toObj() {
                return {id: this.id, name: this.name};
            },
            toTargetObj() {
                return this.toObj();
            },
            async placeDamage(amount) {
                events.push({damage: amount, type: 'damage'});
                this.damage += amount;
            },
        };
        const scenario = {
            accelerationIcons: 0,
            accelerationTokens: 0,
            gameZone: {
                cards: [enemy],
                inPlayCards: [enemy],
                players: [player],
            },
            match,
            minions: [],
            schemes: [],
            sideSchemes: [],
            villain: enemy,
        };
        const encounterDeck = new Deck({
            isScenarioDeck: true,
            owner: scenario,
        });
        scenario.deck = encounterDeck;
        match.scenario = scenario;
        const encounterCards = Array.from({length: 7}, (_, index) => ({
            boost: index < 2 ? index + 1 : 0,
            id: `encounter-${index + 1}`,
            image: `encounter-${index + 1}.png`,
            name: `Carta de Encuentro ${index + 1}`,
            toObj() {
                return {
                    boost: this.boost,
                    id: this.id,
                    image: this.image,
                    name: this.name,
                };
            },
        }));
        encounterDeck.cards = encounterCards;
        await superhero.initTriggers({player});
        const chaosMagic = player.deck.cards.find(({name}) =>
            name === 'Magia del caos');
        const decompositions = player.deck.cards.filter(({name}) =>
            name === 'Descomposición molecular').slice(0, 2);
        const cardsToPlay = [chaosMagic, ...decompositions];
        player.deck.cards = player.deck.cards.filter(card =>
            !cardsToPlay.includes(card));
        player.hand.addCards(cardsToPlay);

        const discardPlayerCard = player.deck.discard.bind(player.deck);
        player.deck.discard = async card => {
            events.push({
                card: card.name,
                type: 'player-card-discard',
            });
            await discardPlayerCard(card);
        };
        const discardEncounterCards = encounterDeck.discardTopCards
            .bind(encounterDeck);
        encounterDeck.discardTopCards = async count => {
            events.push({count, type: 'encounter-discard'});

            return discardEncounterCards(count);
        };
        match.openDialog = async dialog => {
            const cards = dialog.data?.cards?.map(({id}) => id) ?? [];
            events.push({
                cards,
                dialogType: dialog.dialogType,
                subtitle: dialog.subtitle,
                title: dialog.title,
                selectable: dialog.data?.selectable,
                type: 'dialog',
            });

            if (dialog.dialogType === DIALOG_SELECT_TARGET ||
                dialog.dialogType === DIALOG_USE_CARD) {
                return {selected: dialog.data.cards[0]};
            }
            if (dialog.dialogType === DIALOG_REVEAL_CARDS &&
                dialog.data?.selectable) {
                return {selected: dialog.data.cards[0]};
            }

            return undefined;
        };

        const playChaosMagic = new PlayCardEffect({
            abilityType: 'action',
            card: chaosMagic,
            match,
        });
        await playChaosMagic.runEffect({card: chaosMagic, match, player});

        const decompositionIndex = events.findIndex(event =>
            event.type === 'dialog' &&
            event.dialogType === DIALOG_REVEAL_CARDS &&
            event.subtitle?.includes('Descomposición molecular'));
        const damageIndex = events.findIndex(event =>
            event.type === 'damage');
        const decompositionDiscardIndex = events.findIndex(event =>
            event.type === 'player-card-discard' &&
            event.card === 'Descomposición molecular');
        const chaosDiscardDialogIndex = events.findIndex(event =>
            event.type === 'dialog' &&
            event.dialogType === DIALOG_REVEAL_CARDS &&
            event.subtitle?.includes('Magia del caos'));
        const chaosDiscardIndex = events.findIndex(event =>
            event.type === 'player-card-discard' &&
            event.card === 'Magia del caos');
        const revealedBatches = events
            .filter(event => event.dialogType === DIALOG_REVEAL_CARDS)
            .map(({cards}) => cards);

        assert.ok(decompositionIndex >= 0, JSON.stringify(events));
        assert.equal(events.some(event =>
            event.type === 'dialog' &&
            event.dialogType === DIALOG_SELECT_TARGET &&
            event.cards.some(id => [
                'encounter-1',
                'encounter-2',
            ].includes(id))), false);
        assert.equal(events.some(event =>
            event.type === 'dialog' &&
            event.dialogType === DIALOG_SELECT_TARGET &&
            event.cards.includes('scenario-deck')), false);
        assert.ok(events.some(event =>
            event.type === 'dialog' &&
            event.dialogType === DIALOG_USE_CARD));
        assert.ok(damageIndex > decompositionIndex);
        assert.ok(decompositionDiscardIndex > damageIndex);
        assert.ok(chaosDiscardDialogIndex > decompositionDiscardIndex);
        assert.ok(chaosDiscardIndex > chaosDiscardDialogIndex);
        assert.deepEqual(events[decompositionIndex].cards, [
            'encounter-1',
            'encounter-2',
        ]);
        assert.deepEqual(events[chaosDiscardDialogIndex].cards, [
            'encounter-4',
            'encounter-5',
            'encounter-6',
        ]);
        assert.deepEqual(revealedBatches, [
            ['encounter-1', 'encounter-2'],
            ['encounter-3'],
            ['encounter-4', 'encounter-5', 'encounter-6'],
        ]);
        assert.equal(events[decompositionIndex].selectable, true);
        assert.match(events[decompositionIndex].subtitle, /Haz clic en una carta/);
        assert.equal(events[chaosDiscardDialogIndex].selectable, undefined);
        assert.doesNotMatch(events[chaosDiscardDialogIndex].subtitle, /interrumpir/i);
        assert.equal(events[damageIndex].damage, 7);
        assert.deepEqual(events.filter(event =>
            event.type === 'encounter-discard').map(({count}) => count), [
            2,
            1,
            3,
        ]);
    });

    test('Magic Shield responds to damage to any friendly character, not enemies', async () => {
        const friendlyCharacter = {
            id: 'friendly',
            isCharacter: true,
            isEnemy: false,
        };
        const enemy = {
            id: 'enemy',
            isCharacter: true,
            isEnemy: true,
        };
        const player = {
            isPlayer: true,
            friends: [friendlyCharacter],
        };
        const trigger = new CharacterWouldTakeDamageTrigger({
            card: {controller: player},
            ability: {canTrigger: async () => true},
            target: TARGET_FRIENDLY_CHARACTER,
        });
        const match = {characters: [friendlyCharacter, enemy]};
        const damageContext = character => ({
            effect: {
                selectedTarget: character,
                takenDamage: 1,
            },
            match,
            player,
        });

        assert.equal(
            await trigger.canTrigger(damageContext(friendlyCharacter)),
            true
        );
        assert.ok(!(await trigger.canTrigger(damageContext(enemy))));
    });

    test('Agatha does not keep bottomed cards visible in the deck eye', async () => {
        const catalog = await loadCatalog();
        const scarletWitch = catalog.heroes.find(({_id}) =>
            _id === 'scarlet-witch');
        const agatha = scarletWitch.config.cards.find(({card}) =>
            card.params.name === 'Agatha Harkness').card;
        const effectConfig = agatha.params.abilities[0].params.effect;
        const cards = ['first', 'second', 'third'].map(id => ({
            id,
            toObj: () => ({id}),
        }));
        const deck = new Deck({
            owner: {name: 'Wanda'},
            isPlayerDeck: true,
        });
        deck.cards = cards.slice();
        deck.markKnown(cards);
        deck.refresh = async () => {};
        let dialog;
        const match = {
            skipDiscardOrderDialog: false,
            async openDialog(options) {
                dialog = options;
                return {
                    discarded: [{id: 'first'}],
                    selected: [{id: 'second'}, {id: 'third'}],
                };
            },
        };
        const effect = new SelectAndOrderTopCardsEffect({
            ...effectConfig.params,
            match,
            selectedTarget: deck,
        });
        effect.openDialog = options => match.openDialog(options);

        await effect.execute({
            player: {
                hand: {
                    addCard() {},
                    async refresh() {},
                },
            },
        });

        assert.equal(Object.hasOwn(dialog, 'subtitle'), false);
        assert.equal(
            dialog.data.selectionInstructions,
            effectConfig.params.selectionInstructions
        );
        assert.deepEqual(deck.cards, [cards[1], cards[2]]);
        assert.deepEqual(deck.knownCards, []);
        assert.deepEqual(deck.toObj().knownCards, []);
    });

    test('Molecular Decomposition applies its additional damage to the defeated stage', async () => {
        const catalog = await loadCatalog();
        const scarletWitch = catalog.heroes.find(({_id}) =>
            _id === 'scarlet-witch');
        const molecularDecomposition = scarletWitch.config.cards.find(({card}) =>
            card.params.name === 'Descomposición molecular').card;
        const effectConfigs = molecularDecomposition.params.abilities[0]
            .params.effect.params.effects;
        const damageConfigs = effectConfigs.filter(({type}) =>
            type === EFFECT_DEAL_DAMAGE);

        assert.equal(damageConfigs.length, 1);
        assert.equal(
            molecularDecomposition.params.abilities[0].params.effect.params.target,
            TARGET_ENEMY
        );
        const damageConfig = damageConfigs[0];
        assert.equal(damageConfig.params.target, TARGET_PARENT);
        assert.equal(damageConfig.params.damage, 5);
        const cardResolutionConfig = effectConfigs.find(({type}) =>
            type === EFFECT_COUNT_BOOST_ICONS_BATCH);
        assert.equal(
            cardResolutionConfig.params.cards,
            'effects.0.cards'
        );
        assert.deepEqual(damageConfig.params.additionalDamageCalc, {
            target: 'effects.1.value',
            formula: CALC_ALL,
        });

        const firstStage = {
            damage: 0,
            hitPoints: 5,
            isCharacter: true,
            isEnemy: true,
            isInPlay: true,
            isVillain: true,
        };
        const nextStage = {
            damage: 0,
            hitPoints: 9,
            isCharacter: true,
            isEnemy: true,
            isInPlay: false,
            isVillain: true,
        };
        const damageApplications = [];
        const match = {
            villain: firstStage,
            effectsFactory: {
                createEffect({type, selectedTarget, damage}) {
                    assert.equal(type, EFFECT_TAKE_DAMAGE);
                    damageApplications.push({damage, selectedTarget});

                    return {
                        defeated: false,
                        takenDamage: damage,
                        async runEffect() {
                            selectedTarget.damage += damage;
                            if (selectedTarget.damage >= selectedTarget.hitPoints) {
                                selectedTarget.isInPlay = false;
                                nextStage.isInPlay = true;
                                match.villain = nextStage;
                                this.defeated = true;
                            }
                        },
                    };
                },
            },
        };
        const damageEffect = new DealDamageEffect({
            ...damageConfig.params,
            activation: {getOverkill: () => false},
            match,
            selectedTarget: firstStage,
        });
        const params = {
            effects: [{}, {value: 2}],
            match,
            player: {},
        };

        await damageEffect.prepare(params);
        await damageEffect.execute(params);

        assert.equal(damageApplications.length, 1);
        assert.equal(damageApplications[0].selectedTarget, firstStage);
        assert.equal(damageApplications[0].damage, 7);
        assert.equal(firstStage.damage, 7);
        assert.equal(match.villain, nextStage);
        assert.equal(nextStage.damage, 0);
    });
});
