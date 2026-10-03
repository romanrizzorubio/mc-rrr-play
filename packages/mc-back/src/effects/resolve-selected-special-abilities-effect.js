import {SpecialAbility} from '../abilities/misc/special-ability.js';
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
            const special = gameCard.abilities.find(ability =>
                ability instanceof SpecialAbility);
            if (special) {
                await special.resolveAbility({...params, isLastStep});
            }
        }
    }
}
