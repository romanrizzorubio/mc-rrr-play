import {DoIfEffect} from './do-if-effect.js';
import {GetTraitsEffect} from './get-traits-effect.js';

export class DoIfHasTraitsEffect extends DoIfEffect {
    constructor({
// DoIfEffect
        traits,
        effect: _effect,
        effectNot: _effectNot,
// DoIfHasDamageEffect
        resources: _resources = [],
    }) {
        super(arguments[0]);

        this.traits = traits;
    }

    async checkCondition(params, selectedTarget = this.selectedTarget) {
        const getTraitsEffect = new GetTraitsEffect({
            selectedTarget,
            match: this.match,
        });

        await getTraitsEffect.runEffect(params);

        return this.traits.some(trait => getTraitsEffect.traits.some(t => t === trait));
    }

    async canRun(params) {
        const validTargets = await this.getTargetCandidates(params);

        if (!validTargets.length) {
            return false;
        }

        if (!await super.canRun(params)) {
            return false;
        }

        return Boolean(await this.promisesSequentialSome(validTargets, async selectedTarget => {
            const checked = await this.checkCondition(params, selectedTarget);
            const effect = checked ? this.effect : this.effectNot;

            if (!effect) {
                return true;
            }

            this.prepareChildEffect(effect, selectedTarget);

            return effect.canRun(params);
        }));
    }
    async getTargetCandidates(params) {
        const validTargets = await super.getValidTarget(params);
        if (this.effectNot) {
            return validTargets.flat(Infinity);
        }

        return this.getEffectiveTargets(params, validTargets);
    }
    async getEffectiveTargets(params, targets) {
        const validTargets = targets ?? await super.getValidTarget(params);
        const requiredTraits = Array.isArray(this.traits) ?
            this.traits :
            [this.traits];

        return this.promisesSequentialFilter(validTargets.flat(Infinity), async target => {
            const getTraitsEffect = new GetTraitsEffect({
                selectedTarget: target.currentSide ?? target,
                match: this.match,
            });
            await getTraitsEffect.runEffect({
                ...params,
                player: target.controller ?? params.player,
            });

            return requiredTraits.some(trait =>
                getTraitsEffect.traits.includes(trait));
        });
    }
    async selectTarget(params) {
        const {selectedTarget} = this;
        const isPreselected = params.fixedPreselectedTarget ||
            params.preselectedEffectTargets?.has(this);
        if ((isPreselected || (selectedTarget && !this.refreshTarget)) &&
            selectedTarget) {
            const targets = await this.getTargetCandidates(params);
            const selectedTargets = Array.isArray(selectedTarget) ?
                selectedTarget :
                [selectedTarget];
            const validTargets = selectedTargets.map(selected =>
                targets.find(target =>
                    target === selected ||
                    (selected?.id !== undefined && target?.id === selected.id) ||
                    target?.parent === selected ||
                    selected?.parent === target));

            return validTargets.every(Boolean) ?
                Array.isArray(selectedTarget) ? validTargets : validTargets[0] :
                null;
        }

        const targetCandidates = await this.getTargetCandidates(params);

        return super.selectTarget({...params, targetCandidates});
    }
}