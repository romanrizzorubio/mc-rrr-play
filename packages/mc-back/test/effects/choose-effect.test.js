import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ALL_PLAYERS,
    TARGET_YOU,
} from 'mc-shared';
import {ChooseEffect} from '../../src/effects/choose-effect.js';
import {ExhaustEffect} from '../../src/effects/exhaust-effect.js';
import {SpendEffect} from '../../src/effects/spend-effect.js';
import {Player} from '../../src/model/match/player.js';
import {CostPaymentSession} from '../../src/utils/cost-payment-session.js';

function createOption(title, canRun, resolved) {
    return {
        target: title,
        getTitle() {
            return title;
        },
        async canRun() {
            return canRun;
        },
        async runEffect() {
            resolved.push(title);
        },
    };
}

function createChooseEffect(options, openDialog) {
    const effect = new ChooseEffect({
        ability: {
            card: {
                toObj() {
                    return {name: 'Test card'};
                },
            },
        },
        options,
    });
    effect.openDialog = openDialog;

    return effect;
}

test('chooses the only partially resolvable option without opening a dialog', async () => {
    const resolved = [];
    const effect = createChooseEffect([
        createOption('Available option', true, resolved),
        createOption('Unavailable option', false, resolved),
    ], async () => {
        assert.fail('A single valid option should resolve directly.');
    });

    await effect.execute({
        player: {hand: {cards: []}},
    });

    assert.deepEqual(resolved, ['Available option']);
});

test('partial options do not inherit match-all from a surrounding effect group', async () => {
    const resolved = [];
    const option = {
        target: 'partial option',
        async canRun({matchAll}) {
            return matchAll === false;
        },
        async runEffect(params) {
            resolved.push(params.matchAll);
        },
    };
    const effect = createChooseEffect([option], async () => {
        assert.fail('A single valid option should resolve directly.');
    });

    await effect.execute({
        matchAll: true,
        player: {hand: {cards: []}},
    });

    assert.deepEqual(resolved, [false]);
});

test('offers only partially resolvable options when multiple remain', async () => {
    const resolved = [];
    const effect = createChooseEffect([
        createOption('First option', true, resolved),
        createOption('Second option', true, resolved),
        createOption('Unavailable option', false, resolved),
    ], async ({data}) => {
        assert.deepEqual(data.options.map(({text}) => text), [
            'First option',
            'Second option',
        ]);

        return {selected: {id: 1}};
    });

    await effect.execute({
        player: {hand: {cards: []}},
    });

    assert.deepEqual(resolved, ['Second option']);
});

test('resolves each-player choices in player order and targets each dialog', async () => {
    const firstPlayer = {
        name: 'First player',
        hand: {cards: []},
    };
    const secondPlayer = {
        name: 'Second player',
        hand: {cards: []},
    };
    const match = {
        players: [secondPlayer, firstPlayer],
        initialPlayer: firstPlayer,
    };
    const resolved = [];
    const dialogs = [];
    const options = ['First option', 'Second option'].map(title => ({
        target: TARGET_YOU,
        getTitle() {
            return title;
        },
        async canRun() {
            return true;
        },
        async runEffect({player}) {
            resolved.push([title, player.name]);
        },
    }));
    const effect = new ChooseEffect({
        match,
        players: TARGET_ALL_PLAYERS,
        ability: {
            card: {
                toObj() {
                    return {name: 'Test card'};
                },
            },
        },
        options,
    });
    effect.openDialog = async dialog => {
        dialogs.push(dialog);

        return {selected: {id: dialogs.length - 1}};
    };

    await effect.execute({match, player: firstPlayer});

    assert.deepEqual(dialogs.map(({targetPlayer}) => targetPlayer), [
        'First player',
        'Second player',
    ]);
    assert.deepEqual(resolved, [
        ['First option', 'First player'],
        ['Second option', 'Second player'],
    ]);
});

test('an exhaust option remains valid when only some of its targets are ready', async () => {
    const readyCharacter = {exhausted: false};
    const exhaustedCharacter = {exhausted: true};
    const option = new ExhaustEffect({
        match: {triggerCards: {}},
        selectedTarget: [readyCharacter, exhaustedCharacter],
        target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
    });
    const effect = createChooseEffect([option], async () => {
        assert.fail('A single valid option should resolve directly.');
    });

    assert.deepEqual(
        await effect.getValidOptions({player: {}, match: {triggerCards: {}}}),
        [option]
    );
    assert.deepEqual(option.selectedTarget, [readyCharacter]);
});

test('a resource-spend effect can run when at least one requirement is payable', async () => {
    const payer = {
        async getCardsToPay(_card, resourceType) {
            return {
                generators: [],
                hand: resourceType === RESOURCE_MENTAL ? [{}] : [],
            };
        },
    };
    const effect = new SpendEffect({
        match: {triggerCards: {}},
        resources: [RESOURCE_ENERGY, RESOURCE_MENTAL, RESOURCE_PHYSICAL],
        selectedTarget: payer,
        target: TARGET_YOU,
    });

    assert.equal(await effect.canRun({card: {}, player: payer}), true);

    payer.getCardsToPay = async () => ({
        generators: [],
        hand: [],
    });

    assert.equal(await effect.canRun({card: {}, player: payer}), false);
});

test('a partially paid resource effect resolves but is not fully resolved', async () => {
    let allowPartial;
    const payer = {
        async spendResources(_resources, _card, _excludedCardIds, options) {
            allowPartial = options.allowPartial;

            return {
                fullyPaid: false,
                generators: [],
                hand: [],
                resources: [RESOURCE_ENERGY],
            };
        },
    };
    const effect = new SpendEffect({
        match: {triggerCards: {}},
        resources: [RESOURCE_ENERGY, RESOURCE_MENTAL, RESOURCE_PHYSICAL],
        selectedTarget: payer,
        target: TARGET_YOU,
    });

    await effect.execute({
        card: {},
        costPaymentSession: new CostPaymentSession(),
        player: payer,
    });

    assert.equal(allowPartial, true);
    assert.equal(effect.isResolved(), true);
    assert.equal(effect.isFullResolved(), false);
});

test('partial resource prompts are enabled only when explicitly requested', async () => {
    const dialogs = [];
    const player = Object.create(Player.prototype);
    player.getCardsToPay = async () => ({
        generators: [],
        hand: [],
    });
    player.openDialog = async dialog => {
        dialogs.push(dialog);
    };

    await player.spendResources(
        [RESOURCE_ENERGY, RESOURCE_MENTAL],
        undefined,
        new Set(),
        {allowPartial: true}
    );
    await player.spendResources(
        [RESOURCE_ENERGY, RESOURCE_MENTAL],
        undefined,
        new Set()
    );

    assert.equal(dialogs[0].showCancel, false);
    assert.equal(dialogs[0].data.allowPartial, true);
    assert.equal(dialogs[1].showCancel, true);
    assert.equal(dialogs[1].data.allowPartial, false);
});
