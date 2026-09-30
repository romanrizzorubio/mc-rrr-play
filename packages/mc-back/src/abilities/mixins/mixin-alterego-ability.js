export const MixinAlteregoAbility = C => class extends C {
    canRun(params) {
        if (this.isValidIdentity(params)) {
            return super.canRun(arguments[0]);
        }

        return false;
    }
    isValidIdentity({player}) {
        const owner = this.card.owner || this.owner;
        if (owner && owner.isPlayer) {
            return owner.isAlterEgo;
        }

        if (player) {
            return player.isAlterEgo;
        }

        return false;
    }
};