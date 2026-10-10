import {Effect} from './effect.js';

export class GetSchemeEffect extends Effect {
    constructor({}) {
        super(arguments[0]);

        this.scheme = 0;
        this.modifyScheme = 0;
    }
    async execute(_params) {
        const {selectedTarget, modifyScheme} = this;

        this.scheme = selectedTarget.scheme + modifyScheme;
    }
}