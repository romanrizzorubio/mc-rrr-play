export const AttackEffect = BaseEffect => class extends BaseEffect {
    constructor(params) {
        super(params);

        this.attackKeywordModifiers = [];
        this.usedAttackKeywords = new Set();
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.resetAttackKeywordData();
    }
    resetAttackKeywordData() {
        this.attackKeywordModifiers = [];
        this.usedAttackKeywords.clear();
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
