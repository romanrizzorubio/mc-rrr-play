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
    async resolveAbility(params) {
        const {card} = params;
        this.basicCost.effect.selectedTarget = card;

        this.resolved = false;
        this.paymentCancelled = false;

        let resolveParams = params;
        if ((this.isAttack || this.isThwart) &&
            !params.preselectedTarget &&
            !params.fixedPreselectedTarget) {
            const targetState = await this.prepareToResolve(params);
            if (!targetState.canRun) {
                this.paymentCancelled = true;
                return;
            }

            resolveParams = {
                ...params,
                preselectedTarget: targetState.preselectedTarget,
                ...(targetState.preselectedTarget ? {
                    fixedPreselectedTarget: true,
                    selectedTarget: this.effect.selectedTarget,
                } : {}),
            };
        }

        await super.resolveAbility(resolveParams);

        if (this.resolved && card.isAlly) {
            await this.applyConsequencial(params);
        }
    }
}