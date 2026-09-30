import {Engine} from '../../engine/engine.js';

export class Keywords extends Engine {
    constructor({
// Keywords
        guard = false,
        permanent = false,
        toughness = false,
        quickStrike = false,
        surge = false,
        villainous = false,
        overkill = false,
        piercing = false,
        ranged = false,
        retaliate = 0,
        uses,
        hint
    }) {
        super(arguments[0]);

        this.guard = guard;
        this.permanent = permanent;
        this.toughness = toughness;
        this.quickStrike = quickStrike;
        this.surge = surge;
        this.villainous = villainous;
        this.overkill = overkill;
        this.piercing = piercing;
        this.ranged = ranged;
        this.retaliate = retaliate;
        this._uses = uses;
        this._hint = hint;
    }

    get uses() {
        if (this._uses instanceof Array) {
            const [_uses, _perPlayer] = this._uses;

            if (_perPlayer) {
                return _uses * this.match.numPlayers;
            }
        }
        return this._uses;
    }
    get hint() {
        if (this._hint instanceof Array) {
            const [_hint, _perPlayer] = this._hint;

            if (_perPlayer) {
                return _hint * this.match.numPlayers;
            }
        }
        return this._hint;
    }

}