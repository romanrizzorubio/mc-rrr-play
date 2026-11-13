import {DIALOG_SELECT_TARGET,
    EFFECT_CATEGORY_LEAVE_PLAY,
    TARGET_ALL_ALLIES, TARGET_ALL_ALLIES_YOU_CONTROL,
    TARGET_ALL_CARDS, TARGET_ALL_CHARACTERS, TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ALL_DECKS,
    TARGET_ALL_ENEMIES, TARGET_ALL_FRIENDLY_CHARACTERS, TARGET_ALL_HEROES,
    TARGET_ALL_MINIONS,
    TARGET_ALL_PLAYERS,
    TARGET_ALL_SUPERHEROES,
    TARGET_ALL_SCHEMES,
    TARGET_ALL_SIDE_SCHEMES,
    TARGET_ALL_SUPPORTS,
    TARGET_ALL_UPGRADES_YOU_CONTROL,
    TARGET_ALL_HEROES_ALLIES, TARGET_ALL_ENGAGED_MINIONS,
    TARGET_PARENT,
    TARGET_SELECTED_PLAYER_CHARACTERS,
} from 'mc-shared';

import {Engine} from '../engine/engine.js';
import {
    filterReferentialTargets,
    REFERENCE_PRIORITY_ASSOCIATED_SET,
    REFERENCE_PRIORITY_SOURCE_CARD,
    getAssociatedSet,
    getReferenceCardType,
    getReferencePriority,
    hasReferentialTargetCondition,
    isReferentialNameTarget,
} from '../utils/referential-ability-utils.js';
import {
    filterTargetCandidates,
    getConditionExcludePaths,
    getExcludedTargets,
    isExcludedTarget,
    splitTargetCondition,
} from '../utils/target-condition-utils.js';
import {targetMap} from './index.js';

const findSelectedTarget = (targets, selected) => {
    if (!selected) {
        return undefined;
    }

    const directMatch = targets.find(target => target?.id === selected.id);
    if (directMatch) {
        return directMatch;
    }

    return selected.parentId === undefined ?
        undefined :
        targets.find(target => target?.id === selected.parentId);
};

const getTargetPlayerDialogParam = targetPlayer => {
    const playerName = typeof targetPlayer === 'string' ?
        targetPlayer :
        targetPlayer?.name;
    const playerId = typeof targetPlayer === 'string' ?
        targetPlayer :
        targetPlayer?.id ?? targetPlayer?.userId ?? playerName;

    return typeof playerId === 'string' ? {
        targetPlayer: playerId,
        ...(typeof playerName === 'string' ? {targetPlayerName: playerName} : {}),
    } : {};
};

const targetToObj = (target, params) =>
    target.toTargetObj?.(params) ?? target.toObj(params);

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

        getConditionExcludePaths(condition);
    }
    filter(card, params) {
        if (!card) {
            return false;
        }
        if (this._filter && !this._filter(card, params)) {
            return false;
        }
        const effect = this.effect || params.effect;
        if (card.permanent &&
            effect?.effectCategories?.includes(EFFECT_CATEGORY_LEAVE_PLAY)) {
            const sourceSet = effect.ability?.card?.set ??
                params.ability?.card?.set;
            if (!sourceSet || sourceSet !== card.set) {
                return false;
            }
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
        const match = validationParams.match;
        const scenarioZones = match?.scenario?.zones ??
            [match?.scenario?.gameZone];
        const hasInitializedPlayers = Array.isArray(match?.players) &&
            match.players.every(player => player?.gameZone);
        const canReadMatchInPlayCards = hasInitializedPlayers &&
            Array.isArray(scenarioZones) &&
            scenarioZones.filter(Boolean).every(({inPlayCards}) =>
                Array.isArray(inPlayCards));
        const inPlayCards = canReadMatchInPlayCards ?
            match.inPlayCards :
            Object.hasOwn(match ?? {}, 'inPlayCards') &&
                Array.isArray(match.inPlayCards) ?
                match.inPlayCards :
                [];
        const sourceCards = [...new Set([
            ...Object.values(match?.triggerCards || {}),
            ...(inPlayCards || []),
        ])].filter(sourceCard => sourceCard?.isInPlay);
        const abilities = [
            ...card.abilities,
            ...sourceCards
                .filter(sourceCard => sourceCard !== card)
                .flatMap(sourceCard =>
                    Array.isArray(sourceCard.abilities) ?
                        sourceCard.abilities :
                        []),
        ];

        return abilities.some(ability => {
            if (ability.card !== card &&
                typeof validationParams.match?.isScenarioZoneAbilityAllowed === 'function' &&
                !validationParams.match.isScenarioZoneAbilityAllowed(
                    ability,
                    validationParams
                )) {
                return false;
            }
            if (ability.card?.isObligation &&
                ability.card.owner !== validationParams.player) {
                return false;
            }

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
    getTargetCandidates(params, target, condition) {
        if (Array.isArray(target)) {
            return target.reduce((ret, _target) =>
                ret.concat(this.getTargetCandidates(
                    {...params, target: _target},
                    _target,
                    condition
                )), []);
        }

        const {
            ability,
            activation,
            attack,
            card,
            cards,
        } = params;

        const targetFn = targetMap[target];
        return targetFn ? targetFn({
            ability,
            activation,
            attack,
            card,
            cards,
            condition,
            currentRound: this.currentRound,
            effect: params.effect,
            match: this.match ?? params.match,
            params,
            playCardEffect: params.playCardEffect,
            player: params.player,
            source: params.source,
            targetEffect: this.effect,
            triggeredCard: params.triggeredCard,
        }) : [];
    }
    getReferentialTargetsAcrossZones(params, target, condition, referenceCard) {
        const match = this.match ?? params.match;
        const {scenario} = match ?? {};
        if (!scenario?.separatePlayAreas ||
            !hasReferentialTargetCondition(condition, referenceCard)) {
            return [];
        }

        const associatedSet = getAssociatedSet(referenceCard, match);
        const referenceCardType = getReferenceCardType(referenceCard);

        return this.getTargetCandidates(
            {...params, match, player: undefined},
            target,
            condition
        ).filter(candidate => {
            const priority = getReferencePriority(
                candidate,
                referenceCard,
                associatedSet,
                referenceCardType
            );

            return (priority === REFERENCE_PRIORITY_SOURCE_CARD ||
                priority === REFERENCE_PRIORITY_ASSOCIATED_SET) &&
                isReferentialNameTarget(candidate, condition);
        });
    }
    getValidTarget(params) {
        const excludedTargets = getExcludedTargets(
            getConditionExcludePaths(this.condition),
            params
        );
        const {condition, selectionConditions} =
            splitTargetCondition(this.condition);
        const referenceCard = this.effect?.referenceCard ??
            params.ability?.card ??
            params.effect?.ability?.card ??
            this.effect?.ability?.card;
        const localTargets = this.getTargetCandidates(
            params,
            params.target,
            condition
        );
        const crossZoneTargets = this.getReferentialTargetsAcrossZones(
            params,
            params.target,
            condition,
            referenceCard
        );
        const targets = [...new Set([...localTargets, ...crossZoneTargets])];
        const validTargets = targets.filter(target =>
            !isExcludedTarget(target, excludedTargets) &&
                this.filter(target, params));
        const referentialTargets = filterReferentialTargets(
            validTargets,
            condition,
            referenceCard,
            this.match || params.match
        );

        return filterTargetCandidates(
            referentialTargets,
            selectionConditions
        );
    }
    resolveSelectedTargets(selectedTarget, params) {
        const validTargets = this.getValidTarget(params);
        const selectedTargets = Array.isArray(selectedTarget) ?
            selectedTarget :
            [selectedTarget];

        return selectedTargets.map(selected =>
            findSelectedTarget(validTargets, selected));
    }
    isAllTarget(params) {
        const {target} = params;
        switch (target) {
            case TARGET_ALL_ALLIES:
            case TARGET_ALL_ALLIES_YOU_CONTROL:
            case TARGET_ALL_CARDS:
            case TARGET_ALL_DECKS:
            case TARGET_ALL_CHARACTERS:
            case TARGET_ALL_CHARACTERS_YOU_CONTROL:
            case TARGET_ALL_FRIENDLY_CHARACTERS:
            case TARGET_ALL_ENEMIES:
            case TARGET_ALL_HEROES:
            case TARGET_ALL_HEROES_ALLIES:
            case TARGET_ALL_MINIONS:
            case TARGET_ALL_PLAYERS:
            case TARGET_ALL_SUPERHEROES:
            case TARGET_SELECTED_PLAYER_CHARACTERS:
            case TARGET_ALL_ENGAGED_MINIONS:
            case TARGET_ALL_SCHEMES:
            case TARGET_ALL_SIDE_SCHEMES:
            case TARGET_ALL_SUPPORTS:
            case TARGET_ALL_UPGRADES_YOU_CONTROL:
            case TARGET_PARENT:
                return true;
        }

        return false;
    }
    isMultipleTarget(params) {
        return Boolean(this.multipleTarget || this.isAllTarget(params));
    }
    async getTargetDialogData(targets, params) {
        const cards = await Promise.all(targets.map(async target => {
            const card = targetToObj(target, params);
            const character = target.isPlayer ? target.superhero : target;

            if (typeof character?.getEffectiveStats !== 'function') {
                return card;
            }

            const player = target.isPlayer ? target : params.player;
            const stats = await character.getEffectiveStats({
                ...params,
                player,
            });

            return {...card, ...stats};
        }));
        const villains = [];
        const minionsByPlayer = new Map();
        const otherTargets = [];

        targets.forEach((target, index) => {
            const card = cards[index];

            if (target.isVillain) {
                villains.push(card);
            } else if (target.isMinion) {
                const engagedPlayer = target.engaged?.isPlayer ?
                    target.engaged :
                    undefined;
                let group = minionsByPlayer.get(engagedPlayer);

                if (!group) {
                    const superheroName = engagedPlayer?.superhero?.currentSide?.name ??
                        engagedPlayer?.superhero?.name;
                    group = {
                        title: engagedPlayer ?
                            `Esbirros enfrentados a ${superheroName || 'su superhéroe'}` :
                            'Esbirros no enfrentados',
                        cards: [],
                    };
                    minionsByPlayer.set(engagedPlayer, group);
                }

                group.cards.push(card);
            } else {
                otherTargets.push(card);
            }
        });

        if (!villains.length && !minionsByPlayer.size) {
            return {cards};
        }

        return {
            cards,
            groups: [
                ...(villains.length ? [{
                    title: 'Villano',
                    cards: villains,
                }] : []),
                ...minionsByPlayer.values(),
                ...(otherTargets.length ? [{
                    title: 'Otros objetivos',
                    cards: otherTargets,
                }] : []),
            ],
        };
    }
    async selectFrom(candidates, params) {
        const validTargets = candidates.filter(card =>
            this.filter(card, params));
        const referenceCard = this.effect?.referenceCard ??
            params.ability?.card ??
            params.effect?.ability?.card ??
            this.effect?.ability?.card;
        const referentialTargets = filterReferentialTargets(
            validTargets,
            this.condition,
            referenceCard,
            this.match || params.match
        );

        return this.selectSingleTarget(referentialTargets, params);
    }
    async selectTarget(params) {
        const validTarget = this.getValidTarget(params);
        const {
            selectCount,
            selectUpTo,
            showCancel = false,
        } = params;

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

            const count = selectUpTo ?
                Math.min(validTarget.length, selectCount ?? validTarget.length) :
                selectCount;
            const minCount = selectUpTo ? 0 : count;
            const targetDialogData = await this.getTargetDialogData(
                validTarget,
                params
            );
            const response = await this.openDialog({
                dialogType: DIALOG_SELECT_TARGET,
                ...(showCancel ? {showCancel: true} : {}),
                ...getTargetPlayerDialogParam(
                    params.targetPlayer ?? params.player
                ),
                title: params.dialogTitle || 'Elige tus objetivos',
                data: {
                    ...targetDialogData,
                    count,
                    minCount,
                    upTo: Boolean(selectUpTo),
                    multiSelect: true,
                },
            });
            if (showCancel && (
                response?.selected === undefined ||
                response.selected === null
            )) {
                return null;
            }

            const {selected} = response || {};
            const selectedTargets = Array.isArray(selected) ?
                selected :
                selected ? [selected] : [];
            if (selectedTargets.length < minCount ||
                selectedTargets.length > count) {
                throw new Error('La selección múltiple de objetivos no es válida.');
            }

            const resolvedSelectedTargets = selectedTargets.map(selectedTarget =>
                findSelectedTarget(validTarget, selectedTarget));
            if (resolvedSelectedTargets.some(selectedTarget => !selectedTarget)) {
                throw new Error('La selección múltiple de objetivos no es válida.');
            }

            return validTarget.filter(target =>
                resolvedSelectedTargets.includes(target));
        }

        if (this.isMultipleTarget(params)) {
            return validTarget;
        }

        return this.selectSingleTarget(validTarget, params);
    }
    async selectSingleTarget(validTarget, params) {
        if (validTarget.length === 0) {
            return null;
        }
        if (validTarget.length === 1 && !params.showSingleTargetDialog) {
            return validTarget[0];
        }

        const targetDialogData = await this.getTargetDialogData(
            validTarget,
            params
        );
        const response = await this.openDialog({
            dialogType: DIALOG_SELECT_TARGET,
            ...(params.showCancel ? {showCancel: true} : {}),
            ...getTargetPlayerDialogParam(
                params.targetPlayer ?? params.player
            ),
            title: params.dialogTitle || 'Elige tu objetivo',
            data: {
                ...targetDialogData,
            },
        });
        if (params.showCancel && (
            response?.selected === undefined ||
            response.selected === null
        )) {
            return null;
        }

        const selectedTarget = findSelectedTarget(
            validTarget,
            response?.selected
        );
        if (!selectedTarget) {
            throw new Error('La selección del objetivo no es válida.');
        }

        return selectedTarget;
    }
}