import {TRIGGER_THIS_GET_SCHEME} from 'mc-shared';
import {Effect} from './effect.js';

export class GetSchemeEffect extends Effect {
    constructor({}) {
        super(arguments[0]);

        this.scheme = 0;
        this.modifyScheme = 0;
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([TRIGGER_THIS_GET_SCHEME]);
    }
    getTriggersParams(params) {
        return {
            ...super.getTriggersParams(params),
            card: this.selectedTarget,
        };
    }
    async execute(_params) {
        const {selectedTarget, modifyScheme} = this;

        this.scheme = selectedTarget.scheme + modifyScheme;
    }
}