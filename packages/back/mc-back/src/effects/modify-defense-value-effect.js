import {Effect} from './effect.js';
import {getCurrentSideTargets} from '../utils/target-utils.js';
import {path} from '../engine/utils.js';
import {confirmPrePlay} from '../utils/pre-play-confirmation.js';

export class ModifyDefenseValueEffect extends Effect {
    constructor({
        count,
        characterTarget,
        characters: _characters,
        isCleanup = false,
        requiresPrePlayConfirmation = false,
        prePlayConfirmation,
    }) {
        super(arguments[0]);

        this.characterTarget = characterTarget;
        this.count = count;
        this.isCleanup = isCleanup;
        this.requiresPrePlayConfirmation =
            requiresPrePlayConfirmation;
        this.prePlayConfirmation = prePlayConfirmation;
    }
    getModifyDefense(params) {
        return this.paramsCalc ?
            this.calculate(params) :
            this.count;
    }
    async confirmBeforeResolve(params) {
        const confirmation = this.prePlayConfirmation;
        if (!this.requiresPrePlayConfirmation && !confirmation) {
            return true;
        }

        if (confirmation?.bonusPath !== undefined &&
            (typeof confirmation.bonusPath !== 'string' ||
                !confirmation.bonusPath)) {
            throw new TypeError(
                'Defense-bonus confirmation path must be a non-empty string.'
            );
        }
        const bonus = confirmation?.bonusPath ?
            path(this, confirmation.bonusPath) :
            this.getModifyDefense(params);
        if (!Number.isSafeInteger(bonus) || bonus <= 0) {
            throw new Error(
                'Defense-bonus confirmation requires a positive integer bonus.'
            );
        }

        const attackEffect = params.effect;
        if (typeof attackEffect?.getDefenseBonusPreview !== 'function') {
            throw new TypeError(
                'Defense-bonus confirmation requires an attack preview.'
            );
        }

        const preview = await attackEffect.getDefenseBonusPreview(params);

        return confirmPrePlay(this, params, {
            title: confirmation?.title,
            subtitle: confirmation?.subtitle,
            data: {
                defenseBonus: {
                    ...preview,
                    bonus,
                    totalDefense: preview.defenseValue + bonus,
                },
                okText: confirmation?.okText,
                cancelText: confirmation?.cancelText,
            },
        });
    }
    async execute(params) {
        const {selectedTarget} = this;
        const {lasting} = params;
        const modifyDefense = this.getModifyDefense(params);

        if (!selectedTarget?.isCard) {
            selectedTarget.modifyDefense =
                (selectedTarget.modifyDefense ?? 0) + modifyDefense;
            return;
        }

        for (const target of getCurrentSideTargets(selectedTarget)) {
            target.modifyDefense = (target.modifyDefense ?? 0) + modifyDefense;

            if (lasting && !this.isCleanup) {
                const cleanup = new ModifyDefenseValueEffect({
                    count: -modifyDefense,
                    isCleanup: true,
                    match: this.match,
                });
                lasting.registerCleanup(cleanup, target);
            }

            await target.refresh();
        }
    }
}