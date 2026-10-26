import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_RESPONSE,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_JUSTICE,
    DIALOG_USE_CARD,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_REMOVE_THREAT,
    RESOURCE_PHYSICAL,
    TARGET_ANY_PLAYER,
    TARGET_PLAYER,
    TARGET_SIDE_SCHEME,
    TARGET_THIS,
    TARGET_YOU,
    TRAIT_SKILL,
    TRIGGER_SIDE_SCHEME_DEFEATED,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {HeroResponseAbility} from '../../src/abilities/response/hero-response-ability.js';
import {RemoveThreatEffect} from '../../src/effects/remove-threat-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

const createMatch = name => {
    const match = new Match({
        mc: {
            mcSocket: {
                send() {},
            },
        },
        name,
    });
    const matchFactory = new MatchFactory(match);

    match.scenario = {
        gameZone: {
            cards: [],
            async refresh() {},
        },
        villain: undefined,
    };

    return {match, matchFactory};
};

const createPlayer = (name, selectedSide, match, matchFactory, heroConfig) => {
    const superhero = matchFactory.createSuperhero({
        ...heroConfig,
        precon: [],
    });
    superhero.selectedSide = selectedSide;

    const player = match.createPlayer({name, superhero});
    player.initPlayer();
    player.hand.refresh = async () => {};
    player.deck.refresh = async () => {};
    player.gameZone.refresh = async () => {};

    return player;
};

describe('Investigador sagaz', () => {
    test('is a three-copy shared Justice upgrade in the Spiderwoman precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const investigator = aspects.find(({_id}) =>
            _id === 'justice-investigador-sagaz');
        const spiderwoman = heroes.find(({_id}) => _id === 'spiderwoman');

        assert.ok(investigator);
        assert.ok(spiderwoman);
        assert.equal(investigator.aspect, 'justice');
        assert.equal(investigator.card.type, CARD_TYPE_UPGRADE);
        assert.equal(investigator.card.params.name, 'Investigador sagaz');
        assert.equal(
            investigator.card.params.set,
            CLASSIFICATION_JUSTICE
        );
        assert.equal(
            investigator.card.params.classification,
            CLASSIFICATION_JUSTICE
        );
        assert.equal(
            investigator.card.params.image,
            'aspect/justice/upgrades/04047.png'
        );
        assert.deepEqual(investigator.card.params.traits, [TRAIT_SKILL]);
        assert.equal(investigator.card.params.cost, 0);
        assert.deepEqual(
            investigator.card.params.resources,
            [RESOURCE_PHYSICAL]
        );
        assert.equal(
            investigator.card.params.controllerTarget,
            TARGET_ANY_PLAYER
        );
        assert.deepEqual(investigator.card.params.maximum, {
            count: 1,
            target: TARGET_PLAYER,
        });
        assert.equal(
            spiderwoman.config.precon
                .find(({aspect}) => aspect === 'justice')
                .cardRefs.find(({id}) => id === investigator._id).count,
            3
        );

        const [ability] = investigator.card.params.abilities;
        assert.equal(ability.type, ABILITY_HERO_RESPONSE);
        assert.equal(ability.params.trigger, TRIGGER_SIDE_SCHEME_DEFEATED);
        assert.deepEqual(ability.params.arrow, {
            type: EFFECT_EXHAUST,
            params: {target: TARGET_THIS},
        });
        assert.deepEqual(ability.params.effect, {
            type: EFFECT_DRAW_CARD,
            params: {target: TARGET_YOU, count: 1},
        });
    });

    test('exhausts and draws for the player controlling it after a side scheme is defeated', async () => {
        const {aspects, heroes} = await loadCatalog();
        const cardConfig = aspects.find(({_id}) =>
            _id === 'justice-investigador-sagaz').card;
        const heroConfig = heroes.find(({_id}) =>
            _id === 'spiderwoman').config;
        const {match, matchFactory} = createMatch('justice-investigador-sagaz');
        const owner = createPlayer(
            'Owner',
            0,
            match,
            matchFactory,
            heroConfig
        );
        const controller = createPlayer(
            'Controller',
            1,
            match,
            matchFactory,
            heroConfig
        );
        const response = matchFactory.cardsFactory.createGameCardFromConfig(
            cardConfig,
            {owner}
        );
        response.controller = controller;
        response.refresh = async () => {};
        controller.gameZone.addToGameZone(response);
        await response.initTriggers({player: owner});
        const [ability] = response.abilities;

        assert.ok(ability instanceof HeroResponseAbility);
        assert.equal(ability.trigger, TRIGGER_SIDE_SCHEME_DEFEATED);
        assert.equal(typeof ability.effect.canRun, 'function');
        assert.equal(ability.effect.effectType, EFFECT_DRAW_CARD);
        assert.equal(ability.effect.target, TARGET_YOU);

        controller.superhero.selectedSide = 0;
        assert.equal(
            await ability.canTrigger({match, player: owner, effect: {}}),
            false
        );
        controller.superhero.selectedSide = 1;

        let ownerDraws = 0;
        let controllerDraws = 0;
        owner.deck.draw = async count => {
            ownerDraws += count;
            return [{id: 'owner-draw'}];
        };
        controller.deck.draw = async count => {
            controllerDraws += count;
            return [{id: 'controller-draw'}];
        };

        const sideScheme = {
            id: 'side-scheme',
            isSideScheme: true,
            isInPlay: true,
            threat: 1,
            gameZone: match.scenario.gameZone,
            canRemoveThreat() {
                return this.threat > 0;
            },
            removeThreat(threat) {
                this.threat = Math.max(0, this.threat - threat);
            },
            async refresh() {},
            async defeat() {
                this.isInPlay = false;
                this.gameZone.cards = this.gameZone.cards.filter(
                    card => card !== this
                );
            },
        };
        match.scenario.gameZone.cards.push(sideScheme);
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);

            return dialog.dialogType === DIALOG_USE_CARD ?
                {selected: {id: response.id}} :
                {};
        };

        await new RemoveThreatEffect({
            effectType: EFFECT_REMOVE_THREAT,
            match,
            selectedTarget: sideScheme,
            target: TARGET_SIDE_SCHEME,
            threat: 1,
        }).runEffect({
            match,
            player: owner,
        });

        assert.equal(sideScheme.isInPlay, false);
        assert.ok(dialogs.some(({dialogType}) =>
            dialogType === DIALOG_USE_CARD));
        assert.equal(response.exhausted, true);
        assert.equal(ownerDraws, 0);
        assert.equal(controllerDraws, 1);
        assert.equal(owner.hand.cards.length, 0);
        assert.equal(controller.hand.cards.length, 1);
    });
});
