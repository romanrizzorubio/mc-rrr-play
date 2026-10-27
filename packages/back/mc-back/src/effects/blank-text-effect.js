import {Effect} from './effect.js';

export class BlankTextEffect extends Effect {
    constructor({
        blank = true,
        isCleanup = false,
        modifierCondition,
    }) {
        super(arguments[0]);

        this.blank = blank;
        this.isCleanup = isCleanup;
        this.modifierCondition = modifierCondition;

        if (modifierCondition !== undefined &&
            (modifierCondition === null ||
                typeof modifierCondition !== 'object')) {
            throw new TypeError(
                'EFFECT_BLANK_TEXT modifierCondition must be an object.'
            );
        }
    }
    async execute(params) {
        const {
            ability,
            selectedTarget,
            blank,
            isCleanup,
            modifierCondition,
        } = this;
        const {lasting} = params;

        if (lasting) {
            if (modifierCondition !== undefined) {
                throw new TypeError(
                    'EFFECT_BLANK_TEXT modifierCondition cannot be combined with EFFECT_LASTING.'
                );
            }
            selectedTarget.printedTextBlank = blank;

            if (!isCleanup) {
                const cleanup = new BlankTextEffect({
                    blank: false,
                    isCleanup: true,
                    match: this.match,
                });
                lasting.registerCleanup(cleanup, selectedTarget);
            }
        } else {
            const source = ability?.card;
            if (!source ||
                typeof selectedTarget?.addBlankTextModifier !== 'function') {
                throw new TypeError(
                    'EFFECT_BLANK_TEXT without EFFECT_LASTING requires an ability source and card target.'
                );
            }

            selectedTarget.addBlankTextModifier(
                source,
                ability,
                blank,
                modifierCondition
            );
        }

        await selectedTarget.refresh();
    }
}
