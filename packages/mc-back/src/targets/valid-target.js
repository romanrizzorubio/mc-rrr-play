import {DIALOG_SELECT_TARGET} from '../constants/dialogs.js';
import {
    TARGET_ALL_CARDS, TARGET_ALL_CHARACTERS, TARGET_ALL_ENEMIES, TARGET_ALL_HEROES,
    TARGET_ALL_HEROES_ALLIES, TARGET_ALL_ENGAGED_MINIONS,
} from '../constants/targets.js';

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
            case TARGET_ALL_CARDS:
            case TARGET_ALL_CHARACTERS:
            case TARGET_ALL_ENEMIES:
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
                });

                return validTarget.find(target => target.id === selected.id);
        }
    }
}