import {
    ACTIVATION_ATTACK,
    ACTIVATION_DEFENSE,
    ACTIVATION_SCHEME,
    ACTIVATION_THWART,

    PRIORITY_CONSTANT,
    PRIORITY_FORCED_INTERRUPT,
    PRIORITY_FORCED_RESPONSE,
    PRIORITY_INTERRUPT,
    PRIORITY_RESPONSE,
    TARGET_YOU,
} from 'mc-shared';
import {Calc} from '../engine/calc.js';
import {Engine} from '../engine/engine.js';
import {path, pathSet} from '../engine/utils.js';
import {ValidTarget} from '../targets/valid-target.js';
import {Keywords} from '../model/commons/keywords.js';

export class Effect extends Engine {
    constructor(params) {
        super(params);
        const {
            selectedTarget,
            source,
            paramsCalc,
            paramsLastStep,
            thenEffect,
            match,
            ability,
            excludeTarget,
            condition,
            activation,
            keywords = {},
            isArrow = false,
            isAttack,
            isDefense = false,
            isScheme = false,
            isThwart = false,
            saveData = [],
            target = TARGET_YOU,
            refreshTarget = false,
            title = '',
            locations = [],
            effectType,
        } = params;

        this.effectType = effectType;
        this.target = target;
        this.locations = locations;
        this.refreshTarget = refreshTarget;
        this.source = source;
        this.title = title || params.title || '';
        this.paramsCalc = paramsCalc;
        this.paramsLastStep = paramsLastStep;
        this.thenEffect = thenEffect;
        this.match = match;
        this.saveData = saveData;
        this.excludeTarget = excludeTarget;
        this.condition = condition;
        this.activation = activation;
        this.isArrow = isArrow;
        this._isAttack = isAttack;
        this._isDefense = isDefense;
        this._isScheme = isScheme;
        this._isThwart = isThwart;
        this._selectedTarget = selectedTarget;
        this._ability = ability;

        this.savedData = {};
        this.delayedEffects = [];
        this.lastingEffects = [];
        this.keywords = new Keywords(keywords);
        this.validTarget = new ValidTarget({
            condition,
            effect: this,
            match: this.match,
            filter: this.filterTarget.bind(this),
        });

        this.resolved = false;
        this.fullResolved = false;
        this.paymentCancelled = false;

        this.isChoose = false;
        this._keepTriggering = false;
    }
    get ability() {
        return this._ability;
    }
    set ability(ability) {
        this._ability = ability;

        if (this.thenEffect) {
            this.thenEffect.ability = ability;
        }
    }
    get character() {
        return path(this, 'ability.character');
    }
    get selectedTarget() {
        return this._selectedTarget;
    }
    set selectedTarget(selectedTarget) {
        this._selectedTarget = selectedTarget;
    }
    get activation() {
        if (!this._activation) {
            if (this.isAttack) {
                this._activation = this.match.activationsFactory.createActivation({
                    type: ACTIVATION_ATTACK,
                    effect: this,
                });
            } else if (this.isDefense) {
                this._activation = this.match.activationsFactory.createActivation({
                    type: ACTIVATION_DEFENSE,
                    effect: this,
                });
            } else if (this.isScheme) {
                this._activation = this.match.activationsFactory.createActivation({
                    type: ACTIVATION_SCHEME,
                    effect: this,
                });
            } else if (this.isThwart) {
                this._activation = this.match.activationsFactory.createActivation({
                    type: ACTIVATION_THWART,
                    effect: this,
                });
            }
        }
        return this._activation;
    }
    set activation(activation) {
        this._activation = activation;
    }
    get activationEnd() {
        return this.resolved;
    }
    get isActivation() {
        const {isAttack, isDefense, isScheme, isThwart} = this;

        return (isAttack || isDefense || isScheme || isThwart);
    }
    get isAttack() {
        return this._isAttack ?? (!this.isArrow && this.ability && this.ability.isAttack);
    }
    set isAttack(isAttack) {
        this._isAttack = isAttack;
    }
    get isDefense() {
        return this._isDefense || (!this.isArrow && this.ability && this.ability.isDefense);
    }
    set isDefense(isDefense) {
        this._isDefense = isDefense;
    }
    get isScheme() {
        return this._isScheme;
    }
    set isScheme(isScheme) {
        this._isScheme = isScheme;
    }
    get isThwart() {
        return this._isThwart || (!this.isArrow && this.ability && this.ability.isThwart);
    }
    set isThwart(isThwart) {
        this._isThwart = isThwart;
    }
    get keepTriggering() {
        return this._keepTriggering;
    }
    get effectCategories() {
        return [];
    }
    get piercing() {
        return this.keywords.piercing;
    }
    get ranged() {
        return this.keywords.ranged;
    }
    calculate(params) {
        const {paramsCalc} = this;

        const calc = new Calc(paramsCalc);

        return calc.calculate({
            ...params,
            effect: this,
        });
    }
    async resolveParams(params) {
        return params;
    }
    getLastStepParam(name, params) {
        if (params.isLastStep &&
            this.paramsLastStep &&
            Object.hasOwn(this.paramsLastStep, name)) {
            return this.paramsLastStep[name];
        }
    }
    async canRun(params) {
        const validTarget = await this.getValidTarget(params);

        if (validTarget.length) {
            return true;
        }

        const {isActivation} = this;

        if (isActivation) {
            const {activation} = this;

            return activation.canRun(params);
        }
    }
    checkStatus() {
        const {isActivation, activation} = this;

        if (isActivation) {
            if (!activation) {
                console.log('No hay activation');
            }
            return activation.checkStatus();
        }

        return true;
    }
    checkTrigger() {
        return true;
    }
    createDelayedEffect(effect) {
        this.delayedEffects.push(effect);
    }
    /** @returns {void | Promise<unknown>} */
    execute(_params) {
        throw new Error('This effect is not created.');
    }
    isInvalidTarget() {
        return false;
    }
    filterTarget(card, params) {
        const {excludeTarget, activation, isArrow} = this;

        if (activation && !isArrow) {
            if (!activation.filterTarget(card, params)) {
                return false;
            }
        }

        if (excludeTarget) {
            const origin = path(params, excludeTarget);

            return card !== origin;
        }

        return true;
    }
    getEffectProperty(name, params) {
        return path(this, name);
    }
    getTitle() {
        return this.title;
    }
    getTriggersEnds(params) {
        const {activation, isActivation} = this;

        return isActivation && activation ?
            activation.getTriggersEnds(params) :
            [];
    }
    getTriggersInit(params) {
        const {activation} = this;

        return activation ?
            activation.getTriggersInit(params) :
            [];
    }
    getTriggersParams(params) {
        const {activation} = this;

        let newParams = {
            ...params,
            effect: this,
        };

        if (activation) {
            newParams = {
                ...newParams,
                ...activation.getTriggersParams(newParams),
            };
        }

        return newParams;
    }
    getTriggersWould(params) {
        const {activation} = this;

        return activation ?
            activation.getTriggersWould(params) :
            [];
    }
    getValidTarget(params) {
        const {target, selectedTarget, ability} = this;
        const targetParams = {
            ...params,
            ability,
            effect: this,
            target,
        };

        if (Array.isArray(selectedTarget)) {
            const validTargets = selectedTarget.filter(selected =>
                this.validTarget.filter(selected, targetParams));
            if (validTargets.length !== selectedTarget.length) {
                this.selectedTarget = validTargets;
            }

            return validTargets.length ? [validTargets] : [];
        }
        if (selectedTarget) {
            return this.validTarget.filter(selectedTarget, targetParams) ?
                [selectedTarget] :
                [];
        }

        return this.validTarget.getValidTarget(targetParams);
    }
    isResolved() {
        return true;
    }
    isFullResolved() {
        return this.isResolved();
    }
    resolveDelayedEffects(params) {
        const {player} = params;

        return this.promisesSequential(this.delayedEffects, delayed => delayed.resolve({
            effect: this,
            player,
        }));
    }
    resolveStatus() {
        const {isActivation, activation} = this;

        if (isActivation && activation) {
            activation.resolveStatus();
        }
    }
    selectTarget(params) {
        const {target, selectedTarget, ability} = this;

        if (selectedTarget && !this.refreshTarget) {
            return selectedTarget;
        }

        return this.validTarget.selectTarget({
            ...params,
            ability,
            target,
        });
    }
    async prepare(params){
        if (!this.selectedTarget) {
            this.selectedTarget = await this.selectTarget(params);
        }
    }
    setEffectProperty(name, value, params) {
        pathSet(this, name, value);
    }
    async triggerWould(params) {
        const type = this.getTriggersWould(params);

        if (await this.trigger(PRIORITY_CONSTANT, type, params)) {
            if (this.checkStatus(params)) {
                if (await this.trigger(PRIORITY_FORCED_INTERRUPT, type, params)) {
                    if (await this.trigger(PRIORITY_INTERRUPT, type, params)) {
                        return true;
                    }
                }
            } else {
                this.resolveStatus(params);
            }
        }

        return false;
    }
    async triggerInit(params) {
        const type = this.getTriggersInit();

        if (await this.trigger(PRIORITY_CONSTANT, type, params)) {
            if (await this.trigger(PRIORITY_FORCED_INTERRUPT, type, params)) {
                if (await this.trigger(PRIORITY_INTERRUPT, type, params)) {
                    return true;
                }
            }
        }

        return false;
    }
    async triggerEnds(params) {
        const type = this.getTriggersEnds(params);

        await this.resolveDelayedEffects(params);
        await this.trigger(PRIORITY_CONSTANT, type, params);

        const {isActivation, activation} = this;
        const additionalForcedResponses = isActivation && activation &&
            typeof activation.getForcedResponseTriggers === 'function' ?
            activation.getForcedResponseTriggers(type, params) :
            [];

        const resolveResponses = async () => {
            await this.trigger(
                PRIORITY_FORCED_RESPONSE,
                type,
                params,
                additionalForcedResponses
            );

            await this.trigger(PRIORITY_RESPONSE, type, params);

            if (isActivation && activation && activation.afterTriggerEnds) {
                await activation.afterTriggerEnds(params);
            }
        };
        const {costPaymentSession} = params;

        if (costPaymentSession?.committing) {
            costPaymentSession.deferResponse(resolveResponses);
        } else {
            await resolveResponses();
        }
    }
    saveDataCard() {
        const card = path(this, 'ability.card');

        if (card && this.saveData.length) {
            this.savedData = this.saveData.reduce((ret, key) => {
                return {
                    ...ret,
                    [key]: card[key],
                };
            }, {});
        }
    }
    getCostPaymentEffects(_params) {
        return [];
    }
    shouldPromptForPayment() {
        return true;
    }
    async prepareCost(params, session) {
        this.resolved = false;
        this.fullResolved = false;
        this.paymentCancelled = false;

        this.saveDataCard();

        const effectParams = await this.resolveParams(params);

        await this.prepare({
            ...effectParams,
            source: this.source,
        });

        if (!await this.canRun(effectParams)) {
            return false;
        }

        const triggersParams = this.getTriggersParams(effectParams);
        if (!await this.triggerWould(triggersParams) ||
            !await this.triggerInit(triggersParams)) {
            return false;
        }

        if (!await this.canRun(effectParams)) {
            return false;
        }

        session.prepareEffect(this, effectParams, triggersParams);

        return true;
    }
    async resolvePrepared(effectParams, triggersParams) {
        await this.execute(effectParams);

        this.resolved = this.isResolved();
        this.fullResolved = this.isFullResolved();

        if (this.resolved && this.fullResolved && this.thenEffect) {
            if (this.thenEffect.target === this.target) {
                this.thenEffect.selectedTarget = this.selectedTarget;
            }

            await this.thenEffect.runEffect(effectParams);
            if (this.thenEffect.paymentCancelled) {
                this.paymentCancelled = true;
            }
        }

        await this.triggerEnds(triggersParams);
    }
    async runEffect(params) {
        this.resolved = false;
        this.fullResolved = false;
        this.paymentCancelled = false;

        const prepared = params.costPaymentSession?.takePreparedEffect(this);
        if (prepared) {
            await this.resolvePrepared(
                prepared.effectParams,
                prepared.triggersParams
            );
            return;
        }

        this.saveDataCard();

        const effectParams = await this.resolveParams(params);

        await this.prepare({
            ...effectParams,
            source: this.source,
        });

        const triggersParams = this.getTriggersParams(effectParams);

        if (await this.triggerWould(triggersParams)) {
            if (await this.triggerInit(triggersParams)) {
                await this.resolvePrepared(effectParams, triggersParams);
            }
        }
    }
    toObj() {
        const {overkill, piercing, ranged} = this;

        return {
            ...super.toObj(arguments[0]),
            overkill,
            piercing,
            ranged,
        };
    }
}