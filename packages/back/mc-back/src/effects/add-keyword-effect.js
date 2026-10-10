import {Effect} from './effect.js';
import {getSelectedTargets} from '../utils/target-utils.js';

const booleanKeywords = new Set([
    'guard',
    'permanent',
    'toughness',
    'quickStrike',
    'surge',
    'villainous',
    'overkill',
    'piercing',
    'ranged',
    'restricted',
]);
const numericKeywords = new Set(['retaliate']);

export class AddKeywordEffect extends Effect {
    constructor({
        keyword,
    }) {
        super(arguments[0]);

        this.keyword = keyword;
    }
    async execute(params) {
        const {ability, keyword} = this;
        const source = params.lasting || ability?.card;

        if (!source) {
            throw new TypeError('EFFECT_ADD_KEYWORD requires an ability source.');
        }
        if (!keyword || typeof keyword !== 'object' ||
            Array.isArray(keyword) || Object.keys(keyword).length === 0) {
            throw new TypeError('EFFECT_ADD_KEYWORD requires a non-empty keyword object.');
        }

        Object.entries(keyword).forEach(([name, value]) => {
            const isBooleanKeyword = booleanKeywords.has(name) && value === true;
            const isNumericKeyword = numericKeywords.has(name) &&
                Number.isFinite(value) && value > 0;
            if (!isBooleanKeyword && !isNumericKeyword) {
                throw new TypeError(`EFFECT_ADD_KEYWORD received an invalid keyword "${name}".`);
            }
        });

        const targets = getSelectedTargets(this.selectedTarget);
        for (const target of targets) {
            if (!target?.isCard || typeof target.addKeywordModifier !== 'function') {
                throw new TypeError('EFFECT_ADD_KEYWORD requires card targets.');
            }

            target.addKeywordModifier(
                source,
                ability,
                keyword,
                Boolean(params.lasting)
            );
            if (typeof target.refresh === 'function') {
                await target.refresh();
            }
        }
    }
}
