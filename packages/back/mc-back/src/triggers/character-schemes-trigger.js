import {getTriggerCardPlayer} from '../utils/trigger-card-player.js';
import {Trigger} from './base/trigger.js';

export class CharacterSchemesTrigger extends Trigger {
    constructor({characterType, ...params}) {
        super(params);

        this.characterType = characterType;
    }
    getCharacter(params) {
        return params.effect?.character;
    }
    canTrigger(params) {
        const character = this.getCharacter(params);

        if (!character?.isCharacter ||
            (this.characterType && character.type !== this.characterType)) {
            return false;
        }

        const player = getTriggerCardPlayer(this.card, params.player);

        return super.canTrigger({...params, player});
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
