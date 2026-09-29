import {Effect} from "./effect.js";
import {TRIGGER_CONDITION_GET_TRAITS} from "../triggers/condition-get-traits-trigger.js";

export class GetTraitsEffect extends Effect {
    constructor({}) {
        super(arguments[0]);

        this.traits = [];
        this.modifyTraits = [];
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([
                TRIGGER_CONDITION_GET_TRAITS,
            ]);
    }
    async execute(params) {
        const {modifyTraits, selectedTarget} = this;

        this.traits = selectedTarget.traits.slice();

        modifyTraits.forEach(trait => {
            if (this.traits.indexOf(trait) === -1) {
                this.traits.push(trait);
            }
        })
    }
}