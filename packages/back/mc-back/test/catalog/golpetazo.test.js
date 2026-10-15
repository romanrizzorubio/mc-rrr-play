import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    DIALOG_USE_CARD,
    TRAIT_WEAPON,
} from 'mc-shared';
import aggressionEvents from '../../../mc-data/seed/catalog/aspects/aggression/events.js';
import thor from '../../../mc-data/seed/catalog/heroes/thor.js';
import {AttackBasicAbility} from '../../src/abilities/basic/attack-basic-ability.js';
import {Attack} from '../../src/activations/attack.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {AttachEffect} from '../../src/effects/attach-effect.js';
import {GameZone} from '../../src/model/match/game-zone.js';
import {Hand} from '../../src/model/match/hand.js';

async function getGolpetazoDialogs({
    attachedTo,
    weaponCardConfig,
} = {}) {
    const dialogs = [];
    const match = {
        triggerCards: {},
        async openDialog(dialog) {
            dialogs.push(dialog);
            return {};
        },
    };
    const cardsFactory = new CardsFactory({match});
    const hero = {
        attached: [],
        id: 'hero',
        isHero: true,
        async refresh() {},
    };
    const alterEgo = {
        attached: [],
        id: 'alter-ego',
        isAlterEgo: true,
        async refresh() {},
    };
    const player = {
        isHero: true,
        isPlayer: true,
        superhero: {
            currentSide: hero,
            sides: [alterEgo, hero],
        },
    };
    player.hand = new Hand(player);
    player.gameZone = new GameZone({owner: player});
    Object.defineProperty(player, 'upgrades', {
        get: () => player.gameZone.upgrades,
    });
    const weapon = weaponCardConfig ?
        cardsFactory.createGameCardFromConfig(weaponCardConfig, {owner: player}) :
        {
            exhausted: false,
            id: 'weapon',
            isUpgrade: true,
            traits: [TRAIT_WEAPON],
        };
    weapon.controller = player;
    player.gameZone.addToGameZone(weapon);

    if (attachedTo) {
        const attachEffect = new AttachEffect({
            card: weapon,
            match,
            selectedTarget: attachedTo({hero, alterEgo}),
        });
        await attachEffect.execute({});
    }

    const golpetazoConfig = aggressionEvents.find(({_id}) =>
        _id === 'aggression-golpetazo');
    assert.ok(golpetazoConfig);
    const printedCard = cardsFactory.createCard(golpetazoConfig.card);
    const golpetazo = cardsFactory.createGameCard({
        card: printedCard,
        owner: player,
    });
    player.hand.addCard(golpetazo);

    const attackAbility = new AttackBasicAbility({
        card: hero,
        match,
    });
    const attackEffect = attackAbility.effect;
    attackEffect.damage = 1;
    attackEffect.preventDamage = 0;
    const attack = new Attack({effect: attackEffect});
    attackEffect.activation = attack;
    await attackEffect.triggerInit(attackEffect.getTriggersParams({player}));

    return dialogs;
}

test('Golpetazo opens for Mjolnir, an unlinked Weapon upgrade in your play area', async () => {
    const mjolnir = thor.config.cards.find(({card}) =>
        card.params.name === 'Mjolnir');
    assert.ok(mjolnir);

    const dialogs = await getGolpetazoDialogs({
        weaponCardConfig: mjolnir.card,
    });

    assert.equal(dialogs.length, 1);
    assert.equal(dialogs[0].dialogType, DIALOG_USE_CARD);
    assert.equal(dialogs[0].data.cards[0].name, 'Golpetazo');
});

test('Golpetazo accepts a Weapon linked to either side of your superhero', async () => {
    const heroDialogs = await getGolpetazoDialogs({
        attachedTo: ({hero}) => hero,
    });
    const alterEgoDialogs = await getGolpetazoDialogs({
        attachedTo: ({alterEgo}) => alterEgo,
    });

    assert.equal(heroDialogs.length, 1);
    assert.equal(alterEgoDialogs.length, 1);
});

test('Golpetazo rejects a Weapon linked to an ally or another hero', async () => {
    const ally = {
        attached: [],
        id: 'ally',
        isAlly: true,
        async refresh() {},
    };
    const otherHero = {
        attached: [],
        id: 'other-hero',
        isHero: true,
        async refresh() {},
    };

    assert.deepEqual(await getGolpetazoDialogs({
        attachedTo: () => ally,
    }), []);
    assert.deepEqual(await getGolpetazoDialogs({
        attachedTo: () => otherHero,
    }), []);
});
