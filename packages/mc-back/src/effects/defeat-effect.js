import {Effect} from "./effect.js";
import {TRIGGER_ATTACHED_DEFEAT} from "../triggers/attached-defeat-trigger.js";
import {TRIGGER_THIS_DEFEAT_MINION} from "../triggers/this-defeat-minion-trigger.js";
import {TRIGGER_YOU_DEFEAT_MINION} from "../triggers/you-defeat-minion-trigger.js";
import {TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY} from "../triggers/your-hero-attack-defeat-enemy-trigger.js";

export class DefeatEffect extends Effect {
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([
                TRIGGER_ATTACHED_DEFEAT,
            ]);
    }
    getTriggersEnds() {
        return super.getTriggersEnds()
            .concat([
                TRIGGER_YOU_DEFEAT_MINION,
                TRIGGER_THIS_DEFEAT_MINION,
                TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY,
            ]);
    }
    defeat(params) {
        const {selectedTarget} = this;

        if (selectedTarget.abilities) {
            const ability = selectedTarget.abilities.find(_ability => _ability.isWhenDefeated && _ability.isValidIdentity(params))

            if (ability) {
                return ability.resolveAbility({
                    ...params,
                    card: selectedTarget,
                });
            }
        }
    }
    async execute(params) {
        const {selectedTarget} = this;
        const {player} = params;
        const {gameZone} = selectedTarget;

        await this.defeat(params);

        await selectedTarget.defeat(player);

        if (selectedTarget.isVillain) {
            this.match.villain.refresh();
        } else {
            if (gameZone) {
                gameZone.refresh();
            }
        }
    }
}