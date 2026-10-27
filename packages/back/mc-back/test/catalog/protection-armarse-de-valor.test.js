import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CARD_TYPE_EVENT,
    CLASSIFICATION_PROTECTION,
    EFFECT_TOUGH,
    RESOURCE_PHYSICAL,
    TARGET_FRIENDLY_CHARACTER,
    TRAIT_AVENGER,
} from 'mc-shared';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {ToughEffect} from '../../src/effects/tough-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {PlayerCard} from '../../src/model/printed/player-card.js';

describe('Armarse de valor', () => {
    const createCharacter = (index, tough = 0) => ({
        id: `friendly-${index}`,
        name: `Personaje amigo ${index}`,
        tough,
        get isTough() {
            return this.tough > 0;
        },
        abilities: [],
        setTough() {
            this.tough++;
        },
        async refresh() {},
        toObj() {
            return {id: this.id, name: this.name};
        },
    });

    const createMatch = (stage, selectedCount, friends) => {
        const match = {
            currentRound: 1,
            dialogs: [],
            inPlayCards: [],
            lasting: [],
            limits: {},
            players: [],
            scenario: {},
            triggerCards: {},
            villain: {stage},
            numPlayers: 1,
            async openDialog(dialog) {
                this.dialogs.push(dialog);

                return {
                    selected: dialog.data.cards.slice(
                        0,
                        Math.min(selectedCount, dialog.data.count)
                    ),
                };
            },
        };
        const player = {
            isHero: true,
            isPlayer: true,
            match,
            friends,
            superhero: {traits: [TRAIT_AVENGER]},
            hand: {cards: []},
        };
        match.players.push(player);
        const matchFactory = new MatchFactory(match);

        return {match, matchFactory, player};
    };

    test('is a shared Protection event restricted to Avengers, not a hero or precon card', async () => {
        const catalog = await loadCatalog();
        const definition = catalog.aspects.find(({_id}) =>
            _id === 'protection-armarse-de-valor');

        assert.ok(definition);
        assert.equal(definition.aspect, CLASSIFICATION_PROTECTION);
        assert.equal(definition.card.type, CARD_TYPE_EVENT);
        assert.equal(definition.card.params.name, 'Armarse de valor');
        assert.equal(definition.card.params.set, CLASSIFICATION_PROTECTION);
        assert.equal(
            definition.card.params.image,
            'aspect/protection/events/12032.png'
        );
        assert.equal(definition.card.params.cost, 3);
        assert.deepEqual(
            definition.card.params.resources,
            [RESOURCE_PHYSICAL]
        );
        assert.equal(
            definition.card.params.classification,
            CLASSIFICATION_PROTECTION
        );
        assert.deepEqual(definition.card.params.paramsToPlay, {
            'superhero.traits': TRAIT_AVENGER,
        });

        const [abilityConfig] = definition.card.params.abilities;
        assert.equal(abilityConfig.type, ABILITY_HERO_ACTION);
        assert.deepEqual(abilityConfig.params.effect, {
            type: EFFECT_TOUGH,
            params: {
                target: TARGET_FRIENDLY_CHARACTER,
                multipleTarget: true,
                selectUpTo: true,
                targetCountCalc: {
                    target: 'match.villain.stage',
                    max: 3,
                },
            },
        });

        const preconIds = catalog.heroes.flatMap(({config}) =>
            (config.precon ?? []).flatMap(({cardRefs = []}) =>
                cardRefs.map(({id}) => id)
            )
        );
        const heroCardNames = catalog.heroes.flatMap(({config}) =>
            (config.cards ?? []).map(({card}) => card.params.name)
        );
        assert.equal(preconIds.includes(definition._id), false);
        assert.equal(heroCardNames.includes('Armarse de valor'), false);

        const player = {
            hand: {cards: []},
            superhero: {traits: [TRAIT_AVENGER]},
        };
        const matchFactory = new MatchFactory({
            triggerCards: {},
            isUniqueCard: () => false,
        });
        const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player}
        );
        player.hand.cards.push(gameCard);

        assert.equal(
            PlayerCard.prototype.canPlay.call(gameCard.card, {gameCard, player}),
            true
        );
        player.superhero.traits = [];
        assert.equal(
            PlayerCard.prototype.canPlay.call(gameCard.card, {gameCard, player}),
            false
        );
        const [ability] = gameCard.abilities;
        assert.ok(ability.effect instanceof ToughEffect);
        assert.equal(typeof ability.effect.canRun, 'function');
    });

    test('selects up to the Villain stage, capped at three, and permits choosing fewer', async () => {
        const {aspects} = await loadCatalog();
        const cardConfig = aspects.find(({_id}) =>
            _id === 'protection-armarse-de-valor').card;

        for (const {stage, selectedCount, expectedMaximum} of [
            {stage: 1, selectedCount: 1, expectedMaximum: 1},
            {stage: 2, selectedCount: 1, expectedMaximum: 2},
            {stage: 4, selectedCount: 3, expectedMaximum: 3},
            {stage: 2, selectedCount: 0, expectedMaximum: 2},
        ]) {
            const friends = Array.from({length: 4}, (_, index) =>
                createCharacter(index + 1)
            );
            const {match, matchFactory, player} = createMatch(
                stage,
                selectedCount,
                friends
            );
            const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(
                cardConfig,
                {owner: player}
            );
            const [ability] = gameCard.abilities;
            const effect = ability.effect;
            const params = {card: gameCard, match, player};

            assert.ok(effect instanceof ToughEffect);
            assert.equal(await effect.canRun(params), true);
            await effect.runEffect(params);

            const [dialog] = match.dialogs;
            assert.equal(dialog.data.count, expectedMaximum);
            assert.equal(dialog.data.minCount, 0);
            assert.equal(dialog.data.upTo, true);
            assert.equal(
                friends.filter(({tough}) => tough > 0).length,
                selectedCount
            );
        }
    });

    test('resolves with zero targets when no friendly character can receive Tough', async () => {
        const {aspects} = await loadCatalog();
        const cardConfig = aspects.find(({_id}) =>
            _id === 'protection-armarse-de-valor').card;
        const friends = [createCharacter(1, 1)];
        const {match, matchFactory, player} = createMatch(2, 0, friends);
        const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(
            cardConfig,
            {owner: player}
        );
        const [ability] = gameCard.abilities;
        const effect = ability.effect;
        const params = {card: gameCard, match, player};

        assert.equal(await effect.canRun(params), true);
        await effect.runEffect(params);

        assert.equal(match.dialogs.length, 0);
        assert.equal(friends[0].tough, 1);
    });
});
