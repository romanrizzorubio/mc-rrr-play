import {Effect} from "./effect.js";

export class GetMaxAlliesEffect extends Effect {
    constructor({}) {
        super(arguments[0]);

        this.maxAllies = 3;
        this.modifyMaxAllies = 0;
    }
    async execute(params) {
        const {modifyMaxAllies} = this;

        this.maxAllies = 3 + modifyMaxAllies;
    }
}