import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_HERO_INTERRUPT,
    DIALOG_ACTIVATE,
    DIALOG_DEFENSE,
    DIALOG_USE_CARD,
    CHARACTER_VILLAIN,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DELAYED,
    EFFECT_DO_IF,
    EFFECT_MODIFY_DEFENSE_VALUE,
    EFFECT_READY,
    EFFECT_TAKE_DAMAGE,
    LABEL_ATTACK,
    PRIORITY_CONSTANT,
    PRIORITY_FORCED_RESPONSE,
    PRIORITY_INTERRUPT,
    PRIORITY_RESPONSE,
    TARGET_ATTACKER,
    TRIGGER_END_PLAY_CARD,
    TRIGGER_HERO_DEFENDS_ATTACK,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_END_PLAY_CARD,
    TRIGGER_YOU_END_PLAY_CARD,
    TRIGGER_VILLAIN_ATTACKS_YOU,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
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

test('enemy attacks show a directly selected hero in the activation dialog', async () => {
    const hero = {
        name: 'Spider-Man',
        async getEffectiveStats() {
            return {
                attack: 3,
                defense: 2,
                hitPoints: 10,
                life: 8,
                recovery: 3,
                thwart: 2,
            };
        },
        toObj() {
            return {name: this.name, attack: 2};
        },
    };
    const scorpion = {
        name: 'Escorpión',
        async getAttackValue() {
            return 2;
        },
        async getEffectiveStats({attack} = {}) {
            return {
                attack,
                defense: 1,
                hitPoints: 5,
                life: 5,
                recovery: 0,
                thwart: 0,
            };
        },
        toObj() {
            return {name: this.name, attack: 1};
        },
    };
    const attack = new EnemyAttackEffect({
        enemy: scorpion,
        match: {},
        selectedTarget: hero,
    });
    let dialog;
    attack.openDialog = async params => {
        dialog = params;
    };

    await attack.prepare({player: hero});

    assert.equal(dialog.dialogType, DIALOG_ACTIVATE);
    assert.equal(dialog.title, 'Escorpión ataca a Spider-Man');
    assert.equal(dialog.data.target.name, 'Spider-Man');
    assert.equal(dialog.data.target.attack, 3);
    assert.equal(dialog.data.target.defense, 2);
    assert.equal(dialog.data.character.attack, 2);
    assert.equal(dialog.data.character.defense, 1);
    assert.equal(dialog.data.emphasizedStat, 'attack');
});

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
        isPlayer: true,
        superhero: {
            currentSide: {
                id: 'spider-man-hero-side',
                name: 'Spider-Man',
            },
        },
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
    player.hand.cards.push(card);
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
        [TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE],
        {effect: attackDamage, player}
    );

    assert.equal(openedDialogs[0].dialogType, DIALOG_USE_CARD);
    assert.equal(openedDialogs[0].data.cards[0].id, card.id);
    assert.equal(eventPlayed, true);
});

test('Backflip confirmation shows the damage and character before playing the event', async () => {
    const backflip = spiderman.config.cards.find(({card}) =>
        card.params.name === 'Voltereta hacia atrás');
    assert.ok(backflip);

    let confirmation;
    const match = {
        activationsFactory: {
            createActivation: () => undefined,
        },
        players: [],
        triggerCards: {},
        openDialog: async dialog => {
            confirmation = dialog;

            return {confirmed: true};
        },
    };
    const damagedCharacter = {
        image: 'heroes/spiderman/peter1.webp',
        name: 'Spider-Man',
        toObj() {
            return {
                image: this.image,
                name: this.name,
            };
        },
    };
    const player = {
        isHero: true,
        isPlayer: true,
        superhero: {
            currentSide: damagedCharacter,
        },
    };
    match.players.push(player);
    const card = {
        id: 'backflip',
        image: 'heroes/spiderman/05002.png',
        isEvent: true,
        name: 'Voltereta hacia atrás',
        owner: player,
        triggers: {},
        toObj() {
            return {
                id: this.id,
                image: this.image,
                name: this.name,
            };
        },
    };
    const ability = new AbilitiesFactory({match})
        .createAbility(backflip.card.params.abilities[0]);
    ability.card = card;
    assert.equal(ability.prePlayConfirmation, undefined);
    assert.equal(typeof ability.confirmBeforeResolve, 'undefined');
    assert.equal(ability.effect.requiresPrePlayConfirmation, true);
    await ability.initTriggers(card);
    const trigger = card.triggers[TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE]
        [PRIORITY_INTERRUPT][0];
    const effect = new TakeDamageEffect({
        damage: 4,
        isAttack: true,
        match,
        selectedTarget: player,
    });
    const triggerParams = trigger.getAbilityParams(
        effect.getTriggersParams({match, player})
    );
    const playCardEffect = new PlayCardEffect({ability, card, match});

    assert.equal(await playCardEffect.confirmBeforePlay({
        ...triggerParams,
        player,
    }), true);

    assert.equal(confirmation.title, 'Voltereta hacia atrás');
    assert.equal(confirmation.data.preventedDamage, 4);
    assert.equal(confirmation.data.card.image, card.image);
    assert.equal(playCardEffect.prePlayConfirmationAcceptedFor, ability.effect);
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

test('Defensa hábil previews current enemy attack and successive defense bonuses', async () => {
    const event = protectionEvents.find(({card}) =>
        card.params.name === 'Defensa hábil');
    assert.ok(event);

    const dialogs = [];
    const match = {
        openDialog: async dialog => {
            dialogs.push(dialog);

            return {confirmed: true};
        },
    };
    const abilitiesFactory = new AbilitiesFactory({match});
    const createAbility = () =>
        abilitiesFactory.createAbility(event.card.params.abilities[0]);
    const attack = new EnemyAttackEffect({
        enemy: {
            name: 'Rhino',
            getAttackValue: async () => 2,
        },
        match,
    });
    attack.defender = {
        isHero: true,
        name: 'Spider-Man',
        getDefenseValue: async () => 2,
    };
    attack.modifyDefense = 1;

    const firstAbility = createAbility();
    firstAbility.card = {name: 'Defensa hábil'};
    assert.equal(firstAbility.effect.requiresPrePlayConfirmation, true);
    assert.equal(firstAbility.effect.prePlayConfirmation, undefined);
    assert.equal(await firstAbility.effect.confirmBeforeResolve({
        effect: attack,
        player: {},
    }), true);
    assert.equal(dialogs[0].title, 'Defensa hábil');
    assert.equal(dialogs[0].subtitle, undefined);
    assert.deepEqual(dialogs[0].data.defenseBonus, {
        enemyName: 'Rhino',
        attackValue: 2,
        defenderName: 'Spider-Man',
        defenseValue: 3,
        bonus: 3,
        totalDefense: 6,
    });

    firstAbility.effect.selectedTarget = attack;
    await firstAbility.effect.execute({});

    const secondAbility = createAbility();
    secondAbility.card = {name: 'Defensa hábil'};
    await secondAbility.effect.confirmBeforeResolve({
        effect: attack,
        player: {},
    });
    assert.deepEqual(dialogs[1].data.defenseBonus, {
        enemyName: 'Rhino',
        attackValue: 2,
        defenderName: 'Spider-Man',
        defenseValue: 6,
        bonus: 3,
        totalDefense: 9,
    });
});

test('Defensa desesperada delays its ready effect until the attack ends', async () => {
    const event = protectionEvents.find(({_id}) =>
        _id === 'protection-defensa-desesperada');
    assert.ok(event);
    const [abilityConfig] = event.card.params.abilities;

    assert.equal(event.card.params.abilities.length, 1);
    assert.equal(abilityConfig.type, ABILITY_HERO_INTERRUPT);
    assert.equal(abilityConfig.params.trigger, TRIGGER_HERO_DEFENDS_ATTACK);
    assert.equal(abilityConfig.params.effect.type, EFFECT_CHAINED);
    assert.equal(
        abilityConfig.params.effect.params.effects[0].type,
        EFFECT_MODIFY_DEFENSE_VALUE
    );
    assert.equal(
        abilityConfig.params.effect.params.effects[1].type,
        EFFECT_DELAYED
    );
    assert.equal(
        abilityConfig.params.effect.params.effects[1].params.effect.type,
        EFFECT_DO_IF
    );
    assert.equal(
        abilityConfig.params.effect.params.effects[1].params.effect.params.effect.type,
        EFFECT_READY
    );

    const player = {
        canDefend: () => true,
        isHero: true,
        isPlayer: true,
    };
    const hero = {
        exhausted: true,
        isHero: true,
        owner: player,
        ready() {
            this.exhausted = false;
        },
        async refresh() {},
    };
    player.superhero = {
        currentSide: hero,
    };
    const match = {
        activationsFactory: {
            createActivation: () => ({
                checkStatus: () => true,
                filterTarget: () => true,
                getTriggersEnds: () => [],
                getTriggersInit: () => [],
                getTriggersParams: params => params,
                getTriggersWould: () => [],
            }),
        },
        triggerCards: {},
    };
    const abilitiesFactory = new AbilitiesFactory({match});
    match.effectsFactory = abilitiesFactory.effectsFactory;
    const ability = abilitiesFactory.createAbility(abilityConfig);
    ability.card = {
        id: 'desperate-defense',
        isEvent: true,
        owner: player,
    };
    const createAttack = takenDamage => {
        const attack = new EnemyAttackEffect({
            enemy: {
                async getAttackValue() {
                    return 2;
                },
                name: 'Rhino',
            },
            match,
            selectedTarget: player,
            activation: {
                checkStatus() {
                    return true;
                },
                getTriggersInit() {
                    return [];
                },
                takenDamage,
                getTriggersEnds() {
                    return [];
                },
                getTriggersParams(params) {
                    return params;
                },
                getTriggersWould() {
                    return [];
                },
            },
        });
        attack.defender = hero;
        attack.defValue = 2;
        attack.defense = async () => {};

        return attack;
    };

    const noDamageAttack = createAttack(0);
    await ability.resolveAbility({
        arrowPaid: true,
        effect: noDamageAttack,
        player,
    });
    assert.equal(noDamageAttack.modifyDefense, 2);
    assert.equal(hero.exhausted, true);
    assert.equal(noDamageAttack.delayedEffects.length, 1);

    await noDamageAttack.execute({player});
    assert.equal(hero.exhausted, false);

    await noDamageAttack.triggerEnds({
        effect: noDamageAttack,
        match,
        player,
    });
    assert.equal(hero.exhausted, false);

    hero.exhausted = true;
    const damageAttack = createAttack(1);
    await ability.resolveAbility({
        arrowPaid: true,
        effect: damageAttack,
        player,
    });
    await damageAttack.triggerEnds({
        effect: damageAttack,
        match,
        player,
    });
    assert.equal(hero.exhausted, true);
});

test('Poneos detras de mi resolves its attack against the villain', async () => {
    const event = protectionEvents.find(({_id}) =>
        _id === 'protection-poneos-detras-de-mi');
    assert.ok(event);

    const [ability] = event.card.params.abilities;
    const villain = {
        name: 'Rhino',
        async getAttackValue() {
            return 2;
        },
        async getEffectiveStats() {
            return {};
        },
        toObj() {
            return {name: this.name};
        },
    };
    const hero = {
        name: 'Spider-Man',
        async getEffectiveStats() {
            return {};
        },
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

test('Contragolpe targets the attacker of the defended attack', async () => {
    const event = protectionEvents.find(({_id}) =>
        _id === 'protection-contragolpe');
    assert.ok(event);

    const [ability] = event.card.params.abilities;
    const attacker = {id: 'rhino', name: 'Rhino'};
    const otherEnemy = {id: 'ultron', name: 'Ultron'};
    const match = {
        enemies: [attacker, otherEnemy],
    };
    const effect = new EffectsFactory({match}).parseEffect(ability.params.effect);

    assert.equal(ability.params.effect.params.target, TARGET_ATTACKER);

    const selectedTarget = await effect.selectTarget({
        attack: {character: attacker},
        match,
        player: {},
    });

    assert.equal(selectedTarget, attacker);
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
        TRIGGER_YOU_END_PLAY_CARD,
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

test('defense dialog shows effective hit points for each defender', async () => {
    const player = {hand: {cards: []}};
    const defender = {
        id: 'spider-man',
        isSuperhero: true,
        currentSide: {
            async getDefenseValue() {
                return 3;
            },
        },
        async getEffectiveStats() {
            return {hitPoints: 16, life: 13};
        },
        toObj() {
            return {
                id: this.id,
                hitPoints: 15,
                life: 12,
            };
        },
    };
    const attackTarget = {
        defenders: [defender],
        name: 'Spider-Man',
        owner: player,
        toObj() {
            return {name: this.name};
        },
    };
    const effect = new EnemyAttackEffect({
        enemy: {name: 'Rino'},
        match: {},
    });
    effect.selectedTarget = attackTarget;
    effect.getAttackValue = async () => 5;
    effect.toObj = () => ({character: {attack: 2}});
    let defenseDialog;
    effect.openDialog = async dialog => {
        defenseDialog = dialog;

        return {defender: {id: defender.id}};
    };
    effect.setDefender = async (selectedDefender, target) => {
        effect.defendersByTarget.set(target, selectedDefender.currentSide);
    };

    await effect.defense({player});

    assert.equal(defenseDialog.dialogType, DIALOG_DEFENSE);
    assert.equal(defenseDialog.data.attack.character.attack, 5);
    assert.deepEqual(defenseDialog.data.defenders.map(({hitPoints, life}) => ({
        hitPoints,
        life,
    })), [
        {hitPoints: 16, life: 13},
    ]);
});

test('enemy attack adds its activation modifier to the calculated character ATK', async () => {
    const effect = new EnemyAttackEffect({
        enemy: {
            async getAttackValue() {
                return 5;
            },
        },
        match: {},
    });
    effect.modifyAttack = 2;

    assert.equal(await effect.getAttackValue({}), 7);

    effect.resetForResolution();

    assert.equal(effect.modifyAttack, 0);
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
                        async canRun() {
                            return true;
                        },
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
                async canRun() {
                    return true;
                },
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
