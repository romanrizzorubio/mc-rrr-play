import assert from 'node:assert/strict';
import {test} from 'node:test';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {Attack} from '../../src/activations/attack.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {CharacterGameCard} from '../../src/model/cards/character-game-card.js';

test('an attachment grants its retaliate value to the attached character', async () => {
    const {scenarios} = await loadCatalog();
    const klaw = scenarios.find(({_id}) => _id === 'klaw');
    const attachmentConfig = klaw.config.cards.find(({card}) =>
        card.params.name === 'Cuerpo de sonido sólido').card;
    const attacker = {};
    const match = {
        effectsFactory: {
            createEffect({damage, selectedTarget}) {
                return {
                    damage,
                    selectedTarget,
                    async canRun() {
                        return true;
                    },
                };
            },
        },
        enemies: [],
        triggerCards: {},
    };
    const cardsFactory = new CardsFactory({match});
    const target = new CharacterGameCard({
        card: {
            hitPoints: 10,
            isVillain: true,
            match,
            retaliate: 0,
        },
        owner: {},
    });
    target.getLife = async () => 10;
    target.refresh = async () => {};

    match.enemies.push(target);
    match.villain = target;

    const attachment = cardsFactory.createGameCard({
        card: cardsFactory.createCard(attachmentConfig),
        owner: {},
    });
    await attachment.card.attachCard({
        card: attachment,
        match,
        player: {},
    });

    const attack = new Attack({
        effect: {
            character: attacker,
            match,
            ranged: false,
        },
    });

    assert.equal(attachment.attachedTo, target);
    assert.equal(target.retaliate, 1);
    const retaliation = await attack.getRetaliateDamageEffect(target, {});

    assert.equal(retaliation.damage, 1);
    assert.equal(retaliation.selectedTarget, attacker);
});
