export const MixinHeroAbility = C => class extends C {
    canRun(params) {
        if (this.isValidIdentity(params)) {
            return super.canRun(arguments[0]);
        }

        return false;
    }
    isValidIdentity({player}) {
        if (this.card.owner.isPlayer) {
            return this.card.owner.isHero;
        }

        if (player) {
            return player.isHero;
        }
    }
}
