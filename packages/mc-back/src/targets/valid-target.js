import {DIALOG_SELECT_TARGET,
    TARGET_ALL_ALLIES, TARGET_ALL_ALLIES_YOU_CONTROL,
    TARGET_ALL_CARDS, TARGET_ALL_CHARACTERS, TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ALL_ENEMIES, TARGET_ALL_FRIENDLY_CHARACTERS, TARGET_ALL_HEROES,
    TARGET_ALL_SCHEMES,
    TARGET_ALL_SIDE_SCHEMES,
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
            case TARGET_ALL_CHARACTERS_YOU_CONTROL:
            case TARGET_ALL_FRIENDLY_CHARACTERS:
            case TARGET_ALL_ENEMIES:
            case TARGET_ALL_HEROES:
            case TARGET_ALL_HEROES_ALLIES:
            case TARGET_SELECTED_PLAYER_CHARACTERS:
            case TARGET_ALL_ENGAGED_MINIONS:
            case TARGET_ALL_SCHEMES:
            case TARGET_ALL_SIDE_SCHEMES:
                return true;
        }

        return false;
    }
    async selectFrom(candidates, params) {
        const validTarget = candidates.filter(card => this.filter(card, params));

        return this.selectSingleTarget(validTarget, params);
    }
    async selectTarget(params) {
        const validTarget = this.getValidTarget(params);
        const {selectCount, selectUpTo} = params;

        if (selectCount !== undefined || selectUpTo) {
            if (selectUpTo && validTarget.length === 0) {
                return [];
            }
            if (selectCount === 0) {
                return [];
            }
            if (!selectUpTo && validTarget.length === 0) {
                return null;
            }
            if (!selectUpTo && validTarget.length <= selectCount) {
                return selectCount === 1 && validTarget.length === 1 ?
                    validTarget[0] :
                    validTarget;
            }

            const count = selectUpTo ? validTarget.length : selectCount;
            const minCount = selectUpTo ? 0 : count;
            const {selected} = await this.openDialog({
                dialogType: DIALOG_SELECT_TARGET,
                title: params.dialogTitle || 'Elige tus objetivos',
                data: {
                    cards: validTarget.map(card => card.toObj(params)),
                    count,
                    minCount,
                    upTo: Boolean(selectUpTo),
                    multiSelect: true,
                },
            });
            const selectedTargets = Array.isArray(selected) ?
                selected :
                selected ? [selected] : [];
            if (selectedTargets.length < minCount ||
                selectedTargets.length > count) {
                throw new Error('La selección múltiple de objetivos no es válida.');
            }

            return validTarget.filter(target =>
                selectedTargets.some(selectedTarget => selectedTarget.id === target.id));
        }

        if (this.isMultipleTarget(params)) {
            return validTarget;
        }

        return this.selectSingleTarget(validTarget, params);
    }
    async selectSingleTarget(validTarget, params) {
        switch (validTarget.length) {
            case 0:
                return null;
            case 1:
                return validTarget.pop();
            default:
                const {selected} = await this.openDialog({
                    dialogType: DIALOG_SELECT_TARGET,
                    title: params.dialogTitle || 'Elige tu objetivo',
                    data: {
                        cards: validTarget.map(card => card.toObj(params)),
                    },
                });

                return validTarget.find(target => target.id === selected.id);
        }
    }
}