import {Trigger} from './base/trigger.js';
import {getAttachmentHost} from '../utils/attachment-utils.js';

export class AttachedGetStatTrigger extends Trigger {
    canTrigger(params) {
        const {attachedTo} = this.card;
        const {selectedTarget} = params.effect;
        const attachmentHost = selectedTarget &&
            getAttachmentHost(selectedTarget);

        if (attachedTo && attachedTo.id === attachmentHost?.id) {
            return super.canTrigger(params);
        }

        return false;
    }
}
