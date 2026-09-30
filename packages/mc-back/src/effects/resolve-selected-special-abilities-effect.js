import {ABILITY_SPECIAL} from '../constants/abilities.js';

import {Effect} from './effect.js';


export class ResolveSelectedSpecialAbilitiesEffect extends Effect {
    async execute(params) {
        const {orderedCards} = params;
        
        if (!orderedCards || orderedCards.length === 0) {
            return;
        }

        for (let i = 0; i < orderedCards.length; i++) {
            const gameCard = orderedCards[i];
            const isLastStep = i === orderedCards.length - 1;
            const special = gameCard.abilities.find(a => a.type === ABILITY_SPECIAL);
            if (special) {
                const specialParams = {...params, isLastStep};
                if (special.params && special.params.effect) {
                    const effectConfig = special.params.effect;
                    if (isLastStep && effectConfig.paramsLastStep) {
                        special.params.effect = {
                            ...effectConfig,
                            ...effectConfig.paramsLastStep
                        };
                    }
                }
                await special.resolveAbility(specialParams);
            }
        }
    }
}
