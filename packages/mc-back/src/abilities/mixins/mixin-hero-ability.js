export const MixinHeroAbility = C => class extends C {
    canRun(params) {
        if (this.isValidIdentity(params)) {
            return super.canRun(arguments[0]);
        }

        return false;
    }
    isValidIdentity({player}) {
        const owner = this.card.owner || this.owner;
        if (owner && owner.isPlayer) {
            return owner.isHero;
        }

        if (player) {
            return player.isHero;
        }

        return false;
    }
};
