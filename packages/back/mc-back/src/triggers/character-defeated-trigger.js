import {getTriggerCardPlayer} from '../utils/trigger-card-player.js';
import {Trigger} from './base/trigger.js';

export class CharacterDefeatedTrigger extends Trigger {
    constructor({
        characterType,
        controlledByYou = false,
        ...params
    }) {
        super(params);

        this.characterType = characterType;
        this.controlledByYou = controlledByYou;
    }
    getCharacter(params) {
        return params.effect?.defeatedCharacter ||
            params.effect?.selectedTarget;
    }
    getAbilityParams(params) {
        const player = getTriggerCardPlayer(this.card, params.player);
        const character = this.getCharacter(params);

        return {
            ...super.getAbilityParams({...params, player}),
            card: character,
            triggeredCard: character,
        };
    }
    canTrigger(params) {
        const character = this.getCharacter(params);
        const player = getTriggerCardPlayer(this.card, params.player);

        if (params.effect?.defeated !== true ||
            !character?.isCharacter ||
            character.isInPlay ||
            (this.characterType && character.type !== this.characterType) ||
            (this.controlledByYou &&
                params.effect.defeatedController !== player)) {
            return false;
        }

        return super.canTrigger(
            this.getAbilityParams({...params, player})
        );
    }
    runCard(params) {
        const player = getTriggerCardPlayer(this.card, params.player);

        return super.runCard({
            ...params,
            card: this.getCharacter(params),
            player,
        });
    }
}
