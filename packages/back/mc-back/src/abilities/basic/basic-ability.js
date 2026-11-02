import {DealConsequencialDamageEffect} from '../../effects/deal-consequencial-damage-effect.js';
import {BasicActivationCost} from '../../model/costs/basic-activation-cost.js';
import {Ability} from '../core/ability.js';

export class BasicAbility extends Ability {
    constructor() {
        super(arguments[0]);

        this.basicCost = new BasicActivationCost({match: this.match});
        this.costs.add(this.basicCost);

        this.isBasic = true;
    }
    applyConsequencial(params, damage) {
        const dealConsequencialDamageEffect = new DealConsequencialDamageEffect({
            match: this.match,
            selectedTarget: this.card,
            damage,
        });

        return dealConsequencialDamageEffect.runEffect(params);
    }
    getCurrentCard() {
        const {card} = this;
        const parent = card?.parent;

        return parent?.sides?.includes(card) ?
            parent.currentSide :
            card;
    }
    syncEffectConfigurationFromCurrentSide() {
        const currentCard = this.getCurrentCard();
        if (!currentCard || currentCard === this.card) {
            return;
        }

        const currentAbility = currentCard.abilities?.find(ability =>
            ability.constructor === this.constructor);
        const currentEffect = currentAbility?.effectDefinition;
        if (!currentAbility || !currentEffect || !this.effect) {
            return;
        }

        this.effect.setConfigValue('target', currentEffect.target);
        this.effect.setConfigValue('distribute', currentEffect.distribute);
        currentAbility.resetDistribution?.();
    }
    async resolveAbility(params) {
        const {activationTarget, ...abilityParams} = params;
        const {card} = abilityParams;
        this.basicCost.effect.selectedTarget = card;

        this.resolved = false;
        this.paymentCancelled = false;

        let resolveParams = abilityParams;
        if ((this.isAttack || this.isThwart) &&
            (activationTarget ||
                (!abilityParams.preselectedTarget &&
                    !abilityParams.fixedPreselectedTarget))) {
            const statusReplacesActivation =
                (this.isAttack && card?.isStunned) ||
                (this.isThwart && card?.isConfused);

            if (statusReplacesActivation) {
                resolveParams = {
                    ...abilityParams,
                    preselectedTarget: true,
                    fixedPreselectedTarget: true,
                    selectedTarget: [],
                };
            } else {
                const isDistributedMultipleTarget = activationTarget &&
                    this.effect.distribute &&
                    this.effect.validTarget.isMultipleTarget({
                        target: this.effect.target,
                    });
                let targetParams = abilityParams;
                if (activationTarget && isDistributedMultipleTarget) {
                    targetParams = {...abilityParams};
                    delete targetParams.fixedPreselectedTarget;
                    delete targetParams.preselectedTarget;
                    delete targetParams.selectedTarget;
                } else if (activationTarget) {
                    targetParams = {
                        ...abilityParams,
                        preselectedTarget: true,
                        fixedPreselectedTarget: true,
                        selectedTarget: activationTarget,
                    };
                }
                const targetState = await this.prepareToResolve(targetParams);
                if (!targetState.canRun) {
                    this.paymentCancelled = true;
                    return;
                }

                resolveParams = {
                    ...targetParams,
                    preselectedTarget: targetState.preselectedTarget,
                    ...(targetState.preselectedTarget ? {
                        fixedPreselectedTarget: true,
                        selectedTarget: this.effect.selectedTarget,
                    } : {}),
                };
            }
        }

        await super.resolveAbility(resolveParams);

        if (this.resolved && card.isAlly) {
            await this.applyConsequencial(params);
        }
    }
}