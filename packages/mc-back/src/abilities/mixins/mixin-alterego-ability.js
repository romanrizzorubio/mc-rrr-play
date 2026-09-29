export const MixinAlteregoAbility = C => class extends C {
    canRun(params) {
        if (this.isValidIdentity(params)) {
            return super.canRun(arguments[0]);
        }

        return false;
    }
    isValidIdentity({player}) {
        if (this.card.owner.isPlayer) {
            return this.card.owner.isAlterEgo;
        }

        if (player) {
            return player.isAlterEgo;
        }
    }
}