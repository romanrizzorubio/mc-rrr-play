import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    CARD_TYPE_UPGRADE,
    DIALOG_LIST,
    DIALOG_SELECT_CARD,
    PLACE_IN_PLAY,
    TARGET_ENEMY,
    TARGET_YOU,
    TRAIT_BLACK_PANTHER,
} from 'mc-shared';
import {SpecialAbility} from '../../src/abilities/misc/special-ability.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {MoveDamageEffect} from '../../src/effects/move-damage-effect.js';
import {RemoveThreatEffect} from '../../src/effects/remove-threat-effect.js';
import {ResolveSpecialAbilityEffect} from '../../src/effects/resolve-special-ability-effect.js';

const createGameCard = (id, ability) => {
    const gameCard = {
        id,
        card: {
            name: id,
            traits: [TRAIT_BLACK_PANTHER],
            type: CARD_TYPE_UPGRADE,
        },
        abilities: [ability],
        toObj() {
            return {
                id: this.id,
                image: `${this.id}.png`,
                name: this.card.name,
            };
        },
    };

    ability.card = gameCard;

    return {ability, gameCard};
};

const createSpecialCard = ({id, hasEnemy = true, onResolve = () => {}}) => {
    const match = {
        enemies: hasEnemy ? [{id: `${id}-enemy`}] : [],
    };
    const ability = new SpecialAbility({
        effect: new DealDamageEffect({
            damage: 1,
            match,
            target: TARGET_ENEMY,
        }),
        match,
    });
    ability.resolveAbility = onResolve;

    return {...createGameCard(id, ability), match};
};

const createMoveDamageCard = ({id, lastStepDamage, onResolve = () => {}}) => {
    const match = {
        enemies: [{id: `${id}-enemy`}],
    };
    const ability = new SpecialAbility({
        effect: new MoveDamageEffect({
            damage: 1,
            fromTarget: TARGET_YOU,
            match,
            paramsLastStep: lastStepDamage === undefined ?
                undefined :
                {damage: lastStepDamage},
            target: TARGET_ENEMY,
        }),
        match,
    });
    ability.resolveAbility = onResolve;

    return {...createGameCard(id, ability), match};
};

const createEffect = (cards, {resolveAll = false, choose, playerDamage = 0} = {}) => {
    const effect = new ResolveSpecialAbilityEffect({
        filter: {
            traits: [TRAIT_BLACK_PANTHER],
            type: CARD_TYPE_UPGRADE,
        },
        locations: [PLACE_IN_PLAY],
        resolveAll,
    });
    const dialogs = [];

    effect.openDialog = async dialog => {
        dialogs.push(dialog);
        if (!choose) {
            throw new Error('No dialog choice was configured.');
        }

        return choose(dialog);
    };

    return {
        dialogs,
        effect,
        params: {
            player: {
                damage: playerDamage,
                superhero: {
                    damage: playerDamage,
                },
                gameZone: {
                    cards: cards.map(({gameCard}) => gameCard),
                },
            },
        },
    };
};

test('shows and resolves the only special ability with a valid target', async () => {
    const resolved = [];
    const runnable = createSpecialCard({
        id: 'runnable',
        onResolve: async params => resolved.push({
            id: 'runnable',
            isLastStep: params.isLastStep,
        }),
    });
    const blocked = createSpecialCard({
        id: 'blocked',
        hasEnemy: false,
    });
    const {dialogs, effect, params} = createEffect([runnable, blocked], {
        choose: dialog => {
            assert.equal(dialog.dialogType, DIALOG_SELECT_CARD);
            assert.deepEqual(dialog.data.cards.map(card => card.id), ['runnable']);
            return {selected: [{id: 'runnable'}]};
        },
    });

    await effect.execute(params);

    assert.deepEqual(resolved, [{id: 'runnable', isLastStep: true}]);
    assert.equal(dialogs.length, 1);
    assert.equal(dialogs[0].closeOnResponse, true);
});

test('offers multiple abilities and resolves only the chosen one by default', async () => {
    const resolved = [];
    const first = createSpecialCard({id: 'first'});
    const second = createSpecialCard({
        id: 'second',
        onResolve: async params => resolved.push({
            id: 'second',
            isLastStep: params.isLastStep,
        }),
    });
    const {dialogs, effect, params} = createEffect([first, second], {
        choose: dialog => {
            assert.equal(dialog.dialogType, DIALOG_SELECT_CARD);
            return {selected: [{id: 'second'}]};
        },
    });

    await effect.execute(params);

    assert.deepEqual(resolved, [{id: 'second', isLastStep: true}]);
    assert.equal(dialogs.length, 1);
    assert.equal(dialogs[0].title, '¿Qué capacidad especial quieres resolver?');
    assert.deepEqual(dialogs[0].data.cards.map(card => card.id), ['first', 'second']);
});

test('resolves all valid abilities one by one and marks only the last step', async () => {
    const resolved = [];
    const first = createSpecialCard({
        id: 'first',
        onResolve: async params => resolved.push({
            id: 'first',
            isLastStep: params.isLastStep,
        }),
    });
    const second = createSpecialCard({
        id: 'second',
        onResolve: async params => resolved.push({
            id: 'second',
            isLastStep: params.isLastStep,
        }),
    });
    const {dialogs, effect, params} = createEffect([first, second], {
        resolveAll: true,
        choose: dialog => {
            assert.equal(dialog.dialogType, DIALOG_SELECT_CARD);
            const cardId = dialog.data.cards.length === 2 ? 'second' : 'first';
            return {selected: [{id: cardId}]};
        },
    });

    await effect.execute(params);

    assert.deepEqual(resolved, [
        {id: 'second', isLastStep: false},
        {id: 'first', isLastStep: true},
    ]);
    assert.equal(dialogs.length, 2);
    assert.deepEqual(dialogs.map(dialog => dialog.closeOnResponse), [false, true]);
});

test('rechecks target validity after resolving each ability', async () => {
    const resolved = [];
    const remaining = createSpecialCard({id: 'remaining'});
    const selected = createSpecialCard({
        id: 'selected',
        onResolve: async () => {
            remaining.match.enemies = [];
            resolved.push('selected');
        },
    });
    const {dialogs, effect, params} = createEffect([selected, remaining], {
        resolveAll: true,
        choose: () => ({selected: [{id: 'selected'}]}),
    });

    await effect.execute(params);

    assert.deepEqual(resolved, ['selected']);
    assert.equal(dialogs.length, 1);
});

test('uses a list when more than five valid abilities are available', async () => {
    const resolved = [];
    const cards = Array.from({length: 6}, (_, index) =>
        createSpecialCard({
            id: `card-${index}`,
            onResolve: async () => resolved.push(`card-${index}`),
        }));
    const {dialogs, effect, params} = createEffect(cards, {
        choose: dialog => {
            assert.equal(dialog.dialogType, DIALOG_LIST);
            assert.equal(dialog.data.options.length, 6);
            return {selected: dialog.data.options[5]};
        },
    });

    await effect.execute(params);

    assert.deepEqual(resolved, ['card-5']);
    assert.equal(dialogs.length, 1);
});

test('does not open a dialog when no special ability has a valid target', async () => {
    const resolved = [];
    const blocked = createSpecialCard({
        id: 'blocked',
        hasEnemy: false,
        onResolve: async () => resolved.push('blocked'),
    });
    const {dialogs, effect, params} = createEffect([blocked], {
        resolveAll: true,
    });

    await effect.execute(params);

    assert.deepEqual(resolved, []);
    assert.equal(dialogs.length, 0);
});

test('requires damage on the hero before offering the Panther Suit special', async () => {
    const resolved = [];
    const suit = createMoveDamageCard({
        id: 'panther-suit',
        onResolve: async () => resolved.push('resolved'),
    });
    const noDamage = createEffect([suit]);

    await noDamage.effect.execute(noDamage.params);

    assert.deepEqual(resolved, []);
    assert.equal(noDamage.dialogs.length, 0);

    const hasDamage = createEffect([suit], {
        playerDamage: 1,
        choose: () => ({selected: [{id: 'panther-suit'}]}),
    });

    await hasDamage.effect.execute(hasDamage.params);

    assert.deepEqual(resolved, ['resolved']);
});

test('uses paramsLastStep values for damage and threat without persisting them', async () => {
    const damage = new DealDamageEffect({
        damage: 2,
        match: {},
        paramsLastStep: {damage: 4},
        selectedTarget: {},
    });
    const threat = new RemoveThreatEffect({
        match: {},
        paramsLastStep: {threat: 2},
        selectedTarget: {},
        threat: 1,
    });

    await damage.prepare({isLastStep: true});
    await threat.prepare({isLastStep: true});
    assert.equal(damage.damage, 4);
    assert.equal(threat.threat, 2);

    await damage.prepare({isLastStep: false});
    await threat.prepare({isLastStep: false});
    assert.equal(damage.damage, 2);
    assert.equal(threat.threat, 1);
});

test('checks the last-step damage requirement before offering the Panther Suit', async () => {
    const resolved = [];
    const suit = createMoveDamageCard({
        id: 'panther-suit',
        lastStepDamage: 2,
        onResolve: async params => resolved.push(params.isLastStep),
    });
    const oneDamage = createEffect([suit], {
        playerDamage: 1,
        resolveAll: true,
    });

    await oneDamage.effect.execute(oneDamage.params);

    assert.deepEqual(resolved, []);
    assert.equal(oneDamage.dialogs.length, 0);

    const twoDamage = createEffect([suit], {
        choose: () => ({selected: [{id: 'panther-suit'}]}),
        playerDamage: 2,
        resolveAll: true,
    });
    await twoDamage.effect.execute(twoDamage.params);

    assert.deepEqual(resolved, [true]);
});
