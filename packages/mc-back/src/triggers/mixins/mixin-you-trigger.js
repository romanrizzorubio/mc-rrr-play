export const MixinYouTrigger = C => class extends C {
    constructor(params) {
        super(params);
    }
    getYou(params) {
        const {effect} = params;

        return effect.selectedTarget;
    }
    isSuperhero(character, params) {
        const {player} = params;

        return character === player ||
            character === player.superhero ||
            character === player.superhero.currentSide;
    }
    canTrigger(params) {
        if (this.isSuperhero(this.getYou(params), params)) {
            return super.canTrigger(params);
        }
    }
}