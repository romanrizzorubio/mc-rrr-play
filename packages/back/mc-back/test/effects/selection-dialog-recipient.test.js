import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {TARGET_ANY_PLAYER} from 'mc-shared';
import {ReplaceStatusEffect} from '../../src/effects/replace-status-effect.js';
import {SelectFromTopDeckEffect} from '../../src/effects/select-from-top-deck-effect.js';
import {ValidTarget} from '../../src/targets/valid-target.js';

describe('selection dialog recipients', () => {
    test('targets a direct valid-target selection to the player resolving it', async () => {
        const actor = {
            abilities: [],
            id: 'actor-id',
            name: 'Actor',
            isPlayer: true,
            toTargetObj() {
                return {id: this.id};
            },
        };
        const otherPlayer = {
            abilities: [],
            id: 'other-id',
            name: 'Other player',
            isPlayer: true,
            toTargetObj() {
                return {id: this.id};
            },
        };
        let dialog;
        const match = {
            players: [actor, otherPlayer],
            async openDialog(params) {
                dialog = params;

                return {selected: params.data.cards[1]};
            },
        };
        const validTarget = new ValidTarget({match});

        const selected = await validTarget.selectTarget({
            match,
            player: actor,
            target: TARGET_ANY_PLAYER,
        });

        assert.strictEqual(selected, otherPlayer);
        assert.equal(dialog.targetPlayer, actor.id);
    });

    test('targets top-of-deck card choices to the player resolving the effect', async () => {
        const actor = {id: 'actor-id', name: 'Actor'};
        const cards = [
            {id: 'top-card-1', toObj() { return {id: this.id}; }},
            {id: 'top-card-2', toObj() { return {id: this.id}; }},
        ];
        let dialog;
        const match = {
            async openDialog(params) {
                dialog = params;

                return {selected: [params.data.cards[1]]};
            },
        };
        const player = {
            ...actor,
            deck: {
                async draw() {
                    return cards;
                },
                async discard() {},
                refresh() {},
            },
            hand: {
                addCards() {},
                async refresh() {},
            },
        };
        const effect = new SelectFromTopDeckEffect({match});

        await effect.execute({match, player});

        assert.strictEqual(dialog.targetPlayer, player);
    });

    test('targets status-card choices to the player resolving the effect', async () => {
        const actor = {id: 'actor-id', name: 'Actor'};
        const cards = [
            {id: 'character-1', toObj() { return {id: this.id}; }},
            {id: 'character-2', toObj() { return {id: this.id}; }},
        ];
        let dialog;
        const match = {
            async openDialog(params) {
                dialog = params;

                return {selected: params.data.cards[1]};
            },
        };
        const effect = new ReplaceStatusEffect({match});
        effect.getValidTarget = () => cards;

        const selected = await effect.selectTarget({
            match,
            player: actor,
        });

        assert.strictEqual(selected, cards[1]);
        assert.strictEqual(dialog.targetPlayer, actor);
    });

    test('targets both status replacement choices to the player resolving the effect', async () => {
        const actor = {id: 'actor-id', name: 'Actor'};
        const card = {
            id: 'character-id',
            stunned: 1,
            confused: 1,
            tough: 1,
            removeStunned() {
                this.stunned--;
            },
            removeConfused() {
                this.confused--;
            },
            removeTough() {
                this.tough--;
            },
            stun() {
                this.stunned++;
            },
            confuse() {
                this.confused++;
            },
            setTough() {
                this.tough++;
            },
            async refresh() {},
        };
        const dialogs = [];
        const match = {
            async openDialog(params) {
                dialogs.push(params);

                return {selected: params.data.options[0]};
            },
        };
        const effect = new ReplaceStatusEffect({match});
        effect.selectedTarget = card;

        await effect.execute({player: actor});

        assert.equal(dialogs.length, 2);
        assert.deepEqual(
            dialogs.map(({targetPlayer}) => targetPlayer.id),
            [actor.id, actor.id],
        );
    });
});
