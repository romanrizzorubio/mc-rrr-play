import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    DIALOG_REVEAL_CARDS,
    DIALOG_SELECT_CARD,
    DIALOG_SELECT_TARGET,
    EFFECT_COUNT_BOOST_ICONS,
    PRIORITY_INTERRUPT,
    PRIORITY_CONSTANT,
    PRIORITY_FORCED_INTERRUPT,
    TRIGGER_BOOST_ICONS_COUNTED,
    TARGET_PARENT,
    TARGET_SOURCE,
} from 'mc-shared';
import {CancelBoostIconsEffect} from '../../src/effects/cancel-boost-icons-effect.js';
import {CountBoostIconsEffect} from '../../src/effects/count-boost-icons-effect.js';
import {
    CountBoostIconsBatchEffect,
} from '../../src/effects/count-boost-icons-batch-effect.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {DiscardFromDeckEffect} from '../../src/effects/discard-from-deck-effect.js';
import {ModifyBoostIconsEffect} from '../../src/effects/modify-boost-icons-effect.js';
import {ResolveCardsInOrderEffect} from '../../src/effects/resolve-cards-in-order-effect.js';
import {Trigger} from '../../src/triggers/base/trigger.js';

describe('Boost icon counting effects', () => {
    test('counts a cached batch in one interrupt window and sums modified values', async () => {
        const first = {
            id: 'first',
            boost: 1,
            boostAbility() {
                assert.fail('Counting boost icons must not resolve abilities.');
            },
            toObj() {
                return {id: this.id};
            },
        };
        const second = {
            id: 'second',
            boost: 2,
            boostAbility() {
                assert.fail('Counting boost icons must not resolve abilities.');
            },
            toObj() {
                return {id: this.id};
            },
        };
        const priorities = [];
        const effect = new CountBoostIconsBatchEffect({
            cards: 'effects.0.cards',
            showDialog: false,
        });
        effect.trigger = async (priority, triggerTypes, params) => {
            priorities.push(priority);
            assert.deepEqual(triggerTypes, [TRIGGER_BOOST_ICONS_COUNTED]);
            assert.equal(params.effect, effect);
            assert.deepEqual(params.countedCards, [first, second]);
            assert.equal(params.showSingleTargetDialog, true);
            if (priority === PRIORITY_INTERRUPT) {
                params.effect.boostCountWindows[1].boostValue++;
            }

            return true;
        };

        await effect.execute({
            effects: [{cards: [first, second]}],
            player: {id: 'player'},
        });

        assert.deepEqual(priorities, [
            PRIORITY_CONSTANT,
            PRIORITY_FORCED_INTERRUPT,
            PRIORITY_INTERRUPT,
        ]);
        assert.deepEqual(
            effect.results.map(({card, value}) => [card.id, value]),
            [['first', 1], ['second', 3]]
        );
        assert.equal(effect.value, 4);
        assert.equal(
            effect.boostCountWindows[1].toTargetObj({}).boost,
            3
        );
    });

    test('shows interruption guidance only when an interrupt is available', async () => {
        const cards = [
            {
                id: 'first',
                boost: 1,
                toObj() {
                    return {id: this.id};
                },
            },
            {
                id: 'second',
                boost: 2,
                toObj() {
                    return {id: this.id};
                },
            },
        ];
        const interactionInstructions =
            'Haz clic en una carta para elegirla como objetivo de una interrupción.';

        const resolveDialog = async canInterrupt => {
            const dialogs = [];
            let availabilityChecks = 0;
            const match = {
                triggerCards: {},
                async openDialog(dialog) {
                    dialogs.push(dialog);
                },
            };
            const effect = new CountBoostIconsBatchEffect({
                cards: 'effects.0.cards',
                interactionInstructions,
                match,
            });
            effect.ability = {
                card: {name: 'Descomposición molecular'},
            };
            effect.trigger = async () => false;
            const interruptCard = {
                id: 'batch-interrupt',
                triggers: {},
            };
            const interrupt = new Trigger({
                ability: {
                    canTrigger(params) {
                        availabilityChecks++;
                        assert.equal(params.triggeredEffect, effect);

                        return canInterrupt;
                    },
                },
                card: interruptCard,
                trigger: TRIGGER_BOOST_ICONS_COUNTED,
                triggerParams: {},
            });
            interruptCard.triggers[TRIGGER_BOOST_ICONS_COUNTED] = {
                [PRIORITY_INTERRUPT]: [interrupt],
            };
            match.triggerCards[interruptCard.id] = interruptCard;

            await effect.execute({
                effects: [{cards}],
                match,
                player: {id: 'player'},
            });

            return {availabilityChecks, dialogs};
        };

        const withInterrupt = await resolveDialog(true);
        assert.equal(withInterrupt.dialogs.length, 1);
        assert.equal(
            withInterrupt.dialogs[0].title,
            'Cartas que se van a descartar'
        );
        assert.match(
            withInterrupt.dialogs[0].subtitle,
            /Se descartan por Descomposición molecular\./
        );
        assert.match(
            withInterrupt.dialogs[0].subtitle,
            /En el orden en que se descartarán, desde la carta superior\./
        );
        assert.match(
            withInterrupt.dialogs[0].subtitle,
            /Haz clic en una carta para elegirla como objetivo de una interrupción\./
        );
        assert.equal(withInterrupt.dialogs[0].data.selectable, true);
        assert.deepEqual(
            withInterrupt.dialogs[0].data.cards.map(({id}) => id),
            ['first', 'second']
        );
        assert.equal(withInterrupt.availabilityChecks, 1);

        const withoutInterrupt = await resolveDialog(false);
        assert.equal(withoutInterrupt.dialogs.length, 1);
        assert.equal(
            withoutInterrupt.dialogs[0].dialogType,
            DIALOG_REVEAL_CARDS
        );
        assert.equal(
            withoutInterrupt.dialogs[0].title,
            'Cartas que se van a descartar'
        );
        assert.deepEqual(
            withoutInterrupt.dialogs[0].data.cards.map(({id}) => id),
            ['first', 'second']
        );
        assert.doesNotMatch(
            withoutInterrupt.dialogs[0].subtitle,
            /interrumpir/i
        );
        assert.equal(withoutInterrupt.dialogs[0].data.selectable, false);
        assert.equal(withoutInterrupt.availabilityChecks, 1);
    });

    test('selects one card from the boost batch and allows cancellation before changes', async () => {
        const makeWindow = (id, boostValue) => {
            const card = {
                id,
                name: id,
                toObj() {
                    return {id: this.id, name: this.name};
                },
            };

            return {
                id,
                card,
                boostValue,
                countReplaced: false,
                toTargetObj() {
                    return card.toObj();
                },
            };
        };
        const first = makeWindow('first', 0);
        const second = makeWindow('second', 2);
        const dialogs = [];
        const match = {
            async openDialog(dialog) {
                dialogs.push(dialog);
                return {selected: {id: 'second'}};
            },
        };
        const modifier = new ModifyBoostIconsEffect({
            count: 1,
            match,
            target: TARGET_PARENT,
        });
        const selection = new ChainedEffect({
            condition: {countReplaced: false},
            dialogTitle: 'Elige la carta cuyo Aumento quieres modificar',
            effects: [modifier],
            match,
            showCancel: true,
            source: 'triggeredEffect.boostCountWindows',
            target: TARGET_SOURCE,
        });
        const params = {
            effect: {boostCountWindows: [first, second]},
            match,
            player: {id: 'player'},
            source: 'triggeredEffect.boostCountWindows',
            triggeredEffect: {boostCountWindows: [first, second]},
            showSingleTargetDialog: true,
        };

        await selection.prepare(params);
        assert.equal(dialogs[0].dialogType, DIALOG_SELECT_TARGET);
        assert.equal(dialogs[0].showCancel, true);
        assert.equal(
            dialogs[0].title,
            'Elige la carta cuyo Aumento quieres modificar'
        );
        assert.deepEqual(
            dialogs[0].data.cards.map(({id}) => id),
            ['first', 'second']
        );
        assert.equal(selection.selectedTarget, second);
        assert.equal(modifier.selectedTarget, second);
        await modifier.execute({...params, parentTargets: [second]});

        assert.equal(first.boostValue, 0);
        assert.equal(second.boostValue, 3);

        const cancel = new CancelBoostIconsEffect({
            allowZero: true,
            match,
            replaceCount: true,
            target: TARGET_PARENT,
        });
        const batch = new CountBoostIconsBatchEffect({cards: []});
        batch.boostCountWindows = [first, second];
        cancel.selectedTarget = first;
        await cancel.execute({
            ...params,
            effect: batch,
            parentTargets: [first],
            triggeredEffect: batch,
        });

        assert.equal(first.countReplaced, true);
        assert.equal(second.countReplaced, false);
        assert.equal(batch.checkTrigger(), true);

        const remainingSelection = new ChainedEffect({
            condition: {countReplaced: false},
            effects: [
                new ModifyBoostIconsEffect({
                    count: 1,
                    match,
                    target: TARGET_PARENT,
                }),
            ],
            match,
            source: 'triggeredEffect.boostCountWindows',
            target: TARGET_SOURCE,
        });
        await remainingSelection.prepare({
            ...params,
            effect: batch,
            triggeredEffect: batch,
        });
        assert.deepEqual(
            dialogs[1].data.cards.map(({id}) => id),
            ['second']
        );
        second.countReplaced = true;
        assert.equal(batch.checkTrigger(), false);

        const individualWindow = makeWindow('individual', 2);
        const individualSelection = new ChainedEffect({
            effects: [
                new ModifyBoostIconsEffect({
                    count: 1,
                    match,
                    target: TARGET_PARENT,
                }),
            ],
            match,
            showCancel: true,
            source: 'triggeredEffect.boostCountWindows',
            target: TARGET_SOURCE,
        });
        const dialogCountBeforeIndividual = dialogs.length;
        await individualSelection.prepare({
            ...params,
            effect: {boostCountWindows: [individualWindow]},
            showSingleTargetDialog: undefined,
            triggeredEffect: {boostCountWindows: [individualWindow]},
        });
        assert.equal(individualSelection.selectedTarget, individualWindow);
        assert.equal(dialogs.length, dialogCountBeforeIndividual);

        const onlyWindow = makeWindow('only', 1);
        const cancelDialogs = [];
        const cancelMatch = {
            async openDialog(dialog) {
                cancelDialogs.push(dialog);
                return {selected: null};
            },
        };
        const cancellable = new ChainedEffect({
            effects: [
                new ModifyBoostIconsEffect({
                    count: 1,
                    match: cancelMatch,
                    target: TARGET_PARENT,
                }),
            ],
            match: cancelMatch,
            showCancel: true,
            source: 'triggeredEffect.boostCountWindows',
            target: TARGET_SOURCE,
        });
        const cancelParams = {
            effect: {boostCountWindows: [onlyWindow]},
            match: cancelMatch,
            player: {id: 'player'},
            source: 'triggeredEffect.boostCountWindows',
            triggeredEffect: {boostCountWindows: [onlyWindow]},
            showSingleTargetDialog: true,
        };

        await cancellable.prepare(cancelParams);
        await cancellable.execute(cancelParams);

        assert.equal(cancelDialogs.length, 1);
        assert.equal(cancelDialogs[0].showCancel, true);
        assert.equal(onlyWindow.boostValue, 1);
        assert.equal(cancellable.paymentCancelled, true);
    });

    test('counts one specified card and does not resolve its Boost ability', async () => {
        const card = {
            id: 'counted',
            boost: 2,
            async boostAbility() {
                assert.fail('Counting a card must not resolve its Boost ability.');
            },
            toObj() {
                return {id: this.id, boost: this.boost};
            },
        };
        const dialogs = [];
        const match = {
            triggerCards: {},
            async openDialog(dialog) {
                dialogs.push(dialog);
            },
        };
        const effect = new CountBoostIconsEffect({
            card: 'card',
            match,
        });

        await effect.execute({
            card,
            match,
            player: {id: 'player', hand: {cards: []}},
        });

        assert.equal(effect.card, card);
        assert.equal(effect.value, 2);
        assert.deepEqual(
            dialogs
                .filter(({dialogType}) => dialogType === DIALOG_REVEAL_CARDS)
                .map(({data}) => data.cards.map(({id}) => id)),
            [['counted']]
        );
    });

    test('shows the replacement card in the updated count dialog', async () => {
        const originalCard = {
            id: 'original',
            name: 'Carta original',
            boost: 1,
            toObj() {
                return {
                    boost: this.boost,
                    id: this.id,
                    name: this.name,
                };
            },
        };
        const replacementCard = {
            id: 'replacement',
            name: 'Carta sustituta',
            boost: 2,
            toObj() {
                return {
                    boost: this.boost,
                    id: this.id,
                    name: this.name,
                };
            },
        };
        const dialogs = [];
        const match = {
            triggerCards: {},
            async openDialog(dialog) {
                dialogs.push(dialog);
            },
        };
        const effect = new CountBoostIconsEffect({
            card: 'card',
            match,
        });
        effect.trigger = async (priority, _triggerTypes, params) => {
            if (priority !== PRIORITY_INTERRUPT) {
                return true;
            }

            params.effect.boostValue = 0;
            params.effect.countReplaced = true;
            const replacementCount = new CountBoostIconsEffect({
                card: replacementCard,
                match,
                showDialog: false,
            });
            await replacementCount.execute({
                ...params,
                card: replacementCard,
            });

            const modifyEffect = new ModifyBoostIconsEffect({
                countedCard: 'replacementCard',
                count: replacementCount.value,
                match,
            });
            await modifyEffect.execute({
                ...params,
                replacementCard,
            });

            return true;
        };

        await effect.execute({
            card: originalCard,
            match,
            player: {id: 'player', hand: {cards: []}},
        });

        const updatedDialog = dialogs.find(({title}) =>
            title === 'Aumento actualizado');
        assert.ok(updatedDialog);
        assert.deepEqual(updatedDialog.data.cards, [{
            boost: 2,
            id: 'replacement',
            name: 'Carta sustituta',
        }]);
    });

    test('counts a card without repeating its display when it was already shown', async () => {
        const player = {id: 'player', isPlayer: true, hand: {cards: []}};
        const card = {
            id: 'already-shown',
            boost: 2,
            toObj() {
                return {id: this.id, boost: this.boost};
            },
        };
        const dialogs = [];
        let interruptResolutions = 0;
        const interruptCard = {
            id: 'boost-interrupt',
            controller: player,
            isEvent: false,
            triggers: {},
        };
        const ability = {
            hideDialog: true,
            resolved: false,
            async canTrigger() {
                return true;
            },
            async resolveAbility({
                effect: countWindow,
                showSingleTargetDialog,
            }) {
                interruptResolutions++;
                assert.equal(showSingleTargetDialog, false);
                countWindow.boostValue++;
                this.resolved = true;
            },
        };
        const trigger = new Trigger({
            ability,
            card: interruptCard,
            trigger: TRIGGER_BOOST_ICONS_COUNTED,
            triggerParams: {},
        });
        interruptCard.triggers[TRIGGER_BOOST_ICONS_COUNTED] = {
            [PRIORITY_INTERRUPT]: [trigger],
        };
        const match = {
            triggerCards: {[interruptCard.id]: interruptCard},
            async openDialog(dialog) {
                dialogs.push(dialog);
            },
        };
        const effect = new CountBoostIconsEffect({
            card: 'card',
            match,
            showDialog: false,
        });

        await effect.execute({
            card,
            match,
            player,
        });

        assert.equal(interruptResolutions, 1);
        assert.equal(effect.value, 3);
        assert.deepEqual(dialogs, []);
    });

    test('rejects a collection instead of silently counting multiple cards', async () => {
        const effect = new CountBoostIconsEffect({card: 'cards'});

        await assert.rejects(
            effect.execute({
                cards: [{id: 'first', boost: 1}],
                match: {triggerCards: {}},
                player: {hand: {cards: []}},
            }),
            TypeError
        );
    });

    test('resolves a cached partial discard batch in player-chosen order', async () => {
        const first = {
            id: 'first',
            boost: 0,
            toObj() {
                return {id: this.id, boost: this.boost};
            },
        };
        const second = {
            id: 'second',
            boost: 2,
            toObj() {
                return {id: this.id, boost: this.boost};
            },
        };
        const deck = {
            cards: [first, second],
            discardPile: [],
            discardRequests: [],
            async discardTopCards(count) {
                this.discardRequests.push(count);
                const discarded = this.cards.splice(0, count);
                this.discardPile.push(...discarded);
                if (!this.cards.length) {
                    this.cards.push(...this.discardPile.splice(0));
                }

                return discarded;
            },
            async refresh() {},
        };
        const dialogs = [];
        const match = {
            triggerCards: {},
            async openDialog(dialog) {
                dialogs.push(dialog);
                if (dialog.dialogType === DIALOG_SELECT_CARD) {
                    return {selected: [{id: 'second'}]};
                }
            },
        };
        match.effectsFactory = {
            parseEffect(definition) {
                assert.equal(definition.type, EFFECT_COUNT_BOOST_ICONS);
                const effect = new CountBoostIconsEffect({
                    ...definition.params,
                    match,
                });
                effect.runEffect = async params => effect.execute(params);
                return effect;
            },
        };
        const player = {deck, hand: {cards: []}};
        const discardEffect = new DiscardFromDeckEffect({
            count: 3,
            match,
            selectedTarget: deck,
            showDialog: false,
        });
        await discardEffect.execute({match, player});

        const effect = new ResolveCardsInOrderEffect({
            cards: 'effects.0.cards',
            effectDefinition: {
                type: EFFECT_COUNT_BOOST_ICONS,
                params: {card: 'card'},
            },
            match,
        });
        await effect.execute({
            effects: [discardEffect],
            match,
            player,
        });

        assert.deepEqual(deck.discardRequests, [3]);
        assert.deepEqual(discardEffect.cards, [first, second]);
        assert.deepEqual(
            effect.results.map(({card, value}) => [card.id, value]),
            [['second', 2], ['first', 0]]
        );
        assert.equal(effect.value, 2);
        assert.deepEqual(
            dialogs
                .filter(({dialogType}) => dialogType === DIALOG_SELECT_CARD)
                .map(({data}) => data.cards.map(({id}) => id)),
            [['first', 'second']]
        );
    });

    test('resolves cards in cached order without asking the player to choose', async () => {
        const first = {
            id: 'first',
            boost: 1,
            toObj() {
                return {id: this.id, boost: this.boost};
            },
        };
        const second = {
            id: 'second',
            boost: 2,
            toObj() {
                return {id: this.id, boost: this.boost};
            },
        };
        const dialogs = [];
        const match = {
            triggerCards: {},
            async openDialog(dialog) {
                dialogs.push(dialog);
            },
        };
        match.effectsFactory = {
            parseEffect(definition) {
                assert.equal(definition.type, EFFECT_COUNT_BOOST_ICONS);
                const effect = new CountBoostIconsEffect({
                    ...definition.params,
                    match,
                });
                effect.runEffect = async params => effect.execute(params);
                return effect;
            },
        };
        const effect = new ResolveCardsInOrderEffect({
            cards: 'effects.0.cards',
            chooseOrder: false,
            effectDefinition: {
                type: EFFECT_COUNT_BOOST_ICONS,
                params: {card: 'card'},
            },
            match,
        });

        await effect.execute({
            effects: [{cards: [first, second]}],
            match,
            player: {id: 'player', hand: {cards: []}},
        });

        assert.deepEqual(
            effect.results.map(({card, value}) => [card.id, value]),
            [['first', 1], ['second', 2]]
        );
        assert.equal(effect.value, 3);
        assert.equal(
            dialogs.some(({dialogType}) =>
                dialogType === DIALOG_SELECT_CARD),
            false
        );
    });

    test('can show a selection dialog for the last card without changing the default', async () => {
        const first = {
            id: 'first',
            boost: 1,
            toObj() {
                return {id: this.id, boost: this.boost};
            },
        };
        const second = {
            id: 'second',
            boost: 2,
            toObj() {
                return {id: this.id, boost: this.boost};
            },
        };
        const onlyCard = {
            id: 'only-card',
            boost: 0,
            toObj() {
                return {id: this.id, boost: this.boost};
            },
        };
        const dialogs = [];
        const match = {
            triggerCards: {},
            async openDialog(dialog) {
                dialogs.push(dialog);
                const cards = dialog.data.cards;
                return {selected: [cards[cards.length - 1]]};
            },
        };
        match.effectsFactory = {
            parseEffect(definition) {
                assert.equal(definition.type, EFFECT_COUNT_BOOST_ICONS);
                const effect = new CountBoostIconsEffect({
                    ...definition.params,
                    match,
                });
                effect.runEffect = async params => effect.execute(params);
                return effect;
            },
        };
        const player = {id: 'player', hand: {cards: []}};
        const effectDefinition = {
            type: EFFECT_COUNT_BOOST_ICONS,
            params: {card: 'card', showDialog: false},
        };
        const effect = new ResolveCardsInOrderEffect({
            cards: 'effects.0.cards',
            effectDefinition,
            match,
            showSingleCardDialog: true,
        });

        await effect.execute({
            effects: [{cards: [first, second]}],
            match,
            player,
        });

        assert.deepEqual(
            dialogs.map(({data}) => data.cards.map(({id}) => id)),
            [['first', 'second'], ['first']]
        );
        assert.deepEqual(
            effect.results.map(({card}) => card.id),
            ['second', 'first']
        );

        const defaultEffect = new ResolveCardsInOrderEffect({
            cards: 'effects.0.cards',
            effectDefinition,
            match,
        });
        await defaultEffect.execute({
            effects: [{cards: [onlyCard]}],
            match,
            player,
        });

        assert.equal(dialogs.length, 2);
        assert.equal(defaultEffect.results[0].card, onlyCard);
    });

    test('does not resolve remaining interrupts for a replaced count', async () => {
        const player = {id: 'player', isPlayer: true, hand: {cards: []}};
        const match = {
            triggerCards: {},
            async openDialog() {},
        };
        const replacementCard = {
            id: 'replacement',
            boost: 2,
            toObj() {
                return {id: this.id, boost: this.boost};
            },
        };
        const replacementEffect = new CountBoostIconsEffect({
            card: 'card',
            match,
        });
        const cancelEffect = new CancelBoostIconsEffect({
            allowZero: true,
            match,
            replaceCount: true,
        });
        const witchCard = {
            id: 'scarlet-witch',
            controller: player,
            owner: player,
            triggers: {},
        };
        const tiaraCard = {
            id: 'scarlet-witch-tiara',
            controller: player,
            owner: player,
            triggers: {},
        };
        let witchResolutions = 0;
        const witchAbility = {
            hideDialog: true,
            resolved: false,
            async canTrigger() {
                return true;
            },
            async resolveAbility(params) {
                witchResolutions++;
                await cancelEffect.execute(params);
                await replacementEffect.execute({
                    ...params,
                    card: replacementCard,
                });
                await new ModifyBoostIconsEffect({
                    count: replacementEffect.value,
                    match,
                }).execute(params);
                this.resolved = true;
            },
        };
        const tiaraCards = [];
        const tiaraAbility = {
            hideDialog: true,
            resolved: false,
            async canTrigger() {
                return true;
            },
            async resolveAbility({effect}) {
                tiaraCards.push(effect.card.id);
                this.resolved = true;
            },
        };
        const witchTrigger = new Trigger({
            ability: witchAbility,
            card: witchCard,
            trigger: TRIGGER_BOOST_ICONS_COUNTED,
            triggerParams: {},
        });
        const tiaraTrigger = new Trigger({
            ability: tiaraAbility,
            card: tiaraCard,
            trigger: TRIGGER_BOOST_ICONS_COUNTED,
            triggerParams: {},
        });
        witchCard.triggers[TRIGGER_BOOST_ICONS_COUNTED] = {
            [PRIORITY_INTERRUPT]: [witchTrigger],
        };
        tiaraCard.triggers[TRIGGER_BOOST_ICONS_COUNTED] = {
            [PRIORITY_INTERRUPT]: [tiaraTrigger],
        };
        match.triggerCards[witchCard.id] = witchCard;
        match.triggerCards[tiaraCard.id] = tiaraCard;

        const originalEffect = new CountBoostIconsEffect({
            card: 'card',
            match,
        });
        const originalCard = {
            id: 'original',
            boost: 1,
            toObj() {
                return {id: this.id, boost: this.boost};
            },
        };

        await originalEffect.execute({
            card: originalCard,
            match,
            player,
        });

        assert.equal(witchResolutions, 1);
        assert.deepEqual(tiaraCards, ['replacement']);
        assert.equal(replacementEffect.value, 2);
        assert.equal(witchTrigger.resolving, false);
        assert.equal(originalEffect.value, 2);
    });
});
