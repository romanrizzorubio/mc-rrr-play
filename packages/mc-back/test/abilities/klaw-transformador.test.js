import assert from 'node:assert/strict';
import {test} from 'node:test';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

test('Transformador sónico stuns the character that took Klaw attack damage', async () => {
    const {scenarios} = await loadCatalog();
    const klaw = scenarios.find(({_id}) => _id === 'klaw');
    const attachmentConfig = klaw.config.cards.find(({card}) =>
        card.params.name === 'Transformador sónico').card;
    const match = {
        triggerCards: {},
    };
    const cardsFactory = new CardsFactory({match});
    const createAttachment = () => cardsFactory.createGameCard({
        card: cardsFactory.createCard(attachmentConfig),
        owner: {},
    });
    const createCharacter = () => ({
        isStunned: false,
        refresh() {},
        stun() {
            this.isStunned = true;
        },
    });
    const hero = {
        ...createCharacter(),
        isHero: true,
    };
    const player = {
        isHero: true,
        isPlayer: true,
        superhero: {
            currentSide: hero,
        },
    };
    const ally = {
        ...createCharacter(),
        isAlly: true,
    };

    for (const attackedCharacter of [ally, player]) {
        const attachment = createAttachment();
        const attack = {
            attacked: attackedCharacter,
            selectedTarget: player,
        };
        attack.activation = {
            effect: attack,
            takenDamage: 2,
        };

        await attachment.abilities[0].resolveAbility({
            card: attachment,
            effect: attack,
            player,
        });

        assert.equal(attackedCharacter === player ? hero.isStunned : ally.isStunned, true);
    }
});

test('Transformador sónico can be discarded by spending energy, physical and mental resources', async () => {
    const {scenarios} = await loadCatalog();
    const klaw = scenarios.find(({_id}) => _id === 'klaw');
    const attachmentConfig = klaw.config.cards.find(({card}) =>
        card.params.name === 'Transformador sónico').card;
    const discardedCards = [];
    const encounterDiscardPile = [];
    const player = {
        isHero: true,
        isPlayer: true,
        async spendResources(resources) {
            assert.deepEqual(resources, ['e', 'p', 'm']);

            return {generators: [], hand: []};
        },
    };
    const match = {
        scenario: {
            deck: {
                discardPile: encounterDiscardPile,
                async discard(card) {
                    encounterDiscardPile.push(card);
                },
                async refresh() {},
            },
            gameZone: {
                async discard(card) {
                    discardedCards.push(card);
                },
            },
        },
        triggerCards: {},
    };
    const cardsFactory = new CardsFactory({match});
    const attachment = cardsFactory.createGameCard({
        card: cardsFactory.createCard(attachmentConfig),
        owner: player,
    });
    const abilityIndex = attachment.abilities.findIndex(({isAction}) => isAction);
    const villain = {
        attached: [attachment],
        removeAttached(card) {
            this.attached.splice(this.attached.indexOf(card), 1);
        },
        refresh() {},
    };
    attachment.attachedTo = villain;

    assert.equal(abilityIndex, 1);
    await attachment.resolveAbility({
        abilityIndex,
        match,
        player,
    });

    assert.deepEqual(discardedCards, [attachment]);
    assert.deepEqual(encounterDiscardPile, [attachment]);
    assert.deepEqual(villain.attached, []);
});
