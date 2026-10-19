import {DIALOG_SELECT_TARGET, TARGET_CHARACTER} from 'mc-shared';

import {STATUS_OPTIONS} from '../constants/status-options.js';
import {selectStatusOption} from '../utils/status-dialog.js';
import {Effect} from './effect.js';

export class ReplaceStatusEffect extends Effect {
    constructor({
        statuses = STATUS_OPTIONS.map(([status]) => status),
        title = 'Elige una carta de Estado para sustituir',
    }) {
        super({...arguments[0], target: arguments[0].target || TARGET_CHARACTER});

        this.statuses = statuses;
        this.statusTitle = title;
        this.selectedStatus = undefined;
        this.replacementStatus = undefined;
    }
    getAvailableStatuses(card) {
        return STATUS_OPTIONS
            .filter(([status]) => this.statuses.includes(status))
            .filter(([status]) => (card[status] || 0) > 0);
    }
    hasReplacement(selectedStatus) {
        return STATUS_OPTIONS.some(([status]) =>
            this.statuses.includes(status) &&
            status !== selectedStatus);
    }
    filterTarget(card) {
        return this.getAvailableStatuses(card).some(([status]) =>
            this.hasReplacement(status)) &&
            super.filterTarget.apply(this, arguments);
    }
    async canRun(params) {
        if (!await super.canRun(params)) {
            return false;
        }

        return this.selectedTarget ?
            this.getAvailableStatuses(this.selectedTarget)
                .some(([status]) => this.hasReplacement(status)) :
            this.getValidTarget(params).length > 0;
    }
    async selectTarget(params) {
        const validTargets = this.getValidTarget(params).flat(Infinity);
        if (!validTargets.length) {
            return null;
        }

        const response = await this.openDialog({
            dialogType: DIALOG_SELECT_TARGET,
            title: 'Elige un personaje con una carta de Estado',
            data: {
                cards: validTargets.map(card => card.toObj(params)),
            },
        });
        const selectedId = response?.selected?.id;
        const selectedTarget = validTargets.find(target =>
            target.id === selectedId || target.parentId === selectedId);

        if (!selectedTarget) {
            throw new Error('La selección del personaje no es válida.');
        }

        return selectedTarget;
    }
    removeStatus(card, status) {
        switch (status) {
            case 'stunned':
                card.removeStunned(1);
                break;
            case 'confused':
                card.removeConfused(1);
                break;
            case 'tough':
                card.removeTough(1);
                break;
        }
    }
    addStatus(card, status) {
        switch (status) {
            case 'stunned':
                card.stun();
                break;
            case 'confused':
                card.confuse();
                break;
            case 'tough':
                card.setTough();
                break;
        }
    }
    async execute() {
        const card = this.selectedTarget;
        const available = this.getAvailableStatuses(card);
        this.selectedStatus = await selectStatusOption(
            this,
            available,
            this.statusTitle
        );

        const replacements = STATUS_OPTIONS
            .filter(([status]) =>
                this.statuses.includes(status) &&
                status !== this.selectedStatus);
        this.replacementStatus = await selectStatusOption(
            this,
            replacements,
            'Elige la nueva carta de Estado',
            {alwaysDialog: true}
        );

        this.removeStatus(card, this.selectedStatus);
        this.addStatus(card, this.replacementStatus);
        await card.refresh();
    }
}
