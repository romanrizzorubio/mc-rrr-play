import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_INTERRUPT,
    DIALOG_USE_CARD,
    EFFECT_CHAINED,
    EFFECT_PREVENT_DAMAGE,
    PRIORITY_INTERRUPT,
    TARGET_ALL_CHARACTERS,
    TARGET_YOUR_SUPERHERO,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
} from 'mc-shared';
import {Engine} from '../../src/engine/engine.js';
import {Effect} from '../../src/effects/effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {PreventDamageEffect} from '../../src/effects/prevent-damage-effect.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {AbilitiesFactory} from '../../src/factory/abilities/abilities-factory.js';
import {Trigger} from '../../src/triggers/base/trigger.js';
import {
    CharacterWouldTakeDamageTrigger,
} from '../../src/triggers/character-would-take-damage-trigger.js';
import protectionUpgrades from '../../../mc-data/seed/catalog/aspects/protection/upgrades.js';
import msMarvel from '../../../mc-data/seed/catalog/heroes/ms-marvel.js';

function createDamageInterruptTrigger(card, id, name) {
    return new Trigger({
        ability: {
            effect: {
                isChoose: false,
                isChooseAbility: false,
            },
            hideDialog: false,
            id,
            isEndLasting: false,
            name,
            async canTrigger() {
                return true;
            },
            getTitle() {
                return this.name;
            },
        },
        card,
        trigger: TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    });
}

describe('damage interrupt dialog', () => {
    test('pre-play confirmation is implemented only by concrete effects', () => {
        assert.equal(typeof Effect.prototype.confirmBeforeResolve, 'undefined');
        assert.equal(
            typeof PreventDamageEffect.prototype.confirmBeforeResolve,
            'function'
        );
    });

    test('damage interrupt dialog leaves damage details to the selected effect', async () => {
        const player = {
            hand: {
                cards: [],
            },
        };
        const card = {
            counters: 2,
            id: 'damage-interrupt',
            owner: player,
            toObj() {
                return {
                    counters: this.counters,
                    id: this.id,
                };
            },
            triggers: {},
        };
        const trigger = createDamageInterruptTrigger(
            card,
            'damage-interrupt--prevent-damage',
            'Evitar daño'
        );
        card.triggers[TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE] = {
            [PRIORITY_INTERRUPT]: [trigger],
        };

        const effect = new TakeDamageEffect({damage: 5});
        const engine = new Engine();
        const dialogs = [];

        engine.match = {
            triggerCards: {
                [card.id]: card,
            },
        };
        engine.openDialog = async dialog => {
            dialogs.push(dialog);
            return {};
        };

        await engine.trigger(
            PRIORITY_INTERRUPT,
            [TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE],
            {effect, player}
        );

        assert.equal(dialogs.length, 1);
        assert.equal(dialogs[0].dialogType, DIALOG_USE_CARD);
        assert.equal(dialogs[0].subtitle, undefined);
        assert.equal(dialogs[0].data.showCounters, true);
        assert.equal(dialogs[0].data.cards[0].counters, 2);
    });

    test('nested interrupt choice dialog does not show a pending damage summary', async () => {
        const player = {
            hand: {
                cards: [],
            },
        };
        const effect = new TakeDamageEffect({damage: 5});
        const dialogs = [];
        const engine = new Engine();
        const card = {
            card: {
                toObj: () => ({
                    counters: 2,
                    id: 'damage-interrupt',
                }),
            },
            triggers: [
                createDamageInterruptTrigger(
                    {id: 'damage-interrupt'},
                    'damage-interrupt--first',
                    'Primera opción'
                ),
                createDamageInterruptTrigger(
                    {id: 'damage-interrupt'},
                    'damage-interrupt--second',
                    'Segunda opción'
                ),
            ],
        };

        engine.openDialog = async dialog => {
            dialogs.push(dialog);
            return {
                selected: {id: '0'},
            };
        };

        await engine._openTriggersDialogTriggers(
            card,
            false,
            {effect, player},
            true
        );

        assert.equal(dialogs.length, 1);
        assert.equal(dialogs[0].subtitle, undefined);
        assert.equal(dialogs[0].data.showCounters, true);
        assert.equal(dialogs[0].data.card.counters, 2);
    });

    test('Flexibilidad receives the damage trigger payload and opens its prevention confirmation', async () => {
        const flexibility = msMarvel.config.cards.find(({card}) =>
            card.params.name === 'Flexibilidad');
        assert.ok(flexibility);

        const dialogs = [];
        const damagedCharacter = {
            id: 'spider-man',
            image: 'heroes/spiderman/peter1.webp',
            isCard: true,
            name: 'Spider-Man',
            toObj() {
                return {
                    id: this.id,
                    image: this.image,
                    name: this.name,
                };
            },
        };
        const match = {
            activationsFactory: {
                createActivation: () => ({filterTarget: () => true}),
            },
            enemies: [],
            friends: [damagedCharacter],
            openDialog: async dialog => {
                dialogs.push(dialog);

                return {confirmed: true};
            },
        };
        const player = {
            isPlayer: true,
            async triggerEvent(trigger, params) {
                const playCardEffect = new PlayCardEffect({
                    ability: trigger.ability,
                    card: trigger.card,
                    match,
                });
                const confirmed =
                    await playCardEffect.confirmBeforePlay(params);

                return {
                    triggered: confirmed,
                    paymentCancelled: !confirmed,
                };
            },
        };
        const card = {
            id: 'flexibilidad',
            image: 'heroes/ms-marvel/05005.png',
            isEvent: true,
            match,
            name: 'Flexibilidad',
            owner: player,
            toObj() {
                return {
                    id: this.id,
                    image: this.image,
                    name: this.name,
                };
            },
        };
        const ability = new AbilitiesFactory({match})
            .createAbility(flexibility.card.params.abilities[0]);
        ability.card = card;
        const trigger = new CharacterWouldTakeDamageTrigger({
            ability,
            card,
            target: TARGET_ALL_CHARACTERS,
            trigger: TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
        });
        const damageEffect = new TakeDamageEffect({
            damage: 4,
            match,
            selectedTarget: damagedCharacter,
        });

        await trigger.runTrigger({
            effect: damageEffect,
            match,
            player,
        });

        assert.equal(dialogs.length, 1);
        assert.equal(dialogs[0].title, 'Flexibilidad');
        assert.equal(dialogs[0].data.preventedDamage, 3);
        assert.equal(dialogs[0].data.card.name, 'Flexibilidad');
        assert.equal(dialogs[0].data.card.image, card.image);
    });

    test('Energy Barrier pays its interrupt cost without a pre-play confirmation dialog', async () => {
        const barrier = protectionUpgrades.find(({_id}) =>
            _id === 'protection-barrera-de-energia');
        assert.ok(barrier);

        const steps = [];
        const dialogs = [];
        const match = {
            openDialog: async dialog => {
                dialogs.push(dialog);

                return {confirmed: true};
            },
        };
        const ability = new AbilitiesFactory({match})
            .createAbility(barrier.card.params.abilities[0]);
        const [preventDamageEffect] = ability.effect.effects;
        const resolutionEffect = ability.effect.createInstance({ability});
        ability.card = {
            image: 'aspect/protection/energy-barrier.png',
            name: 'Barrera de energía',
            toObj() {
                return {
                    image: this.image,
                    name: this.name,
                };
            },
        };
        ability.canRun = async () => true;
        resolutionEffect.runEffect = async () => {
            resolutionEffect.resolved = true;
        };
        ability.arrow.pay = async () => {
            steps.push('arrow');

            return true;
        };
        ability.arrow.paymentCancelled = false;

        assert.equal(
            preventDamageEffect.requiresPrePlayConfirmation,
            false
        );
        assert.equal(preventDamageEffect.prePlayConfirmation, undefined);

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
        await ability.resolveAbility({
            player: {},
            triggeredTargetCharacter: damagedCharacter,
            triggeredTargetDamage: 4,
        }, resolutionEffect);

        assert.deepEqual(steps, ['arrow']);
        assert.equal(dialogs.length, 0);
        assert.equal(ability.resolved, true);
    });

    test('ability configuration is transferred to the effect confirmation', () => {
        const cardConfirmation = {
            title: 'Confirmar prevención',
            countPath: 'triggeredTargetDamage',
            message: 'Daño evitado',
        };
        const effectConfirmation = {
            cardPath: 'triggeredTargetCharacter',
        };
        const ability = new AbilitiesFactory({match: {}}).createAbility({
            type: ABILITY_HERO_INTERRUPT,
            params: {
                prePlayConfirmation: cardConfirmation,
                effect: {
                    type: EFFECT_PREVENT_DAMAGE,
                    params: {
                        prePlayConfirmation: effectConfirmation,
                        target: TARGET_YOUR_SUPERHERO,
                    },
                },
            },
        });

        assert.equal(ability.prePlayConfirmation, undefined);
        assert.deepEqual(ability.effect.prePlayConfirmation, {
            ...cardConfirmation,
            ...effectConfirmation,
        });
    });

    test('legacy confirmation is transferred to a compatible effect in a chain', () => {
        const cardConfirmation = {
            title: 'Confirmar prevención',
            countPath: 'triggeredTargetDamage',
            message: 'Daño evitado',
        };
        const ability = new AbilitiesFactory({match: {}}).createAbility({
            type: ABILITY_HERO_INTERRUPT,
            params: {
                prePlayConfirmation: cardConfirmation,
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [
                            {
                                type: EFFECT_PREVENT_DAMAGE,
                                params: {
                                    target: TARGET_YOUR_SUPERHERO,
                                },
                            },
                        ],
                    },
                },
            },
        });
        const [childEffect] = ability.effect.effects;

        assert.equal(
            Object.hasOwn(ability.effect, 'prePlayConfirmation'),
            false
        );
        assert.deepEqual(childEffect.prePlayConfirmation, cardConfirmation);
    });

    test('legacy effect-group confirmation is migrated to a compatible child', () => {
        const groupConfirmation = {
            title: 'Confirmar prevención',
            countPath: 'triggeredTargetDamage',
            message: 'Daño evitado',
        };
        const ability = new AbilitiesFactory({match: {}}).createAbility({
            type: ABILITY_HERO_INTERRUPT,
            params: {
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        prePlayConfirmation: groupConfirmation,
                        effects: [
                            {
                                type: EFFECT_PREVENT_DAMAGE,
                                params: {
                                    target: TARGET_YOUR_SUPERHERO,
                                },
                            },
                        ],
                    },
                },
            },
        });
        const [childEffect] = ability.effect.effects;

        assert.equal(
            Object.hasOwn(ability.effect, 'prePlayConfirmation'),
            false
        );
        assert.deepEqual(childEffect.prePlayConfirmation, groupConfirmation);
    });
});
