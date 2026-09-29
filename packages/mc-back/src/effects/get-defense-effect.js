import {Effect} from "./effect.js";
import {TRIGGER_CONDITION_GET_DEFENSE} from "../triggers/condition-get-defense-trigger.js";

export class GetDefenseEffect extends Effect {
    constructor({}) {
        super(arguments[0]);

        this.defense = 0;
        this.modifyDefense = 0;
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([
                TRIGGER_CONDITION_GET_DEFENSE,
            ]);
    }
    async execute(params) {
        const {selectedTarget, modifyDefense} = this;

        this.defense = selectedTarget.defense + modifyDefense;
    }
}