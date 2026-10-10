import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    TARGET_ALL_ALLIES_YOU_CONTROL,
    TARGET_CONDITION_CARD,
    TARGET_ALL_HEROES,
    TARGET_ENGAGED,
    TARGET_ENGAGED_HERO,
    TRAIT_MASTERS_OF_EVIL,
} from 'mc-shared';
import {Ability} from '../../src/abilities/core/ability.js';
import {ChangeAttackTargetsEffect} from '../../src/effects/change-attack-targets-effect.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {DoIfEffect} from '../../src/effects/do-if-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {ExhaustEffect} from '../../src/effects/exhaust-effect.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {RequireDefenderEffect} from '../../src/effects/require-defender-effect.js';
import {SeveralAttacksEffect} from '../../src/effects/several-attacks-effect.js';
import {Match} from '../../src/model/match/match.js';
import mastersOfEvil from '../../../mc-data/seed/catalog/sets/masters-of-evil.js';

const makeMastersOfEvilAttack = engagedPlayer => {
    const minion = {
        id: 'masters-minion',
        isMinion: true,
        isInPlay: true,
        traits: [TRAIT_MASTERS_OF_EVIL],
        engaged: engagedPlayer,
    };
    const match = new Match({mc: {}, name: 'test-match'});
    match.scenario = {
        gameZone: {
            searchCards() {
                return [];
            },
        },
    };
    match.players = [{
        minions: [minion],
        gameZone: {
            searchCards() {
                return [];
            },
        },
    }];

    const effect = new SeveralAttacksEffect({
        attackTarget: TARGET_ENGAGED_HERO,
        condition: {
            isMinion: true,
            isInPlay: true,
            traits: [TRAIT_MASTERS_OF_EVIL],
        },
        enemiesType: TARGET_CONDITION_CARD,
        match,
    });
    const attacks = [];
    effect.resolveAttack = async (enemy, target) => {
        attacks.push({enemy, target});
        effect.attacks.push({enemy, target});
    };

    return {attacks, effect, match, minion};
};

test('several attacks resolve the configured all-heroes target', async () => {
    const playerBeingAttacked = {id: 'player-being-attacked'};
    const otherHero = {id: 'other-hero'};
    const anotherHero = {id: 'another-hero'};
    const enemy = {};
    const match = {
        heroes: [playerBeingAttacked, otherHero, anotherHero],
    };
    const attacks = [];
    const effect = new SeveralAttacksEffect({
        attackTarget: TARGET_ALL_HEROES,
        match,
    });

    effect.resolveAttack = async (attacker, target) => {
        attacks.push({attacker, target});
    };

    await effect.activate(enemy, {player: playerBeingAttacked});

    assert.deepEqual(attacks, [
        {attacker: enemy, target: playerBeingAttacked},
        {attacker: enemy, target: otherHero},
        {attacker: enemy, target: anotherHero},
    ]);
});

test('several attacks target each minion engaged player', async () => {
    const engagedPlayer = {id: 'engaged-player'};
    const enemy = {engaged: engagedPlayer};
    const attacks = [];
    const effect = new SeveralAttacksEffect({
        attackTarget: TARGET_ENGAGED,
        match: {},
    });

    effect.resolveAttack = async (attacker, target) => {
        attacks.push({attacker, target});
    };

    await effect.activate(enemy, {player: {id: 'revealing-player'}});

    assert.deepEqual(attacks, [{attacker: enemy, target: engagedPlayer}]);
});

test('Señores del Caos finds engaged Masters of Evil minions before its fallback', async () => {
    const engagedPlayer = {id: 'engaged-player', isHero: true};
    const {attacks, effect, match, minion} =
        makeMastersOfEvilAttack(engagedPlayer);
    const chaos = mastersOfEvil.config.cards.find(({card}) =>
        card.params.name === 'Señores del Caos');
    const attackTarget = chaos.card.params.abilities[0].params.effect
        .params.effects[0].params.attackTarget;

    await effect.prepare({player: engagedPlayer});
    await effect.execute({player: engagedPlayer});

    assert.equal(attackTarget, TARGET_ENGAGED_HERO);
    assert.deepEqual(attacks, [{enemy: minion, target: engagedPlayer}]);

    const fallback = new DoIfEffect({
        condition: {'effects.0.attacks.length': 0},
        match,
    });
    assert.equal(fallback.checkCondition({effects: [effect]}), false);
});

test('Señores del Caos uses its fallback instead of attacking a player in alter ego', async () => {
    const engagedPlayer = {id: 'alter-ego-player', isHero: false};
    const {attacks, effect, match} = makeMastersOfEvilAttack(engagedPlayer);

    await effect.prepare({player: engagedPlayer});
    await effect.execute({player: engagedPlayer});

    assert.deepEqual(attacks, []);

    const fallback = new DoIfEffect({
        condition: {'effects.0.attacks.length': 0},
        match,
    });
    assert.equal(fallback.checkCondition({effects: [effect]}), true);
});

test('change attack targets replaces the target list and keeps the original boost target', () => {
    const originalTarget = {id: 'original-target'};
    const otherHero = {id: 'other-hero'};
    const anotherHero = {id: 'another-hero'};
    const attack = new EnemyAttackEffect({
        match: {},
        selectedTarget: originalTarget,
    });
    const effect = new ChangeAttackTargetsEffect({
        match: {},
        selectedTarget: [otherHero, anotherHero],
    });

    effect.execute({attack: {effect: attack}});

    assert.deepEqual(attack.selectedTarget, [
        otherHero,
        anotherHero,
    ]);
    assert.equal(attack.originalAttackTarget, originalTarget);
    assert.equal(attack.getBoostTarget(), originalTarget);
});

test('a multi-target enemy attack asks every hero for a separate defense', async () => {
    const dialogs = [];
    const createPlayer = id => {
        const player = {
            id,
            hand: {cards: []},
            toObj() {
                return {id};
            },
        };
        const ally = {
            id: `${id}-ally`,
            isAlly: true,
            toObj() {
                return {id: this.id};
            },
        };
        player.owner = player;
        player.defenders = [ally];

        return {player, ally};
    };
    const first = createPlayer('first-player');
    const second = createPlayer('second-player');
    const enemy = {
        toObj() {
            return {name: 'Torbellino'};
        },
    };
    const attack = new EnemyAttackEffect({
        enemy,
        match: {
            async openDialog(dialog) {
                dialogs.push({
                    target: dialog.data.attack.target.id,
                    hand: dialog.hand,
                });

                return {defender: {id: `${dialog.data.attack.target.id}-ally`}};
            },
        },
        selectedTarget: [first.player, second.player],
    });
    attack.setDefender = async (defender, target) => {
        attack.defendersByTarget.set(target, defender);
    };

    await attack.defense({player: first.player});

    assert.deepEqual(dialogs, [
        {target: first.player.id, hand: []},
        {target: second.player.id, hand: []},
    ]);
    assert.equal(attack.defendersByTarget.get(first.player), first.ally);
    assert.equal(attack.defendersByTarget.get(second.player), second.ally);
});

test('a multi-target attack resolves one damage effect with target-specific defense', async () => {
    const firstHero = {id: 'first-hero'};
    const secondHero = {id: 'second-hero'};
    const secondHeroAlly = {id: 'second-hero-ally'};
    const enemy = {};
    const attack = new EnemyAttackEffect({
        character: enemy,
        enemy,
        match: {},
        selectedTarget: [firstHero, secondHero],
    });
    attack.defendersByTarget.set(secondHero, secondHeroAlly);
    attack.defenseValues.set(firstHero, 1);
    attack.dealBoostCards = async () => {};
    attack.defense = async () => {};
    attack.resolveBoostCards = async () => 2;
    attack.getAttackValue = async () => 3;
    attack.activation = {takenDamage: 0};

    const originalRunEffect = DealDamageEffect.prototype.runEffect;
    const damageEffects = [];
    DealDamageEffect.prototype.runEffect = async function runEffect() {
        damageEffects.push({
            damage: this.baseDamage,
            selectedTarget: this.selectedTarget,
        });
        this.takenDamage = this.baseDamage;
    };

    try {
        await attack.execute({player: firstHero});
    } finally {
        DealDamageEffect.prototype.runEffect = originalRunEffect;
    }

    assert.deepEqual(damageEffects, [{
        damage: [4, 5],
        selectedTarget: [firstHero, secondHeroAlly],
    }]);
    assert.deepEqual(attack.attacked, [firstHero, secondHeroAlly]);
    assert.deepEqual(attack.activation.takenDamage, [4, 5]);
});

test('tough prevents group damage only for the hero with tough', async () => {
    const toughHero = {
        isPlayer: true,
        superhero: {
            currentSide: {
                isTough: true,
                removeTough() {
                    this.isTough = false;
                },
                async refresh() {},
            },
        },
    };
    const otherHero = {
        isTough: false,
        async refresh() {},
    };
    const damage = new TakeDamageEffect({
        damage: [2, 2],
        match: {},
        selectedTarget: [toughHero, otherHero],
    });
    damage.trigger = async () => true;

    assert.equal(await damage.triggerWould({player: {}}), true);
    assert.deepEqual(damage.damage, [0, 2]);
    assert.deepEqual(damage.takenDamage, [0, 2]);
    assert.equal(toughHero.superhero.currentSide.isTough, false);
});

test('require defender mandates an eligible ally and keeps normal defense options otherwise', async () => {
    const createDefender = (id, isAlly) => ({
        id,
        isAlly,
        isSuperhero: false,
        toObj() {
            return {id: this.id};
        },
    });
    const firstAlly = createDefender('first-ally', true);
    const secondAlly = createDefender('second-ally', true);
    const hero = createDefender('hero', false);
    const player = {
        id: 'player',
        owner: {hand: {cards: []}},
        defenders: [hero, firstAlly, secondAlly],
        toObj() {
            return {id: this.id};
        },
    };
    const enemy = {
        toObj() {
            return {name: 'Fundidor'};
        },
    };
    const attack = new EnemyAttackEffect({
        enemy,
        match: {},
        selectedTarget: player,
    });
    let dialogOptions;
    let dialogResponse = {defender: {id: secondAlly.id}};
    let selectedDefender;
    attack.openDialog = async options => {
        dialogOptions = options;

        return dialogResponse;
    };
    attack.setDefender = async defender => {
        selectedDefender = defender;
    };

    const effect = new RequireDefenderEffect({
        condition: {isAlly: true},
        match: {},
    });
    effect.execute({attack: {effect: attack}});

    await attack.defense({player});

    assert.equal(dialogOptions.hideOk, true);
    assert.deepEqual(
        dialogOptions.data.defenders.map(({id}) => id),
        [firstAlly.id, secondAlly.id]
    );
    assert.equal(selectedDefender, secondAlly);

    dialogResponse = {defender: null};
    await assert.rejects(
        attack.defense({player}),
        /requires a qualifying defender/
    );

    player.defenders = [hero];
    await attack.defense({player});
    assert.equal(dialogOptions.hideOk, false);
    assert.deepEqual(
        dialogOptions.data.defenders.map(({id}) => id),
        [hero.id]
    );
});

test('attack resolves undefended if no defender is available', async () => {
    const target = {
        id: 'target',
        defenders: [],
    };
    const enemy = {};
    const attack = new EnemyAttackEffect({
        character: enemy,
        enemy,
        match: {},
        selectedTarget: target,
    });
    let openedDefense = false;
    attack.openDialog = async () => {
        openedDefense = true;
    };
    attack.addDefenderCondition({isAlly: true});
    attack.dealBoostCards = async () => {};
    attack.resolveBoostCards = async () => 0;
    attack.getAttackValue = async () => 2;
    attack.activation = {takenDamage: 0};

    const originalRunEffect = DealDamageEffect.prototype.runEffect;
    let dealtDamage;
    DealDamageEffect.prototype.runEffect = async function runEffect() {
        dealtDamage = {
            damage: this.baseDamage,
            target: this.selectedTarget,
        };
    };

    try {
        await attack.execute({player: target});
    } finally {
        DealDamageEffect.prototype.runEffect = originalRunEffect;
    }

    assert.equal(openedDefense, false);
    assert.deepEqual(dealtDamage, {damage: 2, target});
});

test('exhaust effect exhausts every selected ally and refreshes each game zone once', async () => {
    let zoneRefreshes = 0;
    const gameZone = {
        async refresh() {
            zoneRefreshes += 1;
        },
    };
    const exhaustedAllies = [];
    const createAlly = id => ({
        id,
        exhausted: false,
        gameZone,
        exhaust() {
            this.exhausted = true;
            exhaustedAllies.push(id);
        },
        async refresh() {},
    });
    const allies = [createAlly('ally-1'), createAlly('ally-2')];
    const effect = new ExhaustEffect({match: {}});
    effect.selectedTarget = allies;

    await effect.execute();

    assert.deepEqual(exhaustedAllies, ['ally-1', 'ally-2']);
    assert.equal(zoneRefreshes, 1);
    assert.ok(allies.every(ally => ally.exhausted));
});

test('Fundidor boost exhausts only allies controlled by the player resolving it', async () => {
    const createAlly = id => ({
        id,
        exhausted: false,
        exhaust() {
            this.exhausted = true;
        },
        async refresh() {},
    });
    const playerAlly = createAlly('player-ally');
    const otherPlayerAlly = createAlly('other-player-ally');
    const player = {allies: [playerAlly]};
    const otherPlayer = {allies: [otherPlayerAlly]};
    const match = {
        triggerCards: {},
        async openDialog() {
            return {};
        },
    };
    const card = {
        boost: 2,
        toObj() {
            return {};
        },
        async discard() {},
    };
    card.boostAbility = new Ability({
        card,
        effect: new ExhaustEffect({
            match,
            target: TARGET_ALL_ALLIES_YOU_CONTROL,
        }),
        match,
    });

    const enemy = {};
    const attack = new EnemyAttackEffect({
        enemy,
        match,
        selectedTarget: player,
    });
    attack.activation = {
        getTriggersParams(params) {
            return params;
        },
        getTriggersEnds() {
            return [];
        },
        getTriggersInit() {
            return [];
        },
        getTriggersWould() {
            return [];
        },
    };
    attack.changeAttackTargets([player, otherPlayer]);
    attack.boostCards = [card];

    await attack.resolveBoostCards({player});

    assert.equal(playerAlly.exhausted, true);
    assert.equal(otherPlayerAlly.exhausted, false);
});
