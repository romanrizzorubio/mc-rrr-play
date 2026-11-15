import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    DIALOG_USE_CARD,
    PRIORITY_RESPONSE,
    TRIGGER_THIS_DEFEAT_MINION,
} from 'mc-shared';

import leadershipAllies from '../../../mc-data/seed/catalog/aspects/leadership/allies.js';
import blackWidow from '../../../mc-data/seed/catalog/heroes/black-widow.js';
import {Attack} from '../../src/activations/attack.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

describe('Bill Rayos Beta', () => {
    test('removes threat from the main scheme when his attack defeats a minion', async () => {
        const cardDefinition = leadershipAllies.find(({_id}) =>
            _id === 'leadership-bill-rayos-beta').card;
        const mainScheme = {
            canRemoveThreat: () => true,
            isInPlay: true,
            threat: 4,
            removeThreat(count) {
                this.threat = Math.max(0, this.threat - count);
            },
            async refresh() {},
        };
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'bill-rayos-beta-defeat-minion',
        });
        match.scenario = {mainScheme};
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...blackWidow.config,
            cards: [],
            nemesis: [],
            precon: [],
        });
        superhero.selectedSide = 1;
        const player = match.createPlayer({
            name: 'Test',
            superhero,
        });
        await player.initPlayer();
        player.gameZone.refresh = async () => {};
        player.deck.refresh = async () => {};

        const bill = matchFactory.cardsFactory.createGameCardFromConfig(
            cardDefinition,
            {owner: player}
        );
        bill.controller = player;
        player.gameZone.addToGameZone(bill);
        await bill.initTriggers({player});

        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);

            return dialog.dialogType === DIALOG_USE_CARD ?
                {selected: {id: bill.id}} :
                {};
        };

        const createMinion = () => ({
            isCharacter: true,
            isEnemy: true,
            isInPlay: true,
            isMinion: true,
            async defeat() {
                this.isInPlay = false;
            },
        });
        const attackAbility = {
            card: bill,
            character: bill,
            isAttack: true,
            isBasic: true,
        };
        const minion = createMinion();
        const attack = new Attack({
            effect: {
                ability: attackAbility,
                character: bill,
                isAttack: true,
                match,
                selectedTarget: minion,
            },
        });
        const defeat = new DefeatEffect({
            ability: attackAbility,
            activation: attack,
            match,
            selectedTarget: minion,
        });
        const responseTrigger = bill.triggers[TRIGGER_THIS_DEFEAT_MINION]
            [PRIORITY_RESPONSE][0];
        const attackParams = defeat.getTriggersParams({match, player});

        assert.equal(attackParams.effect.isAttack, true);
        assert.equal(await responseTrigger.canTrigger(attackParams), true);

        const nonAttackDefeat = new DefeatEffect({
            ability: {...attackAbility, isAttack: false},
            match,
            selectedTarget: createMinion(),
        });
        assert.equal(
            await responseTrigger.canTrigger(
                nonAttackDefeat.getTriggersParams({match, player})
            ),
            false
        );

        const otherCharacter = {id: 'other-character'};
        const otherAbility = {
            card: otherCharacter,
            character: otherCharacter,
            isAttack: true,
        };
        const otherAttack = new Attack({
            effect: {
                ability: otherAbility,
                character: otherCharacter,
                isAttack: true,
                match,
            },
        });
        const otherDefeat = new DefeatEffect({
            ability: otherAbility,
            activation: otherAttack,
            match,
            selectedTarget: createMinion(),
        });
        const otherCharacterCanTrigger = await responseTrigger.canTrigger(
            otherDefeat.getTriggersParams({match, player})
        );
        assert.equal(
            Boolean(otherCharacterCanTrigger),
            false
        );

        await defeat.runEffect({match, player});

        assert.equal(mainScheme.threat, 2);
        assert.ok(dialogs.some(({dialogType}) =>
            dialogType === DIALOG_USE_CARD));
    });
});
