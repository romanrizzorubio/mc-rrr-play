import {PlayerCard} from './player-card.js';

export const CARD_TYPE_EVENT = 'event';
export class EventCard extends PlayerCard {
    constructor({
// Card
        name: _name, set: _set, image: _image, traits: _traits, ability: _ability, unique: _unique, icons: _icons, keywords: _keywords,
// PlayerCard
        cost: _cost, resources: _resources, classification: _classification, canPlay: _canPlay
    }) {
        super(arguments[0]);

        this.isEvent = true;
    }

    async canPlay({abilityType, gameCard}) {
        if (await super.canPlay(arguments[0])) {
            const abilities = await gameCard.getAbilitiesType(abilityType);

            if (abilities.length) {
                return true;
            }
        }
        return false;
    }

    getAbility(index) {
        if (this.ability instanceof Array) {
            return this.ability[index];
        }

        return this.ability;
    }

    getValidTarget({
        abilityId,
        match,
        player
    }) {
        const ability = this.getAbility(abilityId);

        return ability.getValidTarget(match, player);
    }

    async play(params) {
        const {player, ability, gameCard} = params;

        const value = await ability.resolveAbility(params);

        player.discardHand(gameCard.id);

        return value;
    }
}