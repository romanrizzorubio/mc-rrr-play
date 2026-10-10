
export const MixinFrontCard = C => class extends C {
    constructor({
// FrontCard
        attack,
    }) {
        super(arguments[0]);

        this.attack = attack;
    }
    toObj() {
        return {
            ...super.toObj(arguments[0]),
            attack: this.attack,
        };
    }
};