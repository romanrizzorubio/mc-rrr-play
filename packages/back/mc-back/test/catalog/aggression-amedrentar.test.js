import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CALC_STAGE,
    CARD_TYPE_EVENT,
    CLASSIFICATION_AGGRESSION,
    EFFECT_DEAL_DAMAGE,
    LABEL_ATTACK,
    RESOURCE_PHYSICAL,
    TARGET_VILLAIN,
    TRAIT_ATTACK,
    TRAIT_AVENGER,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerCard} from '../../src/model/printed/player-card.js';

describe('Amedrentar', () => {
    test('is a shared Aggression attack event restricted to Avengers and not in a precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const entry = aspects.find(({_id}) =>
            _id === 'aggression-amedrentar');

        assert.ok(entry);
        assert.equal(entry.aspect, CLASSIFICATION_AGGRESSION);
        assert.equal(entry.card.type, CARD_TYPE_EVENT);
        assert.equal(entry.card.params.name, 'Amedrentar');
        assert.equal(entry.card.params.set, CLASSIFICATION_AGGRESSION);
        assert.equal(
            entry.card.params.image,
            'aspect/aggression/events/15028.png'
        );
        assert.deepEqual(entry.card.params.traits, [TRAIT_ATTACK]);
        assert.equal(entry.card.params.cost, 2);
        assert.deepEqual(entry.card.params.resources, [RESOURCE_PHYSICAL]);
        assert.equal(
            entry.card.params.classification,
            CLASSIFICATION_AGGRESSION
        );
        assert.deepEqual(entry.card.params.paramsToPlay, {
            'superhero.traits': TRAIT_AVENGER,
        });

        const preconIds = heroes.flatMap(({config}) =>
            (config.precon ?? []).flatMap(({cardRefs = []}) =>
                cardRefs.map(({id}) => id)
            )
        );
        const heroCardNames = heroes.flatMap(({config}) =>
            (config.cards ?? []).map(({card}) => card.params.name)
        );
        assert.equal(preconIds.includes(entry._id), false);
        assert.equal(heroCardNames.includes('Amedrentar'), false);

        const msMarvel = heroes.find(({_id}) => _id === 'ms-marvel');
        const superhero = new MatchFactory(
            new Match({name: 'amedrentar-trait-playability'})
        ).createSuperhero({
            ...msMarvel.config,
            cards: [],
            precon: [],
            nemesis: [],
        });
        superhero.selectedSide = 1;
        const playerCard = new PlayerCard(entry.card.params);
        const player = {superhero};
        assert.equal(playerCard.canPlay({player}), false);
        superhero.extraTraits.push(TRAIT_AVENGER);
        assert.equal(superhero.currentSide.traits.includes(TRAIT_AVENGER), false);
        assert.ok(superhero.traits.includes(TRAIT_AVENGER));
        assert.equal(playerCard.canPlay({player}), true);

        const [abilityConfig] = entry.card.params.abilities;
        assert.equal(abilityConfig.type, ABILITY_HERO_ACTION);
        assert.deepEqual(abilityConfig.params.labels, [LABEL_ATTACK]);
        assert.deepEqual(abilityConfig.params.effect, {
            type: EFFECT_DEAL_DAMAGE,
            params: {
                target: TARGET_VILLAIN,
                damage: 2,
                additionalDamageCalc: {
                    target: TARGET_VILLAIN,
                    formula: CALC_STAGE,
                    max: 3,
                },
            },
        });
    });

    test('deals 2 damage plus the Villain stage, capped at 3 additional', async () => {
        const {aspects} = await loadCatalog();
        const cardConfig = aspects.find(({_id}) =>
            _id === 'aggression-amedrentar').card;
        const match = {
            currentRound: 1,
            dialogs: [],
            inPlayCards: [],
            lasting: [],
            limits: {},
            players: [],
            triggerCards: {},
            numPlayers: 1,
            async openDialog(dialog) {
                this.dialogs.push(dialog);
            },
        };
        const matchFactory = new MatchFactory(match);
        const player = {
            isHero: true,
            isPlayer: true,
            match,
        };
        match.players.push(player);

        const villain = {
            damage: 0,
            hitPoints: 100,
            isEnemy: true,
            isInPlay: true,
            isTough: false,
            stage: 1,
            async getLife() {
                return this.hitPoints - this.damage;
            },
            placeDamage(damage) {
                this.damage += damage;
            },
            async refresh() {},
        };
        match.villain = villain;

        const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(
            cardConfig,
            {owner: player}
        );
        const [ability] = gameCard.abilities;
        ability.prepareEffect({preselectedTarget: true});
        const effect = ability.effect;

        assert.ok(effect instanceof DealDamageEffect);
        assert.equal(ability.isAttack, true);
        assert.equal(typeof effect.canRun, 'function');
        effect.selectedTarget = villain;

        for (const {stage, expectedDamage} of [
            {stage: 1, expectedDamage: 3},
            {stage: 2, expectedDamage: 4},
            {stage: 3, expectedDamage: 5},
            {stage: 4, expectedDamage: 5},
        ]) {
            villain.stage = stage;
            const previousDamage = villain.damage;

            await effect.runEffect({match, player});

            assert.equal(villain.damage - previousDamage, expectedDamage);
        }
    });
});
