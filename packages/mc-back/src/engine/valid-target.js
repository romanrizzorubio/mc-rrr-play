import {Engine} from "./engine.js";
import {
    TARGET_ACTIVATION,
    TARGET_ALL_CARDS, TARGET_ALL_CHARACTERS,
    TARGET_ALL_ENGAGED_MINIONS,
    TARGET_ALL_HEROES,
    TARGET_ALL_HEROES_ALLIES,
    TARGET_ALL_PLAYERS, TARGET_ALL_SIDE_SCHEMES, TARGET_ALLY,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_ANY_PLAYER,
    TARGET_ATTACHED,
    TARGET_ATTACKED,
    TARGET_CARD,
    TARGET_CHARACTER, TARGET_CONDITION_CARD,
    TARGET_EFFECT, TARGET_EFFECT_PLAY_CARD,
    TARGET_ENCOUNTER_DECK, TARGET_ENCOUNTER_DECK_CARDS, TARGET_ENCOUNTER_DISCARD,
    TARGET_ENEMY,
    TARGET_ENGAGED,
    TARGET_HERO,
    TARGET_HERO_SIDE,
    TARGET_MAIN_SCHEME,
    TARGET_MINION,
    TARGET_OUTSIDE_NEMESIS,
    TARGET_PLAYER,
    TARGET_ROUND,
    TARGET_SCENARIO,
    TARGET_SCHEME,
    TARGET_SIDE,
    TARGET_SOURCE,
    TARGET_SUPPORT_YOU_CONTROL, TARGET_THIS,
    TARGET_UPGRADE_YOU_CONTROL,
    TARGET_VILLAIN,
    TARGET_YOU,
    TARGET_YOUR_SUPERHERO
} from "../constants/targets.js";
import {path} from "./utils.js";
import {DIALOG_SELECT_TARGET} from "../constants/dialogs.js";

export class ValidTarget extends Engine {
    constructor({
        effect,
        filter,
        multipleTarget,
        match,
        condition,
    }) {
        super(arguments[0]);

        this.effect = effect;
        this.multipleTarget = multipleTarget;
        this.match = match;
        this.condition = condition;
        this._filter = filter;
    }
    filter(card, params) {
        if (this._filter) {
            return this._filter(card, params);
        }

        return true;
    }
    getValidTarget(params) {
        const {
            ability,
            activation,
            attack,
            card,
            cards,
            effect,
            playCardEffect,
            player,
            source,
            target,
        } = params;
        const {condition} = this;

        if (target instanceof Array) {
            return target.reduce((ret, _target) => {
                return ret.concat(this.getValidTarget({
                    ...params,
                    target: _target,
                }));
            }, []);
        }

        let targets;
        switch (target) {
            case TARGET_ACTIVATION:
                targets = [activation];
                break;
            case TARGET_ALL_CARDS:
                targets = cards;
                break;
            case TARGET_ALL_CHARACTERS:
                targets = this.match.enemies.concat(this.match.friends);
                break;
            case TARGET_ALL_ENGAGED_MINIONS:
                targets = player.minions;
                break;
            case TARGET_ALL_HEROES:
                targets = this.match.heroes;
                break;
            case TARGET_ALL_HEROES_ALLIES:
                targets = this.match.heroesAndAllies;
                break;
            case TARGET_ALL_PLAYERS:
                targets = this.match.players;
                break;
            case TARGET_ALL_SIDE_SCHEMES:
                targets = this.match.sideSchemes;
                break;
            case TARGET_ALLY:
                targets = player.allies;
                break;
            case TARGET_ALTEREGO:
                targets = player.isAlterEgo ? [player] : [];
                break;
            case TARGET_ALTEREGO_SIDE:
                targets = card.sides.filter(side => side.isAlterEgo);
                break;
            case TARGET_ANY_PLAYER:
                targets = this.match.players;
                break;
            case TARGET_ATTACHED:
                targets = ability.card.attachedTo ? [ability.card.attachedTo] : [];
                break;
            case TARGET_ATTACKED:
                targets = [attack.attacked];
                break;
            case TARGET_CARD:
                targets = [card];
                break;
            case TARGET_CHARACTER:
                targets = this.match.characters;
                break;
            case TARGET_CONDITION_CARD:
                targets = this.match.searchCards(condition);
                break;
            case TARGET_EFFECT:
                targets = [effect];
                break;
            case TARGET_EFFECT_PLAY_CARD:
                targets = [playCardEffect];
                break;
            case TARGET_ENCOUNTER_DECK:
                targets = [this.match.scenario.deck];
                break;
            case TARGET_ENCOUNTER_DECK_CARDS:
                targets = this.match.scenario.deck.cards;
                break;
            case TARGET_ENCOUNTER_DISCARD:
                targets = this.match.scenario.deck.discardPile;
                break;
            case TARGET_ENEMY:
                targets = this.match.enemies;
                break;
            case TARGET_ENGAGED:
                targets = [card.engaged];
                break;
            case TARGET_HERO:
                targets = player.isHero ? [player.superhero.currentSide] : [];
                break;
            case TARGET_HERO_SIDE:
                targets = card.sides.filter(side => side.isHero);
                break;
            case TARGET_MAIN_SCHEME:
                targets = [this.match.mainScheme];
                break;
            case TARGET_MINION:
                targets = this.match.minions;
                break;
            case TARGET_OUTSIDE_NEMESIS:
                targets = player.superhero.nemesis;
                break;
            case TARGET_PLAYER:
                targets = [player];
                break;
            case TARGET_ROUND:
                targets = [this.currentRound];
                break;
            case TARGET_SCENARIO:
                targets = [this.match.scenario];
                break;
            case TARGET_SCHEME:
                targets = this.match.schemes;
                break;
            case TARGET_SIDE:
                targets = card.sides.filter(side => side !== card.currentSide);
                break;
            case TARGET_SOURCE:
                targets = path(params, source);
                break;
            case TARGET_SUPPORT_YOU_CONTROL:
                targets = player.supports;
                break;
            case TARGET_THIS:
                targets = [path(this, 'effect.ability.card')];
                break;
            case TARGET_UPGRADE_YOU_CONTROL:
                targets = player.upgrades;
                break;
            case TARGET_VILLAIN:
                targets = [this.match.villain];
                break;
            case TARGET_YOU:
                targets = [player];
                break;
            case TARGET_YOUR_SUPERHERO:
                targets = [player.superhero];
                break;
        }

        return targets.filter(target => this.filter(target, params));
    }
    isMultipleTarget(params) {
        const {multipleTarget} = this;
        const {target} = params;

        if (multipleTarget) {
            return true;
        }

        switch (target) {
            case TARGET_ALL_CARDS:
            case TARGET_ALL_CHARACTERS:
            case TARGET_ALL_HEROES:
            case TARGET_ALL_HEROES_ALLIES:
            case TARGET_ALL_ENGAGED_MINIONS:
                return true;
        }

        return false;
    }
    async selectTarget(params) {
        const validTarget = this.getValidTarget(params);

        if (this.isMultipleTarget(params)) {
            return validTarget;
        }

        switch (validTarget.length) {
            case 0:
                return null;
            case 1:
                return validTarget.pop();
            default:
                const {selected} = await this.openDialog({
                    dialogType: DIALOG_SELECT_TARGET,
                    title: 'Elige tu objetivo',
                    data: {
                        cards: validTarget.map(card => card.toObj(arguments[0])),
                    },
                })

                return validTarget.find(target => target.id === selected.id);
        }
    }
}