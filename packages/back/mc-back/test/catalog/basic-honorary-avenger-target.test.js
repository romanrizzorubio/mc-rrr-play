import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {TARGET_FRIENDLY_CHARACTER} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {AttachEffect} from '../../src/effects/attach-effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

describe('Vengador honorario', () => {
    test('can be attached to a character controlled by another player', async () => {
        const {aspects} = await loadCatalog();
        const definition = aspects.find(({_id}) =>
            _id === 'basic-honorary-avenger');
        assert.ok(definition);
        assert.equal(
            definition.card.params.attach,
            TARGET_FRIENDLY_CHARACTER
        );

        const match = {
            characters: [],
            inPlayCards: [],
            triggerCards: {},
        };
        const player = {match};
        const otherPlayer = {};
        const createCharacter = (id, owner) => ({
            abilities: [],
            attached: [],
            id,
            isCharacter: true,
            isEnemy: false,
            isInPlay: true,
            owner,
            async refresh() {},
            toObj() {
                return {id: this.id};
            },
        });
        const ownCharacter = createCharacter('own-character', player);
        const otherCharacter = createCharacter('other-character', otherPlayer);
        const villain = createCharacter('villain', {});
        villain.isEnemy = true;
        player.friends = [ownCharacter];
        otherPlayer.friends = [otherCharacter];
        match.players = [player, otherPlayer];
        match.characters.push(ownCharacter, otherCharacter, villain);

        const cardsFactory = new CardsFactory({match});
        const printedCard = cardsFactory.createCard(definition.card);
        const attachment = cardsFactory.createGameCard({
            card: printedCard,
            owner: player,
        });
        const playEffect = new PlayCardEffect({card: attachment, match});

        assert.deepEqual(
            await playEffect.getValidTarget({match, player}),
            [ownCharacter, otherCharacter]
        );

        const attachEffect = printedCard.createAttachEffect(attachment);
        assert.ok(attachEffect instanceof AttachEffect);
        assert.deepEqual(
            await attachEffect.getValidTarget({match, player}),
            [ownCharacter, otherCharacter]
        );

        attachEffect.selectedTarget = otherCharacter;
        await attachEffect.execute({match, player});

        assert.deepEqual(otherCharacter.attached, [attachment]);
        assert.strictEqual(attachment.attachedTo, otherCharacter);
    });
});
