import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_BOOST,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_WHEN_REVEALED,
    CALC_MULTIPLY_2,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_TREACHERY,
    EFFECT_ASSIGN_DAMAGE,
    EFFECT_CHOOSE,
    EFFECT_DEAL_BOOST,
    EFFECT_DISCARD_GAME,
    EFFECT_HEAL,
    EFFECT_SIMULTANEOUS,
    EFFECT_STORE_BOOST,
    EFFECT_SURGE,
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_PHYSICAL,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ENEMY_HIGHEST_PRINTED_HP,
    TARGET_THIS,
    TARGET_VILLAIN,
    TRAIT_VEHICLE,
    TRAIT_WEAPON,
    TRIGGER_VILLAIN_ATTACKS_YOU,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {AssignDamageEffect} from '../../src/effects/assign-damage-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {StoreBoostEffect} from '../../src/effects/store-boost-effect.js';
import {HealEffect} from '../../src/effects/heal-effect.js';
import {ResolveBoostEffect} from '../../src/effects/resolve-boost-effect.js';

const findEntry = (set, name) => {
    const entry = set.config.cards.find(({card}) => card.params.name === name);
    assert.ok(entry, `Expected ${name} in Trucos de duende.`);

    return entry;
};

test('Trucos de duende registers all four cards and their printed values', async () => {
    const {sets} = await loadCatalog();
    const set = sets.find(({_id}) => _id === 'goblin-gimmicks');

    assert.ok(set);
    assert.equal(set.config.name, 'Trucos de duende');
    assert.equal(set.config.standard, false);
    assert.equal(set.config.cards.length, 4);
    assert.equal(set.config.cards.reduce((total, {count}) => total + count, 0), 8);

    const glider = findEntry(set, 'Planeador duende');
    assert.equal(glider.count, 2);
    assert.equal(glider.card.type, CARD_TYPE_ATTACHMENT);
    assert.equal(glider.card.params.image, 'sets/goblin-gimmicks/02033.png');
    assert.deepEqual(glider.card.params.traits, [TRAIT_VEHICLE]);
    assert.equal(glider.card.params.attack, 1);
    assert.equal(glider.card.params.boost, 3);
    assert.equal(glider.card.params.maxAttach, 1);
    assert.equal(glider.card.params.attach.target, TARGET_ENEMY_HIGHEST_PRINTED_HP);
    assert.equal(glider.card.params.attach.ifNot.type, EFFECT_SURGE);
    const [gliderAction] = glider.card.params.abilities;
    assert.equal(gliderAction.type, ABILITY_HERO_ACTION);
    assert.deepEqual(gliderAction.params.arrow.params.resources, [
        RESOURCE_ENERGY,
        RESOURCE_ENERGY,
    ]);
    assert.deepEqual(gliderAction.params.effect, {
        type: EFFECT_DISCARD_GAME,
        params: {target: TARGET_THIS},
    });

    const pumpkins = findEntry(set, 'Bombas calabaza');
    assert.equal(pumpkins.count, 2);
    assert.equal(pumpkins.card.type, CARD_TYPE_ATTACHMENT);
    assert.equal(pumpkins.card.params.image, 'sets/goblin-gimmicks/02034.png');
    assert.deepEqual(pumpkins.card.params.traits, [TRAIT_WEAPON]);
    assert.equal(pumpkins.card.params.boost, 2);
    assert.equal(pumpkins.card.params.attach, TARGET_VILLAIN);
    const [pumpkinResponse, pumpkinAction] = pumpkins.card.params.abilities;
    assert.equal(pumpkinResponse.type, ABILITY_FORCED_RESPONSE);
    assert.equal(pumpkinResponse.params.trigger, TRIGGER_VILLAIN_ATTACKS_YOU);
    assert.equal(pumpkinResponse.params.effect.type, EFFECT_SIMULTANEOUS);
    assert.equal(pumpkinResponse.params.effect.params.effects[0].type, EFFECT_DISCARD_GAME);
    assert.equal(pumpkinResponse.params.effect.params.effects[1].type, EFFECT_ASSIGN_DAMAGE);
    assert.equal(
        pumpkinResponse.params.effect.params.effects[1].params.target,
        TARGET_ALL_CHARACTERS_YOU_CONTROL
    );
    assert.equal(pumpkinResponse.params.effect.params.effects[1].params.damage, 2);
    assert.equal(pumpkinAction.type, ABILITY_HERO_ACTION);
    assert.deepEqual(pumpkinAction.params.arrow.params.resources, [
        RESOURCE_PHYSICAL,
        RESOURCE_PHYSICAL,
    ]);
    assert.equal(pumpkinAction.params.effect.params.target, TARGET_THIS);

    const intimidation = findEntry(set, 'Intimidación');
    assert.equal(intimidation.count, 2);
    assert.equal(intimidation.card.type, CARD_TYPE_TREACHERY);
    assert.equal(intimidation.card.params.image, 'sets/goblin-gimmicks/02035.png');
    assert.equal(intimidation.card.params.boost, 1);
    const [intimidationReveal] = intimidation.card.params.abilities;
    assert.equal(intimidationReveal.type, ABILITY_WHEN_REVEALED);
    assert.equal(intimidationReveal.params.effect.type, EFFECT_CHOOSE);
    assert.deepEqual(
        intimidationReveal.params.effect.params.options[0].params.resources,
        [RESOURCE_ANY, RESOURCE_ANY]
    );
    assert.equal(intimidationReveal.params.effect.params.options[1].type, EFFECT_STORE_BOOST);
    assert.equal(
        intimidationReveal.params.effect.params.options[1].params.target,
        TARGET_VILLAIN
    );
    assert.equal(intimidation.card.params.boostAbility.type, ABILITY_BOOST);
    assert.equal(
        intimidation.card.params.boostAbility.params.effect.type,
        EFFECT_DEAL_BOOST
    );

    const healing = findEntry(set, 'Curación regenerativa');
    assert.equal(healing.count, 2);
    assert.equal(healing.card.type, CARD_TYPE_TREACHERY);
    assert.equal(healing.card.params.image, 'sets/goblin-gimmicks/02036.png');
    assert.equal(healing.card.params.boost, 1);
    const [healingReveal] = healing.card.params.abilities;
    assert.equal(healingReveal.type, ABILITY_WHEN_REVEALED);
    assert.equal(healingReveal.params.effect.type, EFFECT_HEAL);
    assert.deepEqual(healingReveal.params.effect.params.paramsCalc, {
        formula: CALC_MULTIPLY_2,
        target: 'effect.match.villain.stage',
    });
    assert.equal(healingReveal.params.ifNot.type, EFFECT_SURGE);
    assert.equal(healing.card.params.boostAbility.type, ABILITY_BOOST);
    assert.equal(healing.card.params.boostAbility.params.effect.type, EFFECT_HEAL);
    assert.equal(healing.card.params.boostAbility.params.effect.params.damage, 2);
});

test('all Goblin Gimmicks abilities compile into single resolvable effects', async () => {
    const {sets} = await loadCatalog();
    const set = sets.find(({_id}) => _id === 'goblin-gimmicks');
    const cardsFactory = new CardsFactory({
        match: {
            players: [],
            triggerCards: {},
        },
    });

    for (const {card: config} of set.config.cards) {
        const gameCard = cardsFactory.createGameCard({
            card: cardsFactory.createCard(config),
            owner: {},
        });
        const abilities = [
            ...gameCard.abilities,
            ...(gameCard.boostAbility ? [gameCard.boostAbility] : []),
        ];

        assert.ok(abilities.length);
        abilities.forEach(ability => {
            assert.ok(ability.effect);
            assert.equal(typeof ability.effect.canRun, 'function');
        });
    }

    const intimidation = findEntry(set, 'Intimidación');
    const intimidationCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(intimidation.card),
        owner: {},
    });
    const [storeBoost] = intimidationCard.abilities[0].effect.options.slice(1);
    assert.ok(storeBoost instanceof StoreBoostEffect);
    assert.equal(intimidationCard.boostAbility.effect.effectType, EFFECT_DEAL_BOOST);

    const healing = findEntry(set, 'Curación regenerativa');
    const healingCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(healing.card),
        owner: {},
    });
    assert.ok(healingCard.abilities[0].effect instanceof HealEffect);
});

test('Bombas calabaza assigns two indirect damage total across controlled characters', async () => {
    const {sets} = await loadCatalog();
    const set = sets.find(({_id}) => _id === 'goblin-gimmicks');
    const pumpkins = findEntry(set, 'Bombas calabaza');
    const [response] = pumpkins.card.params.abilities;
    const assignDamage = response.params.effect.params.effects.find(({type}) =>
        type === EFFECT_ASSIGN_DAMAGE);
    assert.ok(assignDamage);
    const characters = ['hero', 'ally'].map(id => ({
        abilities: [],
        damage: 0,
        id,
        toObj() {
            return {id: this.id, life: 10};
        },
    }));
    let assignmentDialog;
    const match = {
        triggerCards: {},
        effectsFactory: {
            createEffect({damage, selectedTarget}) {
                return {
                    takenDamage: damage,
                    async runEffect() {
                        selectedTarget.damage += damage;
                    },
                };
            },
        },
        async openDialog(dialog) {
            assignmentDialog = dialog;

            return {
                assigned: {
                    hero: 1,
                    ally: 1,
                },
            };
        },
    };
    const effect = new AssignDamageEffect({
        ...assignDamage.params,
        match,
        selectedTarget: characters,
    });

    await effect.execute({player: {hand: {cards: []}}});

    assert.equal(assignmentDialog.data.count, 2);
    assert.equal(assignmentDialog.title, 'Reparte 2 de Daño indirecto');
    assert.deepEqual(assignmentDialog.data.cards.map(({id}) => id), ['hero', 'ally']);
    assert.deepEqual(characters.map(({damage}) => damage), [1, 1]);
    assert.equal(characters.reduce((total, {damage}) => total + damage, 0), 2);
});

test('Intimidación adds its boost card to the current activation', async () => {
    const {sets} = await loadCatalog();
    const set = sets.find(({_id}) => _id === 'goblin-gimmicks');
    const intimidation = findEntry(set, 'Intimidación');
    const extraBoost = {boost: 2};
    const villain = {
        abilities: [],
        stage: 1,
    };
    const match = {
        villain,
        players: [],
        triggerCards: {},
        async drawEncounterCards() {
            return [extraBoost];
        },
    };
    const cardsFactory = new CardsFactory({match});
    const card = cardsFactory.createGameCard({
        card: cardsFactory.createCard(intimidation.card),
        owner: {},
    });
    const enemyActivation = {
        enemy: {
            isVillain: true,
            name: 'Duende Verde',
        },
        boostCards: [],
    };
    const effect = new ResolveBoostEffect({
        activation: {},
        card,
        enemyActivation,
        match,
    });

    await effect.execute({player: {}});

    assert.deepEqual(enemyActivation.boostCards, [extraBoost]);
});

test('Regenerative Healing reads the villain stage and surges when there is no damage', async () => {
    const {sets} = await loadCatalog();
    const set = sets.find(({_id}) => _id === 'goblin-gimmicks');
    const healing = findEntry(set, 'Curación regenerativa');
    const villain = {
        abilities: [],
        damage: 5,
        stage: 2,
        get canHeal() {
            return this.damage > 0;
        },
        healDamage(damage) {
            this.damage = Math.max(0, this.damage - damage);
        },
        async refresh() {},
    };
    const match = {
        villain,
        players: [],
        triggerCards: {},
    };
    const cardsFactory = new CardsFactory({match});
    const card = cardsFactory.createGameCard({
        card: cardsFactory.createCard(healing.card),
        owner: {},
    });
    const player = {};
    const ability = card.abilities[0];

    await ability.resolveAbility({player, card, match});

    assert.equal(villain.damage, 1);

    villain.damage = 0;
    const reveal = {};
    await ability.resolveAbility({player, card, match, reveal});

    assert.equal(reveal.surge, true);
});

test('Planeador duende resolves its discard effect after paying the self-discarding action', async () => {
    const {sets} = await loadCatalog();
    const set = sets.find(({_id}) => _id === 'goblin-gimmicks');
    const glider = findEntry(set, 'Planeador duende');
    const match = {
        players: [],
        triggerCards: {},
    };
    const cardsFactory = new CardsFactory({match});
    const card = cardsFactory.createGameCard({
        card: cardsFactory.createCard(glider.card),
        owner: {},
    });
    let discarded = false;
    card.discard = async () => {
        discarded = true;
    };
    const player = {
        isHero: true,
        isPlayer: true,
        hand: {cards: []},
        async getCardsToPay() {
            return {generators: [], hand: [{id: 'energy-resource'}]};
        },
        async spendResources() {
            return {
                resources: [RESOURCE_ENERGY, RESOURCE_ENERGY],
                fullyPaid: true,
                hand: [],
                generators: [],
            };
        },
    };
    const ability = card.abilities[0];

    await ability.resolveAbility({player, card, match});

    assert.equal(discarded, true);
    assert.equal(ability.effect.resolved, true);
    assert.equal(ability.resolved, true);
});
