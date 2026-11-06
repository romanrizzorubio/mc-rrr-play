import {Engine} from '../../engine/engine.js';

export const resolveNumericKeyword = (value, match) => {
    if (!Array.isArray(value)) {
        return value;
    }

    const [amount, perPlayer] = value;
    if (value.length !== 2 ||
        !Number.isFinite(amount) ||
        typeof perPlayer !== 'boolean') {
        throw new TypeError('Numeric keywords must use [value, perPlayer].');
    }
    if (!perPlayer) {
        return amount;
    }

    if (!Number.isFinite(match?.numPlayers)) {
        throw new TypeError(
            'Per-player numeric keywords require a match with a valid player count.'
        );
    }

    return amount * match.numPlayers;
};

export class Keywords extends Engine {
    constructor(params = {}) {
        const {
            guard = false,
            peril = false,
            permanent = false,
            setup = false,
            toughness = false,
            quickStrike = false,
            surge = false,
            villainous = false,
            overkill = false,
            piercing = false,
            ranged = false,
            restricted = false,
            incite = 0,
            hinder = 0,
            retaliate = 0,
            teamUp,
            uses,
            hint,
            match,
        } = params;
        super(params);

        if (teamUp !== undefined &&
            (!Array.isArray(teamUp) ||
                teamUp.length !== 2 ||
                teamUp.some(name =>
                    typeof name !== 'string' || !name.trim()))) {
            throw new TypeError('Team-Up keyword must name exactly two characters.');
        }

        this.match = match;
        this.guard = guard;
        this.peril = peril;
        this.permanent = permanent;
        this.setup = setup;
        this.toughness = toughness;
        this.quickStrike = quickStrike;
        this.surge = surge;
        this.villainous = villainous;
        this.overkill = overkill;
        this.piercing = piercing;
        this.ranged = ranged;
        this.restricted = restricted;
        this._incite = incite;
        this._hinder = hinder;
        this._retaliate = retaliate;
        this.teamUp = teamUp ? [...teamUp] : undefined;
        this._uses = uses;
        this._hint = hint;
    }
    getNumericValue(value) {
        return resolveNumericKeyword(value, this.match);
    }
    get incite() {
        return this.getNumericValue(this._incite);
    }
    get hinder() {
        return this.getNumericValue(this._hinder);
    }
    get retaliate() {
        return this.getNumericValue(this._retaliate);
    }
    get uses() {
        return this.getNumericValue(this._uses);
    }
    get hint() {
        return this.getNumericValue(this._hint);
    }
}