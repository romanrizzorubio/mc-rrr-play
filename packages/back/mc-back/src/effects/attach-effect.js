import {Effect} from './effect.js';
import {getAttachmentHost} from '../utils/attachment-utils.js';
import {checkCondition} from '../engine/utils.js';
import {splitTargetCondition} from '../utils/target-condition-utils.js';
import {GetTraitsEffect} from './get-traits-effect.js';

export class AttachEffect extends Effect {
    constructor({
        card,
        fallbackCondition,
        fallbackTarget,
    }) {
        super(arguments[0]);

        this.card = card;
        this.referenceCard = card;
        this.fallbackCondition = fallbackCondition;
        this.fallbackTarget = fallbackTarget;
        this.usingFallbackTarget = false;
    }
    async getValidTarget(params) {
        const targets = await this.getValidTargets(params);
        if (targets.length || !this.fallbackTarget || this.usingFallbackTarget) {
            return targets;
        }

        this.usingFallbackTarget = true;
        this.target = this.fallbackTarget;
        this.condition = this.fallbackCondition;
        this.validTarget.condition = this.fallbackCondition;

        return this.getValidTargets(params);
    }
    async getValidTargets(params) {
        const condition = this.condition;
        if (!condition || Array.isArray(condition) ||
            !Object.hasOwn(condition, 'traits')) {
            return super.getValidTarget(params);
        }

        const conditionWithoutTraits = {...condition};
        const requiredTraits = Array.isArray(conditionWithoutTraits.traits) ?
            conditionWithoutTraits.traits :
            [conditionWithoutTraits.traits];
        delete conditionWithoutTraits.traits;
        this.condition = conditionWithoutTraits;
        this.validTarget.condition = conditionWithoutTraits;

        try {
            const targets = await super.getValidTarget(params);

            return this.promisesSequentialFilter(targets.flat(Infinity), async target => {
                const traitsEffect = new GetTraitsEffect({
                    selectedTarget: target.currentSide ?? target,
                    match: this.match,
                });
                await traitsEffect.runEffect({
                    ...params,
                    player: target.controller ?? params.player,
                });

                return requiredTraits.some(trait =>
                    traitsEffect.traits.includes(trait));
            });
        } finally {
            this.condition = condition;
            this.validTarget.condition = condition;
        }
    }
    async selectTarget(params) {
        if (!(await this.getValidTarget(params)).length) {
            return null;
        }

        return super.selectTarget(params);
    }
    filterTarget(target, params) {
        const {condition} = splitTargetCondition(this.condition);
        if (!super.filterTarget(target, params) ||
            (condition && !checkCondition(target, condition))) {
            return false;
        }

        return this.card.canAttach(target, params.player);
    }

    async execute(params) {
        const {card, selectedTarget} = this;
        const attachedTo = getAttachmentHost(selectedTarget);

        attachedTo.attached.push(card);
        card.attachedTo = attachedTo;

        await attachedTo.refresh();

        const attackEffect = [
            params.enemyActivation,
            params.activation?.effect,
            params.effect?.enemyActivation,
        ].find(effect =>
            effect?.isAttack &&
            effect.character === attachedTo &&
            typeof effect.resolveAttachedAttackModifiers === 'function');
        if (attackEffect) {
            await attackEffect.resolveAttachedAttackModifiers(card, params);
        }
    }
}