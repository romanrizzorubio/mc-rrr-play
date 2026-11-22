import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_CONSTANT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_OPTION,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_ENEMY_ATTACK,
    EFFECT_FLIP,
    EFFECT_MAY,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_REMOVE_CARD,
    EFFECT_STUN,
    EFFECT_SURGE,
    OPERATOR_MAX,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_ATTACHED,
    TARGET_CARD,
    TARGET_CONDITION_CARD,
    TARGET_EFFECT,
    TARGET_THIS,
    TARGET_YOU,
    TRAIT_BRUTE,
    TRIGGER_CHARACTER_GET_ATTACK,
    TRIGGER_INSTANT,
    TRIGGER_YOU_DEAL_DAMAGE,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {GetAttackEffect} from '../../src/effects/get-attack-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

describe('Drax Obligation and nemesis set', () => {
    const getDrax = async () => {
        const catalog = await loadCatalog();
        const hero = catalog.heroes.find(({_id}) => _id === 'drax');
        assert.ok(hero);

        return {catalog, hero};
    };

    const getNemesisEntry = (hero, name) => {
        const entry = hero.config.nemesis.find(({card}) =>
            card.params.name === name);
        assert.ok(entry, `Missing Drax nemesis card "${name}".`);

        return entry;
    };

    const createGame = async ({selectedSide = 1} = {}) => {
        const {catalog, hero} = await getDrax();
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'drax-nemesis-test',
        });
        match.openDialog = async dialog => {
            const selected = dialog.data?.cards?.[0] ??
                dialog.data?.options?.[0];

            return selected ? {selected} : {};
        };
        match.persist = async () => {};
        match.refresh = async () => {};

        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...hero.config,
            cards: [],
            precon: [],
        });
        superhero.selectedSide = selectedSide;

        const player = match.createPlayer({
            name: 'Drax',
            superhero,
            initial: true,
        });
        player.initPlayer();
        player.gameZone = new PlayerZone({owner: player});
        match.currentPlayer = player;
        match.currentTurnPlayer = player;

        const rhino = catalog.scenarios.find(({_id}) => _id === 'rhino');
        assert.ok(rhino);
        const scenario = await matchFactory.createScenario({
            ...rhino.config,
            cards: [],
            sets: [],
            defaultSets: [],
        });
        match.addScenario(scenario);
        await scenario.initScenario([], false);
        scenario.deck.cards = [];

        return {catalog, hero, match, matchFactory, player, scenario, superhero};
    };

    const createMinion = (matchFactory, player, name, attack, hitPoints = 10) => {
        const minion = matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {
                name,
                attack,
                scheme: 1,
                hitPoints,
                boost: 0,
            },
        }, {owner: player});
        minion.controller = player;
        player.gameZone.engage(minion);

        return minion;
    };

    const addBoostCard = (matchFactory, scenario) => {
        scenario.deck.cards.push(matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_TREACHERY,
            params: {
                name: 'Carta de aumento de prueba',
                set: 'test',
                boost: 0,
            },
        }, {owner: scenario}));
    };

    test('registers the Obligation and full nemesis collection', async () => {
        const {hero} = await getDrax();
        const {obligation, nemesis} = hero.config;

        assert.equal(obligation.count, 1);
        assert.equal(obligation.card.type, CARD_TYPE_OBLIGATION);
        assert.equal(obligation.card.params.name, 'Recuerdos de otra vida');
        assert.equal(obligation.card.params.image, 'heroes/drax/19025.png');
        assert.equal(obligation.card.params.boost, 2);
        assert.equal(obligation.card.params.giveToOwner, true);
        const [flipAbility, resolveObligation] =
            obligation.card.params.abilities;
        assert.equal(flipAbility.type, ABILITY_CONSTANT);
        assert.equal(flipAbility.params.trigger, TRIGGER_INSTANT);
        assert.equal(flipAbility.params.effect.type, EFFECT_MAY);
        assert.equal(
            flipAbility.params.effect.params.effect.type,
            EFFECT_FLIP
        );
        assert.equal(
            flipAbility.params.effect.params.effect.params.formTarget,
            TARGET_ALTEREGO_SIDE
        );
        assert.equal(
            resolveObligation.params.effect.type,
            EFFECT_CHOOSE_ABILITY
        );
        const [exhaustAlterEgo, stunOrSurge] =
            resolveObligation.params.effect.params.options;
        assert.equal(exhaustAlterEgo.type, ABILITY_OPTION);
        assert.equal(
            exhaustAlterEgo.params.arrow.params.target,
            TARGET_ALTEREGO
        );
        assert.deepEqual(exhaustAlterEgo.params.effect, {
            type: EFFECT_REMOVE_CARD,
            params: {target: TARGET_CARD},
        });
        assert.equal(stunOrSurge.params.effect.type, EFFECT_DO_IF);
        assert.deepEqual(
            stunOrSurge.params.effect.params.condition,
            {'player.isStunned': true}
        );
        const [surgeIfStunned, discardAfterSurge] =
            stunOrSurge.params.effect.params.effect.params.effects;
        const [stunDrax, discardAfterStun] =
            stunOrSurge.params.effect.params.effectNot.params.effects;
        assert.equal(surgeIfStunned.type, EFFECT_SURGE);
        assert.deepEqual(discardAfterSurge, {
            type: EFFECT_DISCARD_GAME,
            params: {target: TARGET_CARD},
        });
        assert.equal(stunDrax.type, EFFECT_STUN);
        assert.equal(stunDrax.params.target, TARGET_YOU);
        assert.deepEqual(discardAfterStun, {
            type: EFFECT_DISCARD_GAME,
            params: {target: TARGET_CARD},
        });

        assert.deepEqual(
            nemesis.map(({count, card}) => [card.params.name, count]),
            [
                ['Sacrifica a los débiles', 1],
                ['Yotat el Destructor', 1],
                ['Reto aceptado', 1],
                ['¡Te destruiré!', 2],
            ],
        );

        const scheme = getNemesisEntry(hero, 'Sacrifica a los débiles').card;
        assert.equal(scheme.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.deepEqual(scheme.params.startingThreat, [2, true]);
        assert.equal(scheme.params.boost, 2);
        assert.equal(
            scheme.params.abilities[0].params.trigger,
            TRIGGER_CHARACTER_GET_ATTACK
        );
        assert.equal(
            scheme.params.abilities[0].params.effect.type,
            EFFECT_MODIFY_ATTACK_VALUE
        );
        assert.equal(
            scheme.params.abilities[0].params.effect.params.target,
            TARGET_EFFECT
        );

        const yotat = getNemesisEntry(hero, 'Yotat el Destructor').card;
        assert.equal(yotat.type, CARD_TYPE_MINION);
        assert.equal(yotat.params.unique, true);
        assert.equal(yotat.params.nemesis, true);
        assert.deepEqual(yotat.params.traits, [TRAIT_BRUTE]);
        assert.deepEqual([
            yotat.params.attack,
            yotat.params.scheme,
            yotat.params.hitPoints,
        ], [3, 1, 5]);
        assert.deepEqual(yotat.params.keywords, {
            guard: true,
            retaliate: 1,
        });
        assert.equal(yotat.params.boost, 3);

        const attachment = getNemesisEntry(hero, 'Reto aceptado').card;
        assert.equal(attachment.type, CARD_TYPE_ATTACHMENT);
        assert.deepEqual(attachment.params.keywords, {surge: true});
        assert.equal(attachment.params.boost, 1);
        assert.equal(attachment.params.attack, 2);
        assert.deepEqual(attachment.params.attach, {
            target: TARGET_CONDITION_CARD,
            condition: {attack: {operator: OPERATOR_MAX}},
        });
        const [challengeResponse] = attachment.params.abilities;
        assert.equal(challengeResponse.type, ABILITY_FORCED_RESPONSE);
        assert.equal(
            challengeResponse.params.trigger,
            TRIGGER_YOU_DEAL_DAMAGE
        );
        assert.deepEqual(challengeResponse.params.triggerParams, {
            target: TARGET_ATTACHED,
        });
        assert.deepEqual(challengeResponse.params.condition, {
            'effect.isAttack': true,
            'effect.character.name': 'Drax',
            'effect.takenDamage': '>3',
        });
        assert.deepEqual(challengeResponse.params.effect, {
            type: EFFECT_DISCARD_GAME,
            params: {target: TARGET_THIS},
        });

        const treachery = getNemesisEntry(hero, '¡Te destruiré!').card;
        assert.equal(treachery.type, CARD_TYPE_TREACHERY);
        assert.equal(treachery.params.boost, 2);
        const [alterEgoReveal, heroReveal] = treachery.params.abilities;
        assert.equal(alterEgoReveal.type, ABILITY_WHEN_REVEALED_ALTEREGO);
        assert.equal(alterEgoReveal.params.effect.type, EFFECT_SURGE);
        assert.equal(heroReveal.type, ABILITY_WHEN_REVEALED_HERO);
        assert.equal(heroReveal.params.effect.type, EFFECT_CHAINED);
        const [yotatAttack, villainFallback] =
            heroReveal.params.effect.params.effects;
        assert.equal(yotatAttack.type, EFFECT_ENEMY_ATTACK);
        assert.equal(yotatAttack.params.enemyType, TARGET_CONDITION_CARD);
        assert.equal(yotatAttack.params.attackModifier, 1);
        assert.equal(yotatAttack.params.target, TARGET_YOU);
        assert.equal(villainFallback.type, EFFECT_DO_IF);
        assert.deepEqual(
            villainFallback.params.condition,
            {'effects.0.resolved': false}
        );
        assert.equal(nemesis.reduce((total, {count}) => total + count, 0), 5);
    });

    test('compiles every configured Drax Obligation and nemesis ability', async () => {
        const {hero} = await getDrax();
        const cardsFactory = new CardsFactory({
            match: {players: [], triggerCards: {}},
        });
        const cardConfigs = [
            hero.config.obligation.card,
            ...hero.config.nemesis.map(({card}) => card),
        ];

        for (const cardConfig of cardConfigs) {
            const card = cardsFactory.createGameCardFromConfig(cardConfig);
            for (const ability of card.abilities) {
                assert.ok(
                    ability.effect || ability.validation,
                    `${cardConfig.params.name} has an empty ability`
                );
                if (ability.effect) {
                    assert.equal(typeof ability.effect.canRun, 'function');
                }
            }
        }
    });

    test('the Obligation stuns Drax or gains Surge if he is already stunned', async () => {
        for (const alreadyStunned of [false, true]) {
            const {match, player, superhero} = await createGame();
            if (alreadyStunned) {
                superhero.stunned = 1;
            }

            const obligation = superhero.obligations.find(({name}) =>
                name === 'Recuerdos de otra vida');
            assert.ok(obligation);
            obligation.owner = player;
            await player.addToGameZone(obligation);

            const resolver = obligation.abilities.find(({effect}) =>
                effect?.effectType === EFFECT_CHOOSE_ABILITY);
            assert.ok(resolver);
            const option = resolver.effect.options[1];
            const reveal = {surge: false};
            await option.resolveAbility({
                card: obligation,
                match,
                player,
                reveal,
            });

            assert.equal(superhero.isStunned, true);
            assert.equal(reveal.surge, alreadyStunned);
            assert.equal(player.gameZone.cards.includes(obligation), false);
        }
    });

    test('the Obligation can exhaust the Alter ego and remove itself from the game', async () => {
        const {match, player, superhero} = await createGame({
            selectedSide: 0,
        });
        const obligation = superhero.obligations.find(({name}) =>
            name === 'Recuerdos de otra vida');
        assert.ok(obligation);
        obligation.owner = player;
        await player.addToGameZone(obligation);

        const resolver = obligation.abilities.find(({effect}) =>
            effect?.effectType === EFFECT_CHOOSE_ABILITY);
        assert.ok(resolver);
        const option = resolver.effect.options[0];

        await option.resolveAbility({card: obligation, match, player});

        assert.equal(player.exhausted, true);
        assert.equal(player.gameZone.cards.includes(obligation), false);
        assert.ok(match.removedCards.includes(obligation));
    });

    test('Sacrifica a los débiles raises every enemy attack value by 2', async () => {
        const {hero, match, matchFactory, player, scenario} = await createGame();
        const schemeConfig = getNemesisEntry(
            hero,
            'Sacrifica a los débiles'
        ).card;
        const scheme = matchFactory.cardsFactory.createGameCardFromConfig(
            schemeConfig,
            {owner: scenario}
        );
        scheme.controller = scenario;
        scenario.gameZone.addToGameZone(scheme);
        await scheme.initTriggers({match, player});

        const enemies = [
            createMinion(matchFactory, player, 'Esbirro de ATQ 2', 2),
            createMinion(matchFactory, player, 'Esbirro de ATQ 4', 4),
        ];
        for (const enemy of enemies) {
            const attack = new GetAttackEffect({
                match,
                selectedTarget: enemy,
            });
            const schemeTrigger = Object.values(scheme.triggers[
                TRIGGER_CHARACTER_GET_ATTACK
            ]).flat()[0];
            const attackParams = attack.getTriggersParams({match, player});
            assert.equal(await schemeTrigger.canTrigger(attackParams), true);
            await schemeTrigger.runTrigger(attackParams);
            await attack.execute({match, player});
            assert.equal(attack.attack, enemy.attack + 2);
        }
    });

    test('Reto aceptado attaches to the highest-ATQ enemy and discards after a qualifying attack', async () => {
        const {hero, match, matchFactory, player, scenario, superhero} =
            await createGame();
        addBoostCard(matchFactory, scenario);
        const lowerAttack = createMinion(
            matchFactory,
            player,
            'Esbirro de ATQ 2',
            2
        );
        const higherAttack = createMinion(
            matchFactory,
            player,
            'Esbirro de ATQ 5',
            5,
            20
        );
        const baseAttack = higherAttack.attack;
        const attachmentConfig = getNemesisEntry(hero, 'Reto aceptado').card;
        const attachment = matchFactory.cardsFactory.createGameCardFromConfig(
            attachmentConfig,
            {owner: scenario}
        );
        const attachEffect = attachment.card.createAttachEffect(attachment);

        await attachEffect.runEffect({match, player});

        assert.equal(attachment.attachedTo, higherAttack);
        assert.notEqual(attachment.attachedTo, lowerAttack);
        await attachment.initTriggers({match, player});

        const attack = new GetAttackEffect({
            match,
            selectedTarget: higherAttack,
        });
        await attack.runEffect({match, player});
        assert.equal(attack.attack, baseAttack + 2);

        const otherAttackerDamage = new DealDamageEffect({
            character: {name: 'Otro personaje', owner: player},
            damage: 4,
            isAttack: true,
            match,
            selectedTarget: higherAttack,
        });
        await otherAttackerDamage.runEffect({match, player});
        assert.equal(attachment.attachedTo, higherAttack);

        const belowThreshold = new DealDamageEffect({
            character: superhero.currentSide,
            damage: 3,
            isAttack: true,
            match,
            selectedTarget: higherAttack,
        });
        await belowThreshold.runEffect({match, player});
        assert.equal(attachment.attachedTo, higherAttack);

        const qualifyingAttack = new DealDamageEffect({
            character: superhero.currentSide,
            damage: 4,
            isAttack: true,
            match,
            selectedTarget: higherAttack,
        });
        await qualifyingAttack.runEffect({match, player});
        assert.equal(higherAttack.attached.includes(attachment), false);
        assert.equal(attachment.attachedTo, undefined);
        assert.ok(scenario.deck.discardPile.includes(attachment));

        const attackAfterDiscard = new GetAttackEffect({
            match,
            selectedTarget: higherAttack,
        });
        await attackAfterDiscard.runEffect({match, player});
        assert.equal(attackAfterDiscard.attack, baseAttack);
    });

    test('¡Te destruiré! attacks Yotat with +1 ATQ when he is in play', async () => {
        const {hero, match, matchFactory, player, scenario, superhero} =
            await createGame();
        const yotatConfig = getNemesisEntry(hero, 'Yotat el Destructor').card;
        const yotat = matchFactory.cardsFactory.createGameCardFromConfig(
            yotatConfig,
            {owner: scenario}
        );
        yotat.controller = scenario;
        scenario.gameZone.addToGameZone(yotat);
        await yotat.initTriggers({match, player});
        addBoostCard(matchFactory, scenario);
        superhero.currentSide.setExhausted(true);

        const treachery = matchFactory.cardsFactory.createGameCardFromConfig(
            getNemesisEntry(hero, '¡Te destruiré!').card,
            {owner: scenario}
        );
        const reveal = new RevealEncounterEffect({
            card: treachery,
            match,
            player,
        });
        await reveal.runEffect({player});

        assert.equal(reveal.resolved, true);
        assert.equal(superhero.currentSide.damage, 4);
    });

    test('¡Te destruiré! falls back to the Villain when Yotat is absent', async () => {
        const {hero, match, matchFactory, player, scenario, superhero} =
            await createGame();
        addBoostCard(matchFactory, scenario);
        superhero.currentSide.setExhausted(true);

        const treachery = matchFactory.cardsFactory.createGameCardFromConfig(
            getNemesisEntry(hero, '¡Te destruiré!').card,
            {owner: scenario}
        );
        const reveal = new RevealEncounterEffect({
            card: treachery,
            match,
            player,
        });
        await reveal.runEffect({player});

        assert.equal(reveal.resolved, true);
        assert.ok(superhero.currentSide.damage > 0);
    });

    test('¡Te destruiré! gains Surge when revealed in Alter ego form', async () => {
        const {hero, match, matchFactory, player, scenario} = await createGame({
            selectedSide: 0,
        });
        addBoostCard(matchFactory, scenario);

        const treachery = matchFactory.cardsFactory.createGameCardFromConfig(
            getNemesisEntry(hero, '¡Te destruiré!').card,
            {owner: scenario}
        );
        const reveal = new RevealEncounterEffect({
            card: treachery,
            match,
            player,
        });
        await reveal.runEffect({player});

        assert.equal(reveal.resolved, true);
        assert.equal(reveal.surge, true);
    });
});
