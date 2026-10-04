import assert from 'node:assert/strict';
import {test} from 'node:test';

import protectionSupports from '../../../mc-data/seed/catalog/aspects/protection/supports.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

test('Medical Team is available when a friendly character has damage and it has uses', async () => {
    const match = {};
    const cardsFactory = new CardsFactory({match});
    const superhero = {
        damage: 1,
        currentSide: {
            damage: 0,
            get canHeal() {
                return Boolean(this.damage);
            },
        },
        get canHeal() {
            return Boolean(this.damage);
        },
    };
    const player = {
        friends: [superhero],
    };
    const card = cardsFactory.createCard(protectionSupports[0].card);
    const medicalTeam = cardsFactory.createGameCard({card, owner: player});
    medicalTeam.counters = 3;

    let result = await medicalTeam.toObjWithAbilityAvailability(player);
    assert.equal(result.abilities[0].disable, false);

    superhero.damage = 0;
    result = await medicalTeam.toObjWithAbilityAvailability(player);
    assert.equal(result.abilities[0].disable, true);

    superhero.damage = 1;
    medicalTeam.counters = 0;
    result = await medicalTeam.toObjWithAbilityAvailability(player);
    assert.equal(result.abilities[0].disable, true);
});
