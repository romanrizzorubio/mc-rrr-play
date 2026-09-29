import {MixinFrontCard} from "./mixin-front-card.js";
import {MixinFriendCard} from "./mixin-friend-card.js";
import {ThwartBasicAbility} from "../../../abilities/basic/thwart-basic-ability.js";
import {AttackBasicAbility} from "../../../abilities/basic/attack-basic-ability.js";

export const MixinFriendFrontCard = C => class extends MixinFriendCard(MixinFrontCard(C)) {
    constructor({
// FrontCard
        attack,
// FriendFrontCard
        thwart,
    }) {
        super(arguments[0]);

        this.thwart = thwart;

        this.canDefendBasic = true;

        this.isFriendFront = true;
    }
}