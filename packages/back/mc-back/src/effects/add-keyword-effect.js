import {Effect} from './effect.js';
import {STATUS_STALWART} from 'mc-shared';
import {getSelectedTargets} from '../utils/target-utils.js';
import {resolveNumericKeyword} from '../model/commons/keywords.js';

const booleanKeywords = new Set([
    'guard',
    'permanent',
    'toughness',
    'quickStrike',
    'stalwart',
    'surge',
    'villainous',
    'overkill',
    'piercing',
    'ranged',
    'restricted',
]);
const numericKeywords = new Set(['incite', 'retaliate']);

export class AddKeywordEffect extends Effect {
    constructor({
        keyword,
        modifierCondition,
    }) {
        super(arguments[0]);

        this.keyword = keyword;
        this.modifierCondition = modifierCondition;

        if (modifierCondition !== undefined &&
            (modifierCondition === null ||
                typeof modifierCondition !== 'object')) {
            throw new TypeError(
                'EFFECT_ADD_KEYWORD modifierCondition must be an object.'
            );
        }
    }
    async execute(params) {
        const {ability, keyword, modifierCondition} = this;
        const source = params.lasting || ability?.card;

        if (!source) {
            throw new TypeError('EFFECT_ADD_KEYWORD requires an ability source.');
        }
        if (!keyword || typeof keyword !== 'object' ||
            Array.isArray(keyword) || Object.keys(keyword).length === 0) {
            throw new TypeError('EFFECT_ADD_KEYWORD requires a non-empty keyword object.');
        }

        const resolvedKeyword = Object.fromEntries(
            Object.entries(keyword).map(([name, value]) => [
                name,
                numericKeywords.has(name) ?
                    resolveNumericKeyword(value, this.match) :
                    value,
            ])
        );

        Object.entries(resolvedKeyword).forEach(([name, value]) => {
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
            if (resolvedKeyword.stalwart && !target.isCharacter) {
                throw new TypeError('Stalwart can only be granted to a character.');
            }

            target.addKeywordModifier(
                source,
                ability,
                resolvedKeyword,
                Boolean(params.lasting),
                modifierCondition
            );
            if (resolvedKeyword.stalwart &&
                target.statusAvailable === STATUS_STALWART) {
                target.removeStunned();
                target.removeConfused();
            }
            if (typeof target.refresh === 'function') {
                await target.refresh();
            }
        }
    }
}
