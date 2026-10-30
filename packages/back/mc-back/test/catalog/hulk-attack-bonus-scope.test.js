import assert from 'node:assert/strict';
import {describe, test} from 'node:test';
import {CARD_TYPE_MINION, CARD_TYPE_RESOURCE, DIALOG_PAY_COST, DIALOG_USE_CARD, RESOURCE_PHYSICAL} from 'mc-shared';
import hulk from '../../../mc-data/seed/catalog/heroes/hulk.js';
import aggressionEvents from '../../../mc-data/seed/catalog/aspects/aggression/events.js';
import {Match} from '../../src/model/match/match.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {EngageEffect} from '../../src/effects/engage-effect.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {ModifyAttackEffect} from '../../src/effects/modify-attack-effect.js';

describe('Hulk attack bonuses apply only to their attack', () => {
    test('clearing temporary keywords preserves the configured attack keywords', async () => {
        const match = new Match({name: 'keyword-reset', mc: {mcSocket: {send() {}}}});
        const attack = new DealDamageEffect({match, isAttack: true, keywords: {piercing: true}});
        await new ModifyAttackEffect({
            match, selectedTarget: attack,
            modify: {keywords: {overkill: true, piercing: false}},
        }).runEffect({});
        assert.equal(attack.overkill, true);
        assert.equal(attack.piercing, false);
        attack.resetResolutionState();
        assert.equal(attack.overkill, false);
        assert.equal(attack.piercing, true);
    });

    test('successive basic attacks do not retain Golpe diestro or Hulk aplasta bonuses', async () => {
        const match = new Match({name: 'hulk-attack-bonuses', mc: {mcSocket: {send() {}}}});
        match.persist = async () => {};
        match.refresh = async () => {};
        match.skipDiscardOrderDialog = true;
        match.openDialog = async () => ({});
        const factory = new MatchFactory(match);
        const player = match.createPlayer({
            name: 'Hulk', initial: true,
            superhero: factory.createSuperhero({...hulk.config, cards: [], precon: [], nemesis: []}),
        });
        player.initPlayer();
        player.superhero.selectedSide = 1;
        match.phase = 'players';
        match.playing = true;
        match.currentPlayer = player;
        match.currentTurnPlayer = player;
        match.scenario = {gameZone: {cards: []}, minions: [], schemes: []};
        const minion = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {name: 'Durable target', hitPoints: 100, attack: 1, scheme: 1},
        }, {owner: match.scenario});
        await new EngageEffect({
            card: minion, match, selectedTarget: player, controller: match.scenario,
        }).runEffect({player});
        const makeEvent = config => factory.cardsFactory.createGameCardFromConfig(config, {owner: player});
        const deftStrike = aggressionEvents.find(({_id}) => _id === 'aggression-golpe-diestro').card;
        const smash = hulk.config.cards.find(({card}) => card.params.name === 'Hulk aplasta').card;
        const basic = player.superhero.currentSide.abilities.find(ability => ability.isBasic && ability.isAttack);
        let overkillAtDamage;
        const placeDamage = minion.placeDamage.bind(minion);
        minion.placeDamage = damage => {
            overkillAtDamage = basic.effect.overkill;
            return placeDamage(damage);
        };
        player.deck.cards.push(makeEvent({
            type: CARD_TYPE_RESOURCE, params: {name: 'Remaining deck card'},
        }));
        for (const [configs, expectedDamage] of [
            [[deftStrike], 5], [[], 3], [[smash], 13], [[], 3],
            [[deftStrike, smash], 15], [[], 3],
        ]) {
            const events = configs.map(makeEvent);
            player.hand.addCards(events);
            const resources = Array.from({length: configs.includes(smash) ? 3 : 0}, (_, index) =>
                makeEvent({
                    type: CARD_TYPE_RESOURCE,
                    params: {name: `Physical ${index}`, resources: [RESOURCE_PHYSICAL]},
                }));
            player.hand.addCards(resources);
            match.openDialog = async dialog => {
                if (dialog.dialogType === DIALOG_USE_CARD) {
                    const event = events.find(card =>
                        player.hand.cards.includes(card) && dialog.data.cards.some(item => item.id === card.id));
                    return event ? {selected: {id: event.id}} : {};
                }
                if (dialog.dialogType === DIALOG_PAY_COST) {
                    return {
                        paid: {hand: resources.map(card => ({id: card.id})), generators: []},
                        resources: resources.map(() => RESOURCE_PHYSICAL),
                    };
                }
                return {};
            };
            player.superhero.ready();
            const previousDamage = minion.damage;
            await basic.resolveAbility({player, card: player.superhero.currentSide});
            assert.equal(minion.damage - previousDamage, expectedDamage);
            assert.equal(player.superhero.currentSide.modifyAttack, 0);
            assert.equal(overkillAtDamage, configs.includes(smash), configs.map(config => config.params.name).join(', '));
            assert.equal(events.every(card => player.deck.discardPile.includes(card)), true);
        }
    });
});
