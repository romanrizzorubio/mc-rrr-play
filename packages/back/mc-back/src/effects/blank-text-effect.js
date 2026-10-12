import {Effect} from './effect.js';

export class BlankTextEffect extends Effect {
    constructor({
        blank = true,
        isCleanup = false,
    }) {
        super(arguments[0]);

        this.blank = blank;
        this.isCleanup = isCleanup;
    }
    async execute(params) {
        const {selectedTarget, blank, isCleanup} = this;
        const {lasting} = params;

        selectedTarget.printedTextBlank = blank;

        if (lasting && !isCleanup) {
            const cleanup = new BlankTextEffect({
                blank: false,
                isCleanup: true,
                match: this.match,
            });
            lasting.registerCleanup(cleanup, selectedTarget);
        }

        await selectedTarget.refresh();
    }
}
