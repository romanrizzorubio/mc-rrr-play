import {MixinFriendCard} from './mixin-friend-card.js';
import {MixinFrontCard} from './mixin-front-card.js';

export const MixinFriendFrontCard = C => class extends MixinFriendCard(MixinFrontCard(C)) {
    constructor({
// FrontCard
        attack: _attack,
// FriendFrontCard
        thwart,
    }) {
        super(arguments[0]);

        this.thwart = thwart;

        this.canDefendBasic = true;

        this.isFriendFront = true;
    }
};