import assert from 'node:assert/strict';
import test from 'node:test';

import {
    CARD_TYPE_ALLY,
    TRIGGER_ATTACHED_GET_ATTACK_CONSEQUENCIAL,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

test('Enfurecido modifies its attached ally attack consequential through an effect', async () => {
    const {aspects} = await loadCatalog();
    const enfurecido = aspects.find(aspect =>
        aspect._id === 'aggression-enfurecido');
    assert.ok(enfurecido);
    assert.equal(enfurecido.card.params.attackConsequencial, undefined);

    const player = {
        hand: {cards: []},
        isPlayer: true,
    };
    const match = {
        triggerCards: {},
    };
    const cardsFactory = new CardsFactory({match});
    match.effectsFactory = cardsFactory.abilitiesFactory.effectsFactory;
    const ally = cardsFactory.createGameCard({
        card: cardsFactory.createCard({
            type: CARD_TYPE_ALLY,
            params: {
                name: 'Aliado de prueba',
                set: 'test',
                attack: 1,
                thwart: 1,
                hitPoints: 3,
                attackConsequencial: 1,
            },
        }),
        owner: player,
    });
    const upgradeCard = cardsFactory.createCard(enfurecido.card);
    assert.equal('attackConsequencial' in upgradeCard, false);
    const upgrade = cardsFactory.createGameCard({
        card: upgradeCard,
        owner: player,
    });

    assert.equal(await ally.getAttackConsequencialValue({player}), 1);

    ally.attached.push(upgrade);
    upgrade.attachedTo = ally;
    await upgrade.initTriggers();

    assert.ok(upgrade.triggers[TRIGGER_ATTACHED_GET_ATTACK_CONSEQUENCIAL]);
    assert.equal(await ally.getAttackConsequencialValue({player}), 2);

    ally.refresh = async () => {};
    const attackAbility = ally.abilities.find(ability =>
        ability.isAttack && ability.isBasic);
    assert.ok(attackAbility);
    await attackAbility.applyConsequencial({player});
    assert.equal(ally.damage, 2);
});
