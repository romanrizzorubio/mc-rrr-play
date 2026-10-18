import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    CARD_TYPE_ALLY,
    CARD_TYPE_MINION,
    PRIORITY_INTERRUPT,
    PRIORITY_RESPONSE,
    TARGET_YOUR_SUPERHERO,
    TRIGGER_ABILITY_RESOLVED,
    TRIGGER_CHARACTER_DEFEATED,
    TRIGGER_CHARACTER_SCHEMES,
    TRIGGER_CHARACTER_TAKES_DAMAGE,
    TRIGGER_SURGE,
    TRIGGER_THIS_PLAY_CARD,
    TRIGGER_YOU_END_PLAY_CARD,
} from 'mc-shared';
import {Ability} from '../../src/abilities/core/ability.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {EnemySchemeEffect} from '../../src/effects/enemy-scheme-effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {ResolveSurgeEffect} from '../../src/effects/resolve-surge-effect.js';
import {AbilityResolvedTrigger} from '../../src/triggers/ability-resolved-trigger.js';
import {
    CharacterDefeatedTrigger
} from '../../src/triggers/character-defeated-trigger.js';
import {
    CharacterSchemesTrigger
} from '../../src/triggers/character-schemes-trigger.js';
import {
    CharacterTakesDamageTrigger
} from '../../src/triggers/character-takes-damage-trigger.js';
import {SurgeTrigger} from '../../src/triggers/surge-trigger.js';
import {ThisPlayCardTrigger} from '../../src/triggers/this-play-card-trigger.js';
import {YouEndPlayCardTrigger} from '../../src/triggers/you-end-play-card-trigger.js';
import {TriggersFactory} from '../../src/factory/triggers/triggers-factory.js';

test('generic character trigger types are registered with their parameters', () => {
    const triggersFactory = new TriggersFactory({});
    const card = {};
    const ability = {};
    const defeated = triggersFactory.createTrigger({
        ability,
        card,
        triggerParams: {
            characterType: CARD_TYPE_ALLY,
            controlledByYou: true,
        },
        type: TRIGGER_CHARACTER_DEFEATED,
    });
    const schemes = triggersFactory.createTrigger({
        ability,
        card,
        triggerParams: {characterType: CARD_TYPE_MINION},
        type: TRIGGER_CHARACTER_SCHEMES,
    });
    const takesDamage = triggersFactory.createTrigger({
        ability,
        card,
        triggerParams: {target: TARGET_YOUR_SUPERHERO},
        type: TRIGGER_CHARACTER_TAKES_DAMAGE,
    });

    assert.ok(defeated instanceof CharacterDefeatedTrigger);
    assert.equal(defeated.characterType, CARD_TYPE_ALLY);
    assert.equal(defeated.controlledByYou, true);
    assert.ok(schemes instanceof CharacterSchemesTrigger);
    assert.equal(schemes.characterType, CARD_TYPE_MINION);
    assert.ok(takesDamage instanceof CharacterTakesDamageTrigger);
    assert.equal(takesDamage.target, TARGET_YOUR_SUPERHERO);
});

test('resolved abilities publish the resolving card and its controller snapshot', async () => {
    const player = {};
    const sourceCard = {controller: player};
    const ability = new Ability({
        card: sourceCard,
        match: {},
    });
    let triggerEvent;
    ability.trigger = async (...args) => {
        triggerEvent = args;
    };

    await ability.resolveAbility({player});

    assert.equal(triggerEvent[0], PRIORITY_RESPONSE);
    assert.deepEqual(triggerEvent[1], [TRIGGER_ABILITY_RESOLVED]);
    assert.equal(triggerEvent[2].resolvedAbility, ability);
    assert.equal(triggerEvent[2].resolvedAbilityController, player);
});

test('ability-resolved responses require a controlled ability with a source card', async () => {
    const player = {};
    const otherPlayer = {};
    const trigger = new AbilityResolvedTrigger({
        card: {controller: player},
        ability: {canTrigger: () => true},
        trigger: TRIGGER_ABILITY_RESOLVED,
    });
    const params = {
        player,
        resolvedAbility: {card: {}},
        resolvedAbilityController: player,
    };

    assert.equal(await trigger.canTrigger(params), true);
    assert.equal(await trigger.canTrigger({
        ...params,
        resolvedAbilityController: otherPlayer,
    }), false);
    assert.equal(await trigger.canTrigger({
        ...params,
        resolvedAbility: {},
    }), false);
});

test('this-card play and you-play end triggers enforce their controller scope', async () => {
    const player = {};
    const otherPlayer = {};
    const card = {controller: player, id: 'played-card'};
    const ability = {canTrigger: () => true};
    const thisPlay = new ThisPlayCardTrigger({
        card,
        ability,
        trigger: TRIGGER_THIS_PLAY_CARD,
    });
    const youEndPlay = new YouEndPlayCardTrigger({
        card,
        ability,
        trigger: TRIGGER_YOU_END_PLAY_CARD,
    });

    assert.equal(await thisPlay.canTrigger({
        card,
        player: otherPlayer,
    }), true);
    assert.equal(await thisPlay.canTrigger({
        card: {id: 'different-card'},
        player,
    }), undefined);
    assert.equal(await youEndPlay.canTrigger({
        effect: {resolved: true},
        player,
    }), true);
    assert.equal(await youEndPlay.canTrigger({
        effect: {resolved: true},
        player: otherPlayer,
    }), false);
    assert.equal(await youEndPlay.canTrigger({
        effect: {resolved: false},
        player,
    }), false);

    const playCardEffect = new PlayCardEffect({
        card: {isUpgrade: false},
        match: {},
    });
    assert.ok(playCardEffect.getTriggersInit().includes(TRIGGER_THIS_PLAY_CARD));
    assert.ok(playCardEffect.getTriggersEnds().includes(TRIGGER_YOU_END_PLAY_CARD));
});

test('character-defeated triggers filter by type and retain control context', async () => {
    const player = {};
    const otherPlayer = {};
    const ally = {
        isCharacter: true,
        isAlly: true,
        isInPlay: false,
        type: CARD_TYPE_ALLY,
    };
    const trigger = new CharacterDefeatedTrigger({
        card: {controller: player},
        ability: {canTrigger: () => true},
        characterType: CARD_TYPE_ALLY,
        controlledByYou: true,
        trigger: TRIGGER_CHARACTER_DEFEATED,
    });
    const effect = {
        defeated: true,
        defeatedCharacter: ally,
        defeatedController: player,
        selectedTarget: ally,
    };

    assert.equal(await trigger.canTrigger({
        effect,
        defeatedController: player,
        player: otherPlayer,
    }), true);
    assert.equal(await trigger.canTrigger({
        effect: {...effect, defeatedCharacter: {...ally, isInPlay: true}},
        defeatedController: player,
        player,
    }), false);
    assert.equal(await trigger.canTrigger({
        effect: {...effect, defeatedCharacter: {...ally, type: CARD_TYPE_MINION}},
        defeatedController: player,
        player,
    }), false);
    assert.equal(await trigger.canTrigger({
        effect: {...effect, defeatedController: otherPlayer},
        defeatedController: otherPlayer,
        player,
    }), false);

    let abilityParams;
    trigger.ability.resolveAbility = async params => {
        abilityParams = params;
        trigger.ability.resolved = true;
    };
    await trigger.runCard({
        effect,
        card: ally,
        defeatedController: player,
        player: otherPlayer,
    });
    assert.equal(abilityParams.player, player);
    assert.equal(abilityParams.triggeredCard, ally);
});

test('character-scheme and Surge triggers expose their source card and player', async () => {
    const player = {};
    const otherPlayer = {};
    const listener = {controller: player};
    const ability = {
        canTrigger: () => true,
        async resolveAbility(params) {
            this.resolved = true;
            this.params = params;
        },
    };
    const minion = {
        isCharacter: true,
        isMinion: true,
        type: CARD_TYPE_MINION,
    };
    const schemeTrigger = new CharacterSchemesTrigger({
        card: listener,
        ability,
        characterType: CARD_TYPE_MINION,
        trigger: TRIGGER_CHARACTER_SCHEMES,
    });
    const schemeParams = {
        effect: {character: minion},
        player: otherPlayer,
    };

    assert.equal(await schemeTrigger.canTrigger(schemeParams), true);
    assert.equal(await schemeTrigger.canTrigger({
        ...schemeParams,
        effect: {character: {...minion, type: CARD_TYPE_ALLY}},
    }), false);
    await schemeTrigger.runCard(schemeParams);
    assert.equal(ability.params.player, player);
    assert.equal(ability.params.triggeredCard, minion);

    const surgeTrigger = new SurgeTrigger({
        card: listener,
        ability,
        trigger: TRIGGER_SURGE,
    });
    await surgeTrigger.runCard({player: otherPlayer});
    assert.equal(ability.params.player, player);
});

test('character-takes-damage trigger exposes actual damage and the attack context', async () => {
    const player = {
        superhero: {
            currentSide: {isSuperhero: true, name: 'Viuda Negra'},
        },
    };
    const otherPlayer = {superhero: {currentSide: {}}};
    const attacker = {isEnemy: true};
    const attack = {character: attacker};
    const trigger = new CharacterTakesDamageTrigger({
        card: {controller: player},
        ability: {canTrigger: () => true},
        target: TARGET_YOUR_SUPERHERO,
        trigger: TRIGGER_CHARACTER_TAKES_DAMAGE,
    });
    const effect = {
        activation: {character: attacker, effect: attack},
        isAttack: true,
        selectedTarget: player.superhero.currentSide,
        takenDamage: 2,
    };

    assert.equal(await trigger.canTrigger({effect, player: otherPlayer}), true);
    assert.equal(await trigger.canTrigger({
        effect: {...effect, takenDamage: 0},
        player: otherPlayer,
    }), false);
    assert.ok(!await trigger.canTrigger({
        effect: {...effect, selectedTarget: {isAlly: true}},
        player: otherPlayer,
    }));

    const abilityParams = trigger.getAbilityParams({
        effect,
        player: otherPlayer,
    });
    assert.equal(abilityParams.player, player);
    assert.equal(abilityParams.triggeredTarget, effect.selectedTarget);
    assert.equal(abilityParams.triggeredTargetDamage, 2);
    assert.equal(abilityParams.attack, attack);
});

test('minion plan resolution and Surge expose their trigger windows', async () => {
    const match = {
        activationsFactory: {
            createActivation: () => ({
                getTriggersEnds: () => [],
            }),
        },
    };
    const scheme = new EnemySchemeEffect({
        enemy: {
            isCharacter: true,
            isMinion: true,
            type: CARD_TYPE_MINION,
        },
        match,
    });
    const surge = new ResolveSurgeEffect({
        match: {
            scenario: {
                deck: {
                    cards: [],
                    discardPile: [],
                },
            },
            skipSurgeNotification: true,
        },
    });
    let surgeTrigger;
    surge.trigger = async (...args) => {
        surgeTrigger = args;
    };

    assert.ok(scheme.getTriggersEnds({}).includes(TRIGGER_CHARACTER_SCHEMES));
    await surge.execute({player: {}});
    assert.equal(surgeTrigger[0], PRIORITY_INTERRUPT);
    assert.deepEqual(surgeTrigger[1], [TRIGGER_SURGE]);
});

test('ally defeat captures control before the ally leaves play', async () => {
    const player = {};
    const ally = {
        controller: player,
        gameZone: {
            async refresh() {},
        },
        isCharacter: true,
        isAlly: true,
        isInPlay: true,
        type: CARD_TYPE_ALLY,
        async defeat() {
            this.controller = undefined;
            this.isInPlay = false;
        },
    };
    const effect = new DefeatEffect({
        match: {villain: undefined},
        selectedTarget: ally,
    });
    effect.trigger = async () => false;

    await effect.execute({player});

    assert.equal(effect.defeated, true);
    assert.equal(effect.defeatedCharacter, ally);
    assert.equal(effect.defeatedController, player);
    assert.equal(effect.getTriggersParams({}).defeatedController, player);
    assert.ok(effect.getTriggersEnds({}).includes(TRIGGER_CHARACTER_DEFEATED));
    assert.equal(ally.isInPlay, false);
});
