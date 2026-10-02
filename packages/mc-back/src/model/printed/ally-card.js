import {DIALOG_MAX_ALLIES} from 'mc-shared';
import {GetMaxAlliesEffect} from '../../effects/get-max-allies-effect.js';

import {MixinCharacterCard} from './mixins/mixin-character-card.js';
import {MixinFriendFrontCard} from './mixins/mixin-friend-front-card.js';
import {PlayerCard} from './player-card.js';


export class AllyCard extends MixinFriendFrontCard(MixinCharacterCard(PlayerCard)) {
    constructor({
// Card
        name: _name, set: _set, image: _image, traits: _traits, abilities: _abilities, unique: _unique, icons: _icons, keywords: _keywords,
// PlayerCard
        cost: _cost, resources: _resources, classification: _classification, canPlay: _canPlay,
// MixinCharacterCard
        hitPoints: _hitPoints, statusAvailable: _statusAvailable, toughness: _toughness,
// FrontCard
        attack: _attack,
// FriendFrontCard
        thwart: _thwart,
// AllyCard
        subtitle,
        thwartConsequencial,
        attackConsequencial,
    }) {
        super(arguments[0]);

        this.subtitle = subtitle;
        this.thwartConsequencial = thwartConsequencial;
        this.attackConsequencial = attackConsequencial;

        this.isAlly = true;
    }
    async canPlay(params) {
        const {player, checkOnly} = params;

        const getMaxAlliesEffect = new GetMaxAlliesEffect({
            match: this.match,
        });

        await getMaxAlliesEffect.runEffect(params);
        const allies = player.allies;

        if (allies.length >= getMaxAlliesEffect.maxAllies) {
            if (checkOnly) {
                return super.canPlay(params);
            }

            const {accepted} = await this.openDialog({
                dialogType: DIALOG_MAX_ALLIES,
                title: 'Aliados',
                showCancel: true,
                data: {
                    cards: allies.map(card => card.toObj(arguments[0]))
                },
            });

            return accepted;
        }

        return super.canPlay(params);
    }
}