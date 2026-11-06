import {
    DIALOG_ACTIVATE,
    DIALOG_BOOST_DEALT,
    TARGET_ACTIVATION,
    TRIGGER_ATTACHED_ACTIVATES,
    TRIGGER_THIS_ACTIVATES,
} from 'mc-shared';
import {ValidTarget} from '../targets/valid-target.js';
import {getVillainFor} from '../utils/match-zone-utils.js';

import {DealBoostEffect} from './deal-boost-effect.js';
import {Effect} from './effect.js';
import {ResolveBoostEffect} from './resolve-boost-effect.js';

export class EnemyActivationEffect extends Effect {
    constructor({
        enemy,
        enemyType,
        giveBoost = true,
        player,
    }) {
        super(arguments[0]);

        this.enemy = enemy;
        this.configuredEnemy = enemy;
        this.enemyType = enemyType;
        this.giveBoost = giveBoost;
        this.player = player;

        this.boostCards = [];
        this.canceled = false;
        this.activationInterrupted = false;
        this.resolvedBoostCards = new Set();
    }
    async runEffect(params) {
        try {
            await super.runEffect(params);
        } finally {
            if (this.activationInterrupted) {
                for (const card of this.boostCards) {
                    if (!this.resolvedBoostCards.has(card) && !card.isInPlay) {
                        await card.discard();
                    }
                }
            }
            if (this.match?.limits) {
                await this.endLimit(TARGET_ACTIVATION);
            }
        }
    }
    get character() {
        return this.enemy;
    }
    cancelActivation() {
        this.cancel();
    }
    cancel() {
        this.canceled = true;
    }
    getBoostTarget(_params) {
        return this.selectedTarget;
    }
    checkTrigger() {
        return !this.canceled && this.canContinueActivation();
    }
    canContinueActivation() {
        const targets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget :
            [this.selectedTarget];
        const playerEliminated = this.isAttack &&
            (this.player?.defeated || targets.some(target =>
                (target?.isPlayer ? target : target?.owner)?.defeated));
        if (this.activationInterrupted || !this.enemy ||
            this.match?.gameOverReason || playerEliminated) {
            this.activationInterrupted = true;
            return false;
        }

        const currentVillain = this.enemy.scenarioZone ?
            this.enemy.scenarioZone.currentVillain :
            typeof this.match?.getVillainFor === 'function' ?
                getVillainFor(this.match, this.player) :
                this.match?.villain;
        if (this.enemy.isVillain && currentVillain) {
            if (currentVillain !== this.enemy) {
                if (currentVillain.name !== this.enemy.name) {
                    this.activationInterrupted = true;
                    return false;
                }
                this.enemy = currentVillain;
            }
            return true;
        }

        if (this.enemy.isInPlay === false) {
            this.activationInterrupted = true;
            return false;
        }

        return true;
    }
    isResolved() {
        return !this.activationInterrupted;
    }
    async resolvePrepared(effectParams, triggersParams) {
        if (!this.canContinueActivation()) {
            return;
        }

        await super.resolvePrepared(effectParams, triggersParams);
    }
    async triggerEnds(params, options) {
        if (!this.canContinueActivation()) {
            return;
        }

        await super.triggerEnds(params, options);
    }
    async getEnemyTargetFilter(_params) {
        return undefined;
    }
    async shouldSkipActivationDialog(_params) {
        return false;
    }
    async dealBoostCards(params) {
        const futureBoostCards = (this.enemy.faceDown || [])
            .filter(faceDown => faceDown.isFutureBoost);

        futureBoostCards.forEach(faceDown => {
            faceDown.removeCard();
            this.boostCards.push(faceDown.card);
        });
        if (futureBoostCards.length) {
            await this.enemy.refresh();
        }

        if (!this.giveBoost) {
            return;
        }

        const dealBoostEffect = new DealBoostEffect({
            ability: this.ability,
            enemyActivation: this,
            match: this.match,
        });
        return dealBoostEffect.runEffect(params);
    }
    async showBoostCards() {
        const {boostCards, enemy} = this;

        if (!boostCards.length || this.match.skipBoostDealtNotification) {
            return;
        }

        const count = boostCards.length;
        const countText = count === 1 ?
            'una carta de aumento' :
            `${count} cartas de aumento`;

        const response = await this.openDialog({
            dialogType: DIALOG_BOOST_DEALT,
            title: `${enemy.name} recibe ${countText}`,
            data: {
                allowHideFuture: true,
                cardCount: count,
            },
        });

        if (response?.skipBoostDealtNotification) {
            this.match.skipBoostDealtNotification = true;
        }
    }
    getTriggersParams(params) {
        const {character} = this;

        return {
            ...super.getTriggersParams(params),
            character,
        };
    }
    getTriggersEnds(params) {
        const triggers = super.getTriggersEnds(params);

        return this.resolved && !this.canceled ?
            triggers.concat([
                TRIGGER_ATTACHED_ACTIVATES,
                TRIGGER_THIS_ACTIVATES,
            ]) :
            triggers;
    }
    getTargetDialog() {
        const {selectedTarget} = this;

        return selectedTarget;
    }
    getTitleDialog(params) {
        const {character} = this;
        const target = this.getTargetDialog(params);

        return `${character.name} se activa con ${target.name}`;
    }
    getEnemySelectionDialogTitle() {
        return undefined;
    }
    getDialogEmphasizedStat() {
        return undefined;
    }
    resetForResolution() {
        this.enemy = this.configuredEnemy;
        this.boostCards = [];
        this.canceled = false;
        this.activationInterrupted = false;
        this.resolvedBoostCards.clear();
        this._activation = undefined;
        this.delayedEffects = [];
        this.lastingEffects = [];
    }
    getActivationDialogPlayer(params = {}) {
        return params.player ?? this.player;
    }
    showActivationSkippedDialog(statusType, statusMessage, params) {
        return this.openPublicDialog({
            dialogType: DIALOG_ACTIVATE,
            title: 'Activación omitida',
            data: {
                statusMessage,
                statusType,
            },
        }, this.getActivationDialogPlayer(params));
    }
    async prepare(params) {
        this.resetForResolution();
        this.player = params.player;
        await super.prepare(params);

        const {enemy} = this;

        if (!enemy) {
            await this.selectEnemy(params);
        }
        if (await this.shouldSkipActivationDialog(params)) {
            return;
        }

        const target = this.getTargetDialog(params);
        const characterData = await this.getActivationCharacterData(params);
        const targetData = await this.getCharacterDialogData(target, params);
        const emphasizedStat = this.getDialogEmphasizedStat();

        await this.openPublicDialog({
            dialogType: DIALOG_ACTIVATE,
            title: this.getTitleDialog(params),
            data: {
                character: characterData,
                target: targetData,
                ...(emphasizedStat ? {emphasizedStat} : {}),
            },
        }, this.getActivationDialogPlayer(params));
    }
    async getActivationCharacterData(params) {
        return this.getCharacterDialogData(this.character, params);
    }
    async getCharacterDialogData(character, params, statOverrides = {}) {
        const stats = await character.getEffectiveStats({
            ...statOverrides,
            player: params.player,
        });

        return {
            ...character.toObj(params),
            ...stats,
            ...statOverrides,
        };
    }
    async resolveBoostCards(params) {
        const selectedTarget = this.getBoostTarget(params);
        let totalBoost = 0;

        for (let cardIndex = 0; cardIndex < this.boostCards.length; cardIndex++) {
            if (!this.canContinueActivation()) {
                break;
            }
            const card = this.boostCards[cardIndex];
            const resolveBoostEffect = new ResolveBoostEffect({
                activation: this.activation,
                enemyActivation: this,
                match: this.match,
                selectedTarget,
                card,
                cardIndex,
                previousBoost: totalBoost,
            });

            await resolveBoostEffect.runEffect(params);

            totalBoost += resolveBoostEffect.value;

            if (!card.isInPlay) {
                await card.discard();
            }
            this.resolvedBoostCards.add(card);
        }

        return totalBoost;
    }
    async selectEnemy(params) {
        const {enemyType, ability} = this;

        const filter = await this.getEnemyTargetFilter(params);
        const validTarget = new ValidTarget({
            condition: this.condition,
            effect: this,
            filter,
            match: this.match,
        });

        this.enemy = await validTarget.selectTarget({
            ...params,
            ability,
            target: enemyType,
            dialogTitle: this.getEnemySelectionDialogTitle(),
        });
    }
    toObj() {
        const {
            character,
            selectedTarget,
            boostCards,
        } = this;

        return {
            ...super.toObj(arguments[0]),
            character: character.toObj(arguments[0]),
            target: Array.isArray(selectedTarget) ?
                selectedTarget.map(target => target.toObj(arguments[0])) :
                selectedTarget.toObj(arguments[0]),
            boostCards: boostCards.map(card => card.toObj(arguments[0])),
        };
    }
}