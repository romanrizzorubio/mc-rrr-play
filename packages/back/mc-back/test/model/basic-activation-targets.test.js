import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ACTIVATION_ATTACK,
    ACTIVATION_THWART,
    LABEL_ATTACK,
    LABEL_THWART,
    TARGET_ENEMY,
    TARGET_SCHEME,
} from 'mc-shared';
import {Attack} from '../../src/activations/attack.js';
import {Thwart} from '../../src/activations/thwart.js';
import {BasicAbility} from '../../src/abilities/basic/basic-ability.js';
import {Effect} from '../../src/effects/effect.js';
import {Player} from '../../src/model/match/player.js';
import {getAbilitiesWithAvailability} from '../../src/utils/ability-availability.js';

function createAbility({
    isAttack = false,
    isAction = false,
    isThwart = false,
    targets = [],
    disabled = false,
}) {
    return {
        isAction,
        isAttack,
        isBasic: !isAction,
        isThwart,
        name: isAttack ? 'Ataque' : 'Intervención',
        effect: {
            selectedTarget: undefined,
            async getValidTarget() {
                return targets;
            },
        },
        prepareEffect() {
            this.effect.selectedTarget = undefined;
        },
        async canRun() {
            return !disabled;
        },
        toObj() {
            return {
                isAction: this.isAction,
                isAttack: this.isAttack,
                isBasic: this.isBasic,
                isResource: false,
                isThwart: this.isThwart,
                name: this.name,
            };
        },
    };
}

function createPlayablePlayer(abilities) {
    const player = Object.create(Player.prototype);
    player.name = 'Player';
    player.canFlip = async () => false;
    player.getHandSize = async () => 5;
    player.hand = {toObjWithPlayability: async () => []};
    player.toObj = () => ({
        superhero: {
            extraTraits: [],
        },
    });
    player.superhero = {
        attached: [],
        currentSide: {
            abilities,
            traits: [],
        },
        getEffectiveStats: async () => ({}),
        getEffectiveTraits: async () => [],
    };

    return player;
}

test('player snapshot includes only legal target ids for each usable basic activation', async () => {
    const villain = {id: 'villain-1'};
    const scheme = {id: 'scheme-1'};
    const attack = createAbility({
        isAttack: true,
        targets: [villain],
    });
    const thwart = createAbility({
        isThwart: true,
        targets: [scheme],
        disabled: true,
    });
    const player = createPlayablePlayer([attack, thwart]);

    const snapshot = await player.toObjWithPlayableHand();

    assert.deepEqual(
        snapshot.superhero.abilities.map(({availableTargetIds}) => availableTargetIds),
        [['villain-1'], undefined]
    );
    assert.equal(snapshot.superhero.abilities[1].disable, true);
});

test('resolving a basic activation keeps the chosen target and rejects an invalid target', async () => {
    const target = {id: 'villain-1'};
    const ability = createAbility({
        isAttack: true,
        targets: [target],
    });
    let resolution;
    const hero = {
        id: 'hero-1',
        currentSide: {abilities: [ability]},
        async resolveAbility(params) {
            resolution = params;
        },
    };
    const player = Object.create(Player.prototype);
    player.superhero = hero;
    player.getCard = cardId => cardId === hero.id ? hero : undefined;
    const match = {
        scenario: {
            getCard: () => undefined,
        },
    };
    hero.match = match;

    await player.resolveAbility(hero.id, 0, target.id);

    assert.equal(resolution.preselectedTarget, true);
    assert.equal(resolution.selectedTarget, target);
    assert.equal(ability.effect.selectedTarget, target);
    await assert.rejects(
        player.resolveAbility(hero.id, 0, 'invalid-target'),
        /objetivo de la activación ya no es válido/
    );
});

test('resolving a targeted action keeps the chosen target', async () => {
    const target = {id: 'villain-1'};
    const ability = createAbility({
        isAction: true,
        targets: [target],
    });
    let resolution;
    const upgrade = {
        id: 'upgrade-1',
        currentSide: {abilities: [ability]},
        async resolveAbility(params) {
            resolution = params;
        },
    };
    const player = Object.create(Player.prototype);
    player.superhero = {id: 'hero-1'};
    player.getCard = cardId => cardId === upgrade.id ? upgrade : undefined;
    const match = {
        scenario: {
            getCard: () => undefined,
        },
    };
    upgrade.match = match;

    await player.resolveAbility(upgrade.id, 0, target.id);

    assert.equal(resolution.preselectedTarget, true);
    assert.equal(resolution.selectedTarget, target);
    assert.equal(ability.effect.selectedTarget, target);
});

test('fixed preselected targets are revalidated without opening a second target selection', () => {
    const target = {id: 'scheme-1'};
    let selectionOpened = false;
    const effect = Object.assign(Object.create(Effect.prototype), {
        _selectedTarget: target,
        ability: undefined,
        refreshTarget: true,
        source: undefined,
        target: 'scheme',
        validTarget: {
            filter(candidate) {
                return candidate === target;
            },
            selectTarget() {
                selectionOpened = true;
                return null;
            },
        },
    });

    assert.equal(effect.selectTarget({fixedPreselectedTarget: true}), target);
    assert.equal(selectionOpened, false);

    effect.validTarget.filter = () => false;
    assert.equal(effect.selectTarget({fixedPreselectedTarget: true}), null);
});

test('basic activation payment uses the current superhero card, not the selected target', async () => {
    const originallyConfiguredCard = {id: 'hero-parent'};
    const currentSuperhero = {
        id: 'hero-current-side',
        exhausted: false,
        async refresh() {},
        exhaust() {
            this.exhausted = true;
        },
    };
    const selectedTarget = {id: 'scheme-1'};
    const ability = new BasicAbility({
        card: originallyConfiguredCard,
        match: {triggerCards: {}},
    });
    const payment = ability.basicCost.effect;
    let targetAtPayment;
    ability.costs.canPay = async params => {
        targetAtPayment = payment.selectedTarget;

        assert.deepEqual(
            await payment.getValidTarget({
                ...params,
                card: currentSuperhero,
                fixedPreselectedTarget: true,
                selectedTarget,
            }),
            [currentSuperhero]
        );

        return true;
    };
    ability.costs.pay = async () => {
        await payment.execute();

        return {cancelled: false, resolved: true};
    };

    await ability.resolveAbility({
        card: currentSuperhero,
        player: {},
        fixedPreselectedTarget: true,
        selectedTarget,
    });

    assert.equal(targetAtPayment, currentSuperhero);
    assert.equal(payment.selectedTarget, currentSuperhero);
    assert.equal(currentSuperhero.exhausted, true);
    assert.equal(selectedTarget.exhausted, undefined);
});

test('fixed activation target is restored after paying a cost refreshes the ability', async () => {
    const selectedTarget = {id: 'scheme-1'};
    const originallyConfiguredCard = {id: 'hero-parent'};
    const currentSuperhero = {id: 'hero-current-side'};
    const ability = new BasicAbility({
        card: originallyConfiguredCard,
        match: {triggerCards: {}},
    });
    let targetAtResolution;
    ability.effect = {
        selectedTarget,
        async canRun() {
            return true;
        },
        async runEffect() {
            targetAtResolution = this.selectedTarget;
            this.resolved = true;
        },
    };
    ability.costs.canPay = async () => true;
    ability.costs.pay = async () => {
        ability.effect.selectedTarget = undefined;

        return {cancelled: false, resolved: true};
    };

    await ability.resolveAbility({
        card: currentSuperhero,
        fixedPreselectedTarget: true,
        player: {},
        preselectedTarget: true,
        selectedTarget,
    });

    assert.equal(targetAtResolution, selectedTarget);
    assert.equal(ability.effect.selectedTarget, selectedTarget);
});

async function resolveCancelledBasicActivation({
    dialogResponse,
    label,
    target,
    targetCollection,
    clearTargetDuringPayment = false,
}) {
    const hero = {
        id: 'hero-1',
        exhausted: false,
    };
    const enemies = [
        {id: 'enemy-1', toObj: () => ({id: 'enemy-1'})},
        {id: 'enemy-2', toObj: () => ({id: 'enemy-2'})},
    ];
    let selectionDialog;
    let selectionDialogCount = 0;
    let paymentAttempted = false;
    let targetAtResolution;
    const match = {
        triggerCards: {},
        activationsFactory: {
            createActivation: () => ({
                filterTarget: () => true,
            }),
        },
        async openDialog(dialog) {
            selectionDialog = dialog;
            selectionDialogCount++;

            return dialogResponse;
        },
    };
    match[targetCollection] = enemies;
    const ability = new BasicAbility({
        card: hero,
        match,
    });
    ability.labels = [label];
    ability.effect = new Effect({
        match,
        target,
    });
    ability.effect.ability = ability;
    ability.canRun = async () => true;
    ability.costs.pay = async () => {
        paymentAttempted = true;
        if (clearTargetDuringPayment) {
            ability.effect.selectedTarget = undefined;
        }

        return {cancelled: false, resolved: true};
    };
    ability.effect.runEffect = async function (params) {
        await this.prepare(params);
        targetAtResolution = this.selectedTarget;
        this.resolved = true;
    };

    await ability.resolveAbility({
        card: hero,
        player: {},
    });

    return {
        ability,
        hero,
        paymentAttempted,
        selectionDialog,
        selectionDialogCount,
        targetAtResolution,
    };
}

test('cancelling basic attack target selection does not pay the activation cost', async () => {
    const {ability, hero, paymentAttempted, selectionDialog} =
        await resolveCancelledBasicActivation({
            label: LABEL_ATTACK,
            target: TARGET_ENEMY,
            targetCollection: 'enemies',
        });

    assert.equal(selectionDialog.showCancel, true);
    assert.equal(paymentAttempted, false);
    assert.equal(hero.exhausted, false);
    assert.equal(ability.resolved, false);
    assert.equal(ability.paymentCancelled, true);
});

test('cancelling basic thwart target selection does not pay the activation cost', async () => {
    const {ability, hero, paymentAttempted, selectionDialog} =
        await resolveCancelledBasicActivation({
            label: LABEL_THWART,
            target: TARGET_SCHEME,
            targetCollection: 'schemes',
        });

    assert.equal(selectionDialog.showCancel, true);
    assert.equal(paymentAttempted, false);
    assert.equal(hero.exhausted, false);
    assert.equal(ability.resolved, false);
    assert.equal(ability.paymentCancelled, true);
});

test('basic activation reuses its selected target after paying the cost', async () => {
    const {selectionDialogCount, targetAtResolution} =
        await resolveCancelledBasicActivation({
            dialogResponse: {selected: {id: 'enemy-1'}},
            label: LABEL_ATTACK,
            target: TARGET_ENEMY,
            targetCollection: 'enemies',
            clearTargetDuringPayment: true,
        });

    assert.equal(selectionDialogCount, 1);
    assert.equal(targetAtResolution.id, 'enemy-1');
});

async function resolveStatusBasicAction({
    label,
    target,
    activationType,
    status,
}) {
    const actor = {
        id: 'actor-1',
        isAlly: false,
        isStunned: status === 'stunned',
        isConfused: status === 'confused',
        removeStunned() {
            this.isStunned = false;
        },
        removeConfused() {
            this.isConfused = false;
        },
        refresh() {},
    };
    let costPayments = 0;
    let targetPreparationAttempts = 0;
    const match = {
        triggerCards: {},
        enemies: [],
        schemes: [],
        activationsFactory: {
            createActivation({type, effect}) {
                if (type !== activationType) {
                    throw new Error(`Unexpected activation type: ${type}`);
                }

                return type === ACTIVATION_ATTACK ?
                    new Attack({effect}) :
                    new Thwart({effect});
            },
        },
    };
    const player = {
        canAttack: () => true,
        canThwart: async () => true,
    };
    const ability = new BasicAbility({card: actor, match});
    ability.labels = [label];
    ability.effect = new Effect({match, target});
    ability.effect.ability = ability;
    ability.effect.trigger = async () => true;
    ability.costs.canPay = async () => true;
    ability.costs.pay = async () => {
        costPayments++;

        return {cancelled: false, resolved: true};
    };
    actor.currentSide = {abilities: [ability]};

    const prepareToResolve = ability.prepareToResolve.bind(ability);
    ability.prepareToResolve = async params => {
        targetPreparationAttempts++;

        return prepareToResolve(params);
    };

    const [availableAbility] = await getAbilitiesWithAvailability(actor, player);
    await ability.resolveAbility({card: actor, player});

    return {
        ability,
        actor,
        availableAbility,
        costPayments,
        targetPreparationAttempts,
    };
}

test('a stunned character can attempt a basic attack without an enemy target', async () => {
    const {
        ability,
        actor,
        availableAbility,
        costPayments,
        targetPreparationAttempts,
    } = await resolveStatusBasicAction({
        label: LABEL_ATTACK,
        target: TARGET_ENEMY,
        activationType: ACTIVATION_ATTACK,
        status: 'stunned',
    });

    assert.equal(availableAbility.disable, false);
    assert.deepEqual(availableAbility.availableTargetIds, []);
    assert.equal(targetPreparationAttempts, 0);
    assert.equal(costPayments, 1);
    assert.equal(actor.isStunned, false);
    assert.equal(ability.resolved, false);
});

test('a confused character can attempt a basic thwart without a scheme target', async () => {
    const {
        ability,
        actor,
        availableAbility,
        costPayments,
        targetPreparationAttempts,
    } = await resolveStatusBasicAction({
        label: LABEL_THWART,
        target: TARGET_SCHEME,
        activationType: ACTIVATION_THWART,
        status: 'confused',
    });

    assert.equal(availableAbility.disable, false);
    assert.deepEqual(availableAbility.availableTargetIds, []);
    assert.equal(targetPreparationAttempts, 0);
    assert.equal(costPayments, 1);
    assert.equal(actor.isConfused, false);
    assert.equal(ability.resolved, false);
});

test('a basic attack without a target still requires its matching status', async () => {
    const {
        ability,
        actor,
        availableAbility,
        costPayments,
        targetPreparationAttempts,
    } = await resolveStatusBasicAction({
        label: LABEL_ATTACK,
        target: TARGET_ENEMY,
        activationType: ACTIVATION_ATTACK,
    });

    assert.equal(availableAbility.disable, true);
    assert.equal(availableAbility.availableTargetIds, undefined);
    assert.equal(targetPreparationAttempts, 1);
    assert.equal(costPayments, 0);
    assert.equal(actor.isStunned, false);
    assert.equal(ability.resolved, false);
});
