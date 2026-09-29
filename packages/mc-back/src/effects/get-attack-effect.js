import {Effect} from "./effect.js";
import {TRIGGER_YOUR_HERO_GET_ATTACK} from "../triggers/your-hero-get-attack-trigger.js";

export class GetAttackEffect extends Effect {
    constructor({}) {
        super(arguments[0]);

        this.attack = 0;
        this.modifyAttack = 0;
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([
                TRIGGER_YOUR_HERO_GET_ATTACK,
            ]);
    }
    async execute(params) {
        const {selectedTarget, modifyAttack} = this;

        this.attack = selectedTarget.attack + modifyAttack;
    }
}