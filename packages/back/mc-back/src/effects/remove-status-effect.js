import {TARGET_CHARACTER} from 'mc-shared';

import {STATUS_OPTIONS} from '../constants/status-options.js';
import {selectStatusOption} from '../utils/status-dialog.js';
import {Effect} from './effect.js';

export class RemoveStatusEffect extends Effect {
    constructor({
        statuses = STATUS_OPTIONS.map(([status]) => status),
        title = 'Elige una carta de Estado para descartar',
        target = TARGET_CHARACTER,
    }) {
        super({...arguments[0], target});

        this.statuses = statuses;
        this.statusTitle = title;
        this.selectedStatus = undefined;
    }
    getAvailableStatuses(card) {
        return STATUS_OPTIONS
            .filter(([status]) => this.statuses.includes(status))
            .filter(([status]) => (card?.[status] || 0) > 0);
    }
    filterTarget(card) {
        return this.getAvailableStatuses(card).length > 0 &&
            super.filterTarget.apply(this, arguments);
    }
    async canRun(params) {
        if (!await super.canRun(params)) {
            return false;
        }

        return this.selectedTarget ?
            this.getAvailableStatuses(this.selectedTarget).length > 0 :
            this.getValidTarget(params).length > 0;
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
    async execute() {
        const available = this.getAvailableStatuses(this.selectedTarget);
        this.selectedStatus = await selectStatusOption(
            this,
            available,
            this.statusTitle
        );
        this.removeStatus(this.selectedTarget, this.selectedStatus);
        await this.selectedTarget.refresh();
    }
}
