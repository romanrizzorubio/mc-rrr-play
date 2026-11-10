import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import playerStyles from '../src/components/match/mc-player/mc-player.css.js';
import styles from '../src/components/panels/mc-game-zone/mc-game-zone.css.js';
import {getUpgradesForDisplay} from '../src/utils/game-zone.js';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
    mcStaticRemote: {
        getAssetUrl(path) {
            return path;
        },
    },
};
globalThis.CustomEvent = class {
    constructor(type, options = {}) {
        this.type = type;
        Object.assign(this, options);
    }
};

const {McGameZone} = await import(
    '../src/components/panels/mc-game-zone/mc-game-zone.js'
);

describe('game zone', () => {
    test('includes superhero-attached upgrades with other player upgrades', () => {
        const regularUpgrade = {
            id: 'regular-upgrade',
            isUpgrade: true,
            isAttached: false,
        };
        const superheroUpgrade = {
            id: 'superhero-upgrade',
            isUpgrade: true,
            isAttached: true,
        };
        const attachedSupport = {
            id: 'attached-support',
            isUpgrade: false,
            isAttached: true,
        };

        assert.deepEqual(
            getUpgradesForDisplay(
                [regularUpgrade, superheroUpgrade],
                [superheroUpgrade, attachedSupport]
            ),
            [regularUpgrade, superheroUpgrade]
        );
    });

    test('keeps a minimum-size drop area for playing cards', () => {
        assert.match(
            styles.cssText,
            /\.play-card-drop-zone\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*300px;[^}]*min-height:\s*200px;/s
        );
        assert.match(
            playerStyles.cssText,
            /mc-game-zone\.panel\s*\{[^}]*flex:\s*1 1 300px;[^}]*min-width:\s*300px;/s
        );
    });

    test('stacks supports below upgrades, allies, and encounters', () => {
        const zone = Object.assign(
            Object.create(McGameZone.prototype),
            {
                cards: [],
                attachedUpgrades: [],
                minions: [],
                encounters: 1,
                player: {},
                dragActivation: null,
                dragPlayCard: null,
                dragResourcePayment: null,
            }
        );
        const [
            encounters,
            minions,
            allies,
            upgrades,
            supports,
        ] = zone.render().values.slice(3);

        assert.match(encounters.strings.join(''), /<mc-card-image/u);
        assert.match(minions.strings.join(''), /class="minions-row"/u);
        assert.equal(allies.values[0], 'allies');
        assert.equal(upgrades.values[0], 'upgrades');
        assert.equal(supports.values[0], 'supports');
    });

    test('renders obligations before minions in their shared row', () => {
        const obligation = {id: 'obligation', isObligation: true};
        const minion = {id: 'minion', isMinion: true};
        const zone = Object.assign(
            Object.create(McGameZone.prototype),
            {
                cards: [obligation],
                minions: [minion],
                player: {},
                dragActivation: null,
                dragPlayCard: null,
                dragResourcePayment: null,
            }
        );
        const row = zone.renderMinionsRow();
        const obligationList = row.values[0];
        const minionList = row.values[1];
        const renderedObligations = obligationList.values.find(Array.isArray);

        assert.match(row.strings[0], /class="minions-row"/);
        assert.deepEqual(renderedObligations, [obligation]);
        assert.ok(minionList.values.includes(zone.minions));
        assert.match(
            styles.cssText,
            /\.minions-row\s*\{[^}]*display:\s*flex;/s
        );
    });

    test('includes the local player id when dropping an assigned card on their zone', () => {
        const card = {id: 'shared-upgrade'};
        const zone = Object.assign(
            Object.create(McGameZone.prototype),
            {
                player: {id: 'local-id'},
                dragPlayCard: {
                    card,
                    playableInGameZone: true,
                    playablePlayerIds: ['local-id'],
                },
            },
        );
        let dispatchedEvent;

        zone.dispatchEvent = event => {
            dispatchedEvent = event;
        };
        zone.handlePlayCardDrop({
            preventDefault() {},
            stopPropagation() {},
        });

        assert.equal(dispatchedEvent.type, 'play-card-drop');
        assert.deepEqual(dispatchedEvent.detail, {
            card,
            targetId: 'local-id',
        });

        zone.dragPlayCard.playablePlayerIds = ['other-id'];
        dispatchedEvent = undefined;
        zone.handlePlayCardDrop({
            preventDefault() {},
            stopPropagation() {},
        });
        assert.equal(dispatchedEvent, undefined);
    });

    test('only activates another player zone when the card can target that player', () => {
        const zone = Object.assign(
            Object.create(McGameZone.prototype),
            {
                player: {id: 'other-id'},
                cards: [],
                attachedUpgrades: [],
                minions: [],
                encounters: 0,
                dragPlayCard: {
                    card: {id: 'event-card'},
                    playerId: 'local-id',
                    playableInGameZone: true,
                    playablePlayerIds: [],
                },
            },
        );

        assert.equal(zone.canPlayDraggedCardOnPlayer(), false);
        assert.equal(zone.render().values[0], '');

        zone.player = {id: 'local-id'};
        assert.equal(zone.canPlayDraggedCardOnPlayer(), true);

        zone.player = {id: 'other-id'};
        zone.dragPlayCard.playablePlayerIds = ['other-id'];
        assert.equal(zone.canPlayDraggedCardOnPlayer(), true);
    });

    test('shows an assigned encounter count only when multiple cards are present', () => {
        const renderEncounters = encounters => Object.assign(
            Object.create(McGameZone.prototype),
            {
                encounters,
                dragActivation: null,
                dragPlayCard: null,
            }
        ).renderEncounters();

        const singleEncounter = renderEncounters(1);
        assert.ok(singleEncounter.strings.join('').includes('<mc-card-image'));
        assert.equal(
            singleEncounter.values.some(value =>
                value?.strings?.join('').includes('class="count"')
            ),
            false
        );

        const multipleEncounters = renderEncounters(2);
        const countLabel = multipleEncounters.values.find(value =>
            value?.strings?.join('').includes('class="count"')
        );
        assert.ok(countLabel);
        assert.equal(countLabel.values[0], 2);
    });
});
