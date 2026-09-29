import {PutPlayEffect} from "./put-play-effect.js";
import {TRIGGER_ENGAGE_HERO} from "../triggers/engage-hero-trigger.js";


export class EngageEffect extends PutPlayEffect {
    getTriggersEnds(params) {
        return super.getTriggersEnds(params)
            .concat([
                TRIGGER_ENGAGE_HERO,
            ]);
    }
    getTriggersParams(params) {
        return {
            ...super.getTriggersParams(params),
            card: this.card,
        };
    }

    async execute(params) {
        await super.execute(params);

        const {selectedTarget, card} = this;

        selectedTarget.engage(card);
        card.engaged = selectedTarget;

        selectedTarget.refresh();
    }
}