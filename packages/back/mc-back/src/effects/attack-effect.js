export const AttackEffect = BaseEffect => class extends BaseEffect {
    constructor(params) {
        super(params);

        this.attackKeywordModifiers = [];
        this.usedAttackKeywords = new Set();
        this.temporaryAttackKeywords = new Map();
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.resetAttackKeywordData();
    }
    resetAttackKeywordData() {
        this.temporaryAttackKeywords?.forEach((value, keyword) => {
            this.keywords[keyword] = value;
        });
        this.temporaryAttackKeywords = new Map();
        this.attackKeywordModifiers = [];
        this.usedAttackKeywords.clear();
    }
    setTemporaryAttackKeywords(keywords) {
        this.temporaryAttackKeywords ??= new Map();
        Object.entries(keywords).forEach(([keyword, value]) => {
            if (!this.temporaryAttackKeywords.has(keyword)) {
                this.temporaryAttackKeywords.set(keyword, this.keywords[keyword]);
            }
            this.keywords[keyword] = value;
        });
    }
    get overkill() {
        return this.getAttackKeyword('overkill');
    }
    get piercing() {
        return this.getAttackKeyword('piercing');
    }
    get ranged() {
        return this.getAttackKeyword('ranged');
    }
    getAttackKeyword(name) {
        const value = this.attackKeywordModifiers.reduce((current, modifier) => {
            const {source, ability, keyword, lasting} = modifier;
            const sourceIsActive = lasting ?
                source?.match?.lasting?.includes(source) :
                source?.isInPlay === true &&
                    (!ability ||
                        typeof source.hasAbilityTrigger !== 'function' ||
                        source.hasAbilityTrigger(ability));
            if (!sourceIsActive) {
                return current;
            }

            const addedValue = keyword[name];
            if (typeof addedValue === 'number') {
                return (Number(current) || 0) + addedValue;
            }

            return Boolean(current || addedValue);
        }, this.keywords?.[name] ?? false);

        const activationEffect = this._activation?.effect;
        if (this.isAttack &&
            activationEffect &&
            activationEffect !== this &&
            activationEffect.isAttack &&
            typeof activationEffect.getAttackKeyword === 'function') {
            return Boolean(value || activationEffect.getAttackKeyword(name));
        }

        return value;
    }
    addAttackKeywordModifier(source, ability, keyword, lasting = false) {
        const sourceIsActive = lasting ?
            source?.match?.lasting?.includes(source) :
            source?.isInPlay === true &&
                (!ability ||
                    typeof source.hasAbilityTrigger !== 'function' ||
                    source.hasAbilityTrigger(ability));
        if (!sourceIsActive) {
            return false;
        }

        const modifier = this.attackKeywordModifiers.find(existing =>
            existing.source === source &&
            existing.ability === ability &&
            existing.lasting === lasting);

        if (modifier) {
            modifier.keyword = {
                ...modifier.keyword,
                ...keyword,
            };
        } else {
            this.attackKeywordModifiers.push({
                source,
                ability,
                keyword: {...keyword},
                lasting,
            });
        }

        return true;
    }
    markAttackKeywordUsed(keyword) {
        this.usedAttackKeywords.add(keyword);
    }
};
