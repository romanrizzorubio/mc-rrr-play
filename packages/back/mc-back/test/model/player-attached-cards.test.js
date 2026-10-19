import assert from 'node:assert/strict';
import {test} from 'node:test';

import {CharacterGameCard} from '../../src/model/cards/character-game-card.js';
import {Player} from '../../src/model/match/player.js';
import {Superhero} from '../../src/model/match/superhero.js';

const match = {
    initialPlayer: {},
    triggerCards: {},
};

const createIdentitySide = (id, {isHero, isAlterEgo}) => new CharacterGameCard({
    card: {
        id,
        name: id,
        isAlterEgo,
        isCharacter: true,
        isFriendFront: false,
        isHero,
        isSuperhero: true,
        hitPoints: 15,
        match,
        quickStrike: false,
        traits: [],
    },
});

test('player snapshot includes active identity attachments without duplicates', async () => {
    const heroSide = createIdentitySide('hero', {
        isHero: true,
        isAlterEgo: false,
    });
    const alterEgoSide = createIdentitySide('alter-ego', {
        isHero: false,
        isAlterEgo: true,
    });
    const superhero = new Superhero({
        sides: [heroSide, alterEgoSide],
    });
    const hostAttachment = {
        id: 'host-attachment',
        async toObjWithAbilityAvailability() {
            return {id: this.id};
        },
    };
    const identityAttachment = {
        id: 'identity-attachment',
        async toObjWithAbilityAvailability() {
            return {id: this.id};
        },
    };

    superhero.attached.push(hostAttachment);
    heroSide.attached.push(hostAttachment, identityAttachment);
    superhero.getEffectiveTraits = async () => [];
    superhero.getEffectiveStats = async () => ({});

    const player = {
        superhero,
        async canFlip() {
            return false;
        },
        async getHandSize() {
            return 5;
        },
        hand: {
            async toObjWithPlayability() {
                return [];
            },
        },
        toObj() {
            return {
                superhero: {
                    extraTraits: [],
                },
            };
        },
    };

    const snapshot = await Player.prototype.toObjWithPlayableHand.call(player);

    assert.deepEqual(
        snapshot.superhero.attached.map(({id}) => id),
        ['host-attachment', 'identity-attachment'],
    );

    alterEgoSide.abilities = [];
    superhero.selectedSide = 1;

    const alterEgoSnapshot =
        await Player.prototype.toObjWithPlayableHand.call(player);

    assert.deepEqual(
        alterEgoSnapshot.superhero.attached.map(({id}) => id),
        ['host-attachment'],
    );
});
