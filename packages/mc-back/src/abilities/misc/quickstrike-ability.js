import {ConstantAbility} from "./constant-ability.js";
import {QuickStrikeEffect} from "../../effects/quickstrike-effect.js";
import {CHARACTER_ENGAGED} from "../../constants/characters.js";
import {TRIGGER_ENGAGE_HERO} from "../../triggers/engage-hero-trigger.js";

export class QuickstrikeAbility extends ConstantAbility {
    constructor({}) {
        super(arguments[0]);

        this.trigger = TRIGGER_ENGAGE_HERO;

        this.effect = new QuickStrikeEffect({
            minion: this.card,
            target: CHARACTER_ENGAGED,
            match: this.match,
        });
    }
    getTitle() {
        return 'Ataque veloz';
    }
}