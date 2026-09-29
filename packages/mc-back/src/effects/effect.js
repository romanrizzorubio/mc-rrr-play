import {Engine} from "../engine/engine.js";
import {TARGET_YOU} from "../constants/targets.js";
import {ValidTarget} from "../engine/valid-target.js";
import {
    PRIORITY_CONSTANT,
    PRIORITY_FORCED_INTERRUPT, PRIORITY_FORCED_RESPONSE, PRIORITY_INTERRUPT, PRIORITY_RESPONSE
} from "../constants/priorities.js";
import {Calc} from "../engine/calc.js";
import {path, pathSet} from "../engine/utils.js";
import {Keywords} from "../model/commons/keywords.js";
import {Attack} from "../activations/attack.js";
import {Thwart} from "../activations/thwart.js";
import {Scheme} from "../activations/scheme.js";
import {TRIGGER_THIS_ATTACK} from "../triggers/this-attack-trigger.js";
import {Defense} from "../activations/defense.js";
import {DealDamageEffect} from "./deal-damage-effect.js";
export class Effect extends Engine {
    constructor({
// Effect
        selectedTarget,
        source,
        paramsCalc,
        thenEffect,
        match,
        ability,
        excludeTarget,
        condition,
        activation,
        keywords = {},
        isArrow = false,
        isAttack = false,
        isDefense = false,
        isScheme = false,
        isThwart = false,
        saveData = [],
        target = TARGET_YOU,
        refreshTarget = false,
        title = '',
    }) {
        super(arguments[0]);

        this.target = target;
        this.refreshTarget = refreshTarget;
        this.source = source;
        this.title = title;
        this.paramsCalc = paramsCalc;
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

        this.isChoose = false;
        this._keepTriggering = false;
    }
    get ability() {
        return this._ability;
    }
    set ability(ability) {
        this._ability = ability;
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
                this._activation = new Attack({
                    effect: this,
                });
            } else if (this.isDefense) {
                this._activation = new Defense({
                    effect: this,
                });
            } else if (this.isScheme) {
                this._activation = new Scheme({
                    effect: this,
                });
            } else if (this.isThwart) {
                this._activation = new Thwart({
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
        return this._isAttack || (this.ability && this.ability.isAttack);
    }
    set isAttack(isAttack) {
        this._isAttack = isAttack;
    }
    get isDefense() {
        return this._isDefense || (this.ability && this.ability.isDefense);
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
        return this._isThwart || (this.ability && this.ability.isThwart);
    }
    set isThwart(isThwart) {
        this._isThwart = isThwart;
    }
    get keepTriggering() {
        return this._keepTriggering;
    }
    get piercing() {
        return this.keywords.piercing;
    }
    get ranged() {
        return this.keywords.ranged;
    }
    async applyRetaliate(params) {
        if (this.isAttack) {
            const {selectedTarget} = this;
            const attacker = this.character;

            if (selectedTarget && attacker && !selectedTarget.isDefeated && selectedTarget.retaliate) {
                const dealDamageEffect = new DealDamageEffect({
                    damage: selectedTarget.retaliate,
                    selectedTarget: attacker,
                    match: this.match,
                    ability: this.ability,
                });

                await dealDamageEffect.runEffect(params);
            }
        }
    }
    calculate(params) {
        const {paramsCalc} = this;

        const calc = new Calc(paramsCalc);

        return calc.calculate({
            ...params,
            effect: this,
        });
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
                console.log('No hay activation')
                const a = this.activation
                const b = this.isActivation
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
    execute(params) {
        throw new Error('This effect is not created.');
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
        const {activation} = this;

        return activation ?
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

        const newParams = {
            ...params,
            effect: this,
        };

        return activation ? {
            ...newParams,
            ...activation.getTriggersParams(params),
        } : newParams;
    }
    getTriggersWould(params) {
        const {activation} = this;

        return activation ?
            activation.getTriggersWould(params) :
            [];
    }
    getValidTarget(params) {
        const {target, selectedTarget, ability} = this;

        if (selectedTarget && this.filterTarget(selectedTarget, params)) {
            return [selectedTarget];
        }

        return this.validTarget.getValidTarget({
            ...params,
            ability,
            target,
        });
    }
    isResolved() {
        return true;
    }
    isFullResolved() {
        return true;
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

        await this.applyRetaliate(params);
        await this.resolveDelayedEffects(params);
        await this.trigger(PRIORITY_CONSTANT, type, params);
        await this.trigger(PRIORITY_FORCED_RESPONSE, type, params);
        await this.trigger(PRIORITY_RESPONSE, type, params);
    }
    saveDataCard() {
        const card = path(this, 'ability.card');

        if (card && this.saveData.length) {
            this.savedData = this.saveData.reduce((ret, key) => {
                return {
                    ...ret,
                    [key]: card[key],
                }
            }, {});
        }
    }
    async runEffect(params) {
        this.resolved = false;
        this.fullResolved = false;

        this.saveDataCard();

        await this.prepare({
            ...params,
            source: this.source,
        });

        const triggersParams = this.getTriggersParams(params);

        if (await this.triggerWould(triggersParams)) {
            if (await this.triggerInit(triggersParams)) {
                await this.execute(params);

                this.resolved = this.isResolved();
                this.fullResolved = this.isFullResolved();

                if (this.resolved && this.thenEffect) {
                    await this.thenEffect.runEffect(params)
                }

                await this.triggerEnds(triggersParams)
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
        }
    }
}