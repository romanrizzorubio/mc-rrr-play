import {
    LABEL_ATTACK,
    LABEL_DEFENSE,
    LABEL_THWART,
    PRIORITY_RESPONSE,
    TRIGGER_ABILITY_RESOLVED,
} from 'mc-shared';
import {Engine} from '../../engine/engine.js';
import {checkCondition} from '../../engine/utils.js';
import {Limit} from '../../model/commons/limit.js';
import {Maximum} from '../../model/commons/maximum.js';
import {AbilityCosts} from '../../model/costs/ability-costs.js';
import {getTriggerCardPlayer} from '../../utils/trigger-card-player.js';

export class Ability extends Engine {
    constructor({
// Ability
        name = '',
        labels = [],
        effect,
        limit,
        maximum,
        arrow,
        ifNot,
        condition,
        validation,
        card,
        match,
        hideDialog = false,
        workInHand = false,
    }) {
        super(arguments[0]);

        this.name = name;
        this.labels = labels;
        this.effect = effect;
        this.condition = condition;
        this.validation = validation;
        this.card = card;
        this.hideDialog = hideDialog;
        this.workInHand = workInHand;
        this.match = match;
        this.costs = new AbilityCosts({
            ability: this,
            match,
        });
        if (!match) {
            console.log('Falta Match');
        }

        if (limit) {
            this.limit = new Limit({
                ...limit,
                ability: this
            });
        }
        if (maximum) {
            this.maximum = new Maximum({
                ...maximum,
                ability: this
            });
        }
        if (arrow) {
            this.arrow = arrow;
            this.costs.add(arrow);
            arrow.ability = this;
            arrow.cost.ability = this;
        }
        if (ifNot) {
            this.ifNot = ifNot;
        }
        if (effect) {
            effect.ability = this;
        }
        if (validation) {
            validation.ability = this;
        }

        this.resolved = false;
        this.owner = undefined;

        this.isAction = false;
        this.isBasic = false;
        this.isResource = false;
        this.isSetup = false;
        this.isWhenRevealed = false;
        this.isWhenDefeated = false;
        this.isWhenCompleted = false;
        this.isEndLasting = false;
        this.isOptionAbility = false;
        this.paymentCancelled = false;
    }
    get card() {
        return this._card;
    }
    set card(card) {
        this._card = card;

        if (this.effect?.isChooseAbility) {
            this.effect.options.forEach(option => {
                option.card = card;
            });
        }
    }
    get character() {
        if (this._resolutionContext) {
            return this._resolutionContext.character;
        }

        if (this._card) {
            if (this._card.isEvent) {
                return this._card.owner;
            } else if (this._card.isUpgrade) {
                return this._card.controller;
            }
        }

        return this._card;
    }
    get id() {
        return `${this.card.id}--${this.name}`;
    }
    get isAttack() {
        const {labels} = this;

        return labels.includes(LABEL_ATTACK);
    }
    get isDefense() {
        const {labels} = this;

        return labels.includes(LABEL_DEFENSE);
    }
    get isThwart() {
        const {labels} = this;

        return labels.includes(LABEL_THWART);
    }
    get keepTriggering() {
        return this.effect?.keepTriggering ?? false;
    }
    isValidIdentity() {
        return true;
    }
    async canRun(params, effect = this.effect) {
        const {player} = params;

        if (this.card?.printedTextBlank) {
            return false;
        }

        if (this.condition && !checkCondition(params, this.condition)) {
            return false;
        }

        if (this.isAttack) {
            if (! player.canAttack(params)) {
                return false;
            }
        }
        if (this.isThwart) {
            if (!await player.canThwart(params)) {
                return false;
            }
        }
        if (this.isDefense) {
            if (! player.canDefend(params)) {
                return false;
            }
        }
        if (this.limit) {
            if (!this.limit.canUse(params)) {
                return false;
            }
        }
        if (this.maximum && !this.maximum.canUse()) {
            return false;
        }
        if (!params.arrowPaid && !await this.costs.canPay({
            ...params,
            ability: this,
        })) {
            return false;
        }
        if (effect) {
            if (! await effect.canRun(params)) {
                return false;
            }
        }

        return true;
    }
    canTrigger() {
        return false;
    }
    getTitle() {
        return this.name;
    }
    getValidTarget(match, player) {
        return this.effect.getValidTarget(match, player);
    }
    initTriggers() {}
    async payCosts(params) {
        const paymentParams = {...params};
        delete paymentParams.preselectedTarget;
        delete paymentParams.fixedPreselectedTarget;
        delete paymentParams.preserveNestedSelectedTargets;
        delete paymentParams.preselectedEffectTargets;

        const result = await this.costs.pay({
            ...paymentParams,
            ability: this,
        }, params);

        this.paymentCancelled = result.cancelled;

        return result.resolved;
    }
    async payArrow(params) {
        return this.payCosts(params);
    }
    async onResolutionStart(_params) {}
    prepareEffect({preselectedTarget = false, effect = this.effect} = {}) {
        if (effect) {
            if (!preselectedTarget) {
                effect.selectedTarget = undefined;
            }

            effect.isAttack = effect.isAttack || this.isAttack;
            effect.isDefense = effect.isDefense || this.isDefense;
            effect.isScheme = effect.isScheme || this.isScheme;
            effect.isThwart = effect.isThwart || this.isThwart;
        }
    }
    async prepareToResolve(params) {
        const preselectedTarget = Boolean(params.preselectedTarget);
        this.prepareEffect({preselectedTarget});

        if (!await this.canRun(params)) {
            return {
                canRun: false,
                preselectedTarget: false,
            };
        }

        if (!this.effect || this.effect.validTarget.isMultipleTarget({target: this.effect.target})) {
            return {
                canRun: true,
                preselectedTarget: false,
            };
        }

        const selectedTarget = await this.effect.selectTarget({
            ...params,
            ...(preselectedTarget && this.effect.selectedTarget ? {
                fixedPreselectedTarget: true,
            } : {}),
            ...(this.isBasic && (this.isAttack || this.isThwart) ?
                {showCancel: true} :
                {}),
        });

        if (selectedTarget === null || selectedTarget === undefined) {
            return {
                canRun: false,
                preselectedTarget: false,
            };
        }

        this.effect.selectedTarget = selectedTarget;

        return {
            canRun: true,
            preselectedTarget: true,
        };
    }
    useLimit() {
        if (this.limit) {
            this.limit.use();
        }
    }
    async resolveAbility(params, effect = this.effect) {
        const {
            player,
            preselectedTarget = false,
            preserveNestedSelectedTargets = false,
            preselectedEffectTargets,
            arrowPaid = false,
        } = params;
        const resolvedAbilityController = this.card ?
            getTriggerCardPlayer(this.card, player) :
            undefined;
        const previousResolutionContext = this._resolutionContext;
        const resolutionParams = preselectedEffectTargets ?
            {...params, preselectedEffectTargets} :
            params;
        this._resolutionContext = {
            character: this.character,
        };

        try {
            this.resolved = false;
            this.paymentCancelled = false;
            if (typeof effect?.resetResolutionState === 'function') {
                effect.resetResolutionState({
                    preserveSelectedTarget: preselectedTarget,
                    preserveNestedSelectedTargets,
                    preselectedEffectTargets,
                });
            }
            this.prepareEffect({preselectedTarget, effect});
            if (effect?.isActivation) {
                effect.resetActivation();
            }

            const canRun = await this.canRun(resolutionParams, effect);

            if (canRun) {
                const canConfirmBeforeResolve =
                    typeof effect?.confirmBeforeResolve === 'function';
                const confirmationAccepted =
                    !effect ||
                    params.prePlayConfirmationAcceptedFor === effect ||
                    !canConfirmBeforeResolve ||
                    await effect.confirmBeforeResolve(resolutionParams);
                if (!confirmationAccepted) {
                    this.paymentCancelled = true;
                    return;
                }

                const costsPaid = arrowPaid || await this.payCosts(params);

                if (costsPaid) {
                    this.maximum?.use();
                    await this.onResolutionStart(params);

                    if (effect) {
                        if (params.fixedPreselectedTarget) {
                            effect.selectedTarget = params.selectedTarget;
                        }
                        const effectParams = {...resolutionParams};
                        delete effectParams.arrowPaid;
                        delete effectParams.preselectedTarget;
                        delete effectParams.fixedPreselectedTarget;
                        if (!preserveNestedSelectedTargets) {
                            delete effectParams.preserveNestedSelectedTargets;
                        }
                        if (params.fixedPreselectedTarget) {
                            delete effectParams.selectedTarget;
                        }
                        await effect.runEffect({
                            ...effectParams,
                            player,
                        });

                        if (effect.paymentCancelled) {
                            this.paymentCancelled = true;
                            return;
                        }

                        this.resolved = effect.resolved;
                    } else {
                        this.resolved = true;
                    }
                    this.useLimit();
                }
            } else if (this.ifNot) {
                await this.ifNot.runEffect({
                    ...params,
                    card: params.card || this.card,
                });

                this.resolved = this.ifNot.resolved;
            }

            if (this.resolved && this.card) {
                const trigger = typeof this.trigger === 'function' ?
                    this.trigger :
                    Engine.prototype.trigger;

                if (trigger !== Engine.prototype.trigger || this.match?.triggerCards) {
                    await trigger.call(
                        this,
                        PRIORITY_RESPONSE,
                        [TRIGGER_ABILITY_RESOLVED],
                        {
                            ...params,
                            card: this.card,
                            effect: effect || this,
                            resolvedAbility: this,
                            resolvedAbilityController,
                        }
                    );
                }
            }
        } finally {
            this._resolutionContext = previousResolutionContext;
        }
    }

    toObj() {
        const {name, isAction, isBasic, isResource} = this;

        return {
            name,
            isAction,
            isBasic,
            isResource,
            //arrow: arrow && arrow.toObj(arguments[0]),
            //effect: effect && effect.toObj(arguments[0]),
        };
    }
}