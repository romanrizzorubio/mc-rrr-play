import {DIALOG_SELECT_TARGET,
    TARGET_ALL_ALLIES, TARGET_ALL_ALLIES_YOU_CONTROL,
    TARGET_ALL_CARDS, TARGET_ALL_CHARACTERS, TARGET_ALL_ENEMIES, TARGET_ALL_HEROES, TARGET_ALL_SCHEMES,
    TARGET_ALL_HEROES_ALLIES, TARGET_ALL_ENGAGED_MINIONS,
    TARGET_SELECTED_PLAYER_CHARACTERS,
} from 'mc-shared';

import {Engine} from '../engine/engine.js';
import {targetMap} from './index.js';

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
        if (this._filter && !this._filter(card, params)) {
            return false;
        }

        return !this.isInvalidTarget(card, params);
    }
    isInvalidTarget(card, params) {
        const effect = this.effect || params.effect;
        if (!effect || !card || !Array.isArray(card.abilities)) {
            return false;
        }

        const validationParams = {
            ...params,
            effect,
            match: this.match || params.match,
            targetCard: card,
        };

        return card.abilities.some(ability => {
            const {validation} = ability;
            if (!validation) {
                return false;
            }
            if (typeof validation.isInvalidTarget !== 'function') {
                throw new TypeError(`Invalid target validation on card "${card.name}".`);
            }

            return validation.isInvalidTarget(validationParams);
        });
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
            triggeredCard,
        } = params;

        if (target instanceof Array) {
            return target.reduce((ret, _target) => {
                return ret.concat(this.getValidTarget({
                    ...params,
                    target: _target,
                }));
            }, []);
        }

        const targetFn = targetMap[target];
        const targets = targetFn ? targetFn({
            ability,
            activation,
            attack,
            card,
            cards,
            condition: this.condition,
            currentRound: this.currentRound,
            effect,
            match: this.match,
            params,
            playCardEffect,
            player,
            source,
            targetEffect: this.effect,
            triggeredCard,
        }) : [];

        return targets.filter(target => this.filter(target, params));
    }
    isMultipleTarget(params) {
        const {multipleTarget} = this;
        const {target} = params;

        if (multipleTarget) {
            return true;
        }

        switch (target) {
            case TARGET_ALL_ALLIES:
            case TARGET_ALL_ALLIES_YOU_CONTROL:
            case TARGET_ALL_CARDS:
            case TARGET_ALL_CHARACTERS:
            case TARGET_ALL_ENEMIES:
            case TARGET_ALL_HEROES:
            case TARGET_ALL_HEROES_ALLIES:
            case TARGET_SELECTED_PLAYER_CHARACTERS:
            case TARGET_ALL_ENGAGED_MINIONS:
            case TARGET_ALL_SCHEMES:
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
                });

                return validTarget.find(target => target.id === selected.id);
        }
    }
}