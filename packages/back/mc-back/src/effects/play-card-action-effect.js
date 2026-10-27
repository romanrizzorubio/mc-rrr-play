import {
    ABILITY_ACTION,
    TARGET_YOUR_HERO,
} from 'mc-shared';

import {Effect} from './effect.js';
import {PlayCardEffect} from './play-card-effect.js';

export class PlayCardActionEffect extends Effect {
    constructor({
        costReduction = 0,
        sharedTraitsWith = TARGET_YOUR_HERO,
    }) {
        super(arguments[0]);

        if (!Number.isFinite(costReduction) || costReduction < 0) {
            throw new TypeError('PlayCardActionEffect costReduction must be a non-negative number.');
        }

        this.costReduction = costReduction;
        this.sharedTraitsWith = sharedTraitsWith;
        this.playCardEffect = undefined;
    }
    getSharedTraits(params) {
        const targets = this.validTarget.getTargetCandidates(
            {
                ...params,
                effect: this,
            },
            this.sharedTraitsWith,
        );

        return new Set(targets.flat(Infinity)
            .flatMap(target => target?.traits ?? []));
    }
    filterTarget(card, params) {
        if (!super.filterTarget(card, params) ||
            !card.isPlayerCard ||
            card.isResource) {
            return false;
        }

        const sharedTraits = this.getSharedTraits(params);

        return card.traits?.some(trait => sharedTraits.has(trait)) ?? false;
    }
    async getPlayableTargets(params) {
        const candidates = (await super.getValidTarget(params)).flat(Infinity);
        const playable = [];

        for (const card of candidates) {
            const playCardEffect = new PlayCardEffect({
                abilityType: ABILITY_ACTION,
                card,
                match: this.match,
            });

            if (await playCardEffect.canRun({
                ...params,
                card,
                playCardEffect,
            })) {
                playable.push(card);
            }
        }

        return playable;
    }
    async getValidTarget(params) {
        const targets = await this.getPlayableTargets(params);

        if (!this.selectedTarget) {
            return targets;
        }

        return targets.includes(this.selectedTarget) ?
            [this.selectedTarget] :
            [];
    }
    async selectTarget(params) {
        const targets = await this.getPlayableTargets(params);
        if (params.selectedTarget &&
            (params.fixedPreselectedTarget ||
                params.preselectedEffectTargets?.has(this))) {
            return targets.includes(params.selectedTarget) ?
                params.selectedTarget :
                null;
        }

        return this.validTarget.selectSingleTarget(targets, params);
    }
    isResolved() {
        return this.playCardEffect?.played ?? false;
    }
    isFullResolved() {
        return this.isResolved();
    }
    async execute(params) {
        const {player} = params;
        const card = this.selectedTarget;
        if (!card) {
            return;
        }

        const candidates = await this.getPlayableTargets(params);
        if (!candidates.includes(card)) {
            return;
        }

        const playCardEffect = new PlayCardEffect({
            abilityType: ABILITY_ACTION,
            card,
            match: this.match,
        });
        playCardEffect.modifyCost = -this.costReduction;
        this.playCardEffect = playCardEffect;

        const playParams = {...params};
        delete playParams.ability;
        delete playParams.card;
        delete playParams.source;

        await playCardEffect.runEffect({
            ...playParams,
            card,
            match: this.match,
            player,
        });
        this.paymentCancelled = playCardEffect.paymentCancelled;
    }
}
