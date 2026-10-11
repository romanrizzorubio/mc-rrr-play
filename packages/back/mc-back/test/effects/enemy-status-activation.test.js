import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    DIALOG_ACTIVATE,
    TARGET_REVEALED_ABILITY,
} from 'mc-shared';
import standard from '../../../mc-data/seed/catalog/sets/standard.js';
import {Attack} from '../../src/activations/attack.js';
import {Scheme} from '../../src/activations/scheme.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {EnemySchemeEffect} from '../../src/effects/enemy-scheme-effect.js';
import {ResolveAbilityEffect} from '../../src/effects/resolve-ability-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

function createCharacter() {
    return {
        confused: 0,
        isConfused: false,
        isStunned: false,
        name: 'Klaw',
        removeConfused() {
            this.confused = 0;
            this.isConfused = false;
        },
        removeStunned() {
            this.stunned = 0;
            this.isStunned = false;
        },
        refresh() {},
        stunned: 0,
    };
}

test('stunned enemy attack shows why it was skipped before consuming stun', async () => {
    const character = createCharacter();
    character.stunned = 1;
    character.isStunned = true;

    const effect = new EnemyAttackEffect({
        enemy: character,
        match: {},
    });
    effect.activation = new Attack({effect});
    effect.trigger = async () => true;

    const openedDialogs = [];
    let resolveDialog;
    let notifyDialogOpened;
    const dialogOpened = new Promise(resolve => {
        notifyDialogOpened = resolve;
    });
    const dialogResponse = new Promise(resolve => {
        resolveDialog = resolve;
    });
    effect.openDialog = async dialog => {
        openedDialogs.push(dialog);
        notifyDialogOpened();

        return dialogResponse;
    };

    const activation = effect.triggerWould({});
    await dialogOpened;

    assert.equal(openedDialogs[0].dialogType, DIALOG_ACTIVATE);
    assert.equal(openedDialogs[0].title, 'Activación omitida');
    assert.equal(openedDialogs[0].data.statusType, 'stunned');
    assert.equal(openedDialogs[0].data.statusMessage, 'Klaw estaba aturdido y no ataca.');
    assert.equal(character.isStunned, true);

    resolveDialog();
    assert.equal(await activation, false);
    assert.equal(character.isStunned, false);
});

test('confused enemy scheme shows why it was skipped before consuming confusion', async () => {
    const character = createCharacter();
    character.confused = 1;
    character.isConfused = true;

    const effect = new EnemySchemeEffect({
        enemy: character,
        match: {},
    });
    effect.activation = new Scheme({effect});
    effect.trigger = async () => true;

    const openedDialogs = [];
    let resolveDialog;
    let notifyDialogOpened;
    const dialogOpened = new Promise(resolve => {
        notifyDialogOpened = resolve;
    });
    const dialogResponse = new Promise(resolve => {
        resolveDialog = resolve;
    });
    effect.openDialog = async dialog => {
        openedDialogs.push(dialog);
        notifyDialogOpened();

        return dialogResponse;
    };

    const activation = effect.triggerWould({});
    await dialogOpened;

    assert.equal(openedDialogs[0].dialogType, DIALOG_ACTIVATE);
    assert.equal(openedDialogs[0].title, 'Activación omitida');
    assert.equal(openedDialogs[0].data.statusType, 'confused');
    assert.equal(openedDialogs[0].data.statusMessage, 'Klaw estaba confundido y no ejecuta el plan.');
    assert.equal(character.isConfused, true);

    resolveDialog();
    assert.equal(await activation, false);
    assert.equal(character.isConfused, false);
});

test('resolving Mover ficha again uses only the second scheme activation boost', async () => {
    const resolvedBoosts = [];
    const discardedBoosts = [];
    const boosts = [
        createBoostCard('Primer aumento', 2, resolvedBoosts, discardedBoosts),
        createBoostCard('Segundo aumento', 3, resolvedBoosts, discardedBoosts),
    ];
    const placedThreat = [];
    const dialogs = [];
    let drawnBoosts = 0;
    let enemySelections = 0;
    const player = {isPlayer: true, name: 'Jugador'};
    const match = {
        amplificationIcons: 0,
        skipBoostDealtNotification: true,
        triggerCards: {},
        activationsFactory: {
            createActivation: ({effect}) => new Scheme({effect}),
        },
        async drawEncounterCards() {
            return [boosts[drawnBoosts++]];
        },
        async openDialog(dialog) {
            dialogs.push(dialog);

            return {};
        },
    };
    const factory = new CardsFactory({match});
    match.effectsFactory = factory.abilitiesFactory.effectsFactory;

    const treacheryConfig = standard.config.cards.find(({card}) =>
        card.params.name === 'Mover ficha').card;
    const treachery = factory.createGameCard({
        card: factory.createCard(treacheryConfig),
        owner: player,
    });
    const ability = treachery.abilities[0];
    const enemy = {
        isVillain: true,
        name: 'Villano',
        scheme: 2,
        toObj() {
            return {name: this.name};
        },
    };
    const mainScheme = {
        isMainScheme: true,
        threat: 0,
        value: 100,
        placeThreat(threat) {
            placedThreat.push(threat);
            this.threat += threat;
        },
        refresh() {},
        toObj() {
            return {name: 'Plan principal'};
        },
    };
    const effect = ability.effect;
    effect.selectedTarget = mainScheme;
    effect.validTarget.getValidTarget = () => [mainScheme];
    effect.selectTarget = async () => mainScheme;
    effect.selectEnemy = async () => {
        enemySelections++;
        effect.enemy = enemy;
    };

    await ability.resolveAbility({
        card: treachery,
        player,
        preselectedTarget: true,
    });
    const resolveAgain = new ResolveAbilityEffect({
        match,
        target: TARGET_REVEALED_ABILITY,
    });
    await resolveAgain.execute({
        card: treachery,
        player,
        revealedAbility: ability,
    });

    assert.equal(drawnBoosts, 2);
    assert.equal(enemySelections, 2);
    assert.deepEqual(resolvedBoosts, ['Primer aumento', 'Segundo aumento']);
    assert.deepEqual(discardedBoosts, ['Primer aumento', 'Segundo aumento']);
    assert.deepEqual(placedThreat, [4, 5]);
    assert.equal(mainScheme.threat, 9);
    assert.equal(
        dialogs.filter(({data}) => data?.isBoost).length,
        2
    );
});

function createBoostCard(name, boost, resolvedBoosts, discardedBoosts) {
    return {
        boost,
        boostAbility: {
            async resolveAbility() {
                resolvedBoosts.push(name);
            },
        },
        isInPlay: false,
        async discard() {
            discardedBoosts.push(name);
        },
        toObj() {
            return {name, boost};
        },
    };
}
