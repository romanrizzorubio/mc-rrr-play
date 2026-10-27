import {Effect} from './effect.js';
import {addCharacterTraits} from '../utils/trait-utils.js';
import {getSelectedTargets} from '../utils/target-utils.js';
import {refreshCharacter} from '../utils/character-utils.js';

export class AddTraitEffect extends Effect {
    constructor({
        trait,
        characterTarget,
        modifierCondition,
    }) {
        super(arguments[0]);

        this.characterTarget = characterTarget;
        this.trait = trait;
        this.modifierCondition = modifierCondition;

        if (modifierCondition !== undefined &&
            (modifierCondition === null ||
                typeof modifierCondition !== 'object')) {
            throw new TypeError(
                'EFFECT_ADD_TRAIT modifierCondition must be an object.'
            );
        }
    }
    async execute(params) {
        const {ability, modifierCondition, trait} = this;
        if (modifierCondition !== undefined) {
            const source = params.lasting || ability?.card;
            if (!source) {
                throw new TypeError(
                    'Conditional EFFECT_ADD_TRAIT requires an ability source.'
                );
            }

            for (const target of getSelectedTargets(this.selectedTarget)) {
                if (!target?.isCharacter ||
                    typeof target.addTraitModifier !== 'function') {
                    throw new TypeError(
                        'Conditional EFFECT_ADD_TRAIT requires character targets.'
                    );
                }

                const added = target.addTraitModifier(
                    source,
                    ability,
                    trait,
                    modifierCondition,
                    Boolean(params.lasting)
                );
                if (added) {
                    await refreshCharacter(target);
                }
            }

            return;
        }

        await addCharacterTraits(this, params, [this.trait]);
    }
}
