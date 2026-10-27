import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CARD_TYPE_ALLY,
    CARD_TYPE_EVENT,
    CLASSIFICATION_LEADERSHIP,
    DIALOG_REVEAL_CARDS,
    EFFECT_DISCARD_UNTIL,
    EFFECT_MOVE_TO_HAND,
    RESOURCE_PHYSICAL,
    TARGET_SOURCE,
    TARGET_YOU,
    TRAIT_AVENGER,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {HeroActionAbility} from '../../src/abilities/actions/hero-action-ability.js';
import {DiscardUntilEffect} from '../../src/effects/discard-until-effect.js';
import {MoveToHandEffect} from '../../src/effects/move-to-hand-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {Deck} from '../../src/model/match/deck.js';

describe('Pedir ayuda', () => {
    const createContext = async () => {
        const {aspects, heroes} = await loadCatalog();
        const definition = aspects.find(({_id}) =>
            _id === 'leadership-pedir-ayuda');
        const antMan = heroes.find(({_id}) => _id === 'ant-man');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'leadership-pedir-ayuda',
        });
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
        player.hand.refresh = async () => {};
        player.deck = new Deck({owner: player, isPlayerDeck: true});
        player.deck.refresh = async () => {};
        const event = matchFactory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player},
        );

        return {antMan, definition, event, match, matchFactory, player};
    };

    test('registers three copies in the Ant-Man precon with its printed cost and resource', async () => {
        const {antMan, definition, event} = await createContext();

        assert.ok(antMan);
        assert.ok(definition);
        assert.equal(definition.aspect, CLASSIFICATION_LEADERSHIP);
        assert.deepEqual(
            antMan.config.precon
                .find(({aspect}) => aspect === CLASSIFICATION_LEADERSHIP)
                .cardRefs.find(({id}) => id === definition._id),
            {id: definition._id, count: 3},
        );
        assert.equal(definition.card.type, CARD_TYPE_EVENT);
        assert.equal(definition.card.params.name, 'Pedir ayuda');
        assert.equal(
            definition.card.params.image,
            'aspect/leadership/events/12015.png',
        );
        assert.equal(definition.card.params.cost, 0);
        assert.deepEqual(definition.card.params.resources, [RESOURCE_PHYSICAL]);
        assert.equal(
            definition.card.params.abilities[0].type,
            ABILITY_HERO_ACTION,
        );

        const [ability] = event.abilities;
        assert.ok(ability instanceof HeroActionAbility);
        assert.ok(ability.effect instanceof DiscardUntilEffect);
        assert.ok(ability.effect.thenEffect instanceof MoveToHandEffect);
        assert.equal(ability.effect.effectType, EFFECT_DISCARD_UNTIL);
        assert.equal(ability.effect.target, TARGET_YOU);
        assert.deepEqual(ability.effect.condition, {
            isAlly: true,
            traits: TRAIT_AVENGER,
        });
        assert.equal(ability.effect.showDiscardedCards, true);
        assert.equal(ability.effect.thenEffect.effectType, EFFECT_MOVE_TO_HAND);
        assert.equal(ability.effect.thenEffect.target, TARGET_SOURCE);
        assert.equal(ability.effect.thenEffect.source, 'selectedCards');
        assert.equal(typeof ability.effect.canRun, 'function');
    });

    test('discards through the first Avenger ally and adds that card to the hand', async () => {
        const {event, match, matchFactory, player} = await createContext();
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
        };
        const createPlayerCard = (type, name, traits = []) =>
            matchFactory.cardsFactory.createGameCardFromConfig({
                type,
                params: {
                    name,
                    set: 'Prueba',
                    image: 'test.png',
                    traits,
                    cost: 0,
                    resources: [],
                    hitPoints: 1,
                    attack: 1,
                    thwart: 1,
                },
            }, {owner: player});
        const nonAvengerAlly = createPlayerCard(
            CARD_TYPE_ALLY,
            'Aliado sin rasgo Vengador',
        );
        const avengerEvent = createPlayerCard(
            CARD_TYPE_EVENT,
            'Evento con rasgo Vengador',
            [TRAIT_AVENGER],
        );
        const avengerAlly = createPlayerCard(
            CARD_TYPE_ALLY,
            'Aliado Vengador',
            [TRAIT_AVENGER],
        );
        const remainingCard = createPlayerCard(CARD_TYPE_EVENT, 'Carta restante');
        player.deck.cards = [
            nonAvengerAlly,
            avengerEvent,
            avengerAlly,
            remainingCard,
        ];
        const [ability] = event.abilities;

        await ability.effect.runEffect({ability, card: event, match, player});

        assert.deepEqual(player.deck.discardPile, [nonAvengerAlly, avengerEvent]);
        assert.deepEqual(player.deck.cards, [remainingCard]);
        assert.deepEqual(player.hand.cards, [avengerAlly]);
        assert.equal(dialogs.length, 1);
        assert.equal(dialogs[0].dialogType, DIALOG_REVEAL_CARDS);
        assert.equal(dialogs[0].title, 'Cartas descartadas');
        assert.deepEqual(
            dialogs[0].data.cards.map(({id}) => id),
            [nonAvengerAlly, avengerEvent, avengerAlly].map(({id}) => id),
        );
    });
});
