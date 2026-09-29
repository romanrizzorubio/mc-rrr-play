
export const MixinSideSchemeCard = C => class extends C {
    constructor({
// SideSchemeCard
        startingThreat,
    }) {
        super(arguments[0]);

        this._startingThreat = startingThreat;

        this.isSideScheme = true;
        this.isScheme = true;
    }
    get initial() {
        if (this._startingThreat instanceof Array) {
            const [_startingThreat, _perPlayer] = this._startingThreat;

            if (_perPlayer) {
                return _startingThreat * this.match.numPlayers;
            }
        }
        return this._startingThreat
    }
}