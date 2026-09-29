import {PlayerCard} from "./player-card.js";
import {MixinCharacterCard} from "./mixins/mixin-character-card.js";
import {MixinFriendFrontCard} from "./mixins/mixin-friend-front-card.js";
import {GetMaxAlliesEffect} from "../../effects/get-max-allies-effect.js";
import {DIALOG_MAX_ALLIES} from "../../constants/dialogs.js";

export const CARD_TYPE_ALLY = 'ally';
export class AllyCard extends MixinFriendFrontCard(MixinCharacterCard(PlayerCard)) {
    constructor({
// Card
        name, set, image, traits, abilities, unique, icons, keywords,
// PlayerCard
        cost, resources, classification, canPlay,
// MixinCharacterCard
        hitPoints, statusAvailable, toughness,
// FrontCard
        attack,
// FriendFrontCard
        thwart,
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
        const {player} = params;

        const getMaxAlliesEffect = new GetMaxAlliesEffect({
            match: this.match,
        });

        await getMaxAlliesEffect.runEffect(params);
        const allies = player.allies;

        if (allies.length >= getMaxAlliesEffect.maxAllies) {
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