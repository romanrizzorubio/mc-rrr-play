import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    DIALOG_USE_CARD,
    CHARACTER_VILLAIN,
    EFFECT_DEAL_DAMAGE,
    EFFECT_TAKE_DAMAGE,
    LABEL_ATTACK,
    PRIORITY_CONSTANT,
    PRIORITY_FORCED_RESPONSE,
    PRIORITY_INTERRUPT,
    PRIORITY_RESPONSE,
    TRIGGER_END_PLAY_CARD,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_END_PLAY_CARD,
    TRIGGER_VILLAIN_ATTACKS_YOU,
    TRIGGER_YOU_WOULD_TAKE_DAMAGE,
} from 'mc-shared';
import {Ability} from '../../src/abilities/core/ability.js';
import {Attack} from '../../src/activations/attack.js';
import {
    CANCEL_ENCOUNTER_NOT,
    CANCEL_ENCOUNTER_REVEAL,
} from '../../src/effects/cancel-encounter-effect.js';
import {AbilitiesFactory} from '../../src/factory/abilities/abilities-factory.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {EffectsFactory} from '../../src/factory/effects/effects-factory.js';
import {Engine} from '../../src/engine/engine.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {TreacheryRevealTrigger} from '../../src/triggers/treachery-reveal-trigger.js';
import protectionEvents from '../../../mc-data/seed/catalog/aspects/protection/events.js';
import spiderman from '../../../mc-data/seed/catalog/heroes/spiderman.js';

test('Backflip is offered before attack damage is applied', async () => {
    const backflip = spiderman.config.cards.find(({card}) =>
        card.params.name === 'Voltereta hacia atrás');
    assert.ok(backflip);

    const match = {
        activationsFactory: {
            createActivation: () => ({
                filterTarget: () => true,
            }),
        },
        triggerCards: {},
    };
    const player = {
        canDefend: () => true,
        hand: {cards: []},
        isHero: true,
    };
    const card = {
        id: 'backflip',
        isEvent: true,
        owner: player,
        toObj() {
            return {id: this.id};
        },
        triggers: {},
    };
    let eventPlayed = false;
    player.triggerEvent = async trigger => {
        eventPlayed = trigger.ability === ability;

        return {triggered: eventPlayed, paymentCancelled: false};
    };

    const abilitiesFactory = new AbilitiesFactory({match});
    const ability = abilitiesFactory.createAbility(backflip.card.params.abilities[0]);
    ability.card = card;
    await ability.initTriggers(card);

    const attackDamage = new TakeDamageEffect({
        damage: 6,
        isAttack: true,
        match,
        selectedTarget: player,
    });
    const engine = new Engine();
    const openedDialogs = [];
    engine.match = match;
    engine.openDialog = async dialog => {
        openedDialogs.push(dialog);

        return {selected: {id: card.id}};
    };

    await engine.trigger(
        PRIORITY_INTERRUPT,
        [TRIGGER_YOU_WOULD_TAKE_DAMAGE],
        {effect: attackDamage, player}
    );

    assert.equal(openedDialogs[0].dialogType, DIALOG_USE_CARD);
    assert.equal(openedDialogs[0].data.cards[0].id, card.id);
    assert.equal(eventPlayed, true);
});

test('Backflip prevents all damage from the triggering attack', async () => {
    const backflip = spiderman.config.cards.find(({card}) =>
        card.params.name === 'Voltereta hacia atrás');
    assert.ok(backflip);

    const [ability] = backflip.card.params.abilities;
    const effect = new EffectsFactory({match: {}}).parseEffect(ability.params.effect);
    const attackDamage = {
        damage: 6,
        preventDamage: 0,
    };

    await effect.execute({effect: attackDamage});

    assert.equal(attackDamage.preventDamage, attackDamage.damage);
});

test('Poneos detras de mi resolves its attack against the villain', async () => {
    const event = protectionEvents.find(({_id}) =>
        _id === 'protection-poneos-detras-de-mi');
    assert.ok(event);

    const [ability] = event.card.params.abilities;
    const villain = {
        name: 'Rhino',
        toObj() {
            return {name: this.name};
        },
    };
    const hero = {
        name: 'Spider-Man',
        toObj() {
            return {name: this.name};
        },
    };
    const match = {
        villain,
        activationsFactory: {
            createActivation: () => ({
                filterTarget: () => true,
            }),
        },
    };
    const effect = new EffectsFactory({match}).parseEffect(ability.params.effect);
    const attack = effect.effects.find(_effect => _effect instanceof EnemyAttackEffect);
    let dialogTitle;

    assert.ok(attack);
    attack.openDialog = async ({title}) => {
        dialogTitle = title;
    };
    await attack.prepare({player: {superhero: hero}});

    assert.equal(attack.enemyType, CHARACTER_VILLAIN);
    assert.equal(attack.character, villain);
    assert.equal(dialogTitle, 'Rhino ataca a Spider-Man');
});

test('Poneos detras de mi is not offered after its treachery is canceled', async () => {
    const event = protectionEvents.find(({_id}) =>
        _id === 'protection-poneos-detras-de-mi');
    assert.ok(event);

    const [abilityConfig] = event.card.params.abilities;

    const match = {
        activationsFactory: {
            createActivation: () => ({
                canRun: async () => true,
                filterTarget: () => true,
            }),
        },
    };
    const ability = new AbilitiesFactory({match}).createAbility(abilityConfig);
    ability.card = {owner: undefined};
    const trigger = new TreacheryRevealTrigger({
        ability,
        card: event,
        trigger: abilityConfig.params.trigger,
    });
    const params = {
        player: {isHero: true},
        effect: {
            selectedTarget: {isTreachery: true},
            canceled: CANCEL_ENCOUNTER_NOT,
        },
    };

    assert.equal(abilityConfig.params.condition, undefined);
    assert.equal(ability.effect.matchAll, false);
    assert.equal(await trigger.canTrigger(params), true);

    params.effect.canceled = CANCEL_ENCOUNTER_REVEAL;
    assert.equal(await ability.effect.canRun(params), true);
    assert.equal(await trigger.canTrigger(params), false);
});

test('an attack event play wrapper does not create another attack context', () => {
    const attackEffect = {isAttack: false};
    const ability = new Ability({
        effect: attackEffect,
        labels: [LABEL_ATTACK],
        match: {},
    });
    const playCardEffect = new PlayCardEffect({
        ability,
        card: {isUpgrade: false},
        match: {},
    });

    ability.prepareEffect();

    assert.equal(playCardEffect.isAttack, false);
    assert.equal(attackEffect.isAttack, true);
    assert.ok(!playCardEffect.isActivation);
    assert.equal(playCardEffect.activation, undefined);
    assert.deepEqual(playCardEffect.getTriggersEnds(), [
        TRIGGER_END_PLAY_CARD,
        TRIGGER_THIS_END_PLAY_CARD,
    ]);
});

test('enemy attack opens its response window with the resolved defense state', async () => {
    const match = {
        activationsFactory: {
            createActivation: () => ({
                getForcedResponseTriggers: () => [],
                getTriggersEnds: () => [TRIGGER_THIS_ATTACK],
            }),
        },
    };
    const effect = new EnemyAttackEffect({
        enemy: {},
        match,
    });
    effect.defender = {isHero: true};
    effect.resolveDelayedEffects = async () => {};
    const triggerCalls = [];
    effect.trigger = async (priority, types, params) => {
        triggerCalls.push({
            priority,
            types,
            defended: params.effect.isDefended,
        });
        return true;
    };

    await effect.triggerEnds({effect});

    assert.deepEqual(triggerCalls.map(({priority}) => priority), [
        PRIORITY_CONSTANT,
        PRIORITY_FORCED_RESPONSE,
        PRIORITY_RESPONSE,
    ]);
    assert.ok(triggerCalls[2].types.includes(TRIGGER_THIS_ATTACK));
    assert.ok(triggerCalls[2].types.includes(TRIGGER_VILLAIN_ATTACKS_YOU));
    assert.equal(triggerCalls[2].defended, true);
});

test('retaliation resolves after a defended enemy attack with or without damage', async () => {
    const retaliationDamage = [];
    const player = {hand: {cards: []}};
    const attacker = {
        name: 'Rino',
        async getAttackValue() {
            return 2;
        },
    };
    const defender = {
        id: 'pantera-negra',
        name: 'Pantera Negra',
        card: {retaliate: 1},
        isEnemy: false,
        isInPlay: true,
        owner: player,
        async getLife() {
            return 3;
        },
        toObj() {
            return {id: this.id, name: this.name};
        },
    };

    for (const damage of [0, 1]) {
        const match = {
            triggerCards: {},
            enemies: [attacker],
            activationsFactory: {
                createActivation: ({effect}) => new Attack({effect}),
            },
            effectsFactory: {
                createEffect: ({type, damage: amount, selectedTarget}) => {
                    if (type === EFFECT_TAKE_DAMAGE) {
                        return {
                            takenDamage: amount,
                            async runEffect() {},
                        };
                    }

                    assert.equal(type, EFFECT_DEAL_DAMAGE);

                    return {
                        async runEffect() {
                            retaliationDamage.push({
                                damage: amount,
                                target: selectedTarget.name,
                            });
                        },
                    };
                },
            },
            async openDialog({data}) {
                return {selected: {id: data.cards[0].id}};
            },
        };
        const effect = new EnemyAttackEffect({enemy: attacker, match});
        effect.selectedTarget = player;
        effect.defender = defender;
        effect.defValue = 2 - damage;
        effect.prepare = async () => {};
        effect.dealBoostCards = async () => {};
        effect.defense = async () => {};
        effect.resolveBoostCards = async () => 0;

        await effect.runEffect({player});
    }

    assert.deepEqual(retaliationDamage, [
        {damage: 1, target: 'Rino'},
        {damage: 1, target: 'Rino'},
    ]);
});

test('retaliation resolves before the response to the enemy attack', async () => {
    const resolved = [];
    const attacker = {name: 'Rhino'};
    const defender = {
        card: {retaliate: 1},
        isEnemy: false,
        isInPlay: true,
        async getLife() {
            return 3;
        },
    };
    const player = {};
    const match = {
        activationsFactory: {
            createActivation: ({effect}) => new Attack({effect}),
        },
        enemies: [attacker],
        effectsFactory: {
            createEffect: () => ({
                async runEffect() {
                    resolved.push('retaliation');
                },
            }),
        },
    };
    const damageEffect = new DealDamageEffect({
        character: attacker,
        isAttack: true,
        match,
        selectedTarget: defender,
    });
    damageEffect.resolveDelayedEffects = async () => {};
    damageEffect.trigger = async (priority, types, params, additionalTriggers = []) => {
        if (priority === PRIORITY_FORCED_RESPONSE && types.includes(TRIGGER_THIS_ATTACK)) {
            for (const trigger of additionalTriggers) {
                if (await trigger.canTrigger(params)) {
                    await trigger.runTrigger(params);
                }
            }
        }
        return true;
    };

    const enemyAttackEffect = new EnemyAttackEffect({
        enemy: attacker,
        match,
    });
    enemyAttackEffect.resolveDelayedEffects = async () => {};
    enemyAttackEffect.trigger = async (priority, types) => {
        if (priority === PRIORITY_RESPONSE && types.includes(TRIGGER_VILLAIN_ATTACKS_YOU)) {
            resolved.push('counterpunch');
        }
        return true;
    };

    await damageEffect.triggerEnds({effect: damageEffect, player});
    await enemyAttackEffect.triggerEnds({effect: enemyAttackEffect, player});

    assert.deepEqual(resolved, ['retaliation', 'counterpunch']);
});
