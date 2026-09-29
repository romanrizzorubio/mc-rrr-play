import {Effect} from "./effect.js";
import {Lasting} from "../engine/lasting.js";
import {LastingAbility} from "../abilities/misc/lasting-ability.js";

export const EFFECT_LASTING = 'lasting';
export class LastingEffect extends Effect {
    constructor({
        effect,
        until,
        triggerType,
        hideDialog,
    }) {
        super(arguments[0]);

        this.effect = effect;
        this.triggerType = triggerType;
        this.until = until;
        this.hideDialog = hideDialog;
    }
    execute(params) {
        const {effect, until, ability, triggerType} = this;
        const {player} = params;

        const lasting = new Lasting({
            until,
            effect,
            player,
            card: ability.card,
        });

        this.createLasting(lasting);

        const lastingAbility = new LastingAbility({
            lasting,
            effect,
            trigger: triggerType,
            card: ability.card,
            match: this.match,
            hideDialog: this.hideDialog,
        });
        lastingAbility.initTriggers(ability.card);

        lasting.createEndLasting(until, params);
    }
}