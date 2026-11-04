import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CARD_TYPE_EVENT,
    CLASSIFICATION_BASIC,
    EFFECT_DEAL_DAMAGE,
    EFFECT_SIMULTANEOUS,
    RESOURCE_ENERGY,
    TARGET_ALL_ENGAGED_MINIONS,
    TARGET_VILLAIN,
    TRAIT_TACTIC,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

describe('Paliza', () => {
    test('is a shared Basic event and is not included in any hero precon', async () => {
        const catalog = await loadCatalog();
        const record = catalog.aspects.find(({_id}) => _id === 'basic-paliza');

        assert.ok(record);
        assert.equal(record.classification, CLASSIFICATION_BASIC);
        assert.equal(record.card.type, CARD_TYPE_EVENT);
        assert.deepEqual(record.card.params, {
            name: 'Paliza',
            set: CLASSIFICATION_BASIC,
            image: 'aspect/basic/events/14032.png',
            traits: [TRAIT_TACTIC],
            cost: 2,
            resources: [RESOURCE_ENERGY],
            classification: CLASSIFICATION_BASIC,
            abilities: [
                {
                    type: ABILITY_HERO_ACTION,
                    params: {
                        effect: {
                            type: EFFECT_SIMULTANEOUS,
                            params: {
                                effects: [
                                    {
                                        type: EFFECT_DEAL_DAMAGE,
                                        params: {
                                            target: TARGET_VILLAIN,
                                            damage: 1,
                                        },
                                    },
                                    {
                                        type: EFFECT_DEAL_DAMAGE,
                                        params: {
                                            target: TARGET_ALL_ENGAGED_MINIONS,
                                            damage: 1,
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            ],
        });
        assert.ok(catalog.heroes.every(({config}) =>
            !JSON.stringify(config).includes(record._id)));
    });

    test('deals one non-attack damage to the Villain and only the user-engaged Minions', async () => {
        const catalog = await loadCatalog();
        const antMan = catalog.heroes.find(({_id}) => _id === 'ant-man');
        const record = catalog.aspects.find(({_id}) => _id === 'basic-paliza');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'basic-paliza',
        });
        const matchFactory = new MatchFactory(match);
        const createPlayer = (name, initial = false) => {
            const superhero = matchFactory.createSuperhero({
                ...antMan.config,
                cards: [],
                precon: [],
            });
            superhero.selectedSide = 1;

            const player = match.createPlayer({name, superhero, initial});
            player.gameZone = new PlayerZone({owner: player});

            return player;
        };
        const player = createPlayer('Player 1', true);
        const otherPlayer = createPlayer('Player 2');
        const createEnemy = ({isVillain = false, name}) => ({
            damage: 0,
            hitPoints: 20,
            id: name,
            isEnemy: true,
            isInPlay: true,
            isMinion: !isVillain,
            isVillain,
            name,
            async getLife() {
                return this.hitPoints - this.damage;
            },
            placeDamage(damage) {
                this.damage += damage;
            },
            async refresh() {},
        });
        const villain = createEnemy({isVillain: true, name: 'Villano'});
        const engagedMinion = createEnemy({name: 'Esbirro enfrentado'});
        const otherPlayerMinion = createEnemy({name: 'Esbirro de otro jugador'});
        match.scenario = {
            gameZone: {
                cards: [],
                currentVillain: villain,
            },
            get villain() {
                return this.gameZone.currentVillain;
            },
        };
        player.gameZone.engage(engagedMinion);
        otherPlayer.gameZone.engage(otherPlayerMinion);

        const event = matchFactory.cardsFactory.createGameCardFromConfig(
            record.card,
            {index: 1, owner: player},
        );
        const [ability] = event.abilities;

        assert.equal(ability.isAttack, false);
        assert.equal(ability.effect.effectType, EFFECT_SIMULTANEOUS);
        assert.equal(typeof ability.effect.canRun, 'function');
        assert.deepEqual(
            ability.effect.effects.map(({effectType}) => effectType),
            [EFFECT_DEAL_DAMAGE, EFFECT_DEAL_DAMAGE],
        );

        await ability.resolveAbility({card: event, match, player});

        assert.equal(villain.damage, 1);
        assert.equal(engagedMinion.damage, 1);
        assert.equal(otherPlayerMinion.damage, 0);
    });
});
