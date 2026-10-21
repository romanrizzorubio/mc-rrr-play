import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CARD_TYPE_EVENT,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_ENEMY_ATTACK,
    LABEL_ATTACK,
    RESOURCE_MENTAL,
    TARGET_ENEMY,
    TARGET_SOURCE,
    TARGET_YOU,
    TRAIT_ATTACK,
} from 'mc-shared';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

const createMatch = name => new Match({
    mc: {
        mcSocket: {
            send() {},
        },
    },
    name,
});

test('Cara a cara is in Hulk precon and keeps its selected enemy as the damage target', async () => {
    const {aspects, heroes} = await loadCatalog();
    const cardConfig = aspects.find(({_id}) =>
        _id === 'aggression-cara-a-cara');
    const hulk = heroes.find(({_id}) => _id === 'hulk');

    assert.ok(cardConfig);
    assert.ok(hulk);
    assert.equal(cardConfig.aspect, 'aggression');
    assert.equal(cardConfig.card.type, CARD_TYPE_EVENT);
    assert.equal(cardConfig.card.params.name, 'Cara a cara');
    assert.equal(cardConfig.card.params.image, 'aspect/aggression/events/10015.png');
    assert.deepEqual(cardConfig.card.params.traits, [TRAIT_ATTACK]);
    assert.equal(cardConfig.card.params.cost, 1);
    assert.deepEqual(cardConfig.card.params.resources, [RESOURCE_MENTAL]);
    const preconCard = hulk.config.precon
        .find(({aspect}) => aspect === 'aggression')
        .cardRefs.find(({id}) => id === cardConfig._id);
    assert.equal(preconCard.count, 3);

    const [abilityConfig] = cardConfig.card.params.abilities;
    assert.equal(abilityConfig.type, ABILITY_HERO_ACTION);
    assert.deepEqual(abilityConfig.params.labels, [LABEL_ATTACK]);
    assert.deepEqual(abilityConfig.params.effect, {
        type: EFFECT_CHAINED,
        params: {
            effects: [
                {
                    type: EFFECT_ENEMY_ATTACK,
                    params: {
                        enemyType: TARGET_ENEMY,
                        target: TARGET_YOU,
                        enemyTargetEffect: 'effects.1',
                    },
                },
                {
                    type: EFFECT_DEAL_DAMAGE,
                    params: {
                        target: TARGET_SOURCE,
                        source: 'effects.0.enemyTargets',
                        condition: {isInPlay: true},
                        damage: 5,
                        requiredForAvailability: false,
                    },
                },
            ],
        },
    });

    const match = createMatch('aggression-cara-a-cara');
    const matchFactory = new MatchFactory(match);
    const superhero = matchFactory.createSuperhero(hulk.config);
    superhero.selectedSide = 1;
    const player = match.createPlayer({name: 'Hulk', superhero});
    player.gameZone = new PlayerZone({owner: player});

    const selectedEnemy = {
        id: 'selected-enemy',
        name: 'Selected enemy',
        isEnemy: true,
        isVillain: true,
        isInPlay: true,
        attackable: false,
        damage: 0,
        abilities: [],
        canBeAttacked() {
            return this.attackable;
        },
        toObj() {
            return {id: this.id, name: this.name};
        },
    };
    const otherEnemy = {
        id: 'other-enemy',
        name: 'Other enemy',
        isEnemy: true,
        isMinion: true,
        isInPlay: true,
        attackable: true,
        damage: 0,
        abilities: [],
        canBeAttacked() {
            return this.attackable;
        },
        toObj() {
            return {id: this.id, name: this.name};
        },
    };
    match.scenario = {
        villain: selectedEnemy,
        gameZone: {
            currentScheme: null,
            cards: [],
        },
    };
    let selectionDialog;
    match.openDialog = async ({data}) => {
        selectionDialog = data;

        return {
            selected: data.cards.find(({id}) => id === otherEnemy.id),
        };
    };

    const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(
        cardConfig.card,
        {owner: player}
    );
    const [ability] = gameCard.abilities;
    const [enemyAttack, dealDamage] = ability.effect.effects;
    player.hand.addCard(gameCard);

    assert.equal(ability.isAttack, true);
    assert.equal(typeof ability.effect.canRun, 'function');
    assert.equal(await ability.canRun({card: gameCard, match, player}), true);
    assert.equal((await player.hand.toObjWithPlayability())[0].playable, true);

    const effectParams = {
        card: gameCard,
        effects: ability.effect.effects,
        match,
        player,
    };
    await enemyAttack.selectEnemy(effectParams);
    assert.strictEqual(enemyAttack.enemy, selectedEnemy);
    assert.equal(selectionDialog, undefined);
    assert.deepEqual(dealDamage.getValidTarget(effectParams), []);

    player.minions.push(otherEnemy);
    enemyAttack.resetForResolution();
    await enemyAttack.selectEnemy(effectParams);
    assert.deepEqual(
        selectionDialog.cards.map(({id}) => id),
        [otherEnemy.id, selectedEnemy.id]
    );
    assert.strictEqual(enemyAttack.enemy, otherEnemy);
    assert.deepEqual(dealDamage.getValidTarget(effectParams), [otherEnemy]);

    await dealDamage.prepare({
        ...effectParams,
        source: dealDamage.source,
    });
    assert.strictEqual(dealDamage.selectedTarget, otherEnemy);
    assert.equal(dealDamage.damage, 5);

    let damageCall;
    match.effectsFactory = {
        createEffect({damage, selectedTarget}) {
            return {
                takenDamage: damage,
                defeated: false,
                async runEffect() {
                    damageCall = {damage, selectedTarget};
                    selectedTarget.damage += damage;
                },
            };
        },
    };
    await dealDamage.execute(effectParams);

    assert.deepEqual(damageCall, {
        damage: 5,
        selectedTarget: otherEnemy,
    });
    assert.equal(selectedEnemy.damage, 0);
    assert.equal(otherEnemy.damage, 5);

    otherEnemy.isInPlay = false;
    selectedEnemy.attackable = true;
    const getAttackTargets =
        enemyAttack.validTarget.getValidTarget.bind(enemyAttack.validTarget);
    enemyAttack.validTarget.getValidTarget = () => [];
    enemyAttack.resetForResolution();
    dealDamage.resetResolutionState();

    assert.equal(await ability.canRun({card: gameCard, match, player}), true);
    assert.equal((await player.hand.toObjWithPlayability())[0].playable, true);
    selectionDialog = undefined;
    await enemyAttack.prepare(effectParams);
    assert.strictEqual(enemyAttack.enemy, selectedEnemy);
    assert.equal(selectionDialog, undefined);
    assert.equal(await enemyAttack.canRun(effectParams), false);
    assert.deepEqual(dealDamage.getValidTarget(effectParams), [selectedEnemy]);

    await dealDamage.prepare({
        ...effectParams,
        source: dealDamage.source,
    });
    await dealDamage.execute(effectParams);
    assert.deepEqual(damageCall, {
        damage: 5,
        selectedTarget: selectedEnemy,
    });
    assert.equal(selectedEnemy.damage, 5);

    selectedEnemy.attackable = false;
    enemyAttack.resetForResolution();
    dealDamage.resetResolutionState();
    assert.equal(await ability.canRun({card: gameCard, match, player}), false);
    assert.equal(
        (await player.hand.toObjWithPlayability())[0].playable,
        false
    );
    enemyAttack.validTarget.getValidTarget = getAttackTargets;
});
