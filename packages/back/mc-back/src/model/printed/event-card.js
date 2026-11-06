import {ABILITY_ACTION} from 'mc-shared';

import {PlayerCard} from './player-card.js';

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

    async canPlay(params) {
        const {abilityType, gameCard} = params;
        if (!await super.canPlay(params)) {
            return false;
        }

        const abilities = abilityType === ABILITY_ACTION ?
            await gameCard.getAbilitiesType(ABILITY_ACTION, params) :
            gameCard.abilities.filter(ability =>
                ability.abilityType === abilityType);

        return abilities.length > 0;
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