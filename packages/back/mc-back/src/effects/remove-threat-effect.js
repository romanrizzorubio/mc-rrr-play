import {
    EFFECT_REMOVE_THREAT,
    TARGET_ALL_SCHEMES,
} from 'mc-shared';
import {Calc} from '../engine/calc.js';
import {removeThreatTokens} from '../utils/token-mutations.js';
import {defeatSideSchemeIfEmpty} from '../utils/scheme-threat-resolution.js';
import {AssignThreatEffect} from './assign-threat-effect.js';
import {Effect} from './effect.js';

export class RemoveThreatEffect extends Effect {
    constructor({
        ignoreCrisis = false,
        additionalThreatCalc,
        threat,
        thwart,
        distribute = false,
    }) {
        super({
            ...arguments[0],
            effectType: EFFECT_REMOVE_THREAT,
        });

        this.baseThreat = threat;
        this.threat = threat;
        this.additionalThreatCalc = additionalThreatCalc;
        this.additionalThreat = 0;
        this.threatModifier = 0;
        this.modifyThwart = 0;
        this.thwart = thwart;
        this.ignoreCrisis = ignoreCrisis;
        this.distribute = distribute;
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.additionalThreat = 0;
        this.modifyThwart = 0;
    }
    filterTarget(card) {
        return card.canRemoveThreat({ignoreCrisis: this.ignoreCrisis}) &&
            super.filterTarget.apply(this, arguments);
    }
    async canRun(params) {
        if (!await super.canRun(params)) {
            return false;
        }

        if (!this.paramsCalc) {
            return true;
        }

        const lastStepThreat = this.getLastStepParam('threat', params);
        const threat = lastStepThreat !== undefined ?
            lastStepThreat :
            await this.calculate(params);

        return threat > 0;
    }
    async prepare(params) {
        await super.prepare(params);

        const lastStepThreat = this.getLastStepParam('threat', params);
        if (lastStepThreat !== undefined) {
            this.threat = lastStepThreat;
        } else if (this.paramsCalc) {
            this.threat = this.calculate(params);
        } else {
            this.threat = this.calcPerPlayer(this.baseThreat ?? params.threat);
        }
        this.additionalThreat = this.additionalThreatCalc ?
            await new Calc(this.additionalThreatCalc).calculate({
                ...params,
                match: params.match ?? this.match,
                effect: this,
            }) :
            0;
        if (!Number.isFinite(this.additionalThreat)) {
            throw new TypeError(
                'RemoveThreatEffect additionalThreatCalc requires a numeric threat value.'
            );
        }
        if (Number.isFinite(this.threat)) {
            this.threat += this.threatModifier + this.additionalThreat;
        } else if (this.threatModifier || this.additionalThreat) {
            throw new TypeError('RemoveThreatEffect requires a numeric threat value to modify.');
        }
    }
    async execute(params) {
        const abilityCard = this.ability?.card;
        const abilityParent = abilityCard?.parent;
        if (this.isThwart &&
            this.ability?.isBasic &&
            typeof this.ability.getThwartValue === 'function' &&
            abilityParent?.sides?.includes(abilityCard) &&
            abilityParent.currentSide !== abilityCard) {
            const previousTarget = this.target;
            const thwart = await this.ability.getThwartValue(params);

            this.threat = thwart + this.threatModifier + this.additionalThreat;
            await this.refreshTargetSelection(previousTarget, params);
        }

        const {selectedTarget} = this;
        const threat = this.threat +
            (this.isThwart ? this.modifyThwart : 0);

        if (this.distribute) {
            const effect = new AssignThreatEffect({
                ability: this.ability,
                ignoreCrisis: this.ignoreCrisis,
                match: this.match,
                selectedTarget,
                suppressAbilityThwart: true,
                target: TARGET_ALL_SCHEMES,
                threat,
            });

            return effect.runEffect(params);
        }

        if (Array.isArray(selectedTarget)) {
            return this.promisesSequential(selectedTarget, selectedTarget => {
                const effect = new RemoveThreatEffect({
                    selectedTarget,
                    threat,
                    match: this.match,
                    ability: this.ability,
                });
                return effect.runEffect(params);
            });
        }

        removeThreatTokens(selectedTarget, threat);

        selectedTarget.refresh();

        return defeatSideSchemeIfEmpty(
            selectedTarget,
            this.match,
            this.ability,
            params
        );
    }
}
